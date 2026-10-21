// pixtest.mjs — RENDERED-PIXEL gates (not proxies): loads a schematic with chests +
// redstone dust, renders, and checks actual framebuffer colors. The test the project
// needed all along: "does the chest RENDER brown, does the dust RENDER red".
// usage: node scripts/pixtest.mjs [schematicPath]
import { WebSocket } from "ws";

const schem = process.argv[2] || "schematics/best_earlygame_carpet_duper.litematic";
const seq = { n: 0 };
const pending = new Map();
const call = (ws, method, params = {}) => new Promise((res, rej) => {
	const id = ++seq.n;
	pending.set(id, { res, rej });
	ws.send(JSON.stringify({ id, method, params }));
});

async function main() {
	const tabs = await (await fetch("http://localhost:9225/json")).json();
	const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
	ws.onmessage = (ev) => {
		const m = JSON.parse(ev.data);
		if (m.id && pending.has(m.id)) {
			const p = pending.get(m.id);
			pending.delete(m.id);
			m.error ? p.rej(new Error(m.error.message)) : p.res(m.result);
		}
	};
	await new Promise((r) => (ws.onopen = r));
	await call(ws, "Runtime.enable");

	// fresh load with a cache-buster
	await call(ws, "Runtime.evaluate", { expression: `location.assign("http://localhost:5199/viewer.html?px=${Date.now()}")` });
	await new Promise((r) => setTimeout(r, 12000));
	const evalJs = async (expr) => (await call(ws, "Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;

	await evalJs(`(async()=>{ const v=window.__viewer; if(!v) return "NO-VIEWER"; await v.load("${schem}"); return "loaded"; })()`);
	await new Promise((r) => setTimeout(r, 15000));

	// frame the build tightly, render, and sample pixels by color family
	const stats = await evalJs(`(async()=>{
		const v=window.__viewer; const r=v.raw;
		const so=[...r.schematicManager.schematics.values()][0];
		const dims=so.schematicWrapper.get_dimensions();
		const cx=dims[0]/2, cy=dims[1]/2, cz=dims[2]/2;
		const cam=r.cameraManager.activeCamera._camera;
		cam.up.set(0,1,0);
		cam.position.set(cx+dims[0]*1.5, Math.max(dims[1]*1.6, 18), cz+dims[2]*1.5);
		cam.lookAt(cx, cy, cz);
		cam.updateMatrixWorld(true);
		r.renderManager.render();
		const cv=document.querySelector("#viewer canvas");
		const c2=document.createElement("canvas"); c2.width=cv.width; c2.height=cv.height;
		const x2=c2.getContext("2d",{willReadFrequently:true}); x2.drawImage(cv,0,0);
		const d=x2.getImageData(0,0,cv.width,cv.height).data;
		let n=0, black=0, red=0, brown=0, white=0, lumSum=0;
		for(let i=0;i<d.length;i+=4){
			const R=d[i],G=d[i+1],B=d[i+2];
			const L=0.3*R+0.59*G+0.11*B; lumSum+=L; n++;
			if(L<12) black++;
			if(R>120&&G<80&&B<80) red++;
			if(R>90&&R<190&&G>55&&G<125&&B<75&&R>G&&G>B) brown++;
			if(R>200&&G>200&&B>200) white++;
		}
		return {dims, blackFrac:+(black/n).toFixed(4), redFrac:+(red/n).toFixed(4),
			brownFrac:+(brown/n).toFixed(4), whiteFrac:+(white/n).toFixed(4), meanLum:+(lumSum/n).toFixed(0), mode:v.activeMode};
	})()`);

	// second-load gate (the "loading broke" regression)
	const second = await evalJs(`(async()=>{ try{ await window.__viewer.load("schematics/stress_64x48x64.litematic"); await new Promise(r=>setTimeout(r,12000)); const r=window.__viewer.raw; const names=[...r.schematicManager.schematics.keys()]; let meshes=0; r.sceneManager.scene.traverse(o=>{if(o.isMesh)meshes++;}); r.renderManager.render(); const cv=document.querySelector("#viewer canvas"); const c2=document.createElement("canvas"); c2.width=cv.width;c2.height=cv.height; const x2=c2.getContext("2d",{willReadFrequently:true}); x2.drawImage(cv,0,0); const d=x2.getImageData(0,0,cv.width,cv.height).data; let mean=0,n=0,lums=[]; for(let i=0;i<d.length;i+=256){const l=0.3*d[i]+0.59*d[i+1]+0.11*d[i+2];mean+=l;lums.push(l);n++;} mean/=n; let varr=0; for(const l of lums)varr+=(l-mean)**2; return {names, meshes, stdDev:+Math.sqrt(varr/n).toFixed(1)}; }catch(e){ return {error:String(e).slice(0,100)}; }})()`);

	ws.close();
	console.log(JSON.stringify({ first: stats, secondLoad: second }, null, 1));
}
main().catch((e) => { console.error(e); process.exit(2); });
