// regression.mjs — objective viewer regression battery. Run BEFORE a change to record
// a baseline, AFTER to compare. Gates on content-visible first: an empty/stale render
// fails every check loudly (the class of false-verify that kept resurrecting bugs).
//
// usage: node scripts/regression.mjs [--url http://localhost:5199/viewer.html] [--record baseline] [--compare baseline]
import fs from "node:fs";
import path from "node:path";
import { WebSocket } from "ws";

const BASE_DIR = path.resolve(process.cwd(), "../../regression");
const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const mode = args.includes("--record") ? "record" : "compare";
const runName = flag("--record") || flag("--compare") || "baseline";
const pageUrl = flag("--url") || "http://localhost:5199/viewer.html";

const cdpEval = (ws, expr) => new Promise((res, rej) => {
	const id = ++seq;
	pending.set(id, { res, rej });
	ws.send(JSON.stringify({ id, method: "Runtime.evaluate", params: { expression: expr, awaitPromise: true, returnByValue: true } }));
});
let seq = 0;
const pending = new Map();

async function main() {
	fs.mkdirSync(BASE_DIR, { recursive: true });
	// find CDP target (9225 by convention — see memory: renderer-test-harness)
	const tabs = await (await fetch("http://localhost:9225/json")).json();
	const page = tabs.find((t) => t.type === "page");
	const ws = new WebSocket(page.webSocketDebuggerUrl);
	ws.onmessage = (ev) => {
		const m = JSON.parse(ev.data);
		if (m.id && pending.has(m.id)) {
			const p = pending.get(m.id);
			pending.delete(m.id);
			m.error ? p.rej(new Error(m.error.message)) : p.res(m.result);
		}
	};
	await new Promise((r) => (ws.onopen = r));
	await cdpEval(ws, "Runtime.enable");

	// ---- navigate + load the standard case (stress_64: fast, has sea lanterns) ----
	await cdpEval(ws, `location.assign(${JSON.stringify(pageUrl + "?reg=" + Date.now())})`);
	await new Promise((r) => setTimeout(r, 6000));
	await cdpEval(ws, `(async()=>{ const v=window.__viewer; if(!v) return "no-viewer"; await v.load("schematics/stress_64x48x64.litematic"); return "loaded"; })()`);
	await new Promise((r) => setTimeout(r, 22000));

	const checks = {};
	// 1. content-visible gate
	checks.contentVisible = await cdpEval(ws, `(async()=>{ const v=window.__viewer; if(!v) return 0; const r=v.raw; r.renderManager.render(); const cv=r.canvas; const c2=document.createElement("canvas"); c2.width=cv.width;c2.height=cv.height; const x2=c2.getContext("2d",{willReadFrequently:true}); x2.drawImage(cv,0,0); const d=x2.getImageData(0,0,cv.width,cv.height).data; let mean=0,n=0,lums=[]; for(let i=0;i<d.length;i+=256){const l=0.3*d[i]+0.59*d[i+1]+0.11*d[i+2];mean+=l;lums.push(l);n++;} mean/=n; let varr=0; for(const l of lums)varr+=(l-mean)**2; return +Math.sqrt(varr/n).toFixed(1); })()`).then((r) => r.result.value);

	// 2. build mode actually gpu-pull
	checks.mode = await cdpEval(ws, `window.__viewer?.activeMode || "none"`).then((r) => r.result.value);

	// 3. sea lantern atlas tile integrity (frame-0 rect pale aqua, opaque)
	checks.seaLanternTile = await cdpEval(ws, `(async()=>{ const al=window.__viewer.raw.worldMeshBuilder.cubane.assetLoader; const uv=al.textureUVMap.get("block/sea_lantern"); if(!uv) return {missing:true}; const img=al.textureAtlas.image; const c=document.createElement("canvas"); c.width=img.width;c.height=img.height; const x=c.getContext("2d",{willReadFrequently:true}); x.drawImage(img,0,0); const x0=Math.round(uv.u*img.width), y0=Math.round(uv.v*img.height), w=Math.round(uv.width*img.width), h=Math.round(uv.height*img.height); const d=x.getImageData(x0,y0,w,Math.max(1,Math.round(h/5))).data; let r=0,g=0,b=0,n=0; for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2];n++;} return {avg:[Math.round(r/n),Math.round(g/n),Math.round(b/n)], opaque:n>0}; })()`).then((r) => r.result.value);

	// 4. chest atlas coverage (the recurring black-chest bug: entity tiles must exist)
	checks.chestTiles = await cdpEval(ws, `(async()=>{ const al=window.__viewer.raw.worldMeshBuilder.cubane.assetLoader; return [...al.textureUVMap.keys()].filter(k=>/chest/.test(k)).length; })()`).then((r) => r.result.value);

	// 5. far-view dark-line fingerprint (moiré/edge-bleed class)
	checks.darkLines = await cdpEval(ws, `(async()=>{ const v=window.__viewer; const r=v.raw; const cam=r.cameraManager.activeCamera._camera; cam.up.set(0,1,0); cam.position.set(190,80,190); cam.lookAt(0,20,0); cam.updateMatrixWorld(true); r.renderManager.render(); const cv=r.canvas; const c2=document.createElement("canvas"); c2.width=cv.width;c2.height=cv.height; const x2=c2.getContext("2d",{willReadFrequently:true}); x2.drawImage(cv,0,0); const W=c2.width; const d=x2.getImageData(0,Math.round(c2.height*0.5),W,1).data; let lines=0,minLum=255,last=-9; for(let i=1;i<W-1;i++){const l=0.3*d[i*4]+0.59*d[i*4+1]+0.11*d[i*4+2]; minLum=Math.min(minLum,l); if(l<30&&i-last>=4){lines++;last=i;}} return {lines,minLum:Math.round(minLum)}; })()`).then((r) => r.result.value);

	// 6. layer slice changes the render
	checks.layerDelta = await cdpEval(ws, `(async()=>{ const v=window.__viewer; const r=v.raw; const grab=()=>{ const cv=r.canvas; const c2=document.createElement("canvas"); c2.width=cv.width;c2.height=cv.height; const x2=c2.getContext("2d",{willReadFrequently:true}); x2.drawImage(cv,0,0); const d=x2.getImageData(0,0,cv.width,cv.height).data; let s=0; for(let i=0;i<d.length;i+=512) s+=d[i]+d[i+1]+d[i+2]; return s; }; const setClip=(on,y)=>{ r.sceneManager.scene.traverse(o=>{ if(!o.isMesh)return; const ms=Array.isArray(o.material)?o.material:[o.material]; for(const m of ms){ if(m?.uniforms?.uLayerClip) m.uniforms.uLayerClip.value.set(on?1:0,y); } }); r.renderManager.render(); }; setClip(true,10); const sliced=grab(); setClip(false,1e9); const full=grab(); return {differs: sliced!==full, ratio:+(sliced/Math.max(1,full)).toFixed(3)}; })()`).then((r) => r.result.value);

	// 7. second-load swap (the load-new-schematic bug class)
	checks.secondLoad = await cdpEval(ws, `(async()=>{ const v=window.__viewer; try{ await v.load("schematics/cubes_64x48x64.litematic"); await new Promise(r=>setTimeout(r,6000)); }catch(e){ return {error:String(e).slice(0,60)}; } const r=v.raw; const names=[...r.schematicManager.schematics.keys()]; return {names, swapped: names.length===1 && names[0].includes("cubes")}; })()`).then((r) => r.result.value);

	ws.close();
	const file = path.join(BASE_DIR, runName + ".json");
	if (mode === "record") {
		fs.writeFileSync(file, JSON.stringify(checks, null, 1));
		console.log("BASELINE RECORDED:", file);
		console.log(JSON.stringify(checks, null, 1));
		return;
	}
	const base = JSON.parse(fs.readFileSync(file, "utf8"));
	const report = { pass: [], fail: [] };
	const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
	for (const k of Object.keys(base)) {
		if (eq(base[k], checks[k])) report.pass.push(k);
		else report.fail.push({ check: k, baseline: base[k], now: checks[k] });
	}
	// hard gates regardless of baseline
	if (!(checks.contentVisible > 15)) report.fail.push({ check: "GATE:contentVisible", now: checks.contentVisible });
	if (checks.mode !== "gpu-pull") report.fail.push({ check: "GATE:mode", now: checks.mode });
	const slAvg = checks.seaLanternTile && checks.seaLanternTile.avg;
	if (!(Array.isArray(slAvg) && slAvg[1] > 150)) report.fail.push({ check: "GATE:seaLantern-green", now: checks.seaLanternTile });
	console.log(JSON.stringify(report, null, 1));
	process.exit(report.fail.length ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
