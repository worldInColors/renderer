// WaterMesher.ts — standalone fluid-surface mesher + material (fable, verbatim).
// Vanilla corner-height surface with air-as-zero weighting (edge lips), height-
// gradient flow, center-indexed coordinates, and a two-phase flow-mapping shader
// (world-space UVs, still-frame array crossfade, contrast recovery, foam).
import * as THREE from "three";
import { FLUID_VERT, FLUID_FRAG } from "./FluidShaders";

export type GetBlock = (x: number, y: number, z: number) => string | null | undefined;
export type FluidKind = "water" | "lava";
export interface FluidTextures {
	water?: THREE.DataArrayTexture | null;
	lava?: THREE.DataArrayTexture | null;
}
export interface FluidBuildResult {
	meshes: THREE.Mesh[];
	cells: number;
	ms: number;
}

// ---------------------------------------------------------------------------
// Block classification
// ---------------------------------------------------------------------------
const K_NONE = 0,
	K_WATER = 1,
	K_LAVA = 2;
const KIND_NAME: FluidKind[] = ["water", "water", "lava"];

// Heuristic: blocks that do NOT hide an adjacent fluid face.
const NON_OCCLUDING =
	/^(air|cave_air|void_air)$|glass|pane|bars|leaves|slab|stairs|fence|wall|torch|sign|button|pressure_plate|rail|carpet|trapdoor|door|chain|lantern|flower|grass|fern|sapling|kelp|seagrass|lily_pad|vine|ladder|scaffolding|cobweb|banner|candle|coral|pickle|bamboo|cactus|sugar_cane|bubble_column|campfire|hopper|cauldron|anvil|head|skull|pot|bed$|bell|lever|tripwire|redstone_wire|repeater|comparator|mushroom$|tulip|rose|dandelion|orchid|poppy|lilac|peony|azalea|dripleaf|moss_carpet|sculk_vein|amethyst_cluster|bud$|frogspawn|hanging_roots|spore_blossom|pointed_dripstone|end_rod|brewing_stand|enchanting_table|conduit|chest|shulker_box|cocoa|wheat|carrots|potatoes|beetroots|nether_wart|stem|ice$|slime_block|honey_block|daylight_detector|lectern|stonecutter|grindstone|composter|barrel|snow$/;

function parseLevel(props: string): number {
	const i = props.indexOf("level=");
	if (i < 0) return 0;
	let v = 0,
		j = i + 6;
	while (j < props.length) {
		const c = props.charCodeAt(j);
		if (c < 48 || c > 57) break;
		v = v * 10 + (c - 48);
		j++;
	}
	return v > 15 ? 15 : v;
}

/** Packed: kind (bits 0-1) | level (bits 2-5) | occluding (bit 8). */
// F_LOGGED (fable): waterlogged cells are WATER for culling/heights, but render in a
// translucent bucket so the block's geometry reads through (alpha .5, block wins ties)
const F_LOGGED = 0x80;

function classify(s: string | null | undefined): number {
	if (!s) return 0;
	let name = s,
		props = "";
	const b = s.indexOf("[");
	if (b >= 0) {
		name = s.slice(0, b);
		props = s.slice(b + 1, s.length - 1);
	}
	if (name.startsWith("minecraft:")) name = name.slice(10);
	if (name === "water" || name === "flowing_water") return K_WATER | (parseLevel(props) << 2);
	if (name === "lava" || name === "flowing_lava") return K_LAVA | (parseLevel(props) << 2);
	if (props.indexOf("waterlogged=true") >= 0) return K_WATER | F_LOGGED; // level 0 source, translucent bucket
	return NON_OCCLUDING.test(name) ? 0 : 1 << 8;
}

function levelToHeight(l: number): number {
	if (l >= 8) return 1.0;
	if (l === 0) return 14.2 / 16;
	return (8 - l) / 9;
}

// ---------------------------------------------------------------------------
// Growable buffers
// ---------------------------------------------------------------------------
class F32 {
	a: Float32Array;
	n = 0;
	constructor(cap: number) {
		this.a = new Float32Array(Math.max(cap, 64));
	}
	ensure(k: number) {
		if (this.n + k <= this.a.length) return;
		let c = this.a.length * 2;
		while (c < this.n + k) c *= 2;
		const b = new Float32Array(c);
		b.set(this.a.subarray(0, this.n));
		this.a = b;
	}
	view() {
		return this.a.subarray(0, this.n);
	}
}
class U32 {
	a: Uint32Array;
	n = 0;
	constructor(cap: number) {
		this.a = new Uint32Array(Math.max(cap, 64));
	}
	ensure(k: number) {
		if (this.n + k <= this.a.length) return;
		let c = this.a.length * 2;
		while (c < this.n + k) c *= 2;
		const b = new Uint32Array(c);
		b.set(this.a.subarray(0, this.n));
		this.a = b;
	}
	view() {
		return this.a.subarray(0, this.n);
	}
}

// ---------------------------------------------------------------------------
// Mesher
// ---------------------------------------------------------------------------
const EPS = 1 / 1024;

export function buildFluidMeshes(
	getBlock: GetBlock,
	sx: number,
	sy: number,
	sz: number
): FluidBuildResult {
	const t0 = performance.now();
	const n = sx * sy * sz;
	const kind = new Uint8Array(n);
	const level = new Uint8Array(n);
	const occl = new Uint8Array(n);
	let cells = 0;
	let hasWater = false,
		hasLava = false;

	for (let y = 0; y < sy; y++) {
		for (let z = 0; z < sz; z++) {
			const row = (y * sz + z) * sx;
			for (let x = 0; x < sx; x++) {
				const c = classify(getBlock(x, y, z));
				const k = c & 3;
				kind[row + x] = k | (c & F_LOGGED); // kind + logged flag
				level[row + x] = (c >> 2) & 15;
				occl[row + x] = (c >> 8) & 1;
				if (k !== K_NONE) {
					cells++;
					if (k === K_WATER) hasWater = true;
					else hasLava = true;
				}
			}
		}
	}

	const I = (x: number, y: number, z: number) => (y * sz + z) * sx + x;
	const inb = (x: number, y: number, z: number) =>
		x >= 0 && y >= 0 && z >= 0 && x < sx && y < sy && z < sz;

	/** Vanilla getHeight: fluid height (1 if same fluid above), 0 for air/non-solid, -1 for solid/OOB. */
	const H = (k: number, x: number, y: number, z: number): number => {
		if (!inb(x, y, z)) return -1;
		const i = I(x, y, z);
		if ((kind[i] & 3) === k) {
			if (y + 1 < sy && (kind[I(x, y + 1, z)] & 3) === k) return 1;
			return levelToHeight(level[i]);
		}
		return occl[i] ? -1 : 0;
	};

	// two emit targets (fable): solid (opaque) and logged (translucent bucket
	// for waterlogged cells — the block reads through the water)
	const buildKind = (k: number): THREE.Mesh[] => {
		const est = Math.max(cells, 1);
		const mkBld = () => ({
			pos: new F32(est * 3 * 4 * 3),
			face: new F32(est * 3 * 4),
			flow: new F32(est * 3 * 4 * 3),
			idx: new U32(est * 3 * 6),
			vcount: 0,
		});
		const solid = mkBld();
		const logged = mkBld();
		let cur = solid;

		// per-cell state (set before emitting)
		let fFace = 0,
			fx = 0,
			fz = 0,
			fFall = 0;

		const vert = (x: number, y: number, z: number) => {
			cur.pos.ensure(3);
			cur.face.ensure(1);
			cur.flow.ensure(3);
			cur.pos.a[cur.pos.n++] = x;
			cur.pos.a[cur.pos.n++] = y;
			cur.pos.a[cur.pos.n++] = z;
			cur.face.a[cur.face.n++] = fFace;
			cur.flow.a[cur.flow.n++] = fx;
			cur.flow.a[cur.flow.n++] = fz;
			cur.flow.a[cur.flow.n++] = fFall;
			return cur.vcount++;
		};
		const quad = (
			x0: number,
			y0: number,
			z0: number,
			x1: number,
			y1: number,
			z1: number,
			x2: number,
			y2: number,
			z2: number,
			x3: number,
			y3: number,
			z3: number
		) => {
			const a = vert(x0, y0, z0),
				b = vert(x1, y1, z1),
				c = vert(x2, y2, z2),
				d = vert(x3, y3, z3);
			cur.idx.ensure(6);
			cur.idx.a[cur.idx.n++] = a;
			cur.idx.a[cur.idx.n++] = b;
			cur.idx.a[cur.idx.n++] = c;
			cur.idx.a[cur.idx.n++] = a;
			cur.idx.a[cur.idx.n++] = c;
			cur.idx.a[cur.idx.n++] = d;
		};

		let sum = 0,
			w = 0;
		const addW = (h: number) => {
			if (h >= 0.8) {
				sum += h * 10;
				w += 10;
			} else if (h >= 0) {
				sum += h;
				w += 1;
			}
		};
		const corner = (
			x: number,
			y: number,
			z: number,
			cx: number,
			cz: number,
			hC: number
		): number => {
			const hEW = H(k, x + cx, y, z);
			const hNS = H(k, x, y, z + cz);
			if (hEW >= 1 || hNS >= 1) return 1;
			sum = 0;
			w = 0;
			if (hEW > 0 || hNS > 0) {
				const hD = H(k, x + cx, y, z + cz);
				if (hD >= 1) return 1;
				addW(hD);
			}
			addW(hC);
			addW(hEW);
			addW(hNS);
			return w > 0 ? Math.min(1, sum / w) : hC;
		};

		for (let y = 0; y < sy; y++) {
			for (let z = 0; z < sz; z++) {
				for (let x = 0; x < sx; x++) {
					const i = I(x, y, z);
					if ((kind[i] & 3) !== k) continue;
					cur = (kind[i] & F_LOGGED) !== 0 ? logged : solid;

					const above = y + 1 < sy && (kind[I(x, y + 1, z)] & 3) === k;
					const hC = above ? 1 : levelToHeight(level[i]);

					// --- corner heights ---
					let h00: number, h10: number, h11: number, h01: number;
					if (hC >= 1) {
						h00 = h10 = h11 = h01 = 1;
					} else {
						h00 = corner(x, y, z, -1, -1, hC);
						h10 = corner(x, y, z, +1, -1, hC);
						h11 = corner(x, y, z, +1, +1, hC);
						h01 = corner(x, y, z, -1, +1, hC);
					}

					// --- flow from height gradient (downhill), falling flag ---
					fFall = hC >= 1 ? 1 : 0;
					fx = 0;
					fz = 0;
					if (!fFall) {
						const slope = (nx: number, nz: number): number => {
							if (!inb(nx, y, nz)) return 0;
							const j = I(nx, y, nz);
							if ((kind[j] & 3) === k) {
								if (level[j] >= 8 || (y + 1 < sy && (kind[I(nx, y + 1, nz)] & 3) === k)) return hC; // sink column
								return hC - levelToHeight(level[j]);
							}
							return occl[j] ? 0 : hC; // open air beside us = drop
						};
						fx = slope(x + 1, z) - slope(x - 1, z);
						fz = slope(x, z + 1) - slope(x, z - 1);
						const m = Math.hypot(fx, fz);
						if (m > 1) {
							fx /= m;
							fz /= m;
						}
					}

					// --- geometry (center-indexed) ---
					const xw = x - 0.5,
						xe = x + 0.5,
						zn = z - 0.5,
						zs = z + 0.5,
						yb = y - 0.5;
					const y00 = yb + h00,
						y10 = yb + h10,
						y11 = yb + h11,
						y01 = yb + h01;

					// top
					if (!above) {
						fFace = 0;
						quad(xw, y00, zn, xw, y01, zs, xe, y11, zs, xe, y10, zn);
					}
					// bottom
					{
						const bk = y > 0 ? kind[I(x, y - 1, z)] & 3 : K_NONE;
						const bo = y > 0 ? occl[I(x, y - 1, z)] : 0;
						if (bk !== k && !bo) {
							fFace = 1;
							quad(xw, yb, zn, xe, yb, zn, xe, yb, zs, xw, yb, zs);
						}
					}
					const open = (nx: number, nz: number): boolean => {
						if (!inb(nx, y, nz)) return true;
						const j = I(nx, y, nz);
						return (kind[j] & 3) !== k && !occl[j];
					};
					// -z (north)
					if (open(x, z - 1)) {
						fFace = 2;
						const zz = zn + EPS;
						quad(xe, yb, zz, xw, yb, zz, xw, y00, zz, xe, y10, zz);
					}
					// +z (south)
					if (open(x, z + 1)) {
						fFace = 3;
						const zz = zs - EPS;
						quad(xw, yb, zz, xe, yb, zz, xe, y11, zz, xw, y01, zz);
					}
					// -x (west)
					if (open(x - 1, z)) {
						fFace = 4;
						const xx = xw + EPS;
						quad(xx, yb, zn, xx, yb, zs, xx, y01, zs, xx, y00, zn);
					}
					// +x (east)
					if (open(x + 1, z)) {
						fFace = 5;
						const xx = xe - EPS;
						quad(xx, yb, zs, xx, yb, zn, xx, y10, zn, xx, y11, zs);
					}
				}
			}
		}

		const assemble = (
			b: { pos: F32; face: F32; flow: F32; idx: U32; vcount: number },
			isLogged: boolean
		): THREE.Mesh | null => {
			if (b.idx.n === 0) return null;
			const geo = new THREE.BufferGeometry();
			geo.setAttribute("position", new THREE.BufferAttribute(b.pos.view().slice(), 3));
			geo.setAttribute("aFace", new THREE.BufferAttribute(b.face.view().slice(), 1));
			geo.setAttribute("aFlow", new THREE.BufferAttribute(b.flow.view().slice(), 3));
			geo.setIndex(new THREE.BufferAttribute(b.idx.view().slice(), 1));
			geo.computeBoundingSphere();
			geo.computeBoundingBox();
			const mat = createFluidMaterial(KIND_NAME[k], isLogged);
			const mesh = new THREE.Mesh(geo, mat);
			mesh.name = `fluid:${KIND_NAME[k]}${isLogged ? ":logged" : ""}`;
			mesh.frustumCulled = true;
			if (isLogged) mesh.renderOrder = 1; // after all opaque — blends against the block
			mesh.onBeforeRender = () => tryBind(mat);
			return mesh;
		};

		const out: THREE.Mesh[] = [];
		const mSolid = assemble(solid, false);
		if (mSolid) out.push(mSolid);
		const mLogged = assemble(logged, true);
		if (mLogged) out.push(mLogged);
		return out;
	};

	const meshes: THREE.Mesh[] = [];
	if (hasWater) meshes.push(...buildKind(K_WATER));
	if (hasLava) meshes.push(...buildKind(K_LAVA));

	return { meshes, cells, ms: performance.now() - t0 };
}

// ---------------------------------------------------------------------------
// Material
// ---------------------------------------------------------------------------
interface Preset {
	tint: number;
	frameRate: number;
	cycle: number;
	flowScale: number;
	fallSpeed: number;
	ambient: [number, number];
	outMean: number;
	targetStd: number;
	foam: number;
}
const PRESETS: Record<FluidKind, Preset> = {
	// vanilla #3F76E4 tint (luma .448); outMean .85 targets mean luma ~.38 —
	// the old #2F58AB × .60 pair rendered a 20%-gray surface (user: "really dark")
	water: {
		tint: 0x3f76e4,
		frameRate: 10,
		cycle: 2.5,
		flowScale: 0.9,
		fallSpeed: 1.4,
		ambient: [0.05, 0.03],
		outMean: 0.85,
		targetStd: 0.17,
		foam: 0.35,
	},
	lava: {
		tint: 0xffffff,
		frameRate: 4,
		cycle: 6.0,
		flowScale: 0.4,
		fallSpeed: 0.6,
		ambient: [0.02, 0.01],
		outMean: 0.62,
		targetStd: 0.14,
		foam: 0.0,
	},
};

const LUMA = new THREE.Vector3(0.2126, 0.7152, 0.0722);
const live = new Set<THREE.ShaderMaterial>();
let textureSource: FluidTextures | null = null;

/** Optional explicit source; otherwise `globalThis.liquidFrameTextures` is used lazily. */
export function setFluidTextures(src: FluidTextures | null): void {
	textureSource = src;
	for (const m of live) {
		m.userData.bound = false;
		tryBind(m);
	}
}

export function createFluidMaterial(kind: FluidKind, logged = false): THREE.ShaderMaterial {
	const p = PRESETS[kind];
	// convertLinearToSRGB: the pipeline is sRGB end-to-end (sRGB texels in, sRGB
	// framebuffer out, no conversions) — the Color constructor converts hex to
	// LINEAR working space, which collapsed the tint's luminance and rendered
	// the surface near-black ("really dark water")
	const tint = new THREE.Color(p.tint).convertLinearToSRGB();
	const mat = new THREE.ShaderMaterial({
		glslVersion: THREE.GLSL3,
		vertexShader: FLUID_VERT,
		fragmentShader: FLUID_FRAG,
		uniforms: {
			uTex: { value: null },
			uHasTex: { value: 0 },
			uTint: { value: tint },
			uTime: { value: 0 },
			uCycle: { value: p.cycle },
			uFlowScale: { value: p.flowScale },
			uFallSpeed: { value: p.fallSpeed },
			uAmbient: { value: new THREE.Vector2(p.ambient[0], p.ambient[1]) },
			uFrame0: { value: 0 },
			uFrame1: { value: 0 },
			uFrameMix: { value: 0 },
			uLumMean: { value: 0.3 },
			uLumTarget: { value: 0.6 },
			uGain: { value: 1 },
			uFoam: { value: p.foam },
			uLodBias: { value: 0 },
			uMaxLod: { value: 4 },
			uAlpha: { value: 1 },
		},
		side: THREE.FrontSide,
		transparent: false,
		depthWrite: true,
		depthTest: true,
		// logged variant (fable): alpha .5, never occludes, pushed back so the
		// BLOCK wins coplanar ties (scaffolding posts / stair faces) — the lattice
		// reads through the water; three's transparent list draws it after opaque
		...(logged
			? {
					transparent: true,
					depthWrite: false,
					polygonOffset: true,
					polygonOffsetFactor: 1,
					polygonOffsetUnits: 1,
				}
			: {}),
	});
	if (logged) mat.uniforms.uAlpha.value = 0.5;
	mat.userData.kind = kind;
	mat.userData.bound = false;
	mat.userData.layers = 1;
	mat.userData.frameRate = p.frameRate;
	live.add(mat);
	tryBind(mat);
	return mat;
}

function textureStats(tex: THREE.DataArrayTexture): { mean: number; std: number } {
	const img: any = tex.image;
	const data = img?.data;
	const w = img?.width | 0,
		h = img?.height | 0,
		d = img?.depth | 0;
	const count = w * h * d;
	if (
		!(data instanceof Uint8Array || data instanceof Uint8ClampedArray) ||
		count === 0 ||
		data.length < count * 4
	) {
		return { mean: 0.33, std: 0.08 };
	}
	let s = 0,
		s2 = 0;
	for (let i = 0; i < count; i++) {
		const o = i * 4;
		const l = (0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2]) / 255;
		s += l;
		s2 += l * l;
	}
	const mean = s / count;
	const std = Math.sqrt(Math.max(s2 / count - mean * mean, 1e-8));
	return { mean, std };
}

function tryBind(m: THREE.ShaderMaterial): void {
	if (m.userData.bound) return;
	const src: FluidTextures | undefined = textureSource ?? (globalThis as any).liquidFrameTextures;
	const tex = src?.[m.userData.kind as FluidKind];
	if (!tex) return;
	const p = PRESETS[m.userData.kind as FluidKind];
	// convertLinearToSRGB: the pipeline is sRGB end-to-end (sRGB texels in, sRGB
	// framebuffer out, no conversions) — the Color constructor converts hex to
	// LINEAR working space, which collapsed the tint's luminance and rendered
	// the surface near-black ("really dark water")
	const tint = new THREE.Color(p.tint).convertLinearToSRGB();
	const tintLum = tint.r * LUMA.x + tint.g * LUMA.y + tint.b * LUMA.z;
	const { mean, std } = textureStats(tex);
	const u = m.uniforms;
	u.uTex.value = tex;
	u.uHasTex.value = 1;
	u.uLumMean.value = mean;
	u.uLumTarget.value = tintLum * p.outMean;
	u.uGain.value = THREE.MathUtils.clamp((p.targetStd * tintLum) / std, 1, 8);
	const w = (tex.image as any)?.width | 0;
	u.uMaxLod.value = w > 0 ? Math.log2(w) : 4;
	m.userData.layers = Math.max(1, (tex.image as any)?.depth | 0);
	m.userData.bound = true;
	m.needsUpdate = true;
}

/** Call once per frame with elapsed seconds. */
export function updateFluidTime(t: number): void {
	for (const m of live) {
		tryBind(m);
		const u = m.uniforms;
		u.uTime.value = t;
		const N: number = m.userData.layers || 1;
		const fr = t * (m.userData.frameRate as number);
		const fl = Math.floor(fr);
		const f0 = ((fl % N) + N) % N;
		u.uFrame0.value = f0;
		u.uFrame1.value = (f0 + 1) % N;
		u.uFrameMix.value = fr - fl;
	}
}

export function disposeFluidMeshes(meshes: THREE.Mesh[]): void {
	for (const mesh of meshes) {
		mesh.parent?.remove(mesh);
		mesh.geometry.dispose();
		const mat = mesh.material as THREE.ShaderMaterial;
		live.delete(mat);
		mat.dispose();
	}
}
