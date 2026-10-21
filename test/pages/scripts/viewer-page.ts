// viewer-page.ts — standalone viewer UI on the embeddable SchematicViewer API.
// shulkr-style chrome: top URL bar, floating pill toolbar, layer popover.
import * as THREE from "three";
import { createSchematicViewer, SchematicViewer, ViewerMode } from "../../../src/viewer";

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const viewerEl = $("viewer");
const statusEl = $("status");
const fileEl = $("file");
const urlbar = $("urlbar") as HTMLInputElement;
const layerPop = $("layerpop");
const layerSlider = $("layerslider") as HTMLInputElement;
const layerLbl = $("layerlbl");

const showStatus = (text: string, error = false) => {
	statusEl.style.display = text ? "block" : "none";
	statusEl.textContent = text;
	statusEl.className = error ? "error" : "";
};

let viewer: SchematicViewer | null = null;
let currentMode: ViewerMode = "auto";
let currentUrl: string | null = null;
let gridOn = false;
const FLY_SPEED = 40; // units/s — the library default (10) crawls
const SPEED_MIN = 5, SPEED_MAX = 160;

async function ensureViewer(): Promise<SchematicViewer> {
	if (viewer) return viewer;
	showStatus("initializing…");
	viewer = await createSchematicViewer(viewerEl, {
		mode: currentMode,
		controls: "orbit",
		background: 0x0f1117,
		vanillaPackUrl: "pack.zip",
		onStatus: (s) => {
			if (s.phase === "done") { showStatus(""); fileEl.textContent = s.message || ""; }
			else if (s.phase === "error") showStatus(`error: ${s.message}`, true);
			else showStatus(`${s.phase}${s.message ? " · " + s.message : ""}`);
		},
		onError: (e) => showStatus(String(e), true),
	});
	(window as any).__viewer = viewer;
	(window as any).THREE = THREE;
	// outline-on-click inspector (shulkr-style selection box + block panel)
	try {
		const r0 = viewer.raw as any;
		r0?.enableInspector?.();
		(window as any).__r3 = (r0?.sceneManager?.scene?.constructor) && null;
	} catch (e) {
		console.warn("[viewer] inspector enable failed:", e);
	}
	// Redstone Tweaks: the pack manager AUTO-RESTORES it (with priority) from its
	// own IndexedDB cache on every boot — nothing to do here on warm loads. The
	// old polling loop (12 × 1.5s waiting for the manager) BLOCKED ensureViewer
	// for 18 seconds before every load — the entire "initializing…" era. Now the
	// only action is a fire-and-forget COLD-VISIT install that never blocks.
	(async () => {
		for (let i = 0; i < 20; i++) {
			try {
				const packs = (viewer.raw as any)?.packs;
				if (packs?.getAllPacks && packs.loadPackFromUrl) {
					if (packs.getAllPacks().length === 0) continue; // not settled yet
					if (packs.getAllPacks().some((p: any) => /redstone/i.test(p.name || ""))) return; // restored
					const id = await packs.loadPackFromUrl("packs/redstone-tweaks.zip", { name: "Redstone Tweaks" });
					if (id && packs.setPackPriority) await packs.setPackPriority(id, -1);
					return;
				}
			} catch { /* manager not ready */ }
			await new Promise((res) => setTimeout(res, 1500));
		}
	})();
	syncModeButtons();
	return viewer;
}

async function load(url: string) {
	currentUrl = url;
	showStatus("loading…");
	try {
		const v = await ensureViewer();
		await v.load(url);
		setupLayers();
	} catch {
		/* status already shown via onError */
	}
}

function syncModeButtons() {
	const gpu = $("btn-gpu"), cpu = $("btn-cpu");
	const mode = viewer?.activeMode || "";
	gpu.classList.toggle("active", mode === "gpu-pull");
	cpu.classList.toggle("active", mode === "batched");
}

function currentSchematic(): any {
	const r = viewer?.raw as any;
	return r?.schematicManager?.schematics?.values?.().next?.()?.value;
}

function setupLayers() {
	const so = currentSchematic();
	const sy = so?.schematicWrapper?.get_dimensions?.()?.[1];
	const total = typeof sy === "number" ? sy : 64;
	layerSlider.max = String(total - 1);
	layerSlider.value = String(total - 1);
	layerLbl.textContent = `${total - 1} / ${total - 1}`;
}

$("btn-load").addEventListener("click", () => {
	const u = urlbar.value.trim();
	if (u) load(u);
});
urlbar.addEventListener("keydown", (e) => {
	if ((e as KeyboardEvent).key === "Enter") $("btn-load").dispatchEvent(new Event("click"));
});

$("btn-gpu").addEventListener("click", async () => {
	if (currentMode === "gpu") return;
	currentMode = "gpu";
	if (viewer) { await viewer.setMode("gpu"); syncModeButtons(); } else syncModeButtons();
});
$("btn-cpu").addEventListener("click", async () => {
	if (currentMode === "cpu") return;
	currentMode = "cpu";
	if (viewer) { await viewer.setMode("cpu"); syncModeButtons(); } else syncModeButtons();
});

// camera modes: orbit via switchControls; fly = the FPS fly-controls overlay
// (pointer lock on canvas click + WASD + mouse look) — the perf page's FPS mode
$("btn-orbit").classList.add("active");
// a fullscreen fly overlay (z 900) intercepts clicks while enabled; the toolbar
// sits above it (z 950) and we unlock the pointer so the click lands on the button
const deFlyTrap = () => {
	const cm = (viewer?.raw as any)?.cameraManager;
	if (cm?.flyControls?.isLocked) cm.flyControls.unlock();
};
for (const id of ["btn-orbit", "btn-fps", "btn-gpu", "btn-cpu", "btn-speed", "btn-layer", "btn-grid", "btn-shot", "btn-load"]) {
	$(id).addEventListener("pointerdown", deFlyTrap);
}
$("btn-orbit").addEventListener("click", () => {
	$("btn-orbit").classList.add("active");
	$("btn-fps").classList.remove("active");
	const cm = (viewer?.raw as any)?.cameraManager;
	if (!cm) return;
	try { cm.disableFlyControls?.(); } catch { /* not enabled */ }
	cm.switchControls("orbit");
	$("hint").textContent = "drag rotate · wheel zoom · right-drag pan";
});
$("btn-fps").addEventListener("click", () => {
	$("btn-fps").classList.add("active");
	$("btn-orbit").classList.remove("active");
	const cm = (viewer?.raw as any)?.cameraManager;
	if (!cm) return;
	try {
		if (!cm.flyControls) {
			cm.initializeFlyControls({
				moveSpeed: FLY_SPEED,
				keybinds: { up: "Space", down: "ShiftLeft", sprint: "ControlLeft" },
			});
		} else {
			cm.flyControls.setMoveSpeed?.(FLY_SPEED);
		}
		cm.enableFlyControls();
		$("hint").textContent = "click canvas to lock pointer · WASD move · Space up · Shift down · Ctrl sprint · ESC release";
	} catch (e) {
		showStatus(`fly controls failed: ${e}`, true);
	}
});

let gridHelper: THREE.GridHelper | null = null;
$("btn-grid").addEventListener("click", () => {
	const r = viewer?.raw as any;
	if (!r?.sceneManager) return;
	gridOn = !gridOn;
	$("btn-grid").classList.toggle("active", gridOn);
	const R3 = (window as any).__r3 || THREE; // renderer's three copy when exposed
	if (gridOn && !gridHelper) {
		gridHelper = new R3.GridHelper(512, 512, 0x2a3040, 0x1a1f2b);
		gridHelper.position.y = -0.02;
		r.sceneManager.scene.add(gridHelper);
	} else if (!gridOn && gridHelper) {
		r.sceneManager.scene.remove(gridHelper);
		gridHelper = null;
	}
	try { r.renderManager?.render?.(); } catch { /* */ }
	setTimeout(() => { try { r.renderManager?.render?.(); } catch { /* */ } }, 100);
});

$("btn-shot").addEventListener("click", () => {
	const cv = document.querySelector("#viewer canvas") as HTMLCanvasElement;
	if (!cv) return;
	const r = viewer?.raw as any;
	try { r?.renderManager?.render?.(); } catch { /* already current */ }
	const a = document.createElement("a");
	a.download = `schematic-${Date.now()}.png`;
	a.href = cv.toDataURL("image/png");
	a.click();
});

// layer mode (shulkr-style slice): clip everything above layer N with a cap plane
$("btn-layer").addEventListener("click", () => layerPop.classList.toggle("open"));
$("btn-layer-all").addEventListener("click", () => {
	layerPop.classList.remove("open");
	$("btn-layer").querySelector("span")!.textContent = "All";
	setSlice(false);
	applyLayer(1e9);
});
layerSlider.addEventListener("input", () => {
	setSlice(true);
	const n = Number(layerSlider.value);
	layerLbl.textContent = `${n} / ${layerSlider.max}`;
	$("btn-layer").querySelector("span")!.textContent = String(n);
	applyLayer(n);
});

// fly speed popover
const speedPop = $("speedpop");
const speedSlider = $("speedslider") as HTMLInputElement;
$("btn-speed").addEventListener("click", () => speedPop.classList.toggle("open"));
speedSlider.min = String(SPEED_MIN);
speedSlider.max = String(SPEED_MAX);
speedSlider.value = String(FLY_SPEED);
$("speedlbl")!.textContent = `${FLY_SPEED} u/s`;
speedSlider.addEventListener("input", () => {
	const v = Number(speedSlider.value);
	$("speedlbl").textContent = `${v} u/s`;
	const cm = (viewer?.raw as any)?.cameraManager;
	cm?.flyControls?.setMoveSpeed?.(v);
	cm?.shulkrControls?.setSpeed?.(v / 20); // orbit flavor's speed scale differs
});
speedSlider.addEventListener("change", () => speedPop.classList.remove("open"));

let sliceOn = false;
const planeTop = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e9); // keep y <= constant
function applyLayer(topVisible: number) {
	const r = viewer?.raw as any;
	if (!r?.sceneManager) return;
	const so = currentSchematic();
	if (!so) return;
	const off = so.group?.position ?? { y: 0 };
	// gpu-pull materials: dedicated slice uniform (grid-space Y — group offset not applied)
	r.sceneManager.scene.traverse((o: any) => {
		if (!o.isMesh) return;
		const mats = Array.isArray(o.material) ? o.material : [o.material];
		for (const m of mats) {
			if (m?.uniforms?.uLayerClip) m.uniforms.uLayerClip.value.set(sliceOn ? 1 : 0, topVisible); // cell-Y semantics
			else if (m?.isMeshStandardMaterial) {
				// CPU/batched meshes ride three's local clipping planes
				m.clippingPlanes = sliceOn ? [planeTop] : null;
			}
		}
	});
	if (sliceOn) {
		const rend = r.renderManager?.getRenderer?.() ?? r.renderManager?.renderer;
		if (rend) rend.localClippingEnabled = true;
		planeTop.constant = off.y + topVisible + 0.99; // world-space for built-in materials
	}
	r.renderManager?.render?.();
}
function setSlice(on: boolean) { sliceOn = on; }


// ---------- shulkr-style block selection: voxel DDA pick + white outline ----------
let selGroup: THREE.Group | null = null;
let lastPickToast = 0;
function showSelection(so: any, cell: [number, number, number], worldOrigin: any, dir: any, hitT: number) {
	if (!selGroup) {
		selGroup = new THREE.Group();
		const edge = new THREE.LineSegments(
			new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
			new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthTest: false }),
		);
		const fill = new THREE.Mesh(
			new THREE.BoxGeometry(1.002, 1.002, 1.002),
			new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, depthWrite: false }),
		);
		(selGroup as any).add(edge, fill);
		edge.renderOrder = 1001; // renderOrder does NOT cascade from groups — set both
		(fill as any).renderOrder = 1000;
		((fill as any).material as any).depthTest = false;
	}
	// parent to the SCHEMATIC GROUP — the same frame records, chest instances and
	// the DDA/raycast all work in. Parenting to a record draw mesh silently
	// inherited that mesh's own offset (numeric cell was right, world box wasn't).
	const r0 = viewer!.raw as any;
	const anchor = so?.group ?? r0.sceneManager.scene;
	if (selGroup.parent !== anchor) { selGroup.parent?.remove(selGroup); anchor.add(selGroup); }
	// CENTER convention: rendered cell c occupies [c−0.5, c+0.5] (cubane geometry
	// is centered on the integer coordinate), so the centered 1.002 box sits at
	// the integer cell itself — at cell+0.5 it outlined the neighbor half off
	selGroup.position.set(cell[0], cell[1], cell[2]);
	// double chests: expand the box to the pair's union footprint
	try {
		const b = so.schematicWrapper.get_block(cell[0], cell[1], cell[2]) || "";
		// chest pair-expansion removed (design: vanilla outlines the hovered half only)
		// — per-cell chest rendering makes each half outline its own cell
	} catch { /* optional */ }
	selGroup.quaternion.identity();
	selGroup.scale.set(1, 1, 1); // geometry is already 1.002 wide
}
function clearSelection() { selGroup?.parent?.remove(selGroup); }
// fable: orbit-drag releases fire click at the release point — only treat as a
// pick when the pointer barely moved, or every orbit re-picks a random block
let pickDown: { x: number; y: number } | null = null;
viewerEl.addEventListener("pointerdown", (ev) => { pickDown = { x: ev.clientX, y: ev.clientY }; });
viewerEl.addEventListener("click", (ev) => {
	const r = viewer!.raw as any;
	const cv = viewerEl.querySelector("canvas") as HTMLCanvasElement;
	const so = currentSchematic();
	if (!r || !so || !so.group) return;
	const rect = cv.getBoundingClientRect();
	// fable guards: clicks on UI overlaying the canvas pick through, orbit drags
	// release a click, and a zero-size rect makes NaN rays
	if (ev.target !== cv || !rect.width || !rect.height) return;
	if (!pickDown || Math.hypot(ev.clientX - pickDown.x, ev.clientY - pickDown.y) > 4) return;
	const ndc = new THREE.Vector2(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
	const cam = r.cameraManager.activeCamera._camera;
	// fable: refresh before unprojecting — damped controls / lazy aspect updates
	// can leave matrixWorld a frame behind the click
	cam.updateMatrixWorld(true);
	cam.updateProjectionMatrix();
	const ray = new THREE.Raycaster();
	ray.near = cam.near; // chest raycast honors the same near plane as the walk
	ray.setFromCamera(ndc, cam);
	const worldOrigin = ray.ray.origin.clone();
	const worldDir = ray.ray.direction.clone().normalize();
	// fable: cave_air/void_air/structure_void/light/barrier are invisible but
	// not matched by a bare "air" test — they'd outline empty space
	const isAir = (b: string | undefined) =>
		!b || /^(minecraft:)?(cave_|void_)?air(\[|$)/.test(b) || /^(minecraft:)?(structure_void|light|barrier)(\[|$)/.test(b);
	so.group.updateWorldMatrix(true, false);
	const origin = so.group.worldToLocal(worldOrigin.clone());
	// astra: origin uses the full inverse world matrix — the DIRECTION must too
	// (rotation-only inverse breaks under nonuniform group scale)
	const invW = so.group.matrixWorld.clone().invert();
	const dir = worldDir.clone().transformDirection(invW).normalize();
	// CENTER-indexed Amanatides–Woo walk (fable-hardened): the record path draws
	// cell b at [b−0.5, b+0.5] — cubane builds block geometry centered on the
	// integer coordinate (c/16 − 0.5, see WorldMeshBuilder) — so picking, the
	// outline and the chest instances must use the same convention or they sit
	// half a block off the rendered blocks. (My earlier corner-indexed rewrite
	// "fixed" the wrong side: chests were the outliers, not the picker.)
	const dims = so.schematicWrapper.get_dimensions() as number[];
	// bounds-gated, throw-proof block lookup — a WASM wrapper throwing on a bad
	// index would abort the handler and leave the previous outline standing
	const gb = (x: number, y: number, z: number): string | undefined => {
		if (x < 0 || y < 0 || z < 0 || x >= dims[0] || y >= dims[1] || z >= dims[2]) return undefined;
		try { return so.schematicWrapper.get_block(x, y, z) || undefined; } catch { return undefined; }
	};
	// slab-clip the ray to the grid first — a far camera must not burn the step
	// budget crossing empty space before the schematic even starts. Start no
	// earlier than the near plane: the block the camera is inside is invisible.
	// Grid extents under the center convention: [−0.5, dims−0.5] per axis.
	const tNear = so.group.worldToLocal(worldOrigin.clone().addScaledVector(worldDir, cam.near)).sub(origin).dot(dir);
	let tEnter = Math.max(0, tNear), tExit = Infinity, miss = false;
	const slab = (o: number, d: number, min: number, max: number) => {
		if (d === 0) { if (o < min || o >= max) miss = true; return; }
		let t1 = (min - o) / d, t2 = (max - o) / d;
		if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
		tEnter = Math.max(tEnter, t1); tExit = Math.min(tExit, t2);
	};
	slab(origin.x, dir.x, -0.5, dims[0] - 0.5); slab(origin.y, dir.y, -0.5, dims[1] - 0.5); slab(origin.z, dir.z, -0.5, dims[2] - 0.5);
	// chests render as instanced bypass meshes with 1/16-inset boxes — skip
	// their cells in the walk so the thin air frame around a chest picks the
	// block actually behind it; the mesh raycast below owns chest picks
	const isChest = (b: string | undefined) => !!b && /^minecraft:((trapped_)?chest|ender_chest)(\[|$)/.test(b);
	const solid = (b: string | undefined) => !isAir(b) && !isChest(b);
	let hit: [number, number, number] | null = null;
	let hitT = 0;
	if (!miss && tEnter <= tExit) {
		const o = origin.clone().addScaledVector(dir, tEnter);
		const setup = (oa: number, da: number) => {
			let c = Math.floor(oa + 0.5); // center convention: cell c spans [c−0.5, c+0.5]
			const step = da > 0 ? 1 : -1;
			const inv = da !== 0 ? Math.abs(1 / da) : Infinity;
			// first boundary is at c + 0.5*step; direct assignment: 0*Inf = NaN
			const t = da === 0 ? Infinity : Math.abs(c + 0.5 * step - oa) * inv;
			return { c, step, inv, t };
		};
		const X = setup(o.x, dir.x), Y = setup(o.y, dir.y), Z = setup(o.z, dir.z);
		// setup's t's are relative to the CLIPPED origin — rebase them to global
		// ray-t so hitT is comparable with the chest raycast's distance
		X.t += tEnter; Y.t += tEnter; Z.t += tEnter;
		let tCur = tEnter;
		for (let i = 0; i < 4096 && tCur <= tExit; i++) {
			const bAt = gb(X.c, Y.c, Z.c);
			if (solid(bAt)) { hit = [X.c, Y.c, Z.c]; hitT = tCur; break; }
			if (X.t < Y.t && X.t < Z.t) { X.c += X.step; tCur = X.t; X.t += X.inv; }
			else if (Y.t < Z.t) { Y.c += Y.step; tCur = Y.t; Y.t += Y.inv; }
			else { Z.c += Z.step; tCur = Z.t; Z.t += Z.inv; }
		}
	}
	// chest bypass meshes: exact raycast, and keep the NEARER of the two hits
	// (distances compared in the same local frame as the walk's t)
	let chestCell: [number, number, number] | null = null;
	let chestT = Infinity;
	{
		// scoped to THIS schematic's group — a scene-wide sweep would pick chests
		// from other lingering schematics ("outline only works on chests")
		const bypass: any[] = [];
		so.group.traverse((o: any) => { if ((o as any).isInstancedMesh && (o as any).userData?.cells) bypass.push(o); });
		const bhits = ray.intersectObjects(bypass, false);
		if (bhits.length && bhits[0].instanceId !== undefined) {
			const h = bhits[0];
			const inst = h.object as THREE.InstancedMesh;
			const m = new THREE.Matrix4();
			inst.getMatrixAt(h.instanceId!, m);
			// instanceId → true owning cell (userData.cells, written by the bypass
			// builder — the instance TRANSLATION is NOT the cell: the rotation
			// pivot leaves a residue, e.g. east chests translate +1x)
			const cells = (inst.userData as any)?.cells as Int32Array | undefined;
			if (cells && cells.length >= (h.instanceId! + 1) * 3) {
				chestCell = [cells[h.instanceId! * 3], cells[h.instanceId! * 3 + 1], cells[h.instanceId! * 3 + 2]];
			} else {
				// translation is NOT the owning cell for rotated chests (pivot
				// residue) — loud in dev rather than a silently wrong outline
				console.warn("[pick] chest mesh missing userData.cells, falling back to translation");
				chestCell = [Math.round(m.elements[12]), Math.round(m.elements[13]), Math.round(m.elements[14])];
			}
			chestT = so.group.worldToLocal(h.point.clone()).sub(origin).dot(dir);
		}
	}
	if (chestCell && (!hit || chestT < hitT)) {
		showSelection(so, chestCell, worldOrigin, dir, chestT);
		r.renderManager?.render();
		const nm = (gb(chestCell[0], chestCell[1], chestCell[2]) || "chest").replace("minecraft:", "").split("[")[0];
		fileEl.textContent = `${nm} @ ${chestCell[0]}, ${chestCell[1]}, ${chestCell[2]}`;
		lastPickToast = Date.now();
		return;
	}
	if (!hit) { clearSelection(); return; }
	showSelection(so, hit, worldOrigin, dir, hitT);
	r.renderManager?.render();
	const name = (gb(hit[0], hit[1], hit[2]) || "block").replace("minecraft:", "").split("[")[0];
	fileEl.textContent = `${name} @ ${hit[0]}, ${hit[1]}, ${hit[2]}`;
	lastPickToast = Date.now();
});

// drag & drop
const drop = $("drop");
let dragDepth = 0;
window.addEventListener("dragenter", (e) => { e.preventDefault(); dragDepth++; drop.style.display = "flex"; });
window.addEventListener("dragleave", () => { if (--dragDepth <= 0) { dragDepth = 0; drop.style.display = "none"; } });
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", async (e) => {
	e.preventDefault();
	dragDepth = 0;
	drop.style.display = "none";
	const file = e.dataTransfer?.files?.[0];
	if (!file) return;
	currentUrl = URL.createObjectURL(file);
	urlbar.value = file.name;
	load(currentUrl);
});

// ?url= autoload + sensible demo default
const qurl = new URLSearchParams(location.search).get("url");
const initial = qurl || "schematics/stress_64x48x64.litematic";
urlbar.value = qurl || "";
load(initial);
