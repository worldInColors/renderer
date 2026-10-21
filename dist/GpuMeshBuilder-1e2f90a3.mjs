var Ee = Object.defineProperty;
var ze = (ie, d, u) => d in ie ? Ee(ie, d, { enumerable: !0, configurable: !0, writable: !0, value: u }) : ie[d] = u;
var Te = (ie, d, u) => (ze(ie, typeof d != "symbol" ? d + "" : d, u), u);
import * as se from "three";
const De = (
  /* wgsl */
  `
struct Dims { sx: u32, sy: u32, sz: u32, mode: u32, nSlots: u32, y0: u32, slabH: u32, _p: u32 };
// modes: 0 = count (f32 vertex path), 1 = emit (f32 vertex path),
//        2 = count (records path, TRIANGLE counters), 3 = emit (records path)
@group(0) @binding(0) var<storage, read> grid: array<u32>;
@group(0) @binding(1) var<uniform> dims: Dims;
@group(0) @binding(2) var<storage, read> desc: array<vec4<u32>>;
@group(0) @binding(3) var<storage, read> desc2: array<vec4<u32>>;
@group(0) @binding(4) var<storage, read> tpl_pos: array<f32>;
@group(0) @binding(5) var<storage, read> tpl_idx: array<u32>;
@group(0) @binding(6) var<storage, read> tpl_tri_cull: array<u32>;
@group(0) @binding(7) var<storage, read_write> out_pos: array<f32>;
@group(0) @binding(8) var<storage, read_write> out_idx: array<u32>;
@group(0) @binding(9) var<storage, read_write> counters: array<atomic<u32>>;
@group(0) @binding(10) var<storage, read> cat_offsets: array<u32>;
@group(0) @binding(11) var<storage, read> tpl_tri_mat: array<u32>; // per template triangle
// binding 12 was out_mat (per-vertex material) — dead since groups derive from segment
// layout; the slot now carries the records-path output (adapter caps at 16 storage bindings)
@group(0) @binding(12) var<storage, read_write> out_records: array<vec2<u32>>; // (blockIdx, templateTriRow) per triangle
@group(0) @binding(13) var<storage, read> tpl_nrm: array<f32>;
@group(0) @binding(14) var<storage, read> tpl_uv: array<f32>;
@group(0) @binding(15) var<storage, read_write> out_nrm: array<f32>;
@group(0) @binding(16) var<storage, read_write> out_uv: array<f32>;

const DIRS = array<vec3<i32>, 6>(
  vec3<i32>(1, 0, 0), vec3<i32>(-1, 0, 0),
  vec3<i32>(0, 1, 0), vec3<i32>(0, -1, 0),
  vec3<i32>(0, 0, 1), vec3<i32>(0, 0, -1),
);

const MAXV: u32 = 128u; // local unique-vertex table; templates above this fall back to 3/tri

@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let sx = dims.sx; let sy = dims.sy; let sz = dims.sz;
  // slab chunking: dispatch covers only [y0, y0+slabH) but ALL indexing/culling uses world
  // coordinates against the FULL grid, so the emitted triangle set is identical to a
  // monolithic run — interior seam faces still cull against neighbors outside the slab
  if (gid.x >= sx || gid.y >= dims.slabH || gid.z >= sz) { return; }
  let cell = vec3<u32>(gid.x, gid.y + dims.y0, gid.z);
  let ci = (cell.y * sz + cell.z) * sx + cell.x;
  let pv = grid[ci];
  if (pv == 0u) { return; }

  let d0 = desc[pv];
  let d1 = desc2[pv];
  let vertStart = d0.x; let idxStart = d0.y; let triStart = d0.z;
  let vertCount = d1.x; let idxCount = d1.y; let category = d1.z;
  let slotBase = d1.w; // first (category, material) counter slot for this blockstate's category

  var nbCulled: array<bool, 6>;
  var nbKnown: array<bool, 6>;
  for (var s = 0u; s < 6u; s++) { nbKnown[s] = false; nbCulled[s] = false; }

  let triCount = idxCount / 3u;
  let dedup = vertCount <= MAXV;

  // pass 1: determine surviving triangles; collect unique template vertices (deterministic
  // single-threaded order, identical in count and emit passes)
  var uniq: array<u32, MAXV>; // local template-vertex ids in first-seen order
  var nUniq: u32 = 0u;
  var slot0: u32 = 0xFFFFFFFFu; // segment receiving this cell's deduplicated vertices
  if (dedup) { for (var u = 0u; u < vertCount; u++) { uniq[u] = 0xFFFFFFFFu; } }

  for (var t = 0u; t < triCount; t++) {
    let slot = tpl_tri_cull[triStart + t];
    if (slot != 255u) {
      let s = slot;
      if (!nbKnown[s]) {
        var culled = false;
        let nx = vec3<i32>(cell) + DIRS[s];
        if (nx.x >= 0 && nx.y >= 0 && nx.z >= 0 && nx.x < i32(sx) && nx.y < i32(sy) && nx.z < i32(sz)) {
          let nu = vec3<u32>(nx);
          let nv = grid[(nu.y * sz + nu.z) * sx + nu.x];
          if (nv != 0u) {
            if (desc2[nv].z == category && (desc[nv].w & (1u << s)) != 0u) { culled = true; }
          }
        }
        nbKnown[s] = true; nbCulled[s] = culled;
      }
      if (nbCulled[s]) { continue; }
    }

    if (slot0 == 0xFFFFFFFFu) { slot0 = slotBase + tpl_tri_mat[triStart + t]; }
    if (dedup && dims.mode < 2u) {
      for (var k = 0u; k < 3u; k++) {
        let loc = tpl_idx[idxStart + t * 3u + k] - vertStart;
        if (loc < MAXV && uniq[loc] == 0xFFFFFFFFu) { uniq[loc] = nUniq; nUniq++; }
      }
    }
  }

  // count pass: idx per material slot (3/tri); verts: deduped once per cell (or 3/tri legacy)
  if (dims.mode == 0u) {
    for (var t = 0u; t < triCount; t++) {
      let slot = tpl_tri_cull[triStart + t];
      if (slot != 255u && nbCulled[slot]) { continue; }
      atomicAdd(&counters[(slotBase + tpl_tri_mat[triStart + t]) * 2u + 1u], 3u);
      if (!dedup) { atomicAdd(&counters[(slotBase + tpl_tri_mat[triStart + t]) * 2u + 0u], 3u); }
    }
    if (dedup && slot0 != 0xFFFFFFFFu) { atomicAdd(&counters[slot0 * 2u + 0u], nUniq); }
    return;
  }

  // RECORDS path (mode 2 count / mode 3 emit): one 8-byte record per surviving triangle —
  // (linear cell index, globalThis template-triangle row). Vertices/UVs/normals are expanded
  // by the consumer (render shader or CPU oracle) from the template tables. Material
  // segmentation still applies: records are written into per-(category x material)
  // segments so the record stream can be drawn in material runs without per-tri tags.
  if (dims.mode == 2u || dims.mode == 3u) {
    let ci = (cell.y * sz + cell.z) * sx + cell.x;
    for (var t = 0u; t < triCount; t++) {
      let slot = tpl_tri_cull[triStart + t];
      if (slot != 255u && nbCulled[slot]) { continue; }
      let matIdx = tpl_tri_mat[triStart + t];
      let seg = slotBase + matIdx;
      if (dims.mode == 2u) {
        atomicAdd(&counters[seg * 2u + 1u], 1u); // TRIANGLE count
      } else {
        let i = atomicAdd(&counters[seg * 2u + 1u], 1u);
        out_records[cat_offsets[dims.nSlots + seg] + i] = vec2<u32>(ci, triStart + t);
      }
    }
    return;
  }

  // emit pass
  let catVertRegion = cat_offsets[slotBase];
  if (dedup && slot0 != 0xFFFFFFFFu) {
    let vRegion = cat_offsets[slot0];
    let vBase = atomicAdd(&counters[slot0 * 2u + 0u], nUniq);
    for (var w = 0u; w < vertCount; w++) {
      let u = uniq[w];
      if (u == 0xFFFFFFFFu) { continue; } // local vertex not used by any surviving triangle
      let vi = vertStart + w;
      let ob = vRegion + vBase + u;
      out_pos[ob * 3u + 0u] = f32(cell.x) + tpl_pos[vi * 3u + 0u];
      out_pos[ob * 3u + 1u] = f32(cell.y) + tpl_pos[vi * 3u + 1u];
      out_pos[ob * 3u + 2u] = f32(cell.z) + tpl_pos[vi * 3u + 2u];
      out_nrm[ob * 3u + 0u] = tpl_nrm[vi * 3u + 0u];
      out_nrm[ob * 3u + 1u] = tpl_nrm[vi * 3u + 1u];
      out_nrm[ob * 3u + 2u] = tpl_nrm[vi * 3u + 2u];
      out_uv[ob * 2u + 0u] = tpl_uv[vi * 2u + 0u];
      out_uv[ob * 2u + 1u] = tpl_uv[vi * 2u + 1u];
    }
    for (var t = 0u; t < triCount; t++) {
      let slot = tpl_tri_cull[triStart + t];
      if (slot != 255u && nbCulled[slot]) { continue; }
      let matIdx = tpl_tri_mat[triStart + t];
      let iRegion = cat_offsets[dims.nSlots + slotBase + matIdx];
      let iBase = atomicAdd(&counters[(slotBase + matIdx) * 2u + 1u], 3u);
      for (var k = 0u; k < 3u; k++) {
        let loc = tpl_idx[idxStart + t * 3u + k] - vertStart;
        let u = uniq[loc];
        out_idx[iRegion + iBase + k] = (vRegion + vBase + u) - catVertRegion;
      }
    }
  } else {
    // legacy: 3 vertices per triangle, verts in the triangle's own material slot
    for (var t = 0u; t < triCount; t++) {
      let slot = tpl_tri_cull[triStart + t];
      if (slot != 255u && nbCulled[slot]) { continue; }
      let matIdx = tpl_tri_mat[triStart + t];
      let vRegion = cat_offsets[slotBase + matIdx];
      let iRegion = cat_offsets[dims.nSlots + slotBase + matIdx];
      let vBase = atomicAdd(&counters[(slotBase + matIdx) * 2u + 0u], 3u);
      let iBase = atomicAdd(&counters[(slotBase + matIdx) * 2u + 1u], 3u);
      for (var k = 0u; k < 3u; k++) {
        let vi = tpl_idx[idxStart + t * 3u + k];
        let ob = vRegion + vBase + k;
        out_pos[ob * 3u + 0u] = f32(cell.x) + tpl_pos[vi * 3u + 0u];
        out_pos[ob * 3u + 1u] = f32(cell.y) + tpl_pos[vi * 3u + 1u];
        out_pos[ob * 3u + 2u] = f32(cell.z) + tpl_pos[vi * 3u + 2u];
        out_nrm[ob * 3u + 0u] = tpl_nrm[vi * 3u + 0u];
        out_nrm[ob * 3u + 1u] = tpl_nrm[vi * 3u + 1u];
        out_nrm[ob * 3u + 2u] = tpl_nrm[vi * 3u + 2u];
        out_uv[ob * 2u + 0u] = tpl_uv[vi * 2u + 0u];
        out_uv[ob * 2u + 1u] = tpl_uv[vi * 2u + 1u];
        out_idx[iRegion + iBase + k] = (vRegion + vBase + k) - catVertRegion;
      }
    }
  }
}
`
), W = 0.01, ke = (ie, d, u) => ie === 1 ? 0 : ie === -1 ? 1 : d === 1 ? 2 : d === -1 ? 3 : u === 1 ? 4 : u === -1 ? 5 : 255;
class qe {
  constructor() {
    Te(this, "device", null);
    Te(this, "pipeline", null);
    Te(this, "module", null);
    Te(this, "available", !1);
  }
  async init() {
    if (this.device)
      return !0;
    if (typeof navigator < "u" && navigator.gpu)
      try {
        const d = await navigator.gpu.requestAdapter();
        if (!d)
          return !1;
        this.device = await d.requestDevice({
          requiredLimits: {
            // the shader binds 16 storage buffers (0, 2..16). Request EXACTLY that:
            // if the adapter can't provide it, requestDevice rejects and the caller
            // falls back to batched — requesting the adapter's own limit instead
            // would succeed and then silently dispatch nothing (invalid pipeline)
            maxStorageBuffersPerShaderStage: 16,
            // adapter max here; bindings 0,2..16 fit exactly
            // large builds need big output buffers (3.1M blocks -> ~360MB positions)
            maxStorageBufferBindingSize: d.limits.maxStorageBufferBindingSize,
            maxBufferSize: d.limits.maxBufferSize
          }
        }), this.module = this.device.createShaderModule({ code: De });
        const u = await this.module.getCompilationInfo();
        for (const n of u.messages)
          (n.type === "error" || n.type === "warning") && console.warn(`[GpuMeshBuilder][wgsl:${n.type}] line ${n.lineNum}: ${n.message}`);
        return this.device.lost.then((n) => console.warn("[GpuMeshBuilder] device lost:", n == null ? void 0 : n.reason, n == null ? void 0 : n.message)), this.pipeline = this.device.createComputePipeline({
          layout: "auto",
          compute: { module: this.module, entryPoint: "main" }
        }), this.available = !0, !0;
      } catch (d) {
        return console.warn("[GpuMeshBuilder] WebGPU init failed, falling back:", d), !1;
      }
    return !1;
  }
  /** Flatten palette descriptors + templates into GPU buffers (reusable across meshes). */
  buildTemplateBuffers(d) {
    const u = [...new Set(d.map((b) => b.category))].sort(), n = new Map(u.map((b, B) => [b, B])), C = u.map(() => 1);
    for (const b of d) {
      const B = n.get(b.category);
      for (const a of b.geometries)
        C[B] = Math.max(C[B], (a.materialIndex || 0) + 1);
    }
    const ve = [];
    let we = 0;
    for (let b = 0; b < u.length; b++)
      ve.push(we), we += C[b];
    const e = [], z = [], D = [], ce = [], T = [], v = [], ne = [], ge = [], pe = [], ye = /* @__PURE__ */ new Map(), me = [[0, 0, 0, 0]], he = [[0, 0, 0, 0]], be = Math.max(...d.map((b) => b.index)), _e = new Map(d.map((b) => [b.index, b]));
    for (let b = 1; b <= be; b++) {
      const B = _e.get(b);
      if (!B) {
        me.push([0, 0, 0, 0]), he.push([0, 0, 0, 0]);
        continue;
      }
      const a = z.length, K = D.length, G = e.length / 3;
      for (const o of B.geometries) {
        const X = o.materialIndex || 0, j = e.length / 3, q = z.length, le = D.length, J = o.positions, F = o.normals || [], Q = o.indices;
        for (let t = 0; t < J.length; t++)
          e.push(J[t]);
        const Be = o.uvs || [];
        for (let t = 0; t < F.length; t++)
          T.push(F[t]);
        for (let t = 0; t < Be.length; t++)
          v.push(Be[t]);
        const Y = o.anim, Ae = J.length / 3;
        for (let t = 0; t < Ae; t++)
          ne.push(Y ? Y.frames : 0), ge.push(Y ? Y.step : 0), pe.push(Y ? Y.vTop : 0);
        for (; T.length < e.length; )
          T.push(0);
        for (; v.length < e.length / 3 * 2; )
          v.push(0);
        for (let t = 0; t < Q.length; t++)
          z.push(j + Q[t]);
        for (let t = 0; t + 2 < Q.length; t += 3) {
          const S = Q[t];
          let g = 255;
          if (F.length > S * 3 + 2) {
            const p = Math.round(F[S * 3]), P = Math.round(F[S * 3 + 1]), x = Math.round(F[S * 3 + 2]);
            if (Math.abs(p) + Math.abs(P) + Math.abs(x) === 1) {
              const A = J[S * 3], w = J[S * 3 + 1], k = J[S * 3 + 2];
              (p === 1 && (Math.abs(A - 1) < W || Math.abs(A - 0.5) < W) || p === -1 && (Math.abs(A) < W || Math.abs(A + 0.5) < W) || P === 1 && (Math.abs(w - 1) < W || Math.abs(w - 0.5) < W) || P === -1 && (Math.abs(w) < W || Math.abs(w + 0.5) < W) || x === 1 && (Math.abs(k - 1) < W || Math.abs(k - 0.5) < W) || x === -1 && (Math.abs(k) < W || Math.abs(k + 0.5) < W)) && (g = ke(p, P, x));
            }
          }
          D.push(g), ce.push(X);
        }
        const Se = Math.floor(Q.length / 3);
        for (let t = 0; t + 1 < Se; t += 2) {
          const S = le + t, g = z[q + t * 3], p = z[q + t * 3 + 1], P = z[q + t * 3 + 2], x = z[q + t * 3 + 3], A = z[q + t * 3 + 4], w = z[q + t * 3 + 5], k = [g, p, P].filter((s) => [x, A, w].includes(s));
          if (k.length !== 2)
            continue;
          const I = [x, A, w].find((s) => !k.includes(s)), Z = [g, p, P].find((s) => !k.includes(s));
          if (I === void 0 || Z === void 0 || I === g || I === p || I === P)
            continue;
          const [$, V] = k, c = (s, m, i, h) => s[0] === m && s[1] === i && s[2] === h || s[0] === i && s[1] === h && s[2] === m || s[0] === h && s[1] === m && s[2] === i, M = [g, p, P], r = [x, A, w];
          c(M, $, Z, V) && c(r, $, V, I) ? ye.set(S, [$, Z, V, I]) : c(M, V, Z, $) && c(r, V, $, I) && ye.set(S, [V, Z, $, I]);
        }
      }
      me.push([G, a, K, B.occlusionFlags]), he.push([e.length / 3 - G, z.length - a, n.get(B.category), ve[n.get(B.category)]]);
    }
    return { catNames: u, catMatCount: C, slotBase: ve, nSlots: we, tplPos: e, tplIdx: z, tplCull: D, tplTriMat: ce, tplNrm: T, tplUv: v, tplPosW: ge, tplNrmW: pe, tplUvW: ne, quadStart: ye, desc: me.flat(), desc2: he.flat() };
  }
  /**
   * Build meshes for a full-block grid. `grid` is palette-index-per-cell in
   * (y*sz+z)*sx+x order, 0 = air. Returns BufferGeometry per category with the
   * same {category, positions, indices} shape the batched wasm path produces.
   */
  async buildMeshes(d, u, n, C, ve, we) {
    var M;
    if (!this.device || !this.pipeline)
      throw new Error("GpuMeshBuilder not initialized");
    const e = this.device, z = performance.now(), { catNames: D, catMatCount: ce, slotBase: T, nSlots: v, tplPos: ne, tplIdx: ge, tplCull: pe, tplTriMat: ye, tplNrm: me, tplUv: he, desc: be, desc2: _e } = this.buildTemplateBuffers(ve), b = D.length, B = (r, s) => {
      const m = e.createBuffer({ size: r.byteLength + 3 & -4, usage: s | GPUBufferUsage.COPY_DST });
      return e.queue.writeBuffer(m, 0, r), m;
    }, a = {
      grid: B(d, GPUBufferUsage.STORAGE),
      desc: B(new Uint32Array(be), GPUBufferUsage.STORAGE),
      desc2: B(new Uint32Array(_e), GPUBufferUsage.STORAGE),
      tp: B(new Float32Array(ne), GPUBufferUsage.STORAGE),
      ti: B(new Uint32Array(ge), GPUBufferUsage.STORAGE),
      tc: B(new Uint32Array(pe), GPUBufferUsage.STORAGE),
      tm: B(new Uint32Array(ye), GPUBufferUsage.STORAGE),
      tn: B(new Float32Array(me), GPUBufferUsage.STORAGE),
      tu: B(new Float32Array(he), GPUBufferUsage.STORAGE),
      co: B(new Uint32Array(2 * v), GPUBufferUsage.STORAGE)
    }, K = B(new Uint32Array([u, n, C, 0, v, 0, 0, 0]), GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST), G = Math.max(64, v * 2) * 4, o = e.createBuffer({ size: G, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST }), X = e.createBuffer({ size: G, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ }), j = async () => {
      const r = e.createCommandEncoder();
      r.copyBufferToBuffer(o, 0, X, 0, G), e.queue.submit([r.finish()]), await X.mapAsync(GPUMapMode.READ);
      const s = new Uint32Array(X.getMappedRange().slice(0));
      return X.unmap(), s;
    }, q = (r, s, m, i, h) => e.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: a.grid } },
        { binding: 1, resource: { buffer: K } },
        { binding: 2, resource: { buffer: a.desc } },
        { binding: 3, resource: { buffer: a.desc2 } },
        { binding: 4, resource: { buffer: a.tp } },
        { binding: 5, resource: { buffer: a.ti } },
        { binding: 6, resource: { buffer: a.tc } },
        { binding: 7, resource: { buffer: r } },
        { binding: 8, resource: { buffer: s } },
        { binding: 9, resource: { buffer: o } },
        { binding: 10, resource: { buffer: a.co } },
        { binding: 11, resource: { buffer: a.tm } },
        { binding: 12, resource: { buffer: h } },
        { binding: 13, resource: { buffer: a.tn } },
        { binding: 14, resource: { buffer: a.tu } },
        { binding: 15, resource: { buffer: m } },
        { binding: 16, resource: { buffer: i } }
      ]
    }), le = Math.ceil(u / 4), J = Math.ceil(C / 4), F = e.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }), Q = e.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }), Be = e.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }), Y = e.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }), Ae = e.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }), Se = e.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }), t = () => [F, Q, Be, Y, Ae, Se, a.grid, a.desc, a.desc2, a.tp, a.ti, a.tc, a.tm, a.tn, a.tu, a.co, K, o, X].forEach((r) => r.destroy()), S = async (r, s, m, i) => {
      e.queue.writeBuffer(K, 0, new Uint32Array([u, n, C, r, v, s, m, 0]));
      const h = e.createCommandEncoder(), l = h.beginComputePass();
      l.setPipeline(this.pipeline), l.setBindGroup(0, q(
        i ? i[0] : F,
        i ? i[1] : Q,
        i ? i[2] : Be,
        i ? i[3] : Y,
        i ? i[4] : Ae
      )), l.dispatchWorkgroups(le, Math.ceil(m / 4), J), l.end(), e.queue.submit([h.finish()]), await e.queue.onSubmittedWorkDone();
    }, g = () => e.queue.writeBuffer(o, 0, new Uint32Array(v * 2));
    g(), await S(0, 0, n, null);
    const p = await j(), P = performance.now() - z;
    let x = 0, A = 0;
    for (let r = 0; r < v; r++)
      x += p[r * 2], A += p[r * 2 + 1];
    const w = x * 32 + A * 8;
    if (w > 4 * 1024 ** 3)
      throw t(), new Error(`[GpuMeshBuilder] output ${Math.round(w / 1048576)}MB exceeds the 4GB budget — batched fallback`);
    const k = 384 * 1024 * 1024, I = Math.min(n, Math.max(8, w <= k ? n : Math.floor(n * k / w))), Z = [], $ = async (r, s, m, i) => {
      const h = e.createBuffer({ size: m * 4, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ }), l = e.createCommandEncoder();
      l.copyBufferToBuffer(r, s, h, 0, m * 4), e.queue.submit([l.finish()]), await h.mapAsync(GPUMapMode.READ);
      const E = new i(h.getMappedRange().slice(0));
      return h.unmap(), h.destroy(), E;
    };
    let V = 0, c = !0;
    try {
      for (let r = 0; r < n; r += I) {
        const s = Math.min(I, n - r);
        let m = p;
        c && s === n || (g(), await S(0, r, s, null), m = await j());
        const i = [], h = [];
        let l = 0, E = 0;
        for (let _ = 0; _ < v; _++)
          i.push(l), l += m[_ * 2], h.push(E), E += m[_ * 2 + 1];
        if (e.queue.writeBuffer(a.co, 0, new Uint32Array([...i, ...h])), g(), c && window.__gpuOracle && (window.__gpuDebug = { nSlots: v, slotBase: T, catMatCount: ce, counts: Array.from(p), segV: i, segI: h }), E === 0) {
          c = !1;
          continue;
        }
        const ee = e.createBuffer({ size: l * 3 * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC }), Ue = e.createBuffer({ size: E * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC }), fe = e.createBuffer({ size: l * 3 * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC }), H = e.createBuffer({ size: l * 2 * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC }), Re = performance.now();
        await S(1, r, s, [ee, Ue, fe, H, Se]), V += performance.now() - Re;
        const Pe = await j();
        for (let _ = 0; _ < b; _++) {
          const f = D[_];
          let O = 0, te = 0;
          for (let U = 0; U < ce[_]; U++)
            O += Pe[(T[_] + U) * 2 + 1], te += Pe[(T[_] + U) * 2];
          if (O === 0)
            continue;
          const oe = i[T[_]], ae = h[T[_]], L = await $(ee, oe * 3 * 4, te * 3, Float32Array), y = await $(Ue, ae * 4, O, Uint32Array), N = await $(fe, oe * 3 * 4, te * 3, Float32Array), xe = await $(H, oe * 2 * 4, te * 2, Float32Array), R = new se.BufferGeometry();
          R.setAttribute("position", new se.BufferAttribute(L, 3)), R.setAttribute("normal", new se.BufferAttribute(N, 3)), R.setAttribute("uv", new se.BufferAttribute(xe, 2)), R.setIndex(O > 65535 ? new se.BufferAttribute(y, 1) : new se.BufferAttribute(Uint16Array.from(y), 1));
          for (const U of [R.attributes.position, R.attributes.normal, R.attributes.uv, R.index])
            U.onUpload(() => {
              U.array = null;
            });
          const Fe = we(f);
          for (let U = 0; U < ce[_]; U++) {
            const de = Pe[(T[_] + U) * 2 + 1];
            de > 0 && R.addGroup(h[T[_] + U] - ae, de, U);
          }
          R.boundingBox = new se.Box3(
            new se.Vector3(-0.51, r - 0.51, -0.51),
            new se.Vector3(u - 0.49, r + s + 0.01, C - 0.49)
          ), R.boundingSphere = R.boundingBox.getBoundingSphere(new se.Sphere());
          const Ce = new se.Mesh(R, Fe);
          if (window.__gpuOracle) {
            const U = window;
            (U.__gpuDump = U.__gpuDump || {})[f] = { posArr: L, idxArr: y, groups: ((M = R.groups) == null ? void 0 : M.length) ?? 0 };
          }
          Ce.userData.category = f, Ce.userData.gpuBuilt = !0, Z.push(Ce);
          try {
            const U = window;
            if (U.__meshHashes = U.__meshHashes || [], U.__gpuOracle) {
              let de = 2166136261;
              const Me = [];
              for (let ue = 0; ue + 2 < O; ue += 3) {
                const re = [];
                for (let Ge = 0; Ge < 3; Ge++) {
                  const Oe = y[ue + Ge];
                  re.push(`${Math.round(L[Oe * 3] * 1024)},${Math.round(L[Oe * 3 + 1] * 1024)},${Math.round(L[Oe * 3 + 2] * 1024)}`);
                }
                re.sort(), Me.push(re.join(";"));
              }
              Me.sort();
              for (const ue of Me)
                for (let re = 0; re < ue.length; re++)
                  de ^= ue.charCodeAt(re), de = de * 16777619 >>> 0;
              U.__meshHashes.push({ category: f, tris: Me.length, hash: de.toString(16) });
            }
          } catch {
          }
        }
        [ee, Ue, fe, H].forEach((_) => _.destroy()), c = !1;
      }
      if (window.__gpuRecords) {
        const r = performance.now(), s = _e.length / 4 - 1, m = new Uint32Array(pe.length);
        for (let f = 1; f <= s; f++) {
          const O = be[f * 4 + 2];
          for (let te = 0; te < _e[f * 4 + 1] / 3; te++)
            m[O + te] = f;
        }
        g(), await S(2, 0, n, null);
        const i = await j(), h = [];
        let l = 0;
        for (let f = 0; f < v; f++)
          h.push(l), l += i[f * 2 + 1];
        e.queue.writeBuffer(a.co, 0, new Uint32Array([...new Array(v).fill(0), ...h])), g();
        const E = e.createBuffer({ size: Math.max(l, 1) * 8, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });
        await S(3, 0, n, [F, Q, Be, Y, E]);
        const ee = await j(), Ue = performance.now() - r, fe = /* @__PURE__ */ new Map();
        for (const f of window.__meshHashes ?? []) {
          const O = fe.get(f.category) ?? [];
          O.push(f), fe.set(f.category, O);
        }
        let H = !0, Re = 0, Pe = 0;
        for (let f = 0; f < b; f++) {
          let O = 0;
          for (let y = 0; y < ce[f]; y++)
            O += ee[(T[f] + y) * 2 + 1];
          if (O === 0)
            continue;
          Re += O, Pe += O * 8;
          const te = await $(E, h[T[f]] * 8, O * 2, Uint32Array);
          let oe = 2166136261;
          const ae = [];
          for (let y = 0; y < O; y++) {
            const N = te[y * 2], xe = te[y * 2 + 1], R = N % u, Fe = N / (u * C) | 0, Ce = (N / u | 0) % C, U = m[xe], de = xe - be[U * 4 + 2], Me = be[U * 4 + 1], ue = [];
            for (let re = 0; re < 3; re++) {
              const Ge = ge[Me + de * 3 + re];
              ue.push(
                Math.round(Math.fround(R + ne[Ge * 3]) * 1024) + "," + Math.round(Math.fround(Fe + ne[Ge * 3 + 1]) * 1024) + "," + Math.round(Math.fround(Ce + ne[Ge * 3 + 2]) * 1024)
              );
            }
            ue.sort(), ae.push(ue.join(";"));
          }
          ae.sort();
          for (const y of ae)
            for (let N = 0; N < y.length; N++)
              oe ^= y.charCodeAt(N), oe = oe * 16777619 >>> 0;
          const L = fe.get(D[f]) ?? [];
          if (L.length === 1) {
            const y = L[0].tris === ae.length && L[0].hash === (oe >>> 0).toString(16);
            y || (H = !1), console.log(`[GpuMeshBuilder][records] ${D[f]}: ${ae.length} tris ${(oe >>> 0).toString(16)} vs vertex-path ${L[0].tris} ${L[0].hash} ${y ? "✓ MATCH" : "✗ MISMATCH"}`);
          } else {
            const y = L.reduce((xe, R) => xe + R.tris, 0), N = y === ae.length;
            N || (H = !1), console.log(`[GpuMeshBuilder][records] ${D[f]}: ${ae.length} tris (multi-slab, ${(oe >>> 0).toString(16)}) vs vertex-path slabs ${L.length} totaling ${y} ${N ? "✓ TOTAL MATCH" : "✗ MISMATCH"}`);
          }
        }
        E.destroy();
        const _ = Re === Math.round(A / 3);
        _ || (H = !1), console.log(`[GpuMeshBuilder][records] ${H ? "★ ALL MATCH" : "✗ FAILED"} — ${Re.toLocaleString()} tris as ${(Pe / 1048576).toFixed(1)} MB of records (${Ue.toFixed(0)}ms count+emit+verify; count-pass total ${_ ? "exact" : "DIFFERS"})`);
      }
    } finally {
      t();
    }
    return console.log(`[GpuMeshBuilder] count=${P.toFixed(1)}ms emit=${V.toFixed(1)}ms ${Z.length} meshes, ${Math.round(A / 3).toLocaleString()} tris / ${x.toLocaleString()} verts (dedup ${((1 - x / A) * 100).toFixed(1)}%)`), Z;
  }
  /**
   * Phase B: build meshes that RENDER DIRECTLY from the 8B/triangle record stream
   * (WebGL2 gl_VertexID vertex pulling — no vertex data readback at all).
   * Returns one pulling mesh per non-empty category plus the record stream for
   * verification. Falls back to plain buildMeshes on any WebGPU failure upstream.
   */
  async buildRecordMeshes(d, u, n, C, ve, we) {
    var S;
    const e = this.device, z = performance.now(), { catNames: D, catMatCount: ce, slotBase: T, nSlots: v, tplPos: ne, tplIdx: ge, tplCull: pe, tplTriMat: ye, tplNrm: me, tplUv: he, tplPosW: be, tplNrmW: _e, tplUvW: b, quadStart: B, desc: a, desc2: K } = this.buildTemplateBuffers(ve), G = (g, p) => {
      const P = e.createBuffer({ size: g.byteLength + 3 & -4, usage: p | GPUBufferUsage.COPY_DST });
      return e.queue.writeBuffer(P, 0, g), P;
    }, o = {
      grid: G(d, GPUBufferUsage.STORAGE),
      desc: G(new Uint32Array(a), GPUBufferUsage.STORAGE),
      desc2: G(new Uint32Array(K), GPUBufferUsage.STORAGE),
      tp: G(new Float32Array(ne), GPUBufferUsage.STORAGE),
      ti: G(new Uint32Array(ge), GPUBufferUsage.STORAGE),
      tc: G(new Uint32Array(pe), GPUBufferUsage.STORAGE),
      tm: G(new Uint32Array(ye), GPUBufferUsage.STORAGE),
      tn: G(new Float32Array(me), GPUBufferUsage.STORAGE),
      tu: G(new Float32Array(he), GPUBufferUsage.STORAGE),
      co: G(new Uint32Array(2 * v), GPUBufferUsage.STORAGE)
    }, X = G(new Uint32Array([u, n, C, 0, v, 0, 0, 0]), GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST), j = Math.max(64, v * 2) * 4, q = e.createBuffer({ size: j, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST }), le = e.createBuffer({ size: j, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ }), J = async () => {
      const g = e.createCommandEncoder();
      g.copyBufferToBuffer(q, 0, le, 0, j), e.queue.submit([g.finish()]), await le.mapAsync(GPUMapMode.READ);
      const p = new Uint32Array(le.getMappedRange().slice(0));
      return le.unmap(), p;
    }, F = Array.from({ length: 5 }, () => e.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })), Q = (g) => e.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: o.grid } },
        { binding: 1, resource: { buffer: X } },
        { binding: 2, resource: { buffer: o.desc } },
        { binding: 3, resource: { buffer: o.desc2 } },
        { binding: 4, resource: { buffer: o.tp } },
        { binding: 5, resource: { buffer: o.ti } },
        { binding: 6, resource: { buffer: o.tc } },
        { binding: 7, resource: { buffer: F[0] } },
        { binding: 8, resource: { buffer: F[1] } },
        { binding: 9, resource: { buffer: q } },
        { binding: 10, resource: { buffer: o.co } },
        { binding: 11, resource: { buffer: o.tm } },
        { binding: 12, resource: { buffer: g } },
        { binding: 13, resource: { buffer: o.tn } },
        { binding: 14, resource: { buffer: o.tu } },
        { binding: 15, resource: { buffer: F[2] } },
        { binding: 16, resource: { buffer: F[3] } }
      ]
    }), Be = Math.ceil(u / 4), Y = Math.ceil(C / 4), Ae = async (g, p, P, x) => {
      e.queue.writeBuffer(X, 0, new Uint32Array([u, n, C, g, v, P, x, 0]));
      const A = e.createCommandEncoder(), w = A.beginComputePass();
      w.setPipeline(this.pipeline), w.setBindGroup(0, Q(p)), w.dispatchWorkgroups(Be, Math.ceil(x / 4), Y), w.end(), e.queue.submit([A.finish()]), await e.queue.onSubmittedWorkDone();
    }, Se = () => e.queue.writeBuffer(q, 0, new Uint32Array(v * 2)), t = F[4];
    try {
      const p = [];
      for (let c = 0; c < n; c += 16) {
        const M = Math.min(16, n - c);
        Se(), await Ae(2, t, c, M);
        const r = await J(), s = [];
        let m = 0;
        for (let l = 0; l < v; l++)
          s.push(m), m += r[l * 2 + 1];
        if (m === 0)
          continue;
        e.queue.writeBuffer(o.co, 0, new Uint32Array([...new Array(v).fill(0), ...s])), Se();
        const i = e.createBuffer({ size: m * 8, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });
        await Ae(3, i, c, M);
        const h = await J();
        for (let l = 0; l < D.length; l++) {
          let E = 0;
          for (let H = 0; H < ce[l]; H++)
            E += h[(T[l] + H) * 2 + 1];
          if (E === 0)
            continue;
          const ee = e.createBuffer({ size: E * 8, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ }), Ue = e.createCommandEncoder();
          Ue.copyBufferToBuffer(i, s[T[l]] * 8, ee, 0, E * 8), e.queue.submit([Ue.finish()]), await ee.mapAsync(GPUMapMode.READ);
          const fe = new Uint32Array(ee.getMappedRange().slice(0));
          ee.unmap(), ee.destroy(), p.push({ category: D[l], records: fe, tris: E, y0: c, h: M });
        }
        i.destroy();
      }
      const { buildRecordTables: P, makeRecordMeshes: x } = await import("./RecordRenderer-3c8b6f37.mjs"), A = P(ne, me, he, ge, a, K, K.length / 4 - 1, be, _e, b), w = we(D[0] ?? "solid"), k = ((S = w == null ? void 0 : w[0]) == null ? void 0 : S.map) ?? null, I = K.length / 4 - 1, Z = new Uint32Array(pe.length);
      for (let c = 1; c <= I; c++)
        for (let M = 0; M < K[c * 4 + 1] / 3; M++)
          Z[a[c * 4 + 2] + M] = c;
      const V = x({ perCategory: p, tables: A, sx: u, sy: n, sz: C }, k, (c, M) => {
        const r = B.get(c);
        return r ? { quad: !0, corners: r } : { quad: !1, corners: null };
      });
      return console.log(`[GpuMeshBuilder][pull] ${p.reduce((c, M) => c + M.tris, 0).toLocaleString()} tris → ${V.length} pulling meshes in ${(performance.now() - z).toFixed(0)}ms (readback ${(p.reduce((c, M) => c + M.tris * 8, 0) / 1048576).toFixed(1)}MB)`), { meshes: V, stream: { perCategory: p, tables: A, sx: u, sy: n, sz: C } };
    } finally {
      [...F, o.grid, o.desc, o.desc2, o.tp, o.ti, o.tc, o.tm, o.tn, o.tu, o.co, X, q, le].forEach((g) => g.destroy());
    }
  }
}
export {
  qe as GpuMeshBuilder
};
