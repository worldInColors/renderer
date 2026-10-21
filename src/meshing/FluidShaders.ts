// FluidShaders.ts — water/lava surface shader (fable design, verbatim).
// Consumes the fluid mesher's attributes: aFace (0 top, 1 bottom, 2 -z, 3 +z,
// 4 -x, 5 +x) and aFlow (xy = downhill gradient, z = falling flag), with the
// position attribute carrying group-local CENTER-indexed coordinates
// (cell c spans [c-0.5, c+0.5]) so UVs stay continuous across cells.
export const FLUID_VERT = /* glsl */ `
in float aFace;
in vec3  aFlow;

out vec3 vPos;          // group-local, center-indexed (continuous across cells)
flat out int  vFace;    // 0 top, 1 bottom, 2 -z, 3 +z, 4 -x, 5 +x
flat out vec3 vFlow;    // xy = downhill gradient (|v| <= 1), z = falling flag

void main() {
  vPos  = position;
  vFace = int(aFace + 0.5);
  vFlow = aFlow;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const FLUID_FRAG = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2DArray;

uniform sampler2DArray uTex;
uniform float uHasTex;
uniform vec3  uTint;

uniform float uTime;        // seconds
uniform float uCycle;       // seconds per flow cycle
uniform float uFlowScale;   // blocks/cycle at |gradient| = 1
uniform float uFallSpeed;   // blocks/cycle, downward on falling faces
uniform vec2  uAmbient;     // blocks/cycle drift on flat tops

uniform float uFrame0;      // still-frame array crossfade (computed on CPU)
uniform float uFrame1;
uniform float uFrameMix;

uniform float uLumMean;     // mean luminance of the source texels
uniform float uLumTarget;   // desired mean luminance after recovery
uniform float uGain;        // contrast gain around the mean
uniform float uFoam;
uniform float uLodBias;
uniform float uMaxLod;
uniform float uAlpha;     // 1.0 opaque; 0.5 for the waterlogged bucket

in vec3 vPos;
flat in int  vFace;
flat in vec3 vFlow;

layout(location = 0) out vec4 fragColor;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

vec3 sampleAnim(vec2 uv, float lod) {
  vec3 a = textureLod(uTex, vec3(uv, uFrame0), lod).rgb;
  vec3 b = textureLod(uTex, vec3(uv, uFrame1), lod).rgb;
  return mix(a, b, uFrameMix);
}

// Two-phase flow mapping: two layers half a cycle apart, each displaced by
// a bounded, centered offset; triangle-wave weights hide the resetting layer.
vec3 sampleFlow(vec2 uv, vec2 perCycle, float phase, float lod) {
  float p0 = fract(phase);
  float p1 = fract(phase + 0.5);
  float w0 = 1.0 - abs(2.0 * p0 - 1.0);
  vec3 c0 = sampleAnim(uv - perCycle * (p0 - 0.5), lod);
  vec3 c1 = sampleAnim(uv - perCycle * (p1 - 0.5), lod);
  return mix(c1, c0, w0);
}

void main() {
  // --- derivatives ONCE, in uniform control flow ---
  vec3 dpx = dFdx(vPos);
  vec3 dpy = dFdy(vPos);
  float fw   = max(length(dpx), length(dpy));          // world units per pixel
  float lodA = clamp(log2(max(fw * 16.0, 1e-6)) + uLodBias, 0.0, uMaxLod);
  float lodB = clamp(lodA - 2.0, 0.0, uMaxLod);        // quarter-scale octave

  // --- per-face UV / flow / brightness (keyed on flat varyings only) ---
  float mag      = length(vFlow.xy);
  vec2  grad     = vFlow.xy * uFlowScale;
  float flatness = 1.0 - smoothstep(0.02, 0.25, mag);
  float strength = min(1.0, mag);

  vec2  uv;
  vec2  flow;
  float bright;

  if (vFace <= 1) {
    uv     = vPos.xz;
    flow   = grad + uAmbient * flatness;
    bright = (vFace == 0) ? 1.0 : 0.5;
  } else {
    uv = vec2(vPos.x + vPos.z, vPos.y);
    if (vFlow.z > 0.5) {
      flow     = vec2(0.0, -uFallSpeed);
      strength = 1.0;
    } else {
      flow = vec2(grad.x + grad.y, -0.15 * uFallSpeed * strength);
    }
    bright = (vFace <= 3) ? 0.8 : 0.6;
  }

  // --- two octaves, each two-phase flow + still-frame crossfade ---
  float phase = uTime / uCycle;
  vec3 cA = sampleFlow(uv, flow, phase, lodA);
  vec2 uvB   = vec2(uv.y, -uv.x) * 0.25;
  vec2 flowB = vec2(flow.y, -flow.x) * 0.25;
  vec3 cB = sampleFlow(uvB, flowB, phase * 0.7 + 0.37, lodB);
  vec3 tex = mix(cA, cB, 0.35);

  vec3 rgb;
  if (uHasTex < 0.5) {
    rgb = uTint * 0.6;
  } else {
    // --- mask recovery: contrast-stretch luminance around its mean, keep hue ---
    float lum  = dot(tex, LUMA);
    float lumC = max(uLumTarget + (lum - uLumMean) * uGain, 0.02);
    rgb = tex * (lumC / max(lum, 1e-4));
    float crest = smoothstep(uLumTarget, uLumTarget * 1.6 + 0.05, lumC);
    rgb = mix(rgb, vec3(0.88, 0.94, 1.0), crest * strength * uFoam);
  }

  fragColor = vec4(min(rgb * bright, vec3(1.0)), uAlpha);
}
`;
