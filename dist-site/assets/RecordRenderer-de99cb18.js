import{i as ce,em as ue,$ as fe,V as E,a2 as ve,a as de,v as pe,h as j,B as $,u as X,M as K,dg as me,f as we,D as ie,U as he,m as V,k as xe,o as ye,ax as Z,aA as q}from"./SchematicRenderer-ed2eef6a.js";const z=8192,R=1024,J=z*1024,W=16,M=64,P=1024,ge=4e7;function ee(e,t,r,o,l){if(t===0)return{rec:e,sections:[]};if(t>ge)return{rec:e,sections:[{base:0,count:t,box:[-2,-2,-2,r+2,o+2,l+2]}]};const f=Math.ceil(r/W),d=Math.ceil(o/W),h=Math.ceil(l/W),p=f*d*h,w=new Uint32Array(p+1),v=s=>{const n=e[s*2],u=n/(r*l)|0,a=(n/r|0)%l;return(n%r/W|0)+(a/W|0)*f+(u/W|0)*f*h};for(let s=0;s<t;s++)w[v(s)+1]++;for(let s=0;s<p;s++)w[s+1]+=w[s];const c=new Uint32Array(t*2),y=w.slice(0,p);for(let s=0;s<t;s++){const n=y[v(s)]++;c[n*2]=e[s*2],c[n*2+1]=e[s*2+1]}const x=[];for(let s=0;s<p;s++){const n=w[s+1]-w[s];if(n===0)continue;const u=(s/(f*h)|0)*W,a=(s/f|0)%h*W,g=s%f*W,b=Math.min(r,g+W)-1,i=Math.min(o,u+W)-1,T=Math.min(l,a+W)-1,m=2;x.push({base:w[s],count:n,box:[g-m,u-m,a-m,b+1+m,i+1+m,T+1+m]})}return{rec:c,sections:x}}function te(e,t,r){const o=[];for(let l=0;l<Y(t);l+=J){const f=Math.min(J,Y(t)-l),d=[];for(const h of t){const p=Math.max(h.base,l),w=Math.min(h.base+h.count,l+f);p<w&&d.push({base:p-l,count:w-p,box:h.box})}o.push({rec:e.subarray(l*2,(l+f)*2),items:f,sections:d})}return o.length===0&&o.push({rec:new Uint32Array(0),items:0,sections:[]}),o}function Y(e){let t=0;for(const r of e)t=Math.max(t,r.base+r.count);return t}function oe(e,t,r,o,l,f){const d=new me,h=new we,p=t.map(()=>new $),w=t.map(c=>new $(new E(c.box[0],c.box[1],c.box[2]),new E(c.box[3],c.box[4],c.box[5]))),v=[];e.onBeforeRender=(c,y,x)=>{var g,b;const s=e.material;(g=s.uniforms)!=null&&g.uTime&&(s.uniforms.uTime.value=performance.now()/1e3),(b=s.uniforms)!=null&&b.uWaterFramesOn&&s.uniforms.uWaterFramesOn.value===0&&re.water&&(s.uniforms.uWaterFrames.value=re.water,s.uniforms.uWaterFramesOn.value=1),h.multiplyMatrices(x.projectionMatrix,x.matrixWorldInverse),d.setFromProjectionMatrix(h),e.updateWorldMatrix(!0,!1);for(let i=0;i<w.length;i++)p[i].copy(w[i]).applyMatrix4(e.matrixWorld);v.length=0;const n=x.getWorldPosition(new E);for(let i=0;i<p.length;i++)d.intersectsBox(p[i])&&v.push(i);v.sort((i,T)=>{const m=ne(p[i],n),_=ne(p[T],n);return f?_-m:m-_});let u=0;for(const i of v){const T=t[i];for(let m=0;m<T.count&&!(u*2+1>=o.length);m+=M)o[u*2]=T.base+m,o[u*2+1]=Math.min(M,T.count-m),u++}for(let i=u;i<o.length/2;i++)o[i*2]=0,o[i*2+1]=0;r.needsUpdate=!0,e.userData.pagesDrawn=u;const a=e.geometry.index?e.geometry.index.count:1/0;e.geometry.setDrawRange(0,Math.min(u*M*l,a))},e.userData.pagesDrawn=Math.ceil(Y(t)/M)}function ne(e,t){const r=Math.max(e.min.x-t.x,0,t.x-e.max.x),o=Math.max(e.min.y-t.y,0,t.y-e.max.y),l=Math.max(e.min.z-t.z,0,t.z-e.max.z);return r*r+o*o+l*l}const le=`
precision highp float;
precision highp int;
precision highp usampler2D;
uniform highp usampler2D uRecords;  // RG32UI: (linear cell index, template triangle row)
uniform highp usampler2D uRows;     // RGBA32UI: (c0, c1, c2, _) absolute template vertex ids
uniform highp usampler2D uPages;    // RG32UI: (base item, count) per ${M}-item page
uniform highp sampler2D uPos;       // RGBA32F corner positions (block-local)
uniform highp sampler2D uNrm;       // RGBA32F
uniform highp sampler2D uUv;        // RGBA32F atlas-space uvs
uniform vec3 uDims;                 // sx, sy, sz (vec3 — uvec3 uniform setters vary)
uniform vec4 uPow2;                 // (xMask, zShiftZMask, yShift, enabled) — pow2 fast decode (gpt-6 #3)
out vec2 vUv;
out float vShade;
out float vWy;
out float vCy;
// strip animation (liquid still/flow): signed frames, frame step, frame-0 top V.
// FLAT: these are per-face constants; interpolating them lets a quad straddle
// two parameter sets and feeds a varying into fragment control flow.
flat out float vAnimF;
flat out float vStep;
flat out float vTop;
// fable water: full world position (smooth) + face normal (flat) for the frame-array path
out vec3 vWp;
flat out vec3 vNw;
uniform vec2 uLayerClip; // (enabled, topY) — slice view: discard fragments above grid Y
void main() {
  uint vid = uint(gl_VertexID);
  // slot -> page -> real record (culling happens by rewriting the page table per frame)
  uint slot = vid / 3u;
  uint k = vid - slot * 3u;
  uint page = slot / ${M}u;
  uint local = slot - page * ${M}u;
  uvec2 pe = texelFetch(uPages, ivec2(int(page & ${P-1}u), int(page / ${P}u)), 0).rg;
  if (local >= pe.y) { gl_Position = vec4(2e9, 2e9, 2e9, 1.0); return; } // padded slot
  uint tri = pe.x + local;
  uvec2 rec = texelFetch(uRecords, ivec2(int(tri & ${z-1}u), int(tri / ${z}u)), 0).rg;
  uint cell = rec.x;
  uint row = rec.y;
  uint sx = uint(uDims.x), sy = uint(uDims.y), sz = uint(uDims.z);
  // pow2 dims avoid three runtime integer div/mod per vertex (uniform branch, cheap);
  // the general path stays for builds like 64x48x64 whose sy isn't a power of two
  uvec3 bc;
  if (uPow2.w > 0.5) {
    bc = uvec3(cell & uint(uPow2.x), cell >> uint(uPow2.z), (cell >> uint(uPow2.y)) & uint(uPow2.x));
  } else {
    bc = uvec3(cell % sx, cell / (sx * sz), (cell / sx) % sz); // x, y, z
  }
  uvec4 corners = texelFetch(uRows, ivec2(int(row) & ${R-1}, int(row) / ${R}), 0);
  uint vi = k == 0u ? corners.x : (k == 1u ? corners.y : corners.z);
  ivec2 ct = ivec2(int(vi) & ${R-1}, int(vi) / ${R});
  vec3 pos = texelFetch(uPos, ct, 0).xyz;
  vUv = texelFetch(uUv, ct, 0).xy;
  // Fixed WORLD-space face shading (vanilla-style: top 1.0, bottom 0.5, z 0.8, x 0.6).
  // The previous view-space light (normalMatrix * n dotted with a fixed dir) made the
  // bright/dark set reshuffle with every camera move — the "black/white checker that
  // flickers when moving" artifact. Template normals are grid-space = world-space.
  vec3 wn = texelFetch(uNrm, ct, 0).xyz;
  float ax = abs(wn.x), ay = abs(wn.y), az = abs(wn.z);
  vShade = (ay >= ax && ay >= az) ? (wn.y > 0.0 ? 1.0 : 0.5) : (az >= ax ? 0.8 : 0.6);
  // oracle-frozen arithmetic: same componentwise f32 add the compute mesher performs
  vec3 world = vec3(bc) + pos;
  vWy = world.y;
  vCy = float(bc.y); // owning CELL y — layer slicing is cell-aligned, not a geometry cut
  // animation channels ride in the free w components of the corner tables
  vAnimF = texelFetch(uUv, ct, 0).w;
  vStep = texelFetch(uPos, ct, 0).w;
  vTop = texelFetch(uNrm, ct, 0).w;
  // world position + normal for the water frame-array path (fable)
  vWp = world;
  vNw = wn;
  gl_Position = projectionMatrix * (modelViewMatrix * vec4(world, 1.0));
}`,be=le.replace("uint slot = vid / 3u;","uint slot = vid / 4u;").replace("uint k = vid - slot * 3u;","uint k = vid - slot * 4u;").replace("uint vi = k == 0u ? corners.x : (k == 1u ? corners.y : corners.z);","uint vi = k == 0u ? corners.x : (k == 1u ? corners.y : (k == 2u ? corners.z : corners.w));"),ae=`
precision highp float;
precision highp sampler2DArray;
uniform sampler2D uAtlas;
uniform sampler2DArray uWaterFrames; // fable: liquid frames as array LAYERS (hardware wrap, no atlas bleed)
uniform float uWaterFramesOn;        // 1.0 when the array texture is loaded
uniform vec2 uLayerClip;
uniform float uShadeMix;
uniform float uTime;
in vec2 vUv;
in float vShade;
in float vWy;
in float vCy;
// per-primitive constants: flat, so a quad never blends two faces' parameters
flat in float vAnimF;
flat in float vStep;
flat in float vTop;
in vec3 vWp;
flat in vec3 vNw;
layout(location = 0) out vec4 outColor;

// ONE world-space flow for the whole water body (blocks per second).
// Tops scroll by (x,z); x-normal sides scroll along z by WATER_FLOW.y; z-normal
// sides scroll along x by WATER_FLOW.x; every side also falls by WATER_FALL.
// Shared edges therefore move identically on both faces ("one continuous flow").
const vec2  WATER_FLOW = vec2(0.045, 0.030);
const float WATER_FALL = 0.090;
const float WATER_FPS  = 5.0;
const float WATER_TEXELS_PER_BLOCK = 16.0;
// second octave at 1/4 scale breaks the 1-block tile period (same mean, same flow)
const float WATER_OCT2_SCALE = 0.25;
const float WATER_OCT2_MIX   = 0.35;

// two-frame cross-fade at ONE explicit LOD (no implicit derivatives anywhere in
// the water path -> defined regardless of the enclosing non-uniform branch)
vec4 waterTap(vec2 uv, float k0, float k1, float fk, float lod) {
  vec4 a = textureLod(uWaterFrames, vec3(uv, k0), lod);
  vec4 b = textureLod(uWaterFrames, vec3(uv, k1), lod);
  return mix(a, b, fk);
}

void main() {
  // ---- ALL derivatives up front, in uniform control flow, before any discard ----
  // atlas path
  vec2 duv = vUv * 2048.0;
  float dx2 = dot(dFdx(duv), dFdx(duv));
  float dy2 = dot(dFdy(duv), dFdy(duv));
  float lod = 0.5 * log2(max(dx2, dy2));

  // water path: world-space uv for THIS face (normal is flat -> constant per primitive)
  vec3 an = abs(vNw);
  vec2 wuv;
  vec2 scroll;
  if (an.y > 0.5) {
    wuv = vWp.xz;
    scroll = WATER_FLOW;
  } else if (an.x > 0.5) {
    wuv = vWp.zy;
    scroll = vec2(WATER_FLOW.y, WATER_FALL);
  } else {
    wuv = vWp.xy;
    scroll = vec2(WATER_FLOW.x, WATER_FALL);
  }
  // scroll is spatially constant, so it does not change the derivatives
  wuv += scroll * uTime;
  vec2 wduv = wuv * WATER_TEXELS_PER_BLOCK;
  float wdx2 = dot(dFdx(wduv), dFdx(wduv));
  float wdy2 = dot(dFdy(wduv), dFdy(wduv));
  // ISOTROPIC (max-axis) LOD: the footprint's long axis decides, so the result does
  // not depend on footprint orientation -> no view-direction-dependent mip patchwork.
  // Level 4 of a 16x16 layer is its 1x1 mean: distance converges to a uniform sheet.
  float wlod = clamp(0.5 * log2(max(max(wdx2, wdy2), 1e-12)), 0.0, 4.0);
  // 1/4-scale octave has 4x fewer texels per pixel -> two levels sharper
  float wlod2 = clamp(wlod - 2.0, 0.0, 4.0);

  // layer slice, CELL-aligned: partial geometry (fences are 1.5 tall, slabs 0.5)
  // belongs wholly to its owning cell, so Minecraft layer view must cut on bc.y,
  // not on world Y (a Y-plane halves fences/panes at layer boundaries)
  if (uLayerClip.x > 0.5 && vCy > uLayerClip.y + 0.5) discard;

  // Cap atlas mip selection at level 4 (a 16px tile is 1px there): levels 5+ average
  // across atlas tiles — foreign colors and the transparent padding between tiles.
  // ISOTROPIC textureLod, not textureGrad: anisotropic footprints at the LOD-4 cap
  // stretch flat-on wall faces ACROSS neighbouring atlas tiles.
  vec4 c;
  if (vAnimF != 0.0 && uWaterFramesOn > 0.5) {
    // fable WATER ARRAY PATH: frames are array LAYERS (16x16 each) with hardware
    // RepeatWrapping; uvs are world coordinates (continuous across every block
    // boundary by construction); nothing can sample outside the water texture.
    float nFrames = float(textureSize(uWaterFrames, 0).z);
    float ft = mod(uTime * WATER_FPS, nFrames);
    float k0 = floor(ft);
    float k1 = mod(k0 + 1.0, nFrames);
    float fk = ft - k0;
    vec4 c1 = waterTap(wuv, k0, k1, fk, wlod);
    vec4 c2 = waterTap(wuv * WATER_OCT2_SCALE + vec2(0.37, 0.61), k0, k1, fk, wlod2);
    c = mix(c1, c2, WATER_OCT2_MIX);
  } else {
    vec2 tuv = vUv;
    if (vAnimF > 0.5) {
      float k = floor(mod(uTime * 5.0, vAnimF));
      float lv = clamp(vUv.y - (vTop - vStep), 0.03 * vStep, 0.97 * vStep);
      tuv.y = (vTop - vStep) + lv - k * vStep;
    } else if (vAnimF < -0.5) {
      float frames = -vAnimF;
      float k = floor(mod(uTime * 5.0, frames));
      float q = clamp(fract(vWy * 0.5 + uTime * 0.25), 0.03, 0.97);
      tuv.y = (vTop - k * vStep) - q * vStep;
      float lu = clamp(fract(vUv.x / vStep), 0.03, 0.97);
      float u0 = vUv.x - lu * vStep;
      tuv.x = u0 + fract(lu + vWp.x + vWp.z + uTime * 0.08) * vStep;
    }
    c = textureLod(uAtlas, tuv, min(lod, 4.0));
  }
  /*CUTOUT*/
  // uShadeMix: 1.0 = full vanilla directional shade (opaque blocks); transparent
  // materials (water) soften toward 1.0 — vanilla's 0.5 bottom-face shade makes
  // water read near-black when looked at from below ("dark blue from underneath")
  outColor = vec4(c.rgb * mix(1.0, vShade, uShadeMix), /*ALPHA*/);
  #ifdef TONE_MAPPING
    outColor.rgb = toneMapping(outColor.rgb);
  #endif
  outColor = linearToOutputTexel(outColor);
}`,re={water:null,lava:null};function se(e,t=!1){const r=e?ae.replace("/*CUTOUT*/","if (c.a < 0.5) discard;").replace("/*ALPHA*/","c.a"):ae.replace("/*CUTOUT*/","").replace("/*ALPHA*/","1.0");return new ce({glslVersion:ue,vertexShader:t?be:le,fragmentShader:r,transparent:e,depthWrite:!e,side:fe,forceSinglePass:!0,uniforms:{uRecords:{value:null},uRows:{value:null},uPages:{value:null},uPos:{value:null},uNrm:{value:null},uUv:{value:null},uAtlas:{value:null},uDims:{value:new E(1,1,1)},uPow2:{value:new ve(0,0,0,0)},uLayerClip:{value:new de(0,1e9)},uShadeMix:{value:e?0:1},uTime:{value:0},uWaterFrames:{value:null},uWaterFramesOn:{value:0}}})}function Te(e,t,r,o){if(r.length>=e*t*o)return r;const l=new Uint32Array(e*t*o);return l.set(r),l}function Ae(e,t,r){if(r.length>=e*t*4)return r;const o=new Float32Array(e*t*4);return o.set(r),o}function D(e,t,r,o,l){r=Te(e,t,r,o===q?2:4);const d=new ie(r,e,t,o,he);return d.internalFormat=l,d.needsUpdate=!0,d.magFilter=V,d.minFilter=V,d.generateMipmaps=!1,d}function H(e,t,r){r=Ae(e,t,r);const o=new ie(r,e,t,xe,ye);return o.internalFormat="RGBA32F",o.needsUpdate=!0,o.magFilter=V,o.minFilter=V,o.generateMipmaps=!1,o}function Fe(e,t,r){const o=new Map,l=n=>{if(!o.has(n)){const u=r(n,n+1);o.set(n,u.quad?u.corners:null)}return o.get(n)},f=[],d=new Map,h=new Uint32Array(Math.ceil(t/2)),p=new Uint32Array(Math.ceil(t/2)),w=new Uint32Array(t*2);let v=0,c=0;const y=new Uint8Array(t),x=new Map;for(let n=0;n<t;n++){const u=e[n*2],a=e[n*2+1],g=x.get(u);if(g!==void 0&&e[g*2+1]===a-1){const b=l(a-1);if(b){const i=b.join(",");let T=d.get(i);T===void 0&&(T=f.length/4,f.push(b[0],b[1],b[2],b[3]),d.set(i,T)),h[v]=u,p[v]=T,v++,y[g]=1,y[n]=1,x.delete(u);continue}}x.set(u,n)}const s=new Uint32Array(v*2);for(let n=0;n<v;n++)s[n*2]=h[n],s[n*2+1]=p[n];for(let n=0;n<t;n++)y[n]||(w[c++]=e[n*2],w[c++]=e[n*2+1]);return{quadRec:s,quads:v,cornerTable:f,triRec:w.subarray(0,c),triTris:c/2}}function Re(e){const t=new Uint32Array(e*6);for(let r=0,o=0,l=0;r<e;r++,o+=4)t[l++]=o,t[l++]=o+1,t[l++]=o+2,t[l++]=o,t[l++]=o+2,t[l++]=o+3;return new pe(t,1)}function ke(e,t,r){const o=e.tables,l=Math.ceil(o.rows/R),f=Math.ceil(o.verts/R),d=H(R,f,o.tplPos),h=H(R,f,o.tplNrm),p=H(R,f,o.tplUv),w=D(R,l,o.rowCorners,Z,"RGBA32UI"),v=[];for(const c of e.perCategory){if(c.tris===0)continue;const y=c.category!=="solid",x=c.y0??0,s=c.h??e.sy;let n=null,u=c.records,a=c.tris;if(r){const i=Fe(c.records,c.tris,r);n={quadRec:i.quadRec,quads:i.quads,cornerTable:i.cornerTable},u=i.triRec,a=i.triTris}const g=ee(u,a,e.sx,e.sy,e.sz),b=n?ee(n.quadRec,n.quads,e.sx,e.sy,e.sz):null;for(const i of te(g.rec,g.sections)){const{rec:T,items:m,sections:_}=i;if(m===0)continue;const U=Math.ceil(m/z),B=new Uint32Array(U*z*2);B.set(T);const I=D(z,U,B,q,"RG32UI"),O=Math.ceil(m/M),G=new Uint32Array(P*Math.ceil(O/P)*2),A=D(P,Math.ceil(O/P),G,q,"RG32UI"),F=se(y);c.category==="water"&&(F.depthWrite=!0),F.uniforms.uRecords.value=I,F.uniforms.uRows.value=w,F.uniforms.uPages.value=A,F.uniforms.uPos.value=d,F.uniforms.uNrm.value=h,F.uniforms.uUv.value=p,F.uniforms.uDims.value.set(e.sx,e.sy,e.sz);{const L=Math.log2(e.sx),k=e.sx===e.sz&&Number.isInteger(L)&&e.sx>0;F.uniforms.uPow2.value.set(k?e.sx-1:0,k?L:0,k?L*2:0,k?1:0)}F.uniforms.uAtlas.value=t;const C=new j;C.setDrawRange(0,Math.ceil(m/M)*M*3),C.boundingBox=new $(new E(-.51,x-.51,-.51),new E(e.sx-.49,x+s+.01,e.sz-.49)),C.boundingSphere=C.boundingBox.getBoundingSphere(new X);const S=new K(C,F);S.userData.category=c.category,S.userData.gpuBuilt=!0,S.userData.recordDrawn=m,S.frustumCulled=!0,S.matrixAutoUpdate=!1,S.updateMatrix(),oe(S,_,A,G,3,y),v.push(S)}if(n&&n.quads>0){const i=new Uint32Array(Math.max(n.cornerTable.length,R*4));i.set(n.cornerTable);const T=D(R,Math.ceil(i.length/4/R),i,Z,"RGBA32UI");for(const m of te(b.rec,b.sections)){const{rec:_,items:U,sections:B}=m;if(U===0)continue;const I=Math.ceil(U/z),O=new Uint32Array(I*z*2);O.set(_);const G=D(z,I,O,q,"RG32UI"),A=se(y,!0);c.category==="water"&&(A.depthWrite=!0),A.uniforms.uRecords.value=G,A.uniforms.uRows.value=T,A.uniforms.uPos.value=d,A.uniforms.uNrm.value=h,A.uniforms.uUv.value=p,A.uniforms.uDims.value.set(e.sx,e.sy,e.sz);{const Q=Math.log2(e.sx),N=e.sx===e.sz&&Number.isInteger(Q)&&e.sx>0;A.uniforms.uPow2.value.set(N?e.sx-1:0,N?Q:0,N?Q*2:0,N?1:0)}A.uniforms.uAtlas.value=t;const F=Math.ceil(U/M),C=new Uint32Array(P*Math.ceil(F/P)*2),S=D(P,Math.ceil(F/P),C,q,"RG32UI");A.uniforms.uPages.value=S;const L=new j;L.setIndex(Re(U)),L.setDrawRange(0,Math.min(Math.ceil(U/M)*M*6,U*6)),L.boundingBox=new $(new E(-.51,x-.51,-.51),new E(e.sx-.49,x+s+.01,e.sz-.49)),L.boundingSphere=L.boundingBox.getBoundingSphere(new X);const k=new K(L,A);k.userData.category=c.category,k.userData.gpuBuilt=!0,k.userData.recordDrawn=U,k.matrixAutoUpdate=!1,k.updateMatrix(),oe(k,B,S,C,6,y),v.push(k)}}}return v}function We(e,t,r,o,l,f,d,h=[],p=[],w=[]){const v=e.length/3,c=new Float32Array(v*4),y=new Float32Array(v*4),x=new Float32Array(v*4);for(let a=0;a<v;a++)c[a*4]=e[a*3],c[a*4+1]=e[a*3+1],c[a*4+2]=e[a*3+2],y[a*4]=t[a*3],y[a*4+1]=t[a*3+1],y[a*4+2]=t[a*3+2],x[a*4]=r[a*2],x[a*4+1]=r[a*2+1],c[a*4+3]=h[a]||0,y[a*4+3]=p[a]||0,x[a*4+3]=w[a]||0;let s=0;for(let a=1;a<=d;a++)s+=Math.floor(f[a*4+1]/3);const n=new Uint32Array(Math.max(s,1)*4);let u=0;for(let a=1;a<=d;a++){const g=l[a*4+1],b=Math.floor(f[a*4+1]/3);for(let i=0;i<b;i++)n[u*4]=o[g+i*3],n[u*4+1]=o[g+i*3+1],n[u*4+2]=o[g+i*3+2],u++}return{rowCorners:n,rows:Math.max(u,1),tplPos:c,tplNrm:y,tplUv:x,verts:v}}export{ge as SECTIONIZE_MAX,We as buildRecordTables,re as liquidFrameTextures,se as makePullMaterial,Re as makeQuadIndexBuffer,ke as makeRecordMeshes,Fe as quadify,ee as sectionize};
