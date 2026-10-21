// JsNbtSchematic.ts — pure-JS litematic reader for BOSS-class files.
// The wasm parser (nucleation) holds compressed+decompressed+NBT-tree in wasm32 linear
// memory and aborts ("RuntimeError: unreachable") on ~500MB-decompressed litematics.
// This reader parses the ALREADY-GUNZIPPED NBT in the JS heap and exposes the same
// surface the app duck-types as SchematicWrapper, so every existing build mode works.
import * as THREE from "three";

// ---- minimal NBT reader (big-endian, Java edition) ----
class NBTReader {
	dv: DataView; o = 0;
	constructor(buf: ArrayBuffer) { this.dv = new DataView(buf); }
	u8() { return this.dv.getUint8(this.o++); }
	i16() { const v = this.dv.getInt16(this.o); this.o += 2; return v; }
	i32() { const v = this.dv.getInt32(this.o); this.o += 4; return v; }
	i64() { const v = this.dv.getBigInt64(this.o); this.o += 8; return v; }
	f64() { const v = this.dv.getFloat64(this.o); this.o += 8; return v; }
	str() { const len = this.dv.getUint16(this.o); this.o += 2; const s = new TextDecoder().decode(new Uint8Array(this.dv.buffer, this.o, len)); this.o += len; return s; }
	// returns [name, value]; payload() skips children cheaply
	payload(type: number): any {
		switch (type) {
			case 1: { const v = this.u8(); return v; }
			case 2: { const v = this.i16(); return v; }
			case 3: { const v = this.i32(); return v; }
			case 4: { const v = this.i64(); return v; }
			case 5: { const v = this.dv.getFloat32(this.o); this.o += 4; return v; }
			case 6: { const v = this.f64(); return v; }
			case 7: { const len = this.i32(); this.o += len; return null; } // bytes: skip
			case 8: return this.str();
			case 9: { // list
				const t = this.u8(); const len = this.i32();
				if (t === 0 || len === 0) return [];
				const arr: any[] = [];
				for (let i = 0; i < len; i++) arr.push(this.payload(t));
				return arr;
			}
			case 10: { // compound
				const obj: any = {};
				while (true) {
					const t = this.u8();
					if (t === 0) break;
					const name = this.str();
					obj[name] = this.payload(t);
				}
				return obj;
			}
			case 11: { const len = this.i32(); const a = new Int32Array(len); for (let i = 0; i < len; i++) a[i] = this.i32(); return a; }
			case 12: { // long array: keep as f64-pairs-free BigInt64Array copy
				const len = this.i32();
				const start = this.o;
				this.o += len * 8;
				return { __longArray: true, byteOffset: start, length: len };
			}
			default: throw new Error(`NBT: unknown tag ${type} at ${this.o}`);
		}
	}
	root() {
		const t = this.u8();
		if (t !== 10) throw new Error("NBT: root is not a compound");
		this.str(); // root name
		return this.payload(10);
	}
}

/**
 * Duck-typed SchematicWrapper replacement (the manager accepts anything whose
 * constructor name contains "SchematicWrapper"). Parses ONLY what meshing needs:
 * Regions→<first>→Size/Position/BlockStatePalette/BlockStates.
 */
export class SchematicWrapper {
	private grid: Uint32Array;
	private sx: number; private sy: number; private sz: number;
	private palette: { name: string; Name?: string; properties?: any; stateString: string; props: Record<string, string> }[];
	private longs: BigInt64Array;

	constructor(rawNbt: ArrayBuffer) {
		const t0 = performance.now();
		const r = new NBTReader(rawNbt);
		const root = r.root() as any;
		const regions = root.Regions as any;
		if (!regions) throw new Error("litematic: no Regions");
		const keys = Object.keys(regions);
		const region = regions[keys[0]];
		const size = region.Size, pos = region.Position || { x: 0, y: 0, z: 0 };
		// litematica: Size may carry -z with Position offset; use absolute values
		this.sx = Math.abs(size.x); this.sy = Math.abs(size.y); this.sz = Math.abs(size.z);
		const pal = (region.BlockStatePalette || []) as any[];
		this.palette = pal.map((e: any) => {
			const props = e.Properties || {};
			const pk = Object.keys(props);
			const stateString = pk.length ? `${e.Name}[${pk.map((k) => `${k}=${props[k]}`).join(",")}]` : e.Name;
			return { name: e.Name, Name: e.Name, properties: props, stateString, props };
		});
		const bs = region.BlockStates;
		if (!bs || !bs.__longArray) throw new Error("litematic: no BlockStates long array");
		// BigInt64Array demands 8-byte alignment; NBT long arrays can sit at any offset.
		// If misaligned, make one aligned copy (a ~0.5s memcpy for 465MB — fine).
		if (bs.byteOffset % 8 === 0) {
			this.longs = new BigInt64Array(rawNbt, bs.byteOffset, bs.length);
		} else {
			const alignedCopy = rawNbt.slice(bs.byteOffset, bs.byteOffset + bs.length * 8);
			this.longs = new BigInt64Array(alignedCopy, 0, bs.length);
		}
		const n = this.sx * this.sy * this.sz;
		const bits = Math.max(4, 32 - Math.clz32(this.palette.length - 1 || 1));
		this.grid = new Uint32Array(n);
		let bitPos = 0;
		const mask = (1n << BigInt(bits)) - 1n;
		for (let i = 0; i < n; i++) {
			const li = bitPos >> 6, off = BigInt(bitPos & 63);
			this.grid[i] = Number((this.longs[li] >> off) & mask) & 0xfffffff;
			bitPos += bits;
		}
		console.log(`[JsNbt] parsed ${keys[0]}: ${this.sx}x${this.sy}x${this.sz}, ${this.palette.length} states, ${n.toLocaleString()} cells in ${(performance.now() - t0).toFixed(0)}ms`);
	}

	free() { /* GC handles it */ }

	/** Rebuild an instance from plain worker-posted data (see nbtParseWorker): parsing
	 * runs off the main thread, so the boss-sized NBT read no longer freezes the tab. */
	static fromParsed(data: {
		grid: Uint32Array; palette: any[]; sx: number; sy: number; sz: number; name?: string;
	}): SchematicWrapper {
		const w = Object.create(SchematicWrapper.prototype) as SchematicWrapper;
		(w as any).grid = data.grid;
		(w as any).palette = data.palette;
		(w as any).sx = data.sx; (w as any).sy = data.sy; (w as any).sz = data.sz;
		(w as any)._name = data.name || "boss";
		return w;
	}
	get_dimensions(): [number, number, number] { return [this.sx, this.sy, this.sz]; }
	get_block_count(): number { let c = 0; for (let i = 0; i < this.grid.length; i++) if (this.grid[i] !== 0) c++; return c; }
	get_block(x: number, y: number, z: number): string | undefined {
		if (x < 0 || y < 0 || z < 0 || x >= this.sx || y >= this.sy || z >= this.sz) return undefined;
		return this.palette[this.grid[(y * this.sz + z) * this.sx + x]]?.stateString;
	}
	get_block_with_properties(x: number, y: number, z: number) {
		if (x < 0 || y < 0 || z < 0 || x >= this.sx || y >= this.sy || z >= this.sz) return null;
		const p = this.palette[this.grid[(y * this.sz + z) * this.sx + x]];
		if (!p) return null;
		return { properties: () => p.props, name: () => p.name };
	}
	get_all_palettes() { return { default: this.palette }; }
	get_palette() { return this.palette; }
	get_all_block_entities() { return []; }
	getDefinitionRegionNames() { return []; }
	get_all_entities() { return []; }
	create_simulation_world() { return { get_redstone_power: () => 0, free() {} }; }
	get_tight_dimensions(): [number, number, number] {
		const b = this.tightBounds();
		return [b[3] - b[0] + 1, b[4] - b[1] + 1, b[5] - b[2] + 1];
	}
	get_tight_bounds_min(): [number, number, number] { const b = this.tightBounds(); return [b[0], b[1], b[2]]; }
	get_tight_bounds_max(): [number, number, number] { const b = this.tightBounds(); return [b[3], b[4], b[5]]; }
	get_enclosing_size(): [number, number, number] { return [this.sx, this.sy, this.sz]; }
	get_name(): string { return "boss"; }
	get_region_count(): number { return 1; }
	private _tight: [number, number, number, number, number, number] | null = null;
	private tightBounds(): [number, number, number, number, number, number] {
		if (this._tight) return this._tight;
		let x0 = this.sx, y0 = this.sy, z0 = this.sz, x1 = -1, y1 = -1, z1 = -1;
		for (let y = 0; y < this.sy; y++) for (let z = 0; z < this.sz; z++) {
			const row = y * this.sz + z;
			for (let x = 0; x < this.sx; x++) {
				if (this.grid[row * this.sx + x] !== 0) {
					if (x < x0) x0 = x; if (x > x1) x1 = x;
					if (y < y0) y0 = y; if (y > y1) y1 = y;
					if (z < z0) z0 = z; if (z > z1) z1 = z;
				}
			}
		}
		if (x1 < 0) { x0 = y0 = z0 = 0; x1 = this.sx - 1; y1 = this.sy - 1; z1 = this.sz - 1; }
		this._tight = [x0, y0, z0, x1, y1, z1];
		return this._tight;
	}
	to_litematic() { throw new Error("JsNbt: export unsupported"); }

	// chunk iterator: flat Int32Array [x,y,z,paletteIdx,...] per 16³ chunk, bottom-up
	create_lazy_chunk_iterator(cw: number, ch: number, cl: number, _mode: string, _ox: number, _oy: number, _oz: number) {
		const { sx, sy, sz, grid } = this;
		const chunks: { x: number, y: number, z: number }[] = [];
		for (let cy = 0; cy < sy; cy += ch) for (let cz = 0; cz < sz; cz += cl) for (let cx = 0; cx < sx; cx += cw) {
			chunks.push({ x: cx, y: cy, z: cz });
			if (chunks.length > 1e6) break;
		}
		// order: bottom_up = y outer ascending
		chunks.sort((a, b) => a.y - b.y);
		let i = 0;
		return {
			total_chunks: () => chunks.length,
			has_next: () => i < chunks.length,
			next: () => {
				const c = chunks[i++];
				const w = Math.min(cw, sx - c.x), h = Math.min(ch, sy - c.y), d = Math.min(cl, sz - c.z);
				const blocks: number[] = [];
				for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
					const p = grid[((c.y + y) * sz + (c.z + z)) * sx + (c.x + x)];
					if (p !== 0) blocks.push(c.x + x, c.y + y, c.z + z, p);
				}
				return { chunkX: c.x / cw, chunkY: c.y / ch, chunkZ: c.z / cl, blocks: new Int32Array(blocks) };
			},
		};
	}
}
