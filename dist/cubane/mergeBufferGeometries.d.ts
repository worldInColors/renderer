import * as THREE from "three";
/**
 * Merge BufferGeometries into one — concatenating position/normal/uv and offsetting
 * each sub-geometry's indices by the running vertex count.
 *
 * Writes straight into preallocated typed arrays with `.set()` (a memcpy-style bulk
 * copy), so there is no per-element `push`, no `Array.from` intermediates, and no
 * argument spread. That makes it both fast (one allocation per attribute, no GC churn
 * from a growing `number[]`) and safe on large meshes: the previous implementation did
 * `array.push(...Array.from(typedArray))`, which spreads every float as a call argument
 * and throws `RangeError: Maximum call stack size exceeded` once a geometry is large
 * enough.
 *
 * Only geometries with a non-empty position attribute and a non-empty index are merged.
 * Empty input yields an empty geometry; a single input is cloned. Normals are computed
 * if the inputs don't supply them.
 */
export declare function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry;
//# sourceMappingURL=mergeBufferGeometries.d.ts.map