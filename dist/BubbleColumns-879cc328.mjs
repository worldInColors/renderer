import * as n from "three";
const y = 8192;
function B(c, x) {
  if (!c.length)
    return null;
  const a = [], v = /* @__PURE__ */ new Map();
  for (const e of c) {
    const r = `${e.x},${e.z}`, t = v.get(r);
    if (t && t.y + t.height === e.y && t.downward === e.downward)
      t.height++;
    else {
      const p = { ...e, height: 1 };
      a.push(p), v.set(r, p);
    }
  }
  const b = c.length * 3, i = Math.min(b, y), m = new Float32Array(i * 4), f = new Float32Array(i * 4), u = new n.Box3();
  for (const e of a)
    u.expandByPoint(new n.Vector3(e.x - 0.5, e.y - 0.5, e.z - 0.5)), u.expandByPoint(new n.Vector3(e.x + 0.5, e.y + e.height - 0.5, e.z + 0.5));
  let g = 0, h = a[0].height * 3;
  const s = (e) => {
    const r = Math.sin(e * 127.1 + 311.7) * 43758.5453;
    return r - Math.floor(r);
  };
  for (let e = 0; e < i; e++) {
    const r = e * b / i;
    for (; r >= h; )
      h += a[++g].height * 3;
    const t = a[g];
    m.set([t.x, t.y - 0.4, t.z, t.height - 0.3], e * 4), f.set(
      [
        s(e * 4),
        s(e * 4 + 1),
        0.08 + s(e * 4 + 2) * 0.06,
        (t.downward ? -1 : 1) * (0.7 + s(e * 4 + 3) * 0.5)
      ],
      e * 4
    );
  }
  const d = new n.PlaneGeometry(1, 1), o = new n.InstancedBufferGeometry();
  o.setIndex(d.index), o.setAttribute("position", d.getAttribute("position")), o.setAttribute("uv", d.getAttribute("uv")), o.setAttribute("aColumn", new n.InstancedBufferAttribute(m, 4)), o.setAttribute("aSeed", new n.InstancedBufferAttribute(f, 4)), o.instanceCount = i, o.boundingBox = u, o.boundingSphere = u.getBoundingSphere(new n.Sphere());
  const w = new n.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uBubble: { value: x } },
    vertexShader: `
			attribute vec4 aColumn;
			attribute vec4 aSeed;
			uniform float uTime;
			varying vec2 vUv;
			varying float vFade;
			void main() {
				float travel = fract(aSeed.x + uTime * aSeed.w / aColumn.w);
				float angle = aSeed.y * 6.283185 + uTime * (aSeed.w < 0.0 ? 3.0 : 0.8);
				float radius = 0.1 + aSeed.y * 0.2;
				vec3 center = aColumn.xyz + vec3(cos(angle) * radius, travel * aColumn.w, sin(angle) * radius);
				vec4 view = modelViewMatrix * vec4(center, 1.0);
				float scale = length(modelMatrix[0].xyz);
				view.xy += position.xy * aSeed.z * scale;
				gl_Position = projectionMatrix * view;
				vUv = uv;
				vFade = smoothstep(0.0, 0.04, travel) * smoothstep(0.0, 0.04, 1.0 - travel);
			}`,
    fragmentShader: `
			uniform sampler2D uBubble;
			varying vec2 vUv;
			varying float vFade;
			void main() {
				vec4 bubble = texture2D(uBubble, vUv);
				if (bubble.a < 0.1) discard;
				gl_FragColor = vec4(bubble.rgb, bubble.a * vFade);
				#include <tonemapping_fragment>
				#include <colorspace_fragment>
			}`,
    transparent: !0,
    depthWrite: !1
  }), l = new n.Mesh(o, w);
  return l.name = "bubble-column-particles", l.renderOrder = 2, l.onBeforeRender = () => {
    w.uniforms.uTime.value = performance.now() / 1e3;
  }, l;
}
export {
  y as MAX_BUBBLES,
  B as buildBubbleMesh
};
