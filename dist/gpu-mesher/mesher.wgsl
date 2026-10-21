// GPU compute mesher — 1:1 port of gpu-mesher/reference-mesher.mjs (hash-validated spec).
// Emits per-category world-space triangles for visible faces, same semantics as
// mesh_builder_wasm::merge_category_geometries:
//   face visible UNLESS neighbor non-air AND same category AND neighbor occFlags bit set.
// Template-invariant per-triangle cull slots are precomputed CPU-side at upload time.

struct Dims { sx: u32, sy: u32, sz: u32, mode: u32 }; // mode: 0=count pass, 1=emit pass

@group(0) @binding(0) var<storage, read> grid: array<u32>;          // palette idx per cell (0=air)
@group(0) @binding(1) var<uniform> dims: Dims;
@group(0) @binding(2) var<storage, read> desc: array<vec4<u32>>;    // per blockstate: (vertStart, idxStart, triStart, occFlags)
@group(0) @binding(3) var<storage, read> desc2: array<vec4<u32>>;   // per blockstate: (vertCount, idxCount, category, _)
@group(0) @binding(4) var<storage, read> tpl_pos: array<f32>;       // template positions (local 0..1)
@group(0) @binding(5) var<storage, read> tpl_idx: array<u32>;
@group(0) @binding(6) var<storage, read> tpl_tri_cull: array<u32>;  // per template TRIANGLE: dir slot 0..5 or 255

@group(0) @binding(7) var<storage, read_write> out_pos: array<f32>; // world coords, per category region
@group(0) @binding(8) var<storage, read_write> out_idx: array<u32>;
@group(0) @binding(9) var<storage, read_write> counters: array<atomic<u32>>; // [cat*2]: vert count, [cat*2+1]: idx count
@group(0) @binding(10) var<storage, read> catOffsets: array<u32>; // region start (verts) per category — prefix sums

const MAX_CAT_VERTS: u32 = 1u << 28; // region stride placeholder — set CPU-side via uniform? (v1: fixed generous stride)
// v1: out_pos/out_idx are partitioned by category with a CPU-computed stride (catVertStride),
// passed via counters buffer tail? Keep simple: uniform-free, use push via desc2.w? — see prep script.

const DIRS = array<vec3<i32>, 6>(
  vec3<i32>(1, 0, 0), vec3<i32>(-1, 0, 0),
  vec3<i32>(0, 1, 0), vec3<i32>(0, -1, 0),
  vec3<i32>(0, 0, 1), vec3<i32>(0, 0, -1),
);

@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let sx = dims.sx; let sy = dims.sy; let sz = dims.sz;
  atomicAdd(&counters[12], 1u); // DEBUG: invocations past bounds check
  if (gid.x >= sx || gid.y >= sy || gid.z >= sz) { return; }
  let cell = gid;
  let ci = (cell.y * sz + cell.z) * sx + cell.x;
  let pv = grid[ci];
  atomicAdd(&counters[13], select(0u, 1u, pv != 0u)); // DEBUG: non-air reads
  if (pv == 0u) { return; }
  atomicAdd(&counters[14], 1u); // DEBUG: past air check

  let d0 = desc[pv];
  let d1 = desc2[pv];
  let vertStart = d0.x; let idxStart = d0.y; let triStart = d0.z; let occFlags = d0.w;
  let vertCount = d1.x; let idxCount = d1.y; let category = d1.z;
  let catVertStride = d1.w; // CPU-provided per-category vertex stride in out_pos/out_idx

  // neighbor category/flags cache per slot (like the CPU reference)
  var nbCulled: array<bool, 6>;
  var nbKnown: array<bool, 6>;
  for (var s = 0u; s < 6u; s++) { nbKnown[s] = false; nbCulled[s] = false; }

  let triCount = idxCount / 3u;
  for (var t = 0u; t < triCount; t++) {
    let slot = tpl_tri_cull[triStart + t];
    if (slot != 255u) {
      let s = slot;
      if (!nbKnown[s]) {
        var culled = false;
        let dirv = DIRS[s];
        let nx = vec3<i32>(cell) + dirv;
        if (nx.x >= 0 && nx.y >= 0 && nx.z >= 0 &&
            nx.x < i32(sx) && nx.y < i32(sy) && nx.z < i32(sz)) {
          let nu = vec3<u32>(nx);
          let nv = grid[(nu.y * sz + nu.z) * sx + nu.x];
          if (nv != 0u) {
            let nd1 = desc2[nv];
            let nFlags = desc[nv].w;
            if (nd1.z == category && (nFlags & (1u << s)) != 0u) { culled = true; }
          }
        }
        nbKnown[s] = true; nbCulled[s] = culled;
      }
      if (nbCulled[s]) { continue; }
    }

    // count pass: tally triangles only (exact allocation), emit pass: write vertices
    if (dims.mode == 0u) {
      atomicAdd(&counters[category * 2u + 1u], 3u); // idx count == vert count (3/tri, v1)
      atomicAdd(&counters[category * 2u + 0u], 3u);
    } else {
      let vBase = atomicAdd(&counters[category * 2u + 0u], 3u);
      let iBase = atomicAdd(&counters[category * 2u + 1u], 3u);
      let region = catOffsets[category];
      for (var k = 0u; k < 3u; k++) {
        let vi = tpl_idx[idxStart + t * 3u + k]; // already ABSOLUTE (prep adds per-geometry base)
        let ob = region + vBase + k;
        out_pos[ob * 3u + 0u] = f32(cell.x) + tpl_pos[vi * 3u + 0u];
        out_pos[ob * 3u + 1u] = f32(cell.y) + tpl_pos[vi * 3u + 1u];
        out_pos[ob * 3u + 2u] = f32(cell.z) + tpl_pos[vi * 3u + 2u];
        out_idx[region + iBase + k] = vBase + k;
      }
    }
  }
}
