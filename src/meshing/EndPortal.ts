import * as THREE from "three";
import type { SurfaceCell } from "./SurfaceIndex";

/** End portal block models contain no elements: the block entity supplies this surface. */
export function buildEndPortalMesh(
	cells: Iterable<SurfaceCell>,
	material: THREE.ShaderMaterial,
	animate: boolean
): THREE.Mesh | null {
	const positions: number[] = [],
		cellY: number[] = [];
	let minY = Infinity;
	for (const { x, y, z, state } of cells) {
		if (state !== "minecraft:end_portal") continue;
		minY = Math.min(minY, y);
		for (const [dx, dz] of [
			[-0.5, -0.5],
			[-0.5, 0.5],
			[0.5, -0.5],
			[-0.5, 0.5],
			[0.5, 0.5],
			[0.5, -0.5],
		]) {
			positions.push(x + dx, y + 0.25, z + dz);
			cellY.push(y);
		}
	}
	if (!positions.length) return null;
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
	geometry.setAttribute("aCellY", new THREE.Float32BufferAttribute(cellY, 1));
	geometry.computeBoundingSphere();
	geometry.computeBoundingBox();
	const mesh = new THREE.Mesh(geometry, material);
	mesh.name = "end-portal";
	mesh.userData.surfaceMesh = true;
	mesh.userData.animatedSurface = animate;
	mesh.userData.minCellY = minY;
	mesh.onBeforeRender = () => {
		material.uniforms.uTime.value = animate ? performance.now() / 1000 : 0;
		material.uniforms.uOpacity.value = material.opacity;
	};
	return mesh;
}

export function makeEndPortalMaterial(
	sky: THREE.Texture,
	portal: THREE.Texture,
	clip = { value: new THREE.Vector2(0, 1e9) }
): THREE.ShaderMaterial {
	// Clone sampler settings so the asset loader's shared textures stay unchanged.
	const maps = [sky, portal].map((source) => {
		const texture = source.clone();
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		texture.needsUpdate = true;
		return texture;
	});
	const material = new THREE.ShaderMaterial({
		side: THREE.DoubleSide,
		uniforms: {
			uSky: { value: maps[0] },
			uPortal: { value: maps[1] },
			uTime: { value: 0 },
			uOpacity: { value: 1 },
			uLayerClip: clip,
		},
		vertexShader: `
attribute float aCellY;
varying float vCellY;
varying vec4 vProjection;
void main() {
  vCellY = aCellY;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vProjection = vec4((gl_Position.xy + gl_Position.ww) * 0.5, gl_Position.zw);
}`,
		fragmentShader: `
uniform sampler2D uSky;
uniform sampler2D uPortal;
uniform float uTime;
uniform float uOpacity;
uniform vec2 uLayerClip;
varying float vCellY;
varying vec4 vProjection;
mat2 portalRotation(float angle) { return mat2(cos(angle), -sin(angle), sin(angle), cos(angle)); }
const vec3 COLORS[16] = vec3[16](
    vec3(0.022087, 0.098399, 0.110818),
    vec3(0.011892, 0.095924, 0.089485),
    vec3(0.027636, 0.101689, 0.100326),
    vec3(0.046564, 0.109883, 0.114838),
    vec3(0.064901, 0.117696, 0.097189),
    vec3(0.063761, 0.086895, 0.123646),
    vec3(0.084817, 0.111994, 0.166380),
    vec3(0.097489, 0.154120, 0.091064),
    vec3(0.106152, 0.131144, 0.195191),
    vec3(0.097721, 0.110188, 0.187229),
    vec3(0.133516, 0.138278, 0.148582),
    vec3(0.070006, 0.243332, 0.235792),
    vec3(0.196766, 0.142899, 0.214696),
    vec3(0.047281, 0.315338, 0.321970),
    vec3(0.204675, 0.390010, 0.302066),
    vec3(0.080955, 0.314821, 0.661491)
);

const mat4 SCALE_TRANSLATE = mat4(
    0.5, 0.0, 0.0, 0.25,
    0.0, 0.5, 0.0, 0.25,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
);

mat4 end_portal_layer(float layer) {
    mat4 translate = mat4(
        1.0, 0.0, 0.0, 17.0 / layer,
        0.0, 1.0, 0.0, (2.0 + layer / 1.5) * ((uTime / 1200.0) * 1.5),
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    );

    mat2 rotate = portalRotation(radians((layer * layer * 4321.0 + layer * 9.0) * 2.0));

    mat2 scale = mat2((4.5 - layer / 4.0) * 2.0);

    return mat4(scale * rotate) * translate * SCALE_TRANSLATE;
}

void main() {
  if (uOpacity <= 0.0 || (uLayerClip.x > 0.5 && vCellY > uLayerClip.y)) discard;
  vec3 color = texture2DProj(uSky, vProjection).rgb * COLORS[0];
  for (int i = 0; i < 16; i++) {
    color += texture2DProj(uPortal, vProjection * end_portal_layer(float(i + 1))).rgb * COLORS[i];
  }
  gl_FragColor = vec4(color, uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
	});
	material.addEventListener("dispose", () => maps.forEach((texture) => texture.dispose()));
	return material;
}
