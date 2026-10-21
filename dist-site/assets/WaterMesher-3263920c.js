var Le=Object.defineProperty;var Te=(a,e,t)=>e in a?Le(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t;var I=(a,e,t)=>(Te(a,typeof e!="symbol"?e+"":e,t),t);import{C as ye,i as Se,em as _e,a as Be,$ as Ce,aE as De,V as Ue,h as Pe,v as X,M as Ge}from"./SchematicRenderer-ed2eef6a.js";const Oe=`
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
`,Re=`
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
`,ge=0,Z=1,Fe=2,xe=["water","water","lava"],Ee=/^(air|cave_air|void_air)$|glass|pane|bars|leaves|slab|stairs|fence|wall|torch|sign|button|pressure_plate|rail|carpet|trapdoor|door|chain|lantern|flower|grass|fern|sapling|kelp|seagrass|lily_pad|vine|ladder|scaffolding|cobweb|banner|candle|coral|pickle|bamboo|cactus|sugar_cane|bubble_column|campfire|hopper|cauldron|anvil|head|skull|pot|bed$|bell|lever|tripwire|redstone_wire|repeater|comparator|mushroom$|tulip|rose|dandelion|orchid|poppy|lilac|peony|azalea|dripleaf|moss_carpet|sculk_vein|amethyst_cluster|bud$|frogspawn|hanging_roots|spore_blossom|pointed_dripstone|end_rod|brewing_stand|enchanting_table|conduit|chest|shulker_box|cocoa|wheat|carrots|potatoes|beetroots|nether_wart|stem|ice$|slime_block|honey_block|daylight_detector|lectern|stonecutter|grindstone|composter|barrel|snow$/;function be(a){const e=a.indexOf("level=");if(e<0)return 0;let t=0,n=e+6;for(;n<a.length;){const c=a.charCodeAt(n);if(c<48||c>57)break;t=t*10+(c-48),n++}return t>15?15:t}const me=128;function Ne(a){if(!a)return 0;let e=a,t="";const n=a.indexOf("[");return n>=0&&(e=a.slice(0,n),t=a.slice(n+1,a.length-1)),e.startsWith("minecraft:")&&(e=e.slice(10)),e==="water"||e==="flowing_water"?Z|be(t)<<2:e==="lava"||e==="flowing_lava"?Fe|be(t)<<2:t.indexOf("waterlogged=true")>=0?Z|me:Ee.test(e)?0:256}function ce(a){return a>=8?1:a===0?14.2/16:(8-a)/9}class fe{constructor(e){I(this,"a");I(this,"n",0);this.a=new Float32Array(Math.max(e,64))}ensure(e){if(this.n+e<=this.a.length)return;let t=this.a.length*2;for(;t<this.n+e;)t*=2;const n=new Float32Array(t);n.set(this.a.subarray(0,this.n)),this.a=n}view(){return this.a.subarray(0,this.n)}}class $e{constructor(e){I(this,"a");I(this,"n",0);this.a=new Uint32Array(Math.max(e,64))}ensure(e){if(this.n+e<=this.a.length)return;let t=this.a.length*2;for(;t<this.n+e;)t*=2;const n=new Uint32Array(t);n.set(this.a.subarray(0,this.n)),this.a=n}view(){return this.a.subarray(0,this.n)}}const Y=1/1024;function Ie(a,e,t,n){const c=performance.now(),y=e*t*n,f=new Uint8Array(y),S=new Uint8Array(y),p=new Uint8Array(y);let _=0,G=!1,B=!1;for(let u=0;u<t;u++)for(let m=0;m<n;m++){const v=(u*n+m)*e;for(let h=0;h<e;h++){const F=Ne(a(h,u,m)),r=F&3;f[v+h]=r|F&me,S[v+h]=F>>2&15,p[v+h]=F>>8&1,r!==ge&&(_++,r===Z?G=!0:B=!0)}}const g=(u,m,v)=>(m*n+v)*e+u,O=(u,m,v)=>u>=0&&m>=0&&v>=0&&u<e&&m<t&&v<n,ae=(u,m,v,h)=>{if(!O(m,v,h))return-1;const F=g(m,v,h);return(f[F]&3)===u?v+1<t&&(f[g(m,v+1,h)]&3)===u?1:ce(S[F]):p[F]?-1:0},ve=u=>{const m=Math.max(_,1),v=()=>({pos:new fe(m*3*4*3),face:new fe(m*3*4),flow:new fe(m*3*4*3),idx:new $e(m*3*6),vcount:0}),h=v(),F=v();let r=h,R=0,$=0,k=0,ne=0;const q=(o,s,l)=>(r.pos.ensure(3),r.face.ensure(1),r.flow.ensure(3),r.pos.a[r.pos.n++]=o,r.pos.a[r.pos.n++]=s,r.pos.a[r.pos.n++]=l,r.face.a[r.face.n++]=R,r.flow.a[r.flow.n++]=$,r.flow.a[r.flow.n++]=k,r.flow.a[r.flow.n++]=ne,r.vcount++),E=(o,s,l,A,x,w,C,D,U,W,M,L)=>{const b=q(o,s,l),T=q(A,x,w),d=q(C,D,U),H=q(W,M,L);r.idx.ensure(6),r.idx.a[r.idx.n++]=b,r.idx.a[r.idx.n++]=T,r.idx.a[r.idx.n++]=d,r.idx.a[r.idx.n++]=b,r.idx.a[r.idx.n++]=d,r.idx.a[r.idx.n++]=H};let K=0,V=0;const j=o=>{o>=.8?(K+=o*10,V+=10):o>=0&&(K+=o,V+=1)},z=(o,s,l,A,x,w)=>{const C=ae(u,o+A,s,l),D=ae(u,o,s,l+x);if(C>=1||D>=1)return 1;if(K=0,V=0,C>0||D>0){const U=ae(u,o+A,s,l+x);if(U>=1)return 1;j(U)}return j(w),j(C),j(D),V>0?Math.min(1,K/V):w};for(let o=0;o<t;o++)for(let s=0;s<n;s++)for(let l=0;l<e;l++){const A=g(l,o,s);if((f[A]&3)!==u)continue;r=f[A]&me?F:h;const x=o+1<t&&(f[g(l,o+1,s)]&3)===u,w=x?1:ce(S[A]);let C,D,U,W;if(w>=1?C=D=U=W=1:(C=z(l,o,s,-1,-1,w),D=z(l,o,s,1,-1,w),U=z(l,o,s,1,1,w),W=z(l,o,s,-1,1,w)),ne=w>=1?1:0,$=0,k=0,!ne){const i=(N,ue)=>{if(!O(N,o,ue))return 0;const Q=g(N,o,ue);return(f[Q]&3)===u?S[Q]>=8||o+1<t&&(f[g(N,o+1,ue)]&3)===u?w:w-ce(S[Q]):p[Q]?0:w};$=i(l+1,s)-i(l-1,s),k=i(l,s+1)-i(l,s-1);const P=Math.hypot($,k);P>1&&($/=P,k/=P)}const M=l-.5,L=l+.5,b=s-.5,T=s+.5,d=o-.5,H=d+C,le=d+D,se=d+U,ie=d+W;x||(R=0,E(M,H,b,M,ie,T,L,se,T,L,le,b));{const i=o>0?f[g(l,o-1,s)]&3:ge,P=o>0?p[g(l,o-1,s)]:0;i!==u&&!P&&(R=1,E(M,d,b,L,d,b,L,d,T,M,d,T))}const J=(i,P)=>{if(!O(i,o,P))return!0;const N=g(i,o,P);return(f[N]&3)!==u&&!p[N]};if(J(l,s-1)){R=2;const i=b+Y;E(L,d,i,M,d,i,M,H,i,L,le,i)}if(J(l,s+1)){R=3;const i=T-Y;E(M,d,i,L,d,i,L,se,i,M,ie,i)}if(J(l-1,s)){R=4;const i=M+Y;E(i,d,b,i,d,T,i,ie,T,i,H,b)}if(J(l+1,s)){R=5;const i=L-Y;E(i,d,T,i,d,b,i,le,b,i,se,T)}}const pe=(o,s)=>{if(o.idx.n===0)return null;const l=new Pe;l.setAttribute("position",new X(o.pos.view().slice(),3)),l.setAttribute("aFace",new X(o.face.view().slice(),1)),l.setAttribute("aFlow",new X(o.flow.view().slice(),3)),l.setIndex(new X(o.idx.view().slice(),1)),l.computeBoundingSphere(),l.computeBoundingBox();const A=ke(xe[u],s),x=new Ge(l,A);return x.name=`fluid:${xe[u]}${s?":logged":""}`,x.frustumCulled=!0,s&&(x.renderOrder=1),x.onBeforeRender=()=>te(A),x},re=[],he=pe(h,!1);he&&re.push(he);const we=pe(F,!0);return we&&re.push(we),re},oe=[];return G&&oe.push(...ve(Z)),B&&oe.push(...ve(Fe)),{meshes:oe,cells:_,ms:performance.now()-c}}const Ae={water:{tint:4159204,frameRate:10,cycle:2.5,flowScale:.9,fallSpeed:1.4,ambient:[.05,.03],outMean:.85,targetStd:.17,foam:.35},lava:{tint:16777215,frameRate:4,cycle:6,flowScale:.4,fallSpeed:.6,ambient:[.02,.01],outMean:.62,targetStd:.14,foam:0}},de=new Ue(.2126,.7152,.0722),ee=new Set;let Me=null;function qe(a){Me=a;for(const e of ee)e.userData.bound=!1,te(e)}function ke(a,e=!1){const t=Ae[a],n=new ye(t.tint).convertLinearToSRGB(),c=new Se({glslVersion:_e,vertexShader:Oe,fragmentShader:Re,uniforms:{uTex:{value:null},uHasTex:{value:0},uTint:{value:n},uTime:{value:0},uCycle:{value:t.cycle},uFlowScale:{value:t.flowScale},uFallSpeed:{value:t.fallSpeed},uAmbient:{value:new Be(t.ambient[0],t.ambient[1])},uFrame0:{value:0},uFrame1:{value:0},uFrameMix:{value:0},uLumMean:{value:.3},uLumTarget:{value:.6},uGain:{value:1},uFoam:{value:t.foam},uLodBias:{value:0},uMaxLod:{value:4},uAlpha:{value:1}},side:Ce,transparent:!1,depthWrite:!0,depthTest:!0,...e?{transparent:!0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:1,polygonOffsetUnits:1}:{}});return e&&(c.uniforms.uAlpha.value=.5),c.userData.kind=a,c.userData.bound=!1,c.userData.layers=1,c.userData.frameRate=t.frameRate,ee.add(c),te(c),c}function Ve(a){const e=a.image,t=e==null?void 0:e.data,n=(e==null?void 0:e.width)|0,c=(e==null?void 0:e.height)|0,y=(e==null?void 0:e.depth)|0,f=n*c*y;if(!(t instanceof Uint8Array||t instanceof Uint8ClampedArray)||f===0||t.length<f*4)return{mean:.33,std:.08};let S=0,p=0;for(let B=0;B<f;B++){const g=B*4,O=(.2126*t[g]+.7152*t[g+1]+.0722*t[g+2])/255;S+=O,p+=O*O}const _=S/f,G=Math.sqrt(Math.max(p/f-_*_,1e-8));return{mean:_,std:G}}function te(a){var G,B;if(a.userData.bound)return;const e=Me??globalThis.liquidFrameTextures,t=e==null?void 0:e[a.userData.kind];if(!t)return;const n=Ae[a.userData.kind],c=new ye(n.tint).convertLinearToSRGB(),y=c.r*de.x+c.g*de.y+c.b*de.z,{mean:f,std:S}=Ve(t),p=a.uniforms;p.uTex.value=t,p.uHasTex.value=1,p.uLumMean.value=f,p.uLumTarget.value=y*n.outMean,p.uGain.value=De.clamp(n.targetStd*y/S,1,8);const _=((G=t.image)==null?void 0:G.width)|0;p.uMaxLod.value=_>0?Math.log2(_):4,a.userData.layers=Math.max(1,((B=t.image)==null?void 0:B.depth)|0),a.userData.bound=!0,a.needsUpdate=!0}function Ke(a){for(const e of ee){te(e);const t=e.uniforms;t.uTime.value=a;const n=e.userData.layers||1,c=a*e.userData.frameRate,y=Math.floor(c),f=(y%n+n)%n;t.uFrame0.value=f,t.uFrame1.value=(f+1)%n,t.uFrameMix.value=c-y}}function je(a){var e;for(const t of a){(e=t.parent)==null||e.remove(t),t.geometry.dispose();const n=t.material;ee.delete(n),n.dispose()}}export{Ie as buildFluidMeshes,ke as createFluidMaterial,je as disposeFluidMeshes,qe as setFluidTextures,Ke as updateFluidTime};
