import{InspectorBase as ce,WebGPURenderer as j,Node as ee,WebGLBackend as de,TSL as t,CanvasTarget as he,NodeMaterial as pe,QuadMesh as me,RendererUtils as Y}from"./three.webgpu-df3b5f5a.js";import{al as _,am as ue,a0 as G,an as ge,ao as q,Y as fe,ap as be,aq as xe,q as ve,o as ye,U as we,ar as Ce,as as ke,at as Te,H as Ee,au as Se,av as Le,K as Ie,aw as Be,ax as Me,k as Re,r as Fe,s as ze,ay as Ne,az as We,aA as De,ak as Ae,aB as Pe,n as Ve,aC as _e,aD as He,t as Oe}from"./SchematicRenderer-ed2eef6a.js";class te{constructor(e,i){this.uid=e,this.cid=e.match(/^(.*):f(\d+)$/)[1],this.name=i,this.timestamp=0,this.cpu=0,this.gpu=0,this.fps=0,this.children=[],this.parent=null}}class Ue extends te{constructor(e,i,n,s){let r=i.name;r===""&&(i.isScene?r="Scene":i.isQuadMesh&&(r="QuadMesh")),super(e,r),this.scene=i,this.camera=n,this.renderTarget=s,this.isRenderStats=!0}}class je extends te{constructor(e,i){super(e,i.name),this.computeNode=i,this.isComputeStats=!0}}class Ge extends ce{constructor(){super(),this.currentFrame=null,this.currentRender=null,this.currentNodes=null,this.lastFrame=null,this.frames=[],this.framesLib={},this.maxFrames=512,this._lastFinishTime=0,this._resolveTimestampPromise=null,this.isRendererInspector=!0}getParent(){return this.currentRender||this.getFrame()}begin(){this.currentFrame=this._createFrame(),this.currentRender=this.currentFrame,this.currentNodes=[]}finish(){const e=performance.now(),i=this.currentFrame;i.finishTime=e,i.deltaTime=e-(this._lastFinishTime>0?this._lastFinishTime:e),this.addFrame(i),this.fps=this._getFPS(),this.lastFrame=i,this.currentFrame=null,this.currentRender=null,this.currentNodes=null,this._lastFinishTime=e}_getFPS(){let e=0,i=0;for(let n=this.frames.length-1;n>=0;n--){const s=this.frames[n];if(e++,i+=s.deltaTime,i>=1e3)break}return e*1e3/i}_createFrame(){return{frameId:this.nodeFrame.frameId,resolvedCompute:!1,resolvedRender:!1,deltaTime:0,startTime:performance.now(),finishTime:0,miscellaneous:0,children:[],renders:[],computes:[]}}getFrame(){return this.currentFrame||this.lastFrame}getFrameById(e){return this.framesLib[e]||null}updateTabs(){}resolveFrame(){}async resolveTimestamp(){return this._resolveTimestampPromise!==null?this._resolveTimestampPromise:(this._resolveTimestampPromise=new Promise(e=>{requestAnimationFrame(async()=>{const i=this.getRenderer();await i.resolveTimestampsAsync(_.COMPUTE),await i.resolveTimestampsAsync(_.RENDER);const n=i.backend.getTimestampFrames(_.COMPUTE),s=i.backend.getTimestampFrames(_.RENDER),r=[...new Set([...n,...s])];for(const o of r){const a=this.getFrameById(o);if(a!==null){if(a.resolvedCompute===!1)if(a.computes.length>0){if(n.includes(o)){for(const l of a.computes)i.backend.hasTimestamp(l.uid)?l.gpu=i.backend.getTimestamp(l.uid):(l.gpu=0,l.gpuNotAvailable=!0);a.resolvedCompute=!0}}else a.resolvedCompute=!0;if(a.resolvedRender===!1)if(a.renders.length>0){if(s.includes(o)){for(const l of a.renders)i.backend.hasTimestamp(l.uid)?l.gpu=i.backend.getTimestamp(l.uid):(l.gpu=0,l.gpuNotAvailable=!0);a.resolvedRender=!0}}else a.resolvedRender=!0;a.resolvedCompute===!0&&a.resolvedRender===!0&&this.resolveFrame(a)}}this._resolveTimestampPromise=null,e()})}),this._resolveTimestampPromise)}get isAvailable(){return this.getRenderer()!==null}addFrame(e){if(this.frames.length>=this.maxFrames){const i=this.frames.shift();delete this.framesLib[i.frameId]}this.frames.push(e),this.framesLib[e.frameId]=e,this.isAvailable&&(this.updateTabs(),this.resolveTimestamp())}inspect(e){const i=this.currentNodes;i!==null?i.push(e):ue('RendererInspector: Unable to inspect node outside of frame scope. Use "renderer.setAnimationLoop()".')}beginCompute(e,i){const n=this.getFrame();if(!n)return;const s=new je(e,i);s.timestamp=performance.now(),s.parent=this.currentCompute||this.getParent(),n.computes.push(s),this.currentRender!==null?this.currentRender.children.push(s):n.children.push(s),this.currentCompute=s}finishCompute(){if(!this.getFrame())return;const i=this.currentCompute;i.cpu=performance.now()-i.timestamp,this.currentCompute=i.parent.isComputeStats?i.parent:null}beginRender(e,i,n,s){const r=this.getFrame();if(!r)return;const o=new Ue(e,i,n,s);o.timestamp=performance.now(),o.parent=this.getParent(),r.renders.push(o),this.currentRender!==null?this.currentRender.children.push(o):r.children.push(o),this.currentRender=o}finishRender(){if(!this.getFrame())return;const i=this.currentRender;i.cpu=performance.now()-i.timestamp,this.currentRender=i.parent}}class $e{static init(){if(document.getElementById("profiler-styles"))return;const e=`
:root {
	--profiler-bg: #1e1e24f5;
	--profiler-header-bg: #2a2a33aa;
	--profiler-header: #2a2a33;
	--profiler-border: #4a4a5a;
	--text-primary: #e0e0e0;
	--text-secondary: #9a9aab;
	--accent-color: #00aaff;
	--color-green: #4caf50;
	--color-yellow: #ffc107;
	--color-red: #f44336;
	--color-fps: rgb(63, 81, 181);
	--color-call: rgba(255, 185, 34, 1);
	--font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	--font-mono: 'Fira Code', 'Courier New', Courier, monospace;
}

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Fira+Code&display=swap');

#profiler-panel *, #profiler-toggle * {
	text-transform: initial;
	line-height: normal;
	box-sizing: border-box;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

#profiler-toggle {
	position: fixed;
	top: 15px;
	right: 15px;
	background-color: rgba(30, 30, 36, 0.85);
	border: 1px solid #4a4a5a54;
	border-radius: 12px 6px 6px 12px;
	color: var(--text-primary);
	cursor: pointer;
	z-index: 1001;
	transition: all 0.2s ease-in-out;
	/*font-size: 14px;*/
	font-size: 15px;
	backdrop-filter: blur(8px);
	box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
	display: flex;
	align-items: stretch;
	padding: 0;
	overflow: hidden;
	font-family: var(--font-family);
}

#profiler-toggle.position-right.panel-open {
	right: auto;
	left: 15px;
	border-radius: 6px 12px 12px 6px;
	flex-direction: row-reverse;
}

#profiler-toggle.position-right.panel-open #builtin-tabs-container {
	border-right: none;
	border-left: 1px solid #262636;
}

#profiler-toggle:hover {
	border-color: var(--accent-color);
}

#profiler-toggle.panel-open #toggle-icon {
	background-color: rgba(0, 170, 255, 0.2);
	color: var(--accent-color);
}

#toggle-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	font-size: 20px;
	transition: background-color 0.2s;
}

#profiler-toggle:hover #toggle-icon {
	background-color: rgba(255, 255, 255, 0.05);
}

#profiler-toggle.panel-open:hover #toggle-icon {
	background-color: rgba(0, 170, 255, 0.3);
}

.toggle-separator {
	width: 1px;
	background-color: var(--profiler-border);
}

#toggle-text {
	display: flex;
	align-items: baseline;
	padding: 8px 14px;
	min-width: 80px;
	justify-content: right;
}

#toggle-text .fps-label {
	font-size: 0.7em;
	margin-left: 10px;
    color: #999;
}

#builtin-tabs-container {
	display: flex;
	align-items: stretch;
	gap: 0;
	border-right: 1px solid #262636;
	order: -1;
}

.builtin-tab-btn {
	background: transparent;
	border: none;
	color: var(--text-secondary);
	cursor: pointer;
	padding: 8px 14px;
	font-family: var(--font-family);
	font-size: 13px;
	font-weight: 600;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 32px;
	position: relative;
}

.builtin-tab-btn svg {
	width: 20px;
	height: 20px;
	stroke: currentColor;
}

.builtin-tab-btn:hover {
	background-color: rgba(255, 255, 255, 0.08);
	color: var(--accent-color);
}

.builtin-tab-btn:active {
	background-color: rgba(255, 255, 255, 0.12);
}

.builtin-tab-btn.active {
	background-color: rgba(0, 170, 255, 0.2);
	color: var(--accent-color);
}

.builtin-tab-btn.active:hover {
	background-color: rgba(0, 170, 255, 0.3);
}

#profiler-mini-panel {
	position: fixed;
	top: 60px;
	right: 15px;
	background-color: rgba(30, 30, 36, 0.85);
	border: 1px solid #4a4a5a54;
	border-radius: 8px;
	color: var(--text-primary);
	z-index: 9999;
	backdrop-filter: blur(8px);
	box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5);
	font-family: var(--font-family);
	font-size: 11px;
	width: 350px;
	max-height: calc(100vh - 100px);
	overflow-y: auto;
	overflow-x: hidden;
	display: none;
	opacity: 0;
	transform: translateY(-10px) scale(0.98);
	transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), 
	            transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

#profiler-mini-panel.position-right.panel-open {
	right: auto;
	left: 15px;
}

#profiler-mini-panel.visible {
	display: block;
	opacity: 1;
	transform: translateY(0) scale(1);
}

#profiler-mini-panel::-webkit-scrollbar {
	width: 6px;
}

#profiler-mini-panel::-webkit-scrollbar-track {
	background: transparent;
}

#profiler-mini-panel::-webkit-scrollbar-thumb {
	background: rgba(255, 255, 255, 0.15);
	border-radius: 3px;
	transition: background 0.2s;
}

#profiler-mini-panel::-webkit-scrollbar-thumb:hover {
	background: rgba(255, 255, 255, 0.25);
}

.mini-panel-content {
	padding: 0;
	font-size: 11px;
	line-height: 1.5;
	font-family: var(--font-mono);
	letter-spacing: 0.3px;
	user-select: none;
	-webkit-user-select: none;
}

.mini-panel-content .profiler-content {
	display: block !important;
	background: transparent;
}

.mini-panel-content .list-scroll-wrapper {
	max-height: calc(100vh - 120px);
	overflow-y: auto;
	overflow-x: hidden;
	width: 100%;
}

.mini-panel-content .list-scroll-wrapper::-webkit-scrollbar {
	width: 4px;
}

.mini-panel-content .list-scroll-wrapper::-webkit-scrollbar-track {
	background: transparent;
}

.mini-panel-content .list-scroll-wrapper::-webkit-scrollbar-thumb {
	background: rgba(255, 255, 255, 0.1);
	border-radius: 2px;
}

.mini-panel-content .list-scroll-wrapper::-webkit-scrollbar-thumb:hover {
	background: rgba(255, 255, 255, 0.2);
}

.mini-panel-content .parameters {
	background: transparent;
	border: none;
	box-shadow: none;
	padding: 4px;
}

.mini-panel-content .list-container.parameters {
	padding: 2px 6px 0px 6px !important;
}

.mini-panel-content .list-header {
	display: none;
	padding: 2px 4px;
	font-size: 11px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.mini-panel-content .list-item {
	border-bottom: 1px solid rgba(74, 74, 90, 0.2);
	transition: background-color 0.15s;
}

.mini-panel-content .list-item:last-child {
	border-bottom: none;
}

.mini-panel-content .list-item:hover {
	background-color: rgba(255, 255, 255, 0.04);
}

.mini-panel-content .list-item.actionable:hover {
	background-color: rgba(255, 255, 255, 0.06);
	cursor: pointer;
}

/* Style adjustments for lil-gui look */
.mini-panel-content .item-row {
	padding: 3px 8px;
	min-height: 24px;
}

.mini-panel-content .list-item-row {
	padding: 1px 4px;
	gap: 8px;
	min-height: 21px;
	align-items: center;
}

.mini-panel-content input[type="checkbox"] {
	width: 12px;
	height: 12px;
}

.mini-panel-content input[type="range"] {
	height: 18px;
}

.mini-panel-content .value-number input,
.mini-panel-content .value-slider input {
	background-color: rgba(0, 0, 0, 0.3);
	border: 1px solid rgba(74, 74, 90, 0.5);
	font-size: 10px;
}

.mini-panel-content .value-number input:focus,
.mini-panel-content .value-slider input:focus {
	border-color: var(--accent-color);
}

.mini-panel-content .value-slider {
	gap: 6px;
}

/* Compact nested items */
.mini-panel-content .list-item .list-item {
	margin-left: 8px;
}

.mini-panel-content .list-item .list-item .item-row,
.mini-panel-content .list-item .list-item .list-item-row {
	padding: 2px 6px;
	min-height: 22px;
}

/* Compact collapsible headers */
.mini-panel-content .collapsible .item-row,
.mini-panel-content .list-item-row.collapsible {
	padding: 2px 8px;
	font-weight: 600;
	min-height: 16px;
	display: flex;
	align-items: center;
}

.mini-panel-content .collapsible-icon {
	font-size: 10px;
	width: 14px;
	height: 14px;
}

.mini-panel-content .param-control input[type="range"] {
	height: 12px;
	margin-top: 1px;
	padding-top: 5px;
	user-select: none;
	-webkit-user-select: none;
	outline: none;
}

.mini-panel-content .param-control input[type="range"]::-webkit-slider-thumb {
	width: 14px;
	height: 14px;
	margin-top: -5px;
	user-select: none;
	-webkit-user-select: none;
}

.mini-panel-content .param-control input[type="range"]::-moz-range-thumb {
	width: 14px;
	height: 14px;
	user-select: none;
	-moz-user-select: none;
}

.mini-panel-content .list-children-container {
	padding-left: 0;
}

.mini-panel-content .param-control input[type="number"] {
	flex-basis: 60px !important;
}

.mini-panel-content .param-control {
	align-items: center;
}

.mini-panel-content .param-control select {
	font-size: 11px;
}

.mini-panel-content .list-item-wrapper {
	margin-top: 0;
	margin-bottom: 0;
}

#profiler-panel {
	position: fixed;
	z-index: 1001 !important;
	bottom: 0;
	left: 0;
	right: 0;
	height: 350px;
	background-color: var(--profiler-bg);
	backdrop-filter: blur(8px);
	border-top: 2px solid var(--profiler-border);
	color: var(--text-primary);
	display: flex;
	flex-direction: column;
	z-index: 1000;
	/*box-shadow: 0 -5px 25px rgba(0, 0, 0, 0.5);*/
	transform: translateY(100%);
	transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), height 0.3s ease-out, width 0.3s ease-out;
	font-family: var(--font-mono);
}

#profiler-panel.resizing,
#profiler-panel.dragging {
	transition: none;
}

#profiler-panel.visible {
	transform: translateY(0);
}

#profiler-panel.maximized {
	height: 100vh;
}

/* Position-specific styles */
#profiler-panel.position-top {
	bottom: auto;
	top: 0;
	border-top: none;
	border-bottom: 2px solid var(--profiler-border);
	transform: translateY(-100%);
}

#profiler-panel.position-top.visible {
	transform: translateY(0);
}

#profiler-panel.position-bottom {
	/* Default position - already defined above */
}

#profiler-panel.position-left {
	top: 0;
	bottom: 0;
	left: 0;
	right: auto;
	width: 350px;
	height: 100%;
	border-top: none;
	border-right: 2px solid var(--profiler-border);
	transform: translateX(-100%);
}

#profiler-panel.position-left.visible {
	transform: translateX(0);
}

#profiler-panel.position-right {
	top: 0;
	bottom: 0;
	left: auto;
	right: 0;
	width: 350px;
	height: 100%;
	border-top: none;
	border-left: 2px solid var(--profiler-border);
	transform: translateX(100%);
}

#profiler-panel.position-right.visible {
	transform: translateX(0);
}

#profiler-panel.position-floating {
	border: 2px solid var(--profiler-border);
	border-radius: 8px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	transform: none !important;
	overflow: hidden;
}

#profiler-panel.position-floating.visible {
	transform: none !important;
}

#profiler-panel.position-floating .profiler-header {
	border-radius: 6px 6px 0 0;
}

#profiler-panel.position-floating .panel-resizer {
	bottom: 0;
	right: 0;
	top: auto;
	left: auto;
	width: 16px;
	height: 16px;
	cursor: nwse-resize;
	border-radius: 0 0 6px 0;
}

#profiler-panel.position-floating .panel-resizer::after {
	content: '';
	position: absolute;
	right: 2px;
	bottom: 2px;
	width: 10px;
	height: 10px;
	background: linear-gradient(135deg, transparent 0%, transparent 45%, var(--profiler-border) 45%, var(--profiler-border) 55%, transparent 55%);
}


.panel-resizer {
	position: absolute;
	top: -2px;
	left: 0;
	width: 100%;
	height: 5px;
	cursor: ns-resize;
	z-index: 1001;
	touch-action: none;
}

#profiler-panel.position-top .panel-resizer {
	top: auto;
	bottom: -2px;
}

#profiler-panel.position-left .panel-resizer {
	top: 0;
	left: auto;
	right: -2px;
	width: 5px;
	height: 100%;
	cursor: ew-resize;
}

#profiler-panel.position-right .panel-resizer {
	top: 0;
	left: -2px;
	right: auto;
	width: 5px;
	height: 100%;
	cursor: ew-resize;
}

.profiler-header {
	display: flex;
	background-color: var(--profiler-header-bg);
	border-bottom: 1px solid var(--profiler-border);
	flex-shrink: 0;
	justify-content: space-between;
	align-items: stretch;

	overflow-x: auto;
	overflow-y: hidden;
	width: calc(100% - 134px);
	height: 38px;
	user-select: none;
	-webkit-user-select: none;
}

/* Adjust header width based on panel position */
#profiler-panel.position-right .profiler-header,
#profiler-panel.position-left .profiler-header {
	width: calc(100% - 134px);
}

#profiler-panel.position-bottom .profiler-header,
#profiler-panel.position-top .profiler-header {
	width: calc(100% - 134px);
}

/* Adjust header width when position toggle button is hidden (mobile) */
#profiler-panel.hide-position-toggle .profiler-header {
	width: calc(100% - 90px);
}

/* ===== RULES FOR WHEN THERE ARE NO TABS ===== */

/* Horizontal mode (bottom/top) without tabs */
#profiler-panel.position-bottom.no-tabs:not(.maximized),
#profiler-panel.position-top.no-tabs:not(.maximized) {
	height: 38px !important;
	min-height: 38px !important;
}

#profiler-panel.position-bottom.no-tabs .profiler-header,
#profiler-panel.position-top.no-tabs .profiler-header {
	width: 100%;
	height: 38px;
	border-bottom: none;
}

#profiler-panel.position-bottom.no-tabs .profiler-content-wrapper,
#profiler-panel.position-top.no-tabs .profiler-content-wrapper {
	display: none;
}

#profiler-panel.position-bottom.no-tabs .panel-resizer,
#profiler-panel.position-top.no-tabs .panel-resizer {
	display: none;
}

/* Vertical mode (right/left) without tabs */
#profiler-panel.position-right.no-tabs:not(.maximized),
#profiler-panel.position-left.no-tabs:not(.maximized) {
	width: 45px !important;
	min-width: 45px !important;
}

/* Vertical layout for header when no tabs */
#profiler-panel.position-right.no-tabs .profiler-header,
#profiler-panel.position-left.no-tabs .profiler-header {
	width: 100%;
	flex-direction: column;
	height: 100%;
	border-bottom: none;
}

/* Vertical layout for controls when no tabs */
#profiler-panel.position-right.no-tabs .profiler-controls,
#profiler-panel.position-left.no-tabs .profiler-controls {
	position: static;
	flex-direction: column-reverse;
	justify-content: flex-end;
	width: 100%;
	height: 100%;
	border-bottom: none;
	border-left: none;
	background: transparent;
}

#profiler-panel.position-right.no-tabs .profiler-controls button,
#profiler-panel.position-left.no-tabs .profiler-controls button {
	width: 100%;
	height: 45px;
	border-left: none;
	border-top: none;
	border-bottom: 1px solid var(--profiler-border);
}

#profiler-panel.position-right.no-tabs .profiler-content-wrapper,
#profiler-panel.position-left.no-tabs .profiler-content-wrapper {
	display: none;
}

#profiler-panel.position-right.no-tabs .profiler-tabs,
#profiler-panel.position-left.no-tabs .profiler-tabs {
	display: none;
}

#profiler-panel.position-right.no-tabs .panel-resizer,
#profiler-panel.position-left.no-tabs .panel-resizer {
	display: none;
}

/* Hide position toggle on mobile without tabs */
#profiler-panel.hide-position-toggle.position-right.no-tabs:not(.maximized),
#profiler-panel.hide-position-toggle.position-left.no-tabs:not(.maximized) {
	width: 45px !important;
	min-width: 45px !important;
}

/* Hide drag indicator on mobile devices */
#profiler-panel.is-mobile .tab-btn.active::before {
	display: none;
}

.profiler-header::-webkit-scrollbar {
	width: 8px;
	height: 8px;
}

.profiler-header::-webkit-scrollbar-track {
	background: transparent;
}

.profiler-header::-webkit-scrollbar-thumb {
	background-color: rgba(0, 0, 0, 0.25);
	border-radius: 10px;
	transition: background 0.3s ease;
}

.profiler-header::-webkit-scrollbar-thumb:hover {
	background-color: rgba(0, 0, 0, 0.4);
}

.profiler-header::-webkit-scrollbar-corner {
	background: transparent;
}

#profiler-panel.dragging .profiler-header {
	cursor: grabbing !important;
}

#profiler-panel.dragging {
	opacity: 0.8;
}

.profiler-tabs {
	display: flex;
	cursor: grab;
	position: relative;
}

.profiler-tabs:active {
	cursor: grabbing;
}

.profiler-tabs::-webkit-scrollbar {
	width: 8px;
	height: 8px;
}

.profiler-tabs::-webkit-scrollbar-track {
	background: transparent;
}

.profiler-tabs::-webkit-scrollbar-thumb {
	background-color: rgba(0, 0, 0, 0.25);
	border-radius: 10px;
	transition: background 0.3s ease;
}

.profiler-tabs::-webkit-scrollbar-thumb:hover {
	background-color: rgba(0, 0, 0, 0.4);
}

.profiler-tabs::-webkit-scrollbar-corner {
	background: transparent;
}

.profiler-controls {
	display: flex;
	position: absolute;
	right: 0;
	top: 0;
	height: 38px;
	background: var(--profiler-header-bg);
	border-bottom: 1px solid var(--profiler-border);
}

.tab-btn {
	position: relative;
	background: transparent;
	border: none;
	/*border-right: 1px solid var(--profiler-border);*/
	color: var(--text-secondary);
	padding: 8px 18px;
	cursor: default;
	display: flex;
	align-items: center;
	font-family: var(--font-family);
	font-weight: 600;
	font-size: 14px;
	user-select: none;
	transition: opacity 0.2s, transform 0.2s;
	touch-action: pan-x;
}

.tab-btn.active {
	border-bottom: 2px solid var(--accent-color);
	color: white;
}

.tab-btn.active::before {
	content: '⋮⋮';
	position: absolute;
	left: 3px;
	top: calc(50% - .1rem);
	transform: translateY(-50%);
	color: var(--profiler-border);
	font-size: 18px;
	letter-spacing: -2px;
	opacity: 0.6;
}

.tab-btn.no-detach.active::before {
	display: none;
}

#floating-btn,
#maximize-btn,
#hide-panel-btn {
	background: transparent;
	border: none;
	border-left: 1px solid var(--profiler-border);
	color: var(--text-secondary);
	width: 45px;
	height: 100%;
	cursor: pointer;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

/* Disable transitions in vertical mode to avoid broken animations */
#profiler-panel.position-right #floating-btn,
#profiler-panel.position-right #maximize-btn,
#profiler-panel.position-right #hide-panel-btn,
#profiler-panel.position-left #floating-btn,
#profiler-panel.position-left #maximize-btn,
#profiler-panel.position-left #hide-panel-btn {
	transition: background-color 0.2s, color 0.2s;
}

#floating-btn:hover,
#maximize-btn:hover,
#hide-panel-btn:hover {
	background-color: rgba(255, 255, 255, 0.1);
	color: var(--text-primary);
}

/* Hide maximize button when there are no tabs */
#profiler-panel.position-right.no-tabs #maximize-btn,
#profiler-panel.position-left.no-tabs #maximize-btn,
#profiler-panel.position-bottom.no-tabs #maximize-btn,
#profiler-panel.position-top.no-tabs #maximize-btn {
	display: none !important;
}

.profiler-content-wrapper {
	flex-grow: 1;
	overflow: hidden;
	position: relative;
}

.profiler-content {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	overflow-y: auto;
	font-size: 13px;
	visibility: hidden;
	opacity: 0;
	transition: opacity 0.2s, visibility 0.2s;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	user-select: none;
	-webkit-user-select: none;
}

.profiler-content.active {
	visibility: visible;
	opacity: 1;
}

.profiler-content {
	overflow: auto; /* make sure scrollbars can appear */
}

.profiler-content::-webkit-scrollbar {
	width: 8px;
	height: 8px;
}

.profiler-content::-webkit-scrollbar-track {
	background: transparent;
}

.profiler-content::-webkit-scrollbar-thumb {
	background-color: rgba(0, 0, 0, 0.25);
	border-radius: 10px;
	transition: background 0.3s ease;
}

.profiler-content::-webkit-scrollbar-thumb:hover {
	background-color: rgba(0, 0, 0, 0.4);
}

.profiler-content::-webkit-scrollbar-corner {
	background: transparent;
}

.profiler-content {
	scrollbar-width: thin; /* "auto" | "thin" */
	scrollbar-color: rgba(0, 0, 0, 0.25) transparent;
}

.list-item-row {
	display: grid;
	align-items: center;
	padding: 4px 8px;
	border-radius: 3px;
	transition: background-color 0.2s;
	gap: 10px;
	border-bottom: none;
	user-select: none;
	-webkit-user-select: none;
}

.parameters .list-item-row {
	min-height: 31px;
}

.mini-panel-content .parameters .list-item-row {
	min-height: 21px;
}

.list-item-wrapper {
	margin-top: 2px;
	margin-bottom: 2px;
	user-select: none;
	-webkit-user-select: none;
}

.list-item-wrapper:first-child {
	/*margin-top: 0;*/
}

.list-item-wrapper:not(.header-wrapper):nth-child(odd) > .list-item-row {
	background-color: rgba(0,0,0,0.1);
}

.list-item-wrapper.header-wrapper>.list-item-row {
	color: var(--accent-color);
	background-color: rgba(0, 170, 255, 0.1);
}

.list-item-wrapper.header-wrapper>.list-item-row>.list-item-cell:first-child {
	font-weight: 600;
	line-height: 1;
}

.list-item-row.collapsible,
.list-item-row.actionable {
	cursor: pointer;
}

.list-item-row.collapsible {
	background-color: rgba(0, 170, 255, 0.15) !important;
	min-height: 23px;
}

.list-item-row.collapsible.alert,
.list-item-row.alert {
	background-color: rgba(244, 67, 54, 0.1) !important;
}

@media (hover: hover) {

	.list-item-row:hover:not(.collapsible):not(.no-hover),
	.list-item-row:hover:not(.no-hover),
	.list-item-row.actionable:hover,
	.list-item-row.collapsible.actionable:hover {
		background-color: rgba(255, 255, 255, 0.05) !important;
	}

	.list-item-row.collapsible:hover {
		background-color: rgba(0, 170, 255, 0.25) !important;
	}

}

.list-item-cell {
	white-space: pre;
	display: flex;
	align-items: center;
	user-select: none;
	-webkit-user-select: none;
}

.list-item-cell:not(:first-child) {
	justify-content: flex-end;
	font-weight: 600;
}

.list-header {
	display: grid;
	align-items: center;
	padding: 4px 8px;
	font-weight: 600;
	color: var(--text-secondary);
	padding-bottom: 6px;
	border-bottom: 1px solid var(--profiler-border);
	margin-bottom: 5px;
	gap: 10px;
	user-select: none;
	-webkit-user-select: none;
}

.list-item-wrapper.section-start {
	margin-top: 5px;
	margin-bottom: 5px;
}

.list-header .list-header-cell:not(:first-child) {
	text-align: right;
}

.list-children-container {
	padding-left: 1.5em;
	overflow: hidden;
	transition: max-height 0.1s ease-out;
	margin-top: 2px;
}

.list-children-container.closed {
	max-height: 0;
}

.item-toggler {
	display: inline-block;
	margin-right: 0.8em;
	text-align: left;
}

.list-item-row.open .item-toggler::before {
	content: '-';
}

.list-item-row:not(.open) .item-toggler::before {
	content: '+';
}

.list-item-cell .value.good {
	color: var(--color-green);
}

.list-item-cell .value.warn {
	color: var(--color-yellow);
}

.list-item-cell .value.bad {
	color: var(--color-red);
}

.list-scroll-wrapper {
	width: max-content;
	min-width: 100%;
	display: flex;
	flex-direction: column;
	min-height: 100%;
}

.list-container.parameters .list-item-row:not(.collapsible) {
}

.graph-container {
	width: 100%;
	box-sizing: border-box;
	padding: 8px 0;
	position: relative;
}

.graph-svg {
	width: 100%;
	height: 80px;
	background-color: var(--profiler-header);
	border: 1px solid var(--profiler-border);
	border-radius: 4px;
}

.graph-path {
	stroke-width: 2;
	fill-opacity: 0.4;
}

.console-header {
	padding: 10px;
	border-bottom: 1px solid var(--profiler-border);
	display: flex;
	gap: 20px;
	flex-shrink: 0;
	align-items: center;
	justify-content: space-between;
}

.console-buttons-group {
	display: flex;
	gap: 20px;
}

.console-filter-input {
	background-color: var(--profiler-bg);
	border: 1px solid var(--profiler-border);
	color: var(--text-primary);
	border-radius: 4px;
	padding: 4px 8px;
	font-family: var(--font-mono);
	flex-grow: 1;
	max-width: 300px;
	border-radius: 15px;
}

.console-filter-input:focus {
	outline: none;
	border-color: var(--text-secondary);
}

.console-copy-button {
	background: transparent;
	border: none;
	color: var(--text-secondary);
	cursor: pointer;
	padding: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 4px;
	transition: color 0.2s, background-color 0.2s;
}

.console-copy-button:hover {
	color: var(--text-primary);
	background-color: var(--profiler-hover);
}

.console-copy-button.copied {
	color: var(--color-green);
}

#console-log {
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 10px;
	overflow-y: auto;
	flex-grow: 1;
	user-select: text;
	-webkit-user-select: text;
}

.log-message {
	padding: 2px 5px;
	white-space: pre-wrap;
	word-break: break-all;
	border-radius: 3px;
	line-height: 1.5 !important;
}

.log-message.hidden {
	display: none;
}

.log-message.info {
	color: var(--text-primary);
}

.log-message.warn {
	color: var(--color-yellow);
}

.log-message.error {
	color: #f9dedc;
	background-color: rgba(244, 67, 54, 0.1);
}

.log-prefix {
	color: var(--text-secondary);
	margin-right: 8px;
}

.log-code {
	background-color: rgba(255, 255, 255, 0.1);
	border-radius: 3px;
	padding: 1px 4px;
}

.thumbnail-container {
	display: flex;
	align-items: center;
}

.thumbnail-svg {
	width: 40px;
	height: 22.5px;
	flex-shrink: 0;
	margin-right: 8px;
}

.param-control {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 10px;
	width: 100%;
}

.param-control input,
.param-control select,
.param-control button {
	background-color: var(--profiler-bg);
	border: 1px solid var(--profiler-border);
	color: var(--text-primary);
	border-radius: 4px;
	padding: 4px 6px;
	padding-bottom: 2px;
	font-family: var(--font-mono);
	width: 100%;
	box-sizing: border-box;
}

.param-control input:focus {
	outline: none;
	border-color: var(--accent-color);
}

.param-control select {
	padding-top: 3px;
	padding-bottom: 1px;
}

.param-control input[type="number"] {
	cursor: ns-resize;
}

.param-control input[type="color"] {
	padding: 2px;
}

.param-control button {
	cursor: pointer;
	transition: background-color 0.2s;
}

.param-control button:hover {
	background-color: var(--profiler-header);
}

.param-control-vector {
	display: flex;
	gap: 5px;
}

.custom-checkbox {
	display: inline-flex;
	align-items: center;
	cursor: pointer;
	gap: 8px;
	will-change: transform;
}

.custom-checkbox input {
	display: none;
}

.custom-checkbox .checkmark {
	width: 14px;
	height: 14px;
	border: 1px solid var(--accent-color);
	border-radius: 3px;
	display: inline-flex;
	justify-content: center;
	align-items: center;
	transition: background-color 0.2s, border-color 0.2s;
}

.custom-checkbox .checkmark::after {
	content: '';
	width: 6px;
	height: 6px;
	background-color: var(--accent-color);
	border-radius: 1px;
	display: block;
	transform: scale(0);
	transition: transform 0.2s;
}

.custom-checkbox input:checked+.checkmark {
	border-color: var(--accent-color);
}

.custom-checkbox input:checked+.checkmark::after {
	transform: scale(1);
}

.param-control input[type="range"] {
	-webkit-appearance: none;
	appearance: none;
	width: 100%;
	height: 16px;
	background: var(--profiler-header);
	border-radius: 5px;
	border: 1px solid var(--profiler-border);
	outline: none;
	padding: 0px;
	padding-top: 8px;
}

.param-control input[type="range"]::-webkit-slider-thumb {
	-webkit-appearance: none;
	appearance: none;
	width: 18px;
	height: 18px;
	background: var(--profiler-bg);
	border: 1px solid var(--accent-color);
	border-radius: 3px;
	cursor: pointer;
	margin-top: -8px;
}

.param-control input[type="range"]::-moz-range-thumb {
	width: 18px;
	height: 18px;
	background: var(--profiler-bg);
	border: 2px solid var(--accent-color);
	border-radius: 3px;
	cursor: pointer;
}

.param-control input[type="range"]::-moz-range-track {
	width: 100%;
	height: 16px;
	background: var(--profiler-header);
	border-radius: 5px;
	border: 1px solid var(--profiler-border);
}

/* Override .param-control styles for mini-panel-content */
.mini-panel-content input,
.mini-panel-content select,
.mini-panel-content button {
	padding: 2px 4px;
	height: 21px;
	line-height: 1.4;
	padding-top: 4px;
}

.mini-panel-content .param-control input,
.mini-panel-content .param-control select,
.mini-panel-content .param-control button {
	background-color: #1e1e24c2;
	line-height: 1.0;
}

.mini-panel-content .param-control select {
	padding: 2px 2px;
	padding-top: 3px;
}

.mini-panel-content .param-control input[type="number"]::-webkit-outer-spin-button,
.mini-panel-content .param-control input[type="number"]::-webkit-inner-spin-button {
	-webkit-appearance: none;
	margin: 0;
}

.mini-panel-content .param-control input[type="number"] {
	-moz-appearance: textfield;
}

.mini-panel-content .list-item-cell span {
	position: relative;
	top: 1px;
	margin-left: 2px;
}

.mini-panel-content .custom-checkbox .checkmark {
	width: 12px;
	height: 12px;
	margin-bottom: 2px;
	will-change: transform;
}

.mini-panel-content .list-container.parameters .list-item-row:not(.collapsible) {
	margin-bottom: 2px;
}

@media screen and (max-width: 450px) and (orientation: portrait) {

	.console-filter-input {
		max-width: 100px;
	}

}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {

	.panel-resizer {
		top: -10px !important;
		height: 20px !important;
	}

	#profiler-panel.position-top .panel-resizer {
		top: auto !important;
		bottom: -10px !important;
		height: 20px !important;
	}

	#profiler-panel.position-left .panel-resizer {
		right: -10px !important;
		width: 20px !important;
		height: 100% !important;
	}

	#profiler-panel.position-right .panel-resizer {
		left: -10px !important;
		width: 20px !important;
		height: 100% !important;
	}

	.detached-tab-resizer-top,
	.detached-tab-resizer-bottom {
		height: 10px !important;
	}

	.detached-tab-resizer-left,
	.detached-tab-resizer-right {
		width: 10px !important;
	}

}

.drag-preview-indicator {
	position: fixed;
	background-color: rgba(0, 170, 255, 0.2);
	border: 2px dashed var(--accent-color);
	z-index: 999;
	pointer-events: none;
	transition: all 0.2s ease-out;
}

/* Detached Tab Windows */
.detached-tab-panel {
	position: fixed;
	width: 500px;
	height: 400px;
	background: var(--profiler-bg);
	border: 1px solid var(--profiler-border);
	border-radius: 8px;
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
	z-index: 1002;
	display: flex;
	flex-direction: column;
	backdrop-filter: blur(10px);
	overflow: hidden;
	opacity: 1;
	visibility: visible;
	transition: opacity 0.2s, visibility 0.2s;
}

#profiler-panel:not(.visible) ~ * .detached-tab-panel,
body:has(#profiler-panel:not(.visible)) .detached-tab-panel {
	opacity: 0;
	visibility: hidden;
	pointer-events: none;
}

.detached-tab-header {
	background: var(--profiler-header-bg);
	padding: 0 7px 0 15px;
	font-family: var(--font-family);
	font-size: 14px;
	color: var(--text-primary);
	font-weight: 600;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1px solid var(--profiler-border);
	cursor: grab;
	user-select: none;
	height: 38px;
	flex-shrink: 0;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	touch-action: none;
}

.detached-tab-header:active {
	cursor: grabbing;
}

.detached-header-controls {
	display: flex;
	gap: 5px;
}

.detached-reattach-btn {
	background: transparent;
	border: none;
	color: var(--text-secondary);
	font-family: var(--font-family);
	font-size: 18px;
	line-height: 1;
	cursor: pointer;
	padding: 4px 8px;
	border-radius: 4px;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	justify-content: center;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

.detached-reattach-btn:hover {
	background: rgba(0, 170, 255, 0.2);
	color: var(--accent-color);
}

.detached-tab-content {
	flex: 1;
	overflow: auto;
	position: relative;
	background: var(--profiler-bg);
}

.detached-tab-content::-webkit-scrollbar {
	width: 8px;
	height: 8px;
}

.detached-tab-content::-webkit-scrollbar-track {
	background: transparent;
}

.detached-tab-content::-webkit-scrollbar-thumb {
	background-color: rgba(0, 0, 0, 0.25);
	border-radius: 10px;
	transition: background 0.3s ease;
}

.detached-tab-content::-webkit-scrollbar-thumb:hover {
	background-color: rgba(0, 0, 0, 0.4);
}

.detached-tab-content::-webkit-scrollbar-corner {
	background: transparent;
}

.detached-tab-content .profiler-content {
	display: block !important;
	height: 100%;
	visibility: visible !important;
	opacity: 1 !important;
	position: relative !important;
}

.detached-tab-content .profiler-content > * {
	font-family: var(--font-mono);
	color: var(--text-primary);
}

.detached-tab-resizer {
	position: absolute;
	bottom: 0;
	right: 0;
	width: 20px;
	height: 20px;
	cursor: nwse-resize;
	z-index: 10;
	touch-action: none;
}

.detached-tab-resizer::after {
	content: '';
	position: absolute;
	bottom: 2px;
	right: 2px;
	width: 12px;
	height: 12px;
	border-right: 2px solid var(--profiler-border);
	border-bottom: 2px solid var(--profiler-border);
	border-bottom-right-radius: 6px;
	opacity: 0.5;
}

.detached-tab-resizer:hover::after {
	opacity: 1;
	border-color: var(--accent-color);
}

/* Edge resizers */
.detached-tab-resizer-top {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 5px;
	cursor: ns-resize;
	z-index: 10;
	touch-action: none;
}

.detached-tab-resizer-right {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	width: 5px;
	cursor: ew-resize;
	z-index: 10;
	touch-action: none;
}

.detached-tab-resizer-bottom {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 5px;
	cursor: ns-resize;
	z-index: 10;
	touch-action: none;
}

.detached-tab-resizer-left {
	position: absolute;
	top: 0;
	left: 0;
	bottom: 0;
	width: 5px;
	cursor: ew-resize;
	z-index: 10;
	touch-action: none;
}

/* Input number spin buttons - hide arrows */
/* Chrome, Safari, Edge, Opera */
#profiler-panel input[type="number"]::-webkit-outer-spin-button,
#profiler-panel input[type="number"]::-webkit-inner-spin-button,
.detached-tab-content input[type="number"]::-webkit-outer-spin-button,
.detached-tab-content input[type="number"]::-webkit-inner-spin-button {
	-webkit-appearance: none;
	margin: 0;
}

/* Firefox */
#profiler-panel input[type="number"],
.detached-tab-content input[type="number"] {
	-moz-appearance: textfield;
}

.panel-action-btn {
	background: transparent;
	color: var(--text-primary);
	border: 1px solid var(--profiler-border);
	border-radius: 4px;
	padding: 6px 12px;
	cursor: pointer;
	font-family: var(--font-family);
	font-size: 12px;
	transition: background-color 0.2s;
	display: flex;
	align-items: center;
	justify-content: center;
}

.panel-action-btn:hover {
	background-color: rgba(255, 255, 255, 0.05);
}
`,i=document.createElement("style");i.id="profiler-styles",i.textContent=e,document.head.appendChild(i)}}class Xe extends G{constructor(e){super(),this.inspector=e,this.tabs={},this.activeTabId=null,this.isResizing=!1,this.lastHeightBottom=350,this.lastWidthRight=450,this.position="bottom",this.detachedWindows=[],this.maxZIndex=1002,this.nextTabOriginalIndex=0,$e.init(),this.setupShell(),this.setupResizing(),this.setupWindowResizeListener(),this.setupOrientationListener()}getSize(){return this.panel.classList.contains("visible")===!1||this.panel.classList.contains("no-tabs")?{width:0,height:0}:this.position==="right"?{width:this.panel.offsetWidth,height:0}:{width:0,height:this.panel.offsetHeight}}get isMobile(){return this.detectMobile()}get isSmallScreen(){return window.innerWidth<=768}detectMobile(){const e=navigator.userAgent||navigator.vendor||window.opera,i=/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(e),n="ontouchstart"in window||navigator.maxTouchPoints>0;return i||n&&this.isSmallScreen}setupOrientationListener(){const e=()=>{if(!this.isMobile)return;const n=window.innerWidth>window.innerHeight?"right":"bottom";this.position!==n&&this.setPosition(n)};e(),window.addEventListener("orientationchange",e),window.addEventListener("resize",e)}setupWindowResizeListener(){const e=()=>{this.detachedWindows.forEach(n=>{this.constrainWindowToBounds(n.panel)})},i=()=>{if(this.panel.classList.contains("maximized"))return;const n=window.innerWidth,s=window.innerHeight;if(this.position==="bottom"){const r=this.panel.offsetHeight,o=s-50;r>o&&(this.panel.style.height=`${o}px`,this.lastHeightBottom=o)}else if(this.position==="right"){const r=this.panel.offsetWidth,o=n-50;r>o&&(this.panel.style.width=`${o}px`,this.lastWidthRight=o)}};window.addEventListener("resize",()=>{this.isSmallScreen?(this.floatingBtn.style.display="none",this.panel.classList.add("hide-position-toggle")):(this.floatingBtn.style.display="",this.panel.classList.remove("hide-position-toggle")),this.isMobile?this.panel.classList.add("is-mobile"):this.panel.classList.remove("is-mobile"),e(),i()})}constrainWindowToBounds(e){const i=window.innerWidth,n=window.innerHeight,s=e.offsetWidth,r=e.offsetHeight;let o=parseFloat(e.style.left)||e.offsetLeft||0,a=parseFloat(e.style.top)||e.offsetTop||0;const l=s/2,c=r/2;o+s>i+l&&(o=i+l-s),o<-l&&(o=-l),a+r>n+c&&(a=n+c-r),a<-c&&(a=-c),e.style.left=`${o}px`,e.style.top=`${a}px`}setupShell(){this.domElement=document.createElement("div"),this.domElement.id="profiler-shell",this.toggleButton=document.createElement("button"),this.toggleButton.id="profiler-toggle",this.toggleButton.innerHTML=`
<span id="builtin-tabs-container"></span>
<span id="toggle-text">
	<span id="fps-counter">-</span>
	<span class="fps-label">FPS</span>
</span>
<span id="toggle-icon">
	<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-device-ipad-horizontal-search"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M11.5 20h-6.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v5.5" /><path d="M9 17h2" /><path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M20.2 20.2l1.8 1.8" /></svg>
</span>
`,this.toggleButton.onclick=()=>this.togglePanel(),this.builtinTabsContainer=this.toggleButton.querySelector("#builtin-tabs-container"),this.miniPanel=document.createElement("div"),this.miniPanel.id="profiler-mini-panel",this.miniPanel.className="profiler-mini-panel",this.panel=document.createElement("div"),this.panel.id="profiler-panel";const e=document.createElement("div");e.className="profiler-header",e.addEventListener("wheel",r=>{r.deltaY!==0&&(r.preventDefault(),e.scrollLeft+=r.deltaY*.25)},{passive:!1}),this.tabsContainer=document.createElement("div"),this.tabsContainer.className="profiler-tabs";const i=document.createElement("div");i.className="profiler-controls",this.floatingBtn=document.createElement("button"),this.floatingBtn.id="floating-btn",this.floatingBtn.title="Switch to Right Side",this.floatingBtn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="15" y1="3" x2="15" y2="21"></line></svg>',this.floatingBtn.onclick=()=>this.togglePosition(),this.isSmallScreen&&(this.floatingBtn.style.display="none",this.panel.classList.add("hide-position-toggle")),this.isMobile&&this.panel.classList.add("is-mobile"),this.maximizeBtn=document.createElement("button"),this.maximizeBtn.id="maximize-btn",this.maximizeBtn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',this.maximizeBtn.onclick=()=>this.toggleMaximize();const n=document.createElement("button");n.id="hide-panel-btn",n.textContent="-",n.onclick=()=>this.togglePanel(),i.append(this.floatingBtn,this.maximizeBtn,n),e.append(this.tabsContainer,i),this.contentWrapper=document.createElement("div"),this.contentWrapper.className="profiler-content-wrapper";const s=document.createElement("div");s.className="panel-resizer",this.panel.append(s,e,this.contentWrapper),this.domElement.append(this.toggleButton,this.miniPanel,this.panel),this.panel.classList.add(`position-${this.position}`),this.position==="right"&&(this.toggleButton.classList.add("position-right"),this.miniPanel.classList.add("position-right"))}setupResizing(){const e=this.panel.querySelector(".panel-resizer"),i=n=>{this.isResizing=!0,this.panel.classList.add("resizing"),e.setPointerCapture(n.pointerId);const s=n.clientX,r=n.clientY,o=this.panel.offsetHeight,a=this.panel.offsetWidth,l=d=>{if(!this.isResizing)return;d.preventDefault();const p=d.clientX,h=d.clientY;if(this.position==="bottom"){const u=o-(h-r);u>100&&u<window.innerHeight-50&&(this.panel.style.height=`${u}px`)}else if(this.position==="right"){const u=a-(p-s);u>200&&u<window.innerWidth-50&&(this.panel.style.width=`${u}px`)}this.dispatchEvent({type:"resize"})},c=()=>{this.isResizing=!1,this.panel.classList.remove("resizing"),e.removeEventListener("pointermove",l),e.removeEventListener("pointerup",c),e.removeEventListener("pointercancel",c),this.panel.classList.contains("maximized")||(this.position==="bottom"?this.lastHeightBottom=this.panel.offsetHeight:this.position==="right"&&(this.lastWidthRight=this.panel.offsetWidth),this.saveLayout())};e.addEventListener("pointermove",l),e.addEventListener("pointerup",c),e.addEventListener("pointercancel",c)};e.addEventListener("pointerdown",i)}toggleMaximize(){this.panel.classList.contains("maximized")?(this.panel.classList.remove("maximized"),this.position==="bottom"?(this.panel.style.height=`${this.lastHeightBottom}px`,this.panel.style.width="100%"):this.position==="right"&&(this.panel.style.height="100%",this.panel.style.width=`${this.lastWidthRight}px`),this.maximizeBtn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>'):(this.position==="bottom"?this.lastHeightBottom=this.panel.offsetHeight:this.position==="right"&&(this.lastWidthRight=this.panel.offsetWidth),this.panel.classList.add("maximized"),this.position==="bottom"?(this.panel.style.height="100vh",this.panel.style.width="100%"):this.position==="right"&&(this.panel.style.height="100%",this.panel.style.width="100vw"),this.maximizeBtn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>'),this.dispatchEvent({type:"resize"})}hide(){this.miniPanel.classList.remove("visible"),this.miniPanel.querySelectorAll(".mini-panel-content").forEach(e=>{e.style.display="none"}),this.builtinTabsContainer.querySelectorAll(".builtin-tab-btn").forEach(e=>{e.classList.remove("active")})}show(e){if(this.hide(),e.builtinButton.classList.add("active"),!e.miniContent.firstChild)for(;e.content.firstChild;)e.miniContent.appendChild(e.content.firstChild);e.miniContent.style.display="block",this.miniPanel.classList.add("visible")}addTab(e){this.tabs[e.id]=e,e.originalIndex=this.nextTabOriginalIndex++,e.allowDetach===!1&&e.button.classList.add("no-detach"),e.onVisibilityChange=()=>this.updatePanelSize(),this.setupTabDragAndDrop(e),e.builtin||this.tabsContainer.appendChild(e.button),this.contentWrapper.appendChild(e.content),e.isVisible||(e.button.style.display="none",e.content.style.display="none"),e.builtin&&this.addBuiltinTab(e),this.updatePanelSize(),e.profiler=this}addBuiltinTab(e){const i=document.createElement("button");i.className="builtin-tab-btn",e.icon?i.innerHTML=e.icon:i.textContent=e.button.textContent.charAt(0).toUpperCase(),i.title=e.button.textContent;const n=document.createElement("div");n.className="mini-panel-content",n.style.display="none",e.builtinButton=i,e.miniContent=n,this.miniPanel.appendChild(n),i.onclick=s=>{s.stopPropagation(),n.style.display!=="none"&&n.children.length>0?this.hide():this.show(e)},this.builtinTabsContainer.appendChild(i),e.builtinButton=i,e.miniContent=n,e.isVisible||(i.style.display="none",n.style.display="none",Array.from(this.builtinTabsContainer.querySelectorAll(".builtin-tab-btn")).some(r=>r.style.display!=="none")||(this.builtinTabsContainer.style.display="none"))}removeTab(e){if(!(!e||this.tabs[e.id]===void 0)){if(delete this.tabs[e.id],e.isDetached&&e.detachedWindow){e.detachedWindow.panel&&e.detachedWindow.panel.parentNode&&e.detachedWindow.panel.parentNode.removeChild(e.detachedWindow.panel);const i=this.detachedWindows.indexOf(e.detachedWindow);i!==-1&&this.detachedWindows.splice(i,1)}if(e.builtin?(e.builtinButton&&e.builtinButton.parentNode&&e.builtinButton.parentNode.removeChild(e.builtinButton),e.miniContent&&e.miniContent.parentNode&&e.miniContent.parentNode.removeChild(e.miniContent),Array.from(this.builtinTabsContainer.querySelectorAll(".builtin-tab-btn")).some(n=>n.style.display!=="none")||(this.builtinTabsContainer.style.display="none")):e.button&&e.button.parentNode&&e.button.parentNode.removeChild(e.button),e.content&&e.content.parentNode&&e.content.parentNode.removeChild(e.content),this.activeTabId===e.id){this.activeTabId=null;const i=Object.values(this.tabs).filter(n=>!n.isDetached&&n.isVisible);i.length>0?this.setActiveTab(i[0].id):this.updatePanelSize()}else this.updatePanelSize();e.onVisibilityChange=null,e.profiler=null}}updatePanelSize(){Object.values(this.tabs).some(i=>!i.isDetached&&i.isVisible)?(this.panel.classList.remove("no-tabs"),Object.keys(this.tabs).length>0&&(this.position==="bottom"?parseInt(this.panel.style.height)===38&&(this.panel.style.height=`${this.lastHeightBottom}px`):this.position==="right"&&parseInt(this.panel.style.width)===45&&(this.panel.style.width=`${this.lastWidthRight}px`))):(this.panel.classList.add("no-tabs"),this.panel.classList.contains("maximized")&&(this.panel.classList.remove("maximized"),this.maximizeBtn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>'),this.position==="bottom"?this.panel.style.height="38px":this.position==="right"&&(this.panel.style.width="45px")),this.dispatchEvent({type:"resize"})}setupTabDragAndDrop(e){if(e.button.addEventListener("click",()=>{i||this.setActiveTab(e.id)}),e.allowDetach===!1){e.button.style.cursor="default";return}let i=!1,n,s,r=!1,o=null;const a=10,l=p=>{n=p.clientX,s=p.clientY,i=!1,r=!1,e.button.setPointerCapture(p.pointerId)},c=p=>{const h=p.clientX,u=p.clientY,g=Math.abs(h-n),b=Math.abs(u-s);!i&&(g>a||b>a)&&(i=!0,e.button.style.cursor="grabbing",e.button.style.opacity="0.5",e.button.style.transform="scale(1.05)",o=this.createPreviewWindow(e,h,u),o.style.opacity="0.8"),i&&o&&(r=!0,p.preventDefault(),o.style.left=`${h-200}px`,o.style.top=`${u-20}px`)},d=()=>{if(i&&r&&o){o.parentNode&&o.parentNode.removeChild(o);const p=parseInt(o.style.left)+200,h=parseInt(o.style.top)+20;this.detachTab(e,p,h)}else r||this.setActiveTab(e.id),o&&o.parentNode&&o.parentNode.removeChild(o);e.button.style.opacity="",e.button.style.transform="",e.button.style.cursor="",i=!1,r=!1,o=null,e.button.removeEventListener("pointermove",c),e.button.removeEventListener("pointerup",d),e.button.removeEventListener("pointercancel",d)};e.button.addEventListener("pointerdown",p=>{this.isMobile&&p.pointerType!=="mouse"||(l(p),e.button.addEventListener("pointermove",c),e.button.addEventListener("pointerup",d),e.button.addEventListener("pointercancel",d))}),e.button.style.cursor="grab"}createPreviewWindow(e,i,n){const s=document.createElement("div");s.className="detached-tab-panel",s.style.left=`${i-200}px`,s.style.top=`${n-20}px`,s.style.pointerEvents="none",this.maxZIndex++,s.style.setProperty("z-index",this.maxZIndex,"important");const r=document.createElement("div");r.className="detached-tab-header";const o=document.createElement("span");o.textContent=e.button.textContent.replace("⇱","").trim(),r.appendChild(o);const a=document.createElement("div");a.className="detached-header-controls";const l=document.createElement("button");l.className="detached-reattach-btn",l.innerHTML="↩",a.appendChild(l),r.appendChild(a);const c=document.createElement("div");c.className="detached-tab-content";const d=document.createElement("div");return d.className="detached-tab-resizer",s.appendChild(d),s.appendChild(r),s.appendChild(c),document.body.appendChild(s),s}detachTab(e,i,n){if(e.isDetached||e.allowDetach===!1)return;const r=Array.from(this.tabsContainer.children).map(c=>Object.keys(this.tabs).find(d=>this.tabs[d].button===c)).filter(c=>c!==void 0),o=r.indexOf(e.id);let a=null;if(this.activeTabId===e.id){e.setActive(!1);const c=r.filter(d=>d!==e.id&&!this.tabs[d].isDetached&&this.tabs[d].isVisible);if(c.length>0){for(let d=o-1;d>=0;d--)if(c.includes(r[d])){a=r[d];break}if(!a){for(let d=o+1;d<r.length;d++)if(c.includes(r[d])){a=r[d];break}}a||(a=c[0])}}e.button.parentNode&&e.button.parentNode.removeChild(e.button),e.content.parentNode&&e.content.parentNode.removeChild(e.content);const l=this.createDetachedWindow(e,i,n);this.detachedWindows.push(l),e.isDetached=!0,e.detachedWindow=l,a?this.setActiveTab(a):this.activeTabId===e.id&&(this.activeTabId=null),this.updatePanelSize(),this.saveLayout()}createDetachedWindow(e,i,n){const s=window.innerWidth,r=window.innerHeight,o=400,a=300;let l=i-200,c=n-20;l+o>s&&(l=s-o),l<0&&(l=0),c+a>r&&(c=r-a),c<0&&(c=0);const d=document.createElement("div");d.className="detached-tab-panel",d.style.left=`${l}px`,d.style.top=`${c}px`,this.panel.classList.contains("visible")||(d.style.opacity="0",d.style.visibility="hidden",d.style.pointerEvents="none"),e.isVisible||(d.style.display="none");const p=document.createElement("div");p.className="detached-tab-header";const h=document.createElement("span");h.textContent=e.button.textContent.replace("⇱","").trim(),p.appendChild(h);const u=document.createElement("div");u.className="detached-header-controls";const g=document.createElement("button");g.className="detached-reattach-btn",g.innerHTML="↩",g.title="Reattach to main panel",g.onclick=()=>this.reattachTab(e),u.appendChild(g),p.appendChild(u);const b=document.createElement("div");b.className="detached-tab-content",b.appendChild(e.content),e.content.style.display="block",e.content.classList.add("active");const C=document.createElement("div");C.className="detached-tab-resizer-top";const y=document.createElement("div");y.className="detached-tab-resizer-right";const w=document.createElement("div");w.className="detached-tab-resizer-bottom";const L=document.createElement("div");L.className="detached-tab-resizer-left";const S=document.createElement("div");return S.className="detached-tab-resizer",d.appendChild(C),d.appendChild(y),d.appendChild(w),d.appendChild(L),d.appendChild(S),d.appendChild(p),d.appendChild(b),document.body.appendChild(d),this.setupDetachedWindowDrag(d,p,e),this.setupDetachedWindowResize(d,C,y,w,L,S),d.style.setProperty("z-index",this.maxZIndex,"important"),{panel:d,tab:e}}bringWindowToFront(e){this.maxZIndex++,e.style.setProperty("z-index",this.maxZIndex,"important")}setupDetachedWindowDrag(e,i,n){let s=!1,r,o,a,l;e.addEventListener("pointerdown",()=>{this.bringWindowToFront(e)});const c=h=>{if(h.target.classList.contains("detached-reattach-btn"))return;this.bringWindowToFront(e),s=!0,i.style.cursor="grabbing",i.setPointerCapture(h.pointerId),r=h.clientX,o=h.clientY;const u=e.getBoundingClientRect();a=u.left,l=u.top},d=h=>{if(!s)return;h.preventDefault();const u=h.clientX,g=h.clientY,b=u-r,C=g-o;let y=a+b,w=l+C;const L=window.innerWidth,S=window.innerHeight,I=e.offsetWidth,k=e.offsetHeight,N=I/2,W=k/2;y+I>L+N&&(y=L+N-I),y<-N&&(y=-N),w+k>S+W&&(w=S+W-k),w<-W&&(w=-W),e.style.left=`${y}px`,e.style.top=`${w}px`;const B=this.panel.getBoundingClientRect();u>=B.left&&u<=B.right&&g>=B.top&&g<=B.bottom?(e.style.opacity="0.5",this.panel.style.outline="2px solid var(--accent-color)"):(e.style.opacity="",this.panel.style.outline="")},p=h=>{if(!s)return;s=!1,i.style.cursor="",e.style.opacity="",this.panel.style.outline="";const u=h.clientX,g=h.clientY;if(u!==void 0&&g!==void 0){const b=this.panel.getBoundingClientRect();u>=b.left&&u<=b.right&&g>=b.top&&g<=b.bottom&&n?this.reattachTab(n):this.saveLayout()}i.removeEventListener("pointermove",d),i.removeEventListener("pointerup",p),i.removeEventListener("pointercancel",p)};i.addEventListener("pointerdown",h=>{c(h),i.addEventListener("pointermove",d),i.addEventListener("pointerup",p),i.addEventListener("pointercancel",p)}),i.style.cursor="grab"}setupDetachedWindowResize(e,i,n,s,r,o){const c=(d,p)=>{let h=!1,u,g,b,C,y,w;const L=k=>{k.preventDefault(),k.stopPropagation(),h=!0,this.bringWindowToFront(e),d.setPointerCapture(k.pointerId),u=k.clientX,g=k.clientY,b=e.offsetWidth,C=e.offsetHeight,y=e.offsetLeft,w=e.offsetTop},S=k=>{if(!h)return;k.preventDefault();const N=k.clientX,W=k.clientY,B=N-u,V=W-g,ae=window.innerWidth,le=window.innerHeight;if(p==="right"||p==="corner"){const T=b+B,R=ae-y;T>=250&&T<=R&&(e.style.width=`${T}px`)}if(p==="bottom"||p==="corner"){const T=C+V,R=le-w;T>=150&&T<=R&&(e.style.height=`${T}px`)}if(p==="left"){const T=b-B,R=y+b-250;if(T>=250){const F=y+B;F>=0&&F<=R&&(e.style.width=`${T}px`,e.style.left=`${F}px`)}}if(p==="top"){const T=C-V,R=w+C-150;if(T>=150){const F=w+V;F>=0&&F<=R&&(e.style.height=`${T}px`,e.style.top=`${F}px`)}}},I=()=>{h=!1,d.removeEventListener("pointermove",S),d.removeEventListener("pointerup",I),d.removeEventListener("pointercancel",I),this.saveLayout()};d.addEventListener("pointerdown",k=>{L(k),d.addEventListener("pointermove",S),d.addEventListener("pointerup",I),d.addEventListener("pointercancel",I)})};c(i,"top"),c(n,"right"),c(s,"bottom"),c(r,"left"),c(o,"corner")}reattachTab(e){if(!e.isDetached)return;if(e.detachedWindow){const o=this.detachedWindows.indexOf(e.detachedWindow);o>-1&&this.detachedWindows.splice(o,1),e.detachedWindow.panel.parentNode&&e.detachedWindow.panel.parentNode.removeChild(e.detachedWindow.panel),e.detachedWindow=null}e.isDetached=!1;const n=Object.values(this.tabs).filter(o=>o.originalIndex!==void 0&&o.isVisible).sort((o,a)=>o.originalIndex-a.originalIndex),s=Array.from(this.tabsContainer.children);let r=0;for(const o of n){if(o.id===e.id)break;o.isDetached||r++}r>=s.length||s.length===0?this.tabsContainer.appendChild(e.button):this.tabsContainer.insertBefore(e.button,s[r]),this.contentWrapper.appendChild(e.content),this.setActiveTab(e.id),this.updatePanelSize(),this.saveLayout()}setActiveTab(e){this.activeTabId&&this.tabs[this.activeTabId]&&!this.tabs[this.activeTabId].isDetached&&this.tabs[this.activeTabId].setActive(!1),this.activeTabId=e,this.tabs[e]&&this.tabs[e].setActive(!0),this.saveLayout()}togglePanel(){this.panel.classList.toggle("visible"),this.toggleButton.classList.toggle("panel-open"),this.miniPanel.classList.toggle("panel-open");const e=this.panel.classList.contains("visible");this.detachedWindows.forEach(i=>{e?(i.panel.style.opacity="",i.panel.style.visibility="",i.panel.style.pointerEvents=""):(i.panel.style.opacity="0",i.panel.style.visibility="hidden",i.panel.style.pointerEvents="none")}),this.dispatchEvent({type:"resize"}),this.saveLayout()}togglePosition(){const e=this.position==="bottom"?"right":"bottom";this.setPosition(e)}setPosition(e){if(this.position===e)return;this.panel.style.transition="none";const i=this.panel.classList.contains("maximized");e==="right"?(this.position="right",this.floatingBtn.classList.add("active"),this.floatingBtn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M3 15h18"></path></svg>',this.floatingBtn.title="Switch to Bottom",this.panel.classList.remove("position-bottom"),this.panel.classList.add("position-right"),this.toggleButton.classList.add("position-right"),this.miniPanel.classList.add("position-right"),this.panel.style.bottom="",this.panel.style.top="0",this.panel.style.right="0",this.panel.style.left="",i?(this.panel.style.width="100vw",this.panel.style.height="100%"):(this.panel.style.width=`${this.lastWidthRight}px`,this.panel.style.height="100%")):(this.position="bottom",this.floatingBtn.classList.remove("active"),this.floatingBtn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="15" y1="3" x2="15" y2="21"></line></svg>',this.floatingBtn.title="Switch to Right Side",this.panel.classList.remove("position-right"),this.panel.classList.add("position-bottom"),this.toggleButton.classList.remove("position-right"),this.miniPanel.classList.remove("position-right"),this.panel.style.top="",this.panel.style.right="",this.panel.style.bottom="0",this.panel.style.left="0",i?(this.panel.style.width="100%",this.panel.style.height="100vh"):(this.panel.style.width="100%",this.panel.style.height=`${this.lastHeightBottom}px`)),setTimeout(()=>{this.panel.style.transition=""},50),this.updatePanelSize(),this.saveLayout()}saveLayout(){if(this.isLoadingLayout)return;const e={position:this.position,lastHeightBottom:this.lastHeightBottom,lastWidthRight:this.lastWidthRight,activeTabId:this.activeTabId,detachedTabs:[],isVisible:this.panel.classList.contains("visible")};this.detachedWindows.forEach(i=>{const n=i.tab,s=i.panel,r=parseFloat(s.style.left)||s.offsetLeft||0,o=parseFloat(s.style.top)||s.offsetTop||0,a=s.offsetWidth,l=s.offsetHeight;e.detachedTabs.push({tabId:n.id,originalIndex:n.originalIndex!==void 0?n.originalIndex:0,left:r,top:o,width:a,height:l})});try{P("layout",e)}catch(i){console.warn("Failed to save profiler layout:",i)}}loadLayout(){this.isLoadingLayout=!0;try{const e=A("layout");if(Object.keys(e).length===0)return;if(e.detachedTabs&&e.detachedTabs.length>0){const s=window.innerWidth,r=window.innerHeight;e.detachedTabs=e.detachedTabs.map(o=>{let{left:a,top:l,width:c,height:d}=o;c>s&&(c=s-100),d>r&&(d=r-100);const p=c/2,h=d/2;return a+c>s+p&&(a=s+p-c),a<-p&&(a=-p),l+d>r+h&&(l=r+h-d),l<-h&&(l=-h),{...o,left:a,top:l,width:c,height:d}})}e.position&&(this.position=e.position),e.lastHeightBottom&&(this.lastHeightBottom=e.lastHeightBottom),e.lastWidthRight&&(this.lastWidthRight=e.lastWidthRight);const i=window.innerWidth,n=window.innerHeight;this.lastHeightBottom>n-50&&(this.lastHeightBottom=n-50),this.lastWidthRight>i-50&&(this.lastWidthRight=i-50),this.position==="right"?(this.floatingBtn.classList.add("active"),this.floatingBtn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M3 15h18"></path></svg>',this.floatingBtn.title="Switch to Bottom",this.panel.classList.remove("position-bottom"),this.panel.classList.add("position-right"),this.toggleButton.classList.add("position-right"),this.miniPanel.classList.add("position-right"),this.panel.style.bottom="",this.panel.style.top="0",this.panel.style.right="0",this.panel.style.left="",this.panel.style.width=`${this.lastWidthRight}px`,this.panel.style.height="100%"):this.panel.style.height=`${this.lastHeightBottom}px`,e.isVisible&&(this.panel.classList.add("visible"),this.toggleButton.classList.add("panel-open")),e.activeTabId&&this.setActiveTab(e.activeTabId),e.detachedTabs&&e.detachedTabs.length>0&&(this.pendingDetachedTabs=e.detachedTabs,this.restoreDetachedTabs()),this.updatePanelSize(),this.panel.classList.contains("visible")&&this.miniPanel.classList.add("panel-open")}catch(e){console.warn("Failed to load profiler layout:",e)}finally{this.isLoadingLayout=!1}}restoreDetachedTabs(){if(!this.pendingDetachedTabs||this.pendingDetachedTabs.length===0)return;if(this.pendingDetachedTabs.forEach(i=>{const n=this.tabs[i.tabId];if(!n||n.isDetached)return;i.originalIndex!==void 0&&(n.originalIndex=i.originalIndex),n.button.parentNode&&n.button.parentNode.removeChild(n.button),n.content.parentNode&&n.content.parentNode.removeChild(n.content);const s=this.createDetachedWindow(n,0,0);s.panel.style.left=`${i.left}px`,s.panel.style.top=`${i.top}px`,s.panel.style.width=`${i.width}px`,s.panel.style.height=`${i.height}px`,this.constrainWindowToBounds(s.panel),this.detachedWindows.push(s),n.isDetached=!0,n.detachedWindow=s}),this.pendingDetachedTabs=null,this.detachedWindows.forEach(i=>{const n=parseInt(getComputedStyle(i.panel).zIndex)||0;n>this.maxZIndex&&(this.maxZIndex=n)}),!this.activeTabId||!this.tabs[this.activeTabId]||this.tabs[this.activeTabId].isDetached||!this.tabs[this.activeTabId].isVisible){const n=Object.keys(this.tabs).filter(s=>!this.tabs[s].isDetached&&this.tabs[s].isVisible);if(n.length>0){const r=Array.from(this.tabsContainer.children).map(o=>Object.keys(this.tabs).find(a=>this.tabs[a].button===o)).filter(o=>o!==void 0&&!this.tabs[o].isDetached&&this.tabs[o].isVisible);this.setActiveTab(r[0]||n[0])}else this.activeTabId=null}this.updatePanelSize()}}class D extends G{constructor(e,i={}){super(),this.id=e.toLowerCase(),this.button=document.createElement("button"),this.button.className="tab-btn",this.button.textContent=e,this.content=document.createElement("div"),this.content.id=`${this.id}-content`,this.content.className="profiler-content",this._isActive=!1,this.isVisible=!0,this.isDetached=!1,this.detachedWindow=null,this.allowDetach=i.allowDetach!==void 0?i.allowDetach:!0,this.builtin=i.builtin!==void 0?i.builtin:!1,this.icon=i.icon||null,this.builtinButton=null,this.miniContent=null,this.profiler=null,this.onVisibilityChange=null}get inspector(){return this.profiler.inspector}get isActive(){return this.profiler&&this.profiler.panel.classList.contains("visible")?this.isDetached||this._isActive:!1}set isActive(e){this._isActive=e}init(){}update(){}setActive(e){this.button.classList.toggle("active",e),this.content.classList.toggle("active",e),this.isActive=e}show(){this.content.style.display="",this.button.style.display="",this.isVisible=!0,this.isDetached&&this.detachedWindow&&(this.detachedWindow.panel.style.display=""),this.onVisibilityChange&&this.onVisibilityChange(),this.showBuiltin()}hide(){this.content.style.display="none",this.button.style.display="none",this.isVisible=!1,this.isDetached&&this.detachedWindow&&(this.detachedWindow.panel.style.display="none"),this.onVisibilityChange&&this.onVisibilityChange(),this.hideBuiltin()}showBuiltin(){if(this.builtin&&(this.profiler&&this.profiler.builtinTabsContainer&&(this.profiler.builtinTabsContainer.style.display=""),this.builtinButton&&(this.builtinButton.style.display=""),this.miniContent&&this.profiler)){if(this.profiler.miniPanel.querySelectorAll(".mini-panel-content").forEach(e=>{e.style.display="none"}),this.profiler.builtinTabsContainer.querySelectorAll(".builtin-tab-btn").forEach(e=>{e.classList.remove("active")}),this.builtinButton&&this.builtinButton.classList.add("active"),!this.miniContent.firstChild)for(;this.content.firstChild;)this.miniContent.appendChild(this.content.firstChild);this.miniContent.style.display="block",this.profiler.miniPanel.classList.add("visible")}}hideBuiltin(){if(this.builtin){if(this.builtinButton&&(this.builtinButton.style.display="none"),this.miniContent&&(this.miniContent.style.display="none",this.miniContent.firstChild))for(;this.miniContent.firstChild;)this.content.appendChild(this.miniContent.firstChild);this.builtinButton&&this.builtinButton.classList.remove("active"),this.profiler&&(Array.from(this.profiler.miniPanel.querySelectorAll(".mini-panel-content")).some(n=>n.style.display!=="none")||this.profiler.miniPanel.classList.remove("visible"),Array.from(this.profiler.builtinTabsContainer.querySelectorAll(".builtin-tab-btn")).some(n=>n.style.display!=="none")||(this.profiler.builtinTabsContainer.style.display="none"))}}}class O{constructor(...e){this.headers=e,this.children=[],this.domElement=document.createElement("div"),this.domElement.className="list-container",this.domElement.style.padding="10px",this.id=`list-${Math.random().toString(36).slice(2,11)}`,this.domElement.dataset.listId=this.id,this.gridStyleElement=document.createElement("style"),this.domElement.appendChild(this.gridStyleElement);const i=document.createElement("div");i.className="list-header",this.headers.forEach(n=>{const s=document.createElement("div");s.className="list-header-cell",s.textContent=n,i.appendChild(s)}),this.domElement.appendChild(i)}setGridStyle(e){this.gridStyleElement.textContent=`
[data-list-id="${this.id}"] > .list-header,
[data-list-id="${this.id}"] .list-item-row {
	grid-template-columns: ${e};
}
`}add(e){e.parent!==null&&e.parent.remove(e),e.domElement.classList.add("header-wrapper","section-start"),e.parent=this,this.children.push(e),this.domElement.appendChild(e.domElement)}remove(e){const i=this.children.indexOf(e);return i!==-1&&(this.children.splice(i,1),this.domElement.removeChild(e.domElement),e.parent=null),this}}class ${constructor(e=512){this.maxPoints=e,this.lines={},this.limit=0,this.limitIndex=0,this.domElement=document.createElementNS("http://www.w3.org/2000/svg","svg"),this.domElement.setAttribute("class","graph-svg")}addLine(e,i){const n=document.createElementNS("http://www.w3.org/2000/svg","path");n.setAttribute("class","graph-path"),n.style.stroke=i,n.style.fill=i,this.domElement.appendChild(n),this.lines[e]={path:n,color:i,points:[]}}addPoint(e,i){const n=this.lines[e];n&&(n.points.push(i),n.points.length>this.maxPoints&&n.points.shift(),i>this.limit&&(this.limit=i,this.limitIndex=0))}resetLimit(){this.limit=0,this.limitIndex=0}update(){const e=this.domElement.clientWidth,i=this.domElement.clientHeight;if(e===0)return;const n=e/(this.maxPoints-1);for(const s in this.lines){const r=this.lines[s];let o=`M 0,${i}`;for(let l=0;l<r.points.length;l++){const c=l*n,d=i-r.points[l]/this.limit*i;o+=` L ${c},${d}`}o+=` L ${(r.points.length-1)*n},${i} Z`;const a=e-(r.points.length-1)*n;r.path.setAttribute("transform",`translate(${a}, 0)`),r.path.setAttribute("d",o)}this.limitIndex++>this.maxPoints&&this.resetLimit()}}class v{constructor(...e){this.children=[],this.isOpen=!0,this.childrenContainer=null,this.parent=null,this.domElement=document.createElement("div"),this.domElement.className="list-item-wrapper",this.itemRow=document.createElement("div"),this.itemRow.className="list-item-row",this.userData={},this.data=e,this.data.forEach(i=>{const n=document.createElement("div");n.className="list-item-cell",i instanceof HTMLElement?n.appendChild(i):n.append(String(i)),this.itemRow.appendChild(n)}),this.domElement.appendChild(this.itemRow),this.onItemClick=this.onItemClick.bind(this)}onItemClick(e){e.target.closest("button, a, input, label")||this.toggle()}add(e,i=this.children.length){return e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.splice(i,0,e),this.itemRow.classList.add("collapsible"),this.childrenContainer||(this.childrenContainer=document.createElement("div"),this.childrenContainer.className="list-children-container",this.childrenContainer.classList.toggle("closed",!this.isOpen),this.domElement.appendChild(this.childrenContainer),this.itemRow.addEventListener("click",this.onItemClick)),this.childrenContainer.insertBefore(e.domElement,this.childrenContainer.children[i]||null),this.updateToggler(),this}remove(e){const i=this.children.indexOf(e);return i!==-1&&(this.children.splice(i,1),this.childrenContainer.removeChild(e.domElement),e.parent=null,this.children.length===0&&(this.itemRow.classList.remove("collapsible"),this.itemRow.removeEventListener("click",this.onItemClick),this.childrenContainer.remove(),this.childrenContainer=null),this.updateToggler()),this}updateToggler(){const e=this.itemRow.querySelector(".list-item-cell:first-child");let i=this.itemRow.querySelector(".item-toggler");this.children.length>0?(i||(i=document.createElement("span"),i.className="item-toggler",e.prepend(i)),this.isOpen&&this.itemRow.classList.add("open")):i&&i.remove()}toggle(){return this.isOpen=!this.isOpen,this.itemRow.classList.toggle("open",this.isOpen),this.childrenContainer&&this.childrenContainer.classList.toggle("closed",!this.isOpen),this}close(){return this.isOpen&&this.toggle(),this}}function f(m=null){const e=document.createElement("span");return e.className="value",m!==null&&(e.id=m),e}function x(m,e){const i=m instanceof HTMLElement?m:document.getElementById(m);i&&i.textContent!==e&&(i.textContent=e)}function Ye(m){const e=m.lastIndexOf("/");if(e===-1)return{path:"",name:m.trim()};const i=m.substring(0,e).trim(),n=m.substring(e+1).trim();return{path:i,name:n}}function qe(m){return m.replace(/([a-z0-9])([A-Z])/g,"$1 $2").trim()}function M(m,e=2){if(m===0)return"0 Bytes";const i=1024,n=e<0?0:e,s=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"],r=Math.floor(Math.log(m)/Math.log(i));return parseFloat((m/Math.pow(i,r)).toFixed(n))+" "+s[r]}class Ze extends D{constructor(e={}){super("Performance",e);const i=new O("Name","CPU","GPU","Total");i.setGridStyle("minmax(200px, 2fr) 80px 80px 80px"),i.domElement.style.minWidth="600px";const n=document.createElement("div");n.className="list-scroll-wrapper",n.appendChild(i.domElement),this.content.appendChild(n);const s=document.createElement("div");s.className="graph-container";const r=new $;r.addLine("fps","var( --color-fps )"),s.append(r.domElement);const o=new v("Graph Stats",f(),f(),f("graph-fps-counter"));i.add(o);const a=new v(s);a.itemRow.childNodes[0].style.gridColumn="1 / -1",o.add(a);const l=new v("Frame Stats",f(),f(),f());i.add(l);const c=new v("Miscellaneous & Idle",f(),f(),f());c.domElement.firstChild.style.backgroundColor="#00ff0b1a",c.domElement.firstChild.classList.add("no-hover"),l.add(c),this.notInUse=new Map,this.frameStats=l,this.graphStats=o,this.graph=r,this.miscellaneous=c,this.currentRender=null,this.currentItem=null,this.frameItems=new Map}resolveStats(e,i){const n=e.getStatsData(i.cid);let s=n.item;if(s===void 0)s=new v(f(),f(),f(),f()),i.name?i.isComputeStats===!0&&(i.name=`${i.name} [ Compute ]`):i.name=`Unnamed ${i.cid}`,s.userData.name=i.name,this.currentItem.add(s),n.item=s;else{s.userData.name=i.name,this.notInUse.has(i.cid)&&(s.domElement.firstElementChild.classList.remove("alert"),this.notInUse.delete(i.cid));const a=i.parent.children.indexOf(i);(s.parent===null||s.parent.children.indexOf(s)!==a)&&this.currentItem.add(s,a)}let r=s.userData.name;i.isComputeStats&&(r+=" [ Compute ]"),x(s.data[0],r),x(s.data[1],n.cpu.toFixed(2)),x(s.data[2],i.gpuNotAvailable===!0?"-":n.gpu.toFixed(2)),x(s.data[3],n.total.toFixed(2));const o=this.currentItem;this.currentItem=s;for(const a of i.children)this.resolveStats(e,a);this.currentItem=o,this.frameItems.set(i.cid,s)}updateGraph(e){this.graph.addPoint("fps",e.fps),this.graph.update()}addNotInUse(e,i){i.domElement.firstElementChild.classList.add("alert"),this.notInUse.set(e,{item:i,time:performance.now()}),this.updateNotInUse(e)}updateNotInUse(e){const{item:i,time:n}=this.notInUse.get(e),s=performance.now(),o=5-Math.floor((s-n)/1e3);if(o>=0){const a="*".repeat(Math.max(0,o)),l=i.domElement.querySelector(".list-item-cell .value");x(l,i.userData.name+" (not in use) "+a)}else i.domElement.firstElementChild.classList.remove("alert"),i.parent.remove(i),this.notInUse.delete(e)}updateText(e,i){const n=new Map(this.frameItems);this.frameItems.clear(),this.currentItem=this.frameStats;for(const s of i.children)this.resolveStats(e,s);for(const[s,r]of n)this.frameItems.has(s)||(this.addNotInUse(s,r),n.delete(s));for(const s of this.notInUse.keys())this.updateNotInUse(s);x("graph-fps-counter",e.fps.toFixed()+" FPS"),x(this.frameStats.data[1],i.cpu.toFixed(2)),x(this.frameStats.data[2],i.gpu.toFixed(2)),x(this.frameStats.data[3],i.total.toFixed(2)),x(this.miscellaneous.data[1],i.miscellaneous.toFixed(2)),x(this.miscellaneous.data[2],"-"),x(this.miscellaneous.data[3],i.miscellaneous.toFixed(2)),this.currentItem=null}}class Qe extends D{constructor(e={}){super("Memory",e);const i=new O("Name","Count","Size");i.setGridStyle("minmax(200px, 2fr) 60px 100px"),i.domElement.style.minWidth="300px";const n=document.createElement("div");n.className="list-scroll-wrapper",n.appendChild(i.domElement),this.content.appendChild(n);const s=document.createElement("div");s.className="graph-container";const r=new $;r.addLine("total","var( --color-yellow )"),s.append(r.domElement);const o=new v("Graph Stats","","");i.add(o);const a=new v(s);a.itemRow.childNodes[0].style.gridColumn="1 / -1",o.add(a),this.memoryStats=new v("Renderer Info","",f()),this.memoryStats.domElement.firstChild.classList.add("no-hover"),i.add(this.memoryStats),this.attributes=new v("Attributes",f(),f()),this.memoryStats.add(this.attributes),this.geometries=new v("Geometries",f(),"N/A"),this.memoryStats.add(this.geometries),this.indexAttributes=new v("Index Attributes",f(),f()),this.memoryStats.add(this.indexAttributes),this.indirectStorageAttributes=new v("Indirect Storage Attributes",f(),f()),this.memoryStats.add(this.indirectStorageAttributes),this.programs=new v("Programs",f(),f()),this.memoryStats.add(this.programs),this.readbackBuffers=new v("Readback Buffers",f(),f()),this.memoryStats.add(this.readbackBuffers),this.renderTargets=new v("Render Targets",f(),"N/A"),this.memoryStats.add(this.renderTargets),this.storageAttributes=new v("Storage Attributes",f(),f()),this.memoryStats.add(this.storageAttributes),this.textures=new v("Textures",f(),f()),this.memoryStats.add(this.textures),this.graph=r}updateGraph(e){const i=e.getRenderer();if(!i)return;const n=i.info.memory;this.graph.addPoint("total",n.total),this.graph.limit===0&&(this.graph.limit=1),this.graph.update()}updateText(e){const i=e.getRenderer();if(!i)return;const n=i.info.memory;x(this.memoryStats.data[2],M(n.total)),x(this.attributes.data[1],n.attributes.toString()),x(this.attributes.data[2],M(n.attributesSize)),x(this.geometries.data[1],n.geometries.toString()),x(this.indexAttributes.data[1],n.indexAttributes.toString()),x(this.indexAttributes.data[2],M(n.indexAttributesSize)),x(this.indirectStorageAttributes.data[1],n.indirectStorageAttributes.toString()),x(this.indirectStorageAttributes.data[2],M(n.indirectStorageAttributesSize)),x(this.programs.data[1],n.programs.toString()),x(this.programs.data[2],M(n.programsSize)),x(this.readbackBuffers.data[1],n.readbackBuffers.toString()),x(this.readbackBuffers.data[2],M(n.readbackBuffersSize)),x(this.renderTargets.data[1],n.renderTargets.toString()),x(this.storageAttributes.data[1],n.storageAttributes.toString()),x(this.storageAttributes.data[2],M(n.storageAttributesSize)),x(this.textures.data[1],n.textures.toString()),x(this.textures.data[2],M(n.texturesSize))}}class Je extends D{constructor(e={}){super("Console",e),this.filters={info:!0,warn:!0,error:!0},this.filterText="",this.buildHeader(),this.logContainer=document.createElement("div"),this.logContainer.id="console-log",this.content.appendChild(this.logContainer)}buildHeader(){const e=document.createElement("div");e.className="console-header";const i=document.createElement("input");i.type="text",i.className="console-filter-input",i.placeholder="Filter...",i.addEventListener("input",r=>{this.filterText=r.target.value.toLowerCase(),this.applyFilters()});const n=document.createElement("button");n.className="console-copy-button",n.title="Copy all",n.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',n.addEventListener("click",()=>this.copyAll(n));const s=document.createElement("div");s.className="console-buttons-group",Object.keys(this.filters).forEach(r=>{const o=document.createElement("label");o.className="custom-checkbox",o.style.color=`var(--${r==="info"?"text-primary":"color-"+(r==="warn"?"yellow":"red")})`;const a=document.createElement("input");a.type="checkbox",a.checked=this.filters[r],a.dataset.type=r;const l=document.createElement("span");l.className="checkmark",o.appendChild(a),o.appendChild(l),o.append(r.charAt(0).toUpperCase()+r.slice(1)),s.appendChild(o)}),s.addEventListener("change",r=>{const o=r.target.dataset.type;o in this.filters&&(this.filters[o]=r.target.checked,this.applyFilters())}),s.appendChild(n),e.appendChild(i),e.appendChild(s),this.content.appendChild(e)}applyFilters(){this.logContainer.querySelectorAll(".log-message").forEach(i=>{const n=i.dataset.type,s=i.dataset.rawText.toLowerCase(),r=this.filters[n],o=s.includes(this.filterText);i.classList.toggle("hidden",!(r&&o))})}copyAll(e){const n=this.logContainer.ownerDocument.defaultView.getSelection(),s=n.toString(),r=s&&this.logContainer.contains(n.anchorNode);let o;if(r)o=s;else{const a=this.logContainer.querySelectorAll(".log-message:not(.hidden)");o=Array.from(a).map(l=>l.dataset.rawText).join(`
`)}navigator.clipboard.writeText(o),e.classList.add("copied"),setTimeout(()=>e.classList.remove("copied"),350)}_getIcon(e,i){let n;return i==="tip"?n="💭":i==="tsl"?n="✨":i==="webgpurenderer"?n="🎨":e==="warn"?n="⚠️":e==="error"?n="🔴":e==="info"&&(n="ℹ️"),n}_formatMessage(e,i){const n=document.createDocumentFragment(),s=i.match(/^([\w\.]+:\s)/);let r=i;if(s){const a=s[0],l=a.slice(0,-2).split("."),c=(l.length>1?l[l.length-1]:l[0])+":",d=this._getIcon(e,c.split(":")[0].toLowerCase());n.appendChild(document.createTextNode(d+" "));const p=document.createElement("span");p.className="log-prefix",p.textContent=c,n.appendChild(p),r=i.substring(a.length)}const o=r.split(/(".*?"|'.*?'|`.*?`)/g).map(a=>a.trim()).filter(Boolean);return o.forEach((a,l)=>{if(/^("|'|`)/.test(a)){const c=document.createElement("span");c.className="log-code",c.textContent=a.slice(1,-1),n.appendChild(c)}else l>0&&(a=" "+a),l<o.length-1&&(a+=" "),n.appendChild(document.createTextNode(a))}),n}addMessage(e,i){const n=document.createElement("div");n.className=`log-message ${e}`,n.dataset.type=e,n.dataset.rawText=i,n.appendChild(this._formatMessage(e,i));const s=this.filters[e],r=i.toLowerCase().includes(this.filterText);n.classList.toggle("hidden",!(s&&r)),this.logContainer.appendChild(n),this.logContainer.scrollTop=this.logContainer.scrollHeight,this.logContainer.children.length>200&&this.logContainer.removeChild(this.logContainer.firstChild)}}class z extends G{constructor(){super(),this.domElement=document.createElement("div"),this.domElement.className="param-control",this._onChangeFunction=null,this.addEventListener("change",e=>{requestAnimationFrame(()=>{this._onChangeFunction&&this._onChangeFunction(e.value)})})}setValue(){return this.dispatchChange(),this}getValue(){return null}dispatchChange(){this.dispatchEvent({type:"change",value:this.getValue()})}onChange(e){return this._onChangeFunction=e,this}}class ie extends z{constructor({value:e=0,step:i=.1,min:n=-1/0,max:s=1/0}){super(),this.input=document.createElement("input"),this.input.type="number",this.input.value=e,this.input.step=i,this.input.min=n,this.input.max=s,this.input.addEventListener("change",this._onChangeValue.bind(this)),this.domElement.appendChild(this.input),this.addDragHandler()}_onChangeValue(){const e=parseFloat(this.input.value),i=parseFloat(this.input.min),n=parseFloat(this.input.max);e>n?this.input.value=n:e<i?this.input.value=i:isNaN(e)&&(this.input.value=i),this.dispatchChange()}addDragHandler(){let e=!1,i,n;this.input.addEventListener("mousedown",s=>{e=!0,i=s.clientY,n=parseFloat(this.input.value),document.body.style.cursor="ns-resize"}),document.addEventListener("mousemove",s=>{if(e){const r=i-s.clientY,o=parseFloat(this.input.step)||1,a=parseFloat(this.input.min),l=parseFloat(this.input.max);let c=o;!isNaN(l)&&isFinite(a)&&(c=(l-a)/100);const d=r*c;let p=n+d;p=Math.max(a,Math.min(p,l));const h=(String(o).split(".")[1]||[]).length;this.input.value=p.toFixed(h),this.input.dispatchEvent(new Event("input")),this.dispatchChange()}}),document.addEventListener("mouseup",()=>{e&&(e=!1,document.body.style.cursor="default")})}setValue(e){return this.input.value=e,super.setValue(e)}getValue(){return parseFloat(this.input.value)}}class Ke extends z{constructor({value:e=!1}){super();const i=document.createElement("label");i.className="custom-checkbox";const n=document.createElement("input");n.type="checkbox",n.checked=e,this.checkbox=n;const s=document.createElement("span");s.className="checkmark",i.appendChild(n),i.appendChild(s),this.domElement.appendChild(i),n.addEventListener("change",()=>{this.dispatchChange()})}setValue(e){return this.checkbox.checked=e,super.setValue(e)}getValue(){return this.checkbox.checked}}class et extends z{constructor({value:e=0,min:i=0,max:n=1,step:s=.01}){super(),this.slider=document.createElement("input"),this.slider.type="range",this.slider.min=i,this.slider.max=n,this.slider.step=s;const r=new ie({value:e,min:i,max:n,step:s});this.numberInput=r.input,this.numberInput.style.flexBasis="80px",this.numberInput.style.flexShrink="0",this.slider.value=e,this.domElement.append(this.slider,this.numberInput),this.slider.addEventListener("input",()=>{this.numberInput.value=this.slider.value,this.dispatchChange()}),r.addEventListener("change",()=>{this.slider.value=parseFloat(this.numberInput.value),this.dispatchChange()})}setValue(e){return this.slider.value=e,this.numberInput.value=e,super.setValue(e)}getValue(){return parseFloat(this.slider.value)}step(e){return this.slider.step=e,this.numberInput.step=e,this}}class tt extends z{constructor({options:e=[],value:i=""}){super();const n=document.createElement("select"),s=(r,o)=>{const a=document.createElement("option");return a.value=r,a.textContent=r,o==i&&(a.selected=!0),n.appendChild(a),a};Array.isArray(e)?e.forEach(r=>s(r,r)):Object.entries(e).forEach(([r,o])=>s(r,o)),this.domElement.appendChild(n),n.addEventListener("change",()=>{this.dispatchChange()}),this.options=e,this.select=n}getValue(){const e=this.options;return Array.isArray(e)?e[this.select.selectedIndex]:e[this.select.value]}}class it extends z{constructor({value:e="#ffffff"}){super();const i=document.createElement("input");i.type="color",i.value=this._getColorHex(e),this.colorInput=i,this._value=e,i.addEventListener("input",()=>{const n=i.value;this._value.isColor?this._value.setHex(parseInt(n.slice(1),16)):this._value=n,this.dispatchChange()}),this.domElement.appendChild(i)}_getColorHex(e){return e.isColor&&(e=e.getHex()),typeof e=="number"?e=`#${e.toString(16)}`:e[0]!=="#"&&(e="#"+e),e}getValue(){let e=this._value;return typeof e=="string"&&(e=parseInt(e.slice(1),16)),e}}class nt extends z{constructor({text:e="Button",value:i=()=>{}}){super();const n=document.createElement("button");n.textContent=e,n.onclick=i,this.domElement.appendChild(n)}}class st extends z{constructor({value:e=""}){super();const i=document.createElement("input");i.type="text",i.value=e,this.input=i,i.addEventListener("input",()=>{this.dispatchChange()}),this.domElement.appendChild(i)}setValue(e){return this.input.value=e,super.setValue(e)}getValue(){return this.input.value}}class X{constructor(e,i){this.parameters=e,this.name=i,this.paramList=new v(i),this.objects=[]}close(){return this.paramList.close(),this}add(e,i,...n){const r=typeof e[i];let o=null;return typeof n[0]=="object"?o=this.addSelect(e,i,n[0]):r==="number"?n.length>=2?o=this.addSlider(e,i,...n):o=this.addNumber(e,i,...n):r==="boolean"?o=this.addBoolean(e,i):r==="string"?o=this.addString(e,i):r==="function"&&(o=this.addButton(e,i,...n)),o}_addParameter(e,i,n,s){n.name=r=>(s.data[0].textContent=r,n),n.listen=()=>{const r=()=>{const o=n.getValue(),a=e[i];o!==a&&n.setValue(a),requestAnimationFrame(r)};return requestAnimationFrame(r),n},this._registerParameter(e,i,n,s)}_registerParameter(e,i,n,s){this.objects.push({object:e,key:i,editor:n,subItem:s})}addString(e,i){const n=e[i],s=new st({value:n});s.addEventListener("change",({value:l})=>{e[i]=l});const r=f();r.textContent=i;const o=new v(r,s.domElement);return this.paramList.add(o),o.domElement.firstChild.classList.add("actionable"),this._addParameter(e,i,s,o),s}addFolder(e){const i=new X(this.parameters,e);return this.paramList.add(i.paramList),i}addBoolean(e,i){const n=e[i],s=new Ke({value:n});s.addEventListener("change",({value:l})=>{e[i]=l});const r=f();r.textContent=i;const o=new v(r,s.domElement);this.paramList.add(o);const a=o.domElement.firstChild;return a.classList.add("actionable"),a.addEventListener("click",l=>{if(l.target.closest("label"))return;const c=a.querySelector('input[type="checkbox"]');c&&(c.checked=!c.checked,c.dispatchEvent(new Event("change")))}),this._addParameter(e,i,s,o),s}addSelect(e,i,n){const s=e[i],r=new tt({options:n,value:s});r.addEventListener("change",({value:c})=>{e[i]=c});const o=f();o.textContent=i;const a=new v(o,r.domElement);return this.paramList.add(a),a.domElement.firstChild.classList.add("actionable"),this._addParameter(e,i,r,a),r}addColor(e,i){const n=e[i],s=new it({value:n});s.addEventListener("change",({value:l})=>{e[i]=l});const r=f();r.textContent=i;const o=new v(r,s.domElement);return this.paramList.add(o),o.domElement.firstChild.classList.add("actionable"),this._addParameter(e,i,s,o),s}addSlider(e,i,n=0,s=1,r=.01){const o=e[i],a=new et({value:o,min:n,max:s,step:r});a.addEventListener("change",({value:p})=>{e[i]=p});const l=f();l.textContent=i;const c=new v(l,a.domElement);return this.paramList.add(c),c.domElement.firstChild.classList.add("actionable"),this._addParameter(e,i,a,c),a}addNumber(e,i,...n){const s=e[i],[r,o]=n,a=new ie({value:s,min:r,max:o});a.addEventListener("change",({value:p})=>{e[i]=p});const l=f();l.textContent=i;const c=new v(l,a.domElement);return this.paramList.add(c),c.domElement.firstChild.classList.add("actionable"),this._addParameter(e,i,a,c),a}addButton(e,i){const n=e[i],s=new nt({text:i,value:n});s.addEventListener("change",({value:a})=>{e[i]=a});const r=new v(s.domElement);return r.itemRow.childNodes[0].style.gridColumn="1 / -1",this.paramList.add(r),r.domElement.firstChild.classList.add("actionable"),s.name=a=>(s.domElement.childNodes[0].textContent=a,s),this._registerParameter(e,i,s,r),s}}class ne extends D{constructor(e={}){super(e.name||"Parameters",e);const i=new O("Property","Value");i.domElement.classList.add("parameters"),i.setGridStyle(".5fr 1fr"),i.domElement.style.minWidth="300px";const n=document.createElement("div");n.className="list-scroll-wrapper",n.appendChild(i.domElement),this.content.appendChild(n),this.paramList=i,this.groups=[]}createGroup(e){const i=new X(this,e);return this.paramList.add(i.paramList),this.groups.push(i),i}}const Z="../extensions/extensions.json",Q=j.prototype.init;function se(m){m?j.prototype.init=async function(){if(this.backend.isWebGLBackend!==!0){const e=this.backend.parameters;this.backend=new de(e)}return Q.call(this)}:j.prototype.init=Q}let E=null;function re(){if(E!==null)return E;const m=A("settings");return E={forceWebGL:m.forceWebGL!==void 0?m.forceWebGL:!1,captureStackTrace:m.captureStackTrace!==void 0?m.captureStackTrace:!1,activeExtensions:m.activeExtensions!==void 0?m.activeExtensions:{}},E.forceWebGL&&se(!0),E.captureStackTrace&&(ee.captureStackTrace=!0),E}function U(){P("settings",{forceWebGL:E.forceWebGL,captureStackTrace:E.captureStackTrace,activeExtensions:E.activeExtensions})}re();class rt extends ne{constructor(){super({name:"Settings"}),this.extensions={};const e=re(),i=this.createGroup("Renderer");i.add(e,"forceWebGL").name("Force WebGL").onChange(n=>{se(n),U(),location.reload()}),i.add(e,"captureStackTrace").name("Capture Stack Trace").onChange(n=>{ee.captureStackTrace=n,U(),location.reload()})}init(){const e=this.createGroup("Extensions");this._getExtensions().then(i=>{for(const n of i)n.active=!1,n.loaded=!1,n.tab=null,this.extensions[n.name]=n,n.ui=e.add({[n.name]:!1},n.name).onChange(async s=>{this.setActiveExtension(n.name,s),s?E.activeExtensions[n.name]={name:n.name,url:n.url}:delete E.activeExtensions[n.name],this._updateExtensionUI(n),U()}),E.activeExtensions[n.name]!==void 0&&n.ui.setValue(!0)})}async setActiveExtension(e,i){const n=this.extensions[e],s=this.inspector;n&&(i?await this._loadExtension(s,n):await this._unloadExtension(s,n))}_updateExtensionUI(e){e.active&&E.activeExtensions[e.name]===void 0?(e.ui.checkbox.checked=!0,e.ui.domElement.style.setProperty("--accent-color","var(--color-green)")):e.ui.domElement.style.removeProperty("--accent-color")}async _unloadExtension(e,i){i.active!==!1&&(e.removeTab(i.tab),i.active=!1,i.loaded=!1,i.tab=null,this._updateExtensionUI(i),this.dispatchEvent({type:"extensionremoved",name:i.name}))}async _loadExtension(e,i){if(i.active===!0)return;i.active=!0;const n=new URL(i.url,new URL(Z,import.meta.url)).href,s=await ge(()=>import(n),[],import.meta.url),r=Object.keys(s),o=s[r[0]],a=new o;e.addTab(a),i.loaded=!0,i.tab=a,this._updateExtensionUI(i),this.dispatchEvent({type:"extensionadded",name:i.name,tab:a})}async _getExtensions(){const e=new URL(Z,import.meta.url);return await fetch(e).then(n=>n.json())}}/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */t.BRDF_GGX;t.BRDF_Lambert;t.BasicPointShadowFilter;t.BasicShadowFilter;t.Break;t.Const;t.Continue;t.DFGLUT;t.D_GGX;t.Discard;t.EPSILON;t.F_Schlick;const ot=t.Fn;t.INFINITY;t.If;t.Loop;t.NodeAccess;t.NodeShaderStage;t.NodeType;t.NodeUpdateType;t.PCFShadowFilter;t.PCFSoftShadowFilter;t.PI;t.PI2;t.TWO_PI;t.HALF_PI;t.PointShadowFilter;t.Return;t.Schlick_to_F0;t.ShaderNode;t.Stack;t.Switch;t.TBNViewMatrix;t.VSMShadowFilter;t.V_GGX_SmithCorrelated;t.Var;t.VarIntent;t.abs;t.acesFilmicToneMapping;t.acos;t.acosh;t.add;t.addMethodChaining;t.addNodeElement;t.agxToneMapping;t.all;t.alphaT;t.and;t.anisotropy;t.anisotropyB;t.anisotropyT;t.any;t.append;t.array;t.arrayBuffer;t.asin;t.asinh;t.assign;t.atan;t.atanh;t.atomicAdd;t.atomicAnd;t.atomicFunc;t.atomicLoad;t.atomicMax;t.atomicMin;t.atomicOr;t.atomicStore;t.atomicSub;t.atomicXor;t.attenuationColor;t.attenuationDistance;t.attribute;t.attributeArray;t.backgroundBlurriness;t.backgroundIntensity;t.backgroundRotation;t.batch;t.bentNormalView;t.billboarding;t.bitAnd;t.bitNot;t.bitOr;t.bitXor;t.bitangentGeometry;t.bitangentLocal;t.bitangentView;t.bitangentWorld;t.bitcast;t.blendBurn;t.blendColor;t.blendDodge;t.blendOverlay;t.blendScreen;t.blur;t.bool;t.buffer;t.bufferAttribute;t.bumpMap;t.builtin;t.builtinAOContext;t.builtinShadowContext;t.bvec2;t.bvec3;t.bvec4;t.bypass;t.cache;t.call;t.cameraFar;t.cameraIndex;t.cameraNear;t.cameraNormalMatrix;t.cameraPosition;t.cameraProjectionMatrix;t.cameraProjectionMatrixInverse;t.cameraViewMatrix;t.cameraViewport;t.cameraWorldMatrix;t.cbrt;t.cdl;t.ceil;t.checker;t.cineonToneMapping;t.clamp;t.clearcoat;t.clearcoatNormalView;t.clearcoatRoughness;t.clipSpace;t.code;t.color;t.colorSpaceToWorking;t.colorToDirection;t.compute;t.computeKernel;t.computeSkinning;t.context;t.convert;t.convertColorSpace;t.convertToTexture;t.countLeadingZeros;t.countOneBits;t.countTrailingZeros;t.cos;t.cosh;t.cross;t.cubeTexture;t.cubeTextureBase;t.dFdx;t.dFdy;t.dashSize;t.debug;t.decrement;t.decrementBefore;t.defaultBuildStages;t.defaultShaderStages;t.defined;t.degrees;t.deltaTime;t.densityFog;t.densityFogFactor;t.depth;t.depthPass;t.determinant;t.difference;t.diffuseColor;t.directPointLight;t.directionToColor;t.directionToFaceDirection;t.dispersion;t.distance;t.div;t.dot;t.drawIndex;t.dynamicBufferAttribute;t.element;t.emissive;t.equal;t.equirectUV;t.exp;t.exp2;t.exponentialHeightFogFactor;t.expression;t.faceDirection;t.faceForward;t.faceforward;t.float;t.floatBitsToInt;t.floatBitsToUint;t.floor;t.fog;t.fract;t.frameGroup;t.frameId;t.frontFacing;t.fwidth;t.gain;t.gapSize;t.getConstNodeType;t.getCurrentStack;t.getDirection;t.getDistanceAttenuation;t.getGeometryRoughness;t.getNormalFromDepth;t.interleavedGradientNoise;t.vogelDiskSample;t.getParallaxCorrectNormal;t.getRoughness;t.getScreenPosition;t.getShIrradianceAt;t.getShadowMaterial;t.getShadowRenderObjectFunction;t.getTextureIndex;t.getViewPosition;t.globalId;t.glsl;t.glslFn;t.grayscale;t.greaterThan;t.greaterThanEqual;t.hash;t.highpModelNormalViewMatrix;t.highpModelViewMatrix;t.hue;t.increment;t.incrementBefore;t.instance;t.instanceIndex;t.instancedArray;t.instancedBufferAttribute;t.instancedDynamicBufferAttribute;t.instancedMesh;t.int;t.intBitsToFloat;t.inverse;t.inverseSqrt;t.inversesqrt;t.invocationLocalIndex;t.invocationSubgroupIndex;t.ior;t.iridescence;t.iridescenceIOR;t.iridescenceThickness;t.ivec2;t.ivec3;t.ivec4;t.js;t.label;t.length;t.lengthSq;t.lessThan;t.lessThanEqual;t.lightPosition;t.lightProjectionUV;t.lightShadowMatrix;t.lightTargetDirection;t.lightTargetPosition;t.lightViewPosition;t.lightingContext;t.lights;t.linearDepth;t.linearToneMapping;t.localId;t.log;t.log2;t.logarithmicDepthToViewZ;t.luminance;t.mat2;t.mat3;t.mat4;t.matcapUV;t.materialAO;t.materialAlphaTest;t.materialAnisotropy;t.materialAnisotropyVector;t.materialAttenuationColor;t.materialAttenuationDistance;t.materialClearcoat;t.materialClearcoatNormal;t.materialClearcoatRoughness;t.materialColor;t.materialDispersion;t.materialEmissive;t.materialEnvIntensity;t.materialEnvRotation;t.materialIOR;t.materialIridescence;t.materialIridescenceIOR;t.materialIridescenceThickness;t.materialLightMap;t.materialLineDashOffset;t.materialLineDashSize;t.materialLineGapSize;t.materialLineScale;t.materialLineWidth;t.materialMetalness;t.materialNormal;t.materialOpacity;t.materialPointSize;t.materialReference;t.materialReflectivity;t.materialRefractionRatio;t.materialRotation;t.materialRoughness;t.materialSheen;t.materialSheenRoughness;t.materialShininess;t.materialSpecular;t.materialSpecularColor;t.materialSpecularIntensity;t.materialSpecularStrength;t.materialThickness;t.materialTransmission;t.max;t.maxMipLevel;t.mediumpModelViewMatrix;t.metalness;t.min;t.mix;t.mixElement;t.mod;t.modInt;t.modelDirection;t.modelNormalMatrix;t.modelPosition;t.modelRadius;t.modelScale;t.modelViewMatrix;t.modelViewPosition;t.modelViewProjection;t.modelWorldMatrix;t.modelWorldMatrixInverse;t.morphReference;t.mrt;t.mul;t.mx_aastep;t.mx_add;t.mx_atan2;t.mx_cell_noise_float;t.mx_contrast;t.mx_divide;t.mx_fractal_noise_float;t.mx_fractal_noise_vec2;t.mx_fractal_noise_vec3;t.mx_fractal_noise_vec4;t.mx_frame;t.mx_heighttonormal;t.mx_hsvtorgb;t.mx_ifequal;t.mx_ifgreater;t.mx_ifgreatereq;t.mx_invert;t.mx_modulo;t.mx_multiply;t.mx_noise_float;t.mx_noise_vec3;t.mx_noise_vec4;t.mx_place2d;t.mx_power;t.mx_ramp4;t.mx_ramplr;t.mx_ramptb;t.mx_rgbtohsv;t.mx_rotate2d;t.mx_rotate3d;t.mx_safepower;t.mx_separate;t.mx_splitlr;t.mx_splittb;t.mx_srgb_texture_to_lin_rec709;t.mx_subtract;t.mx_timer;t.mx_transform_uv;t.mx_unifiednoise2d;t.mx_unifiednoise3d;t.mx_worley_noise_float;t.mx_worley_noise_vec2;t.mx_worley_noise_vec3;t.negate;t.neutralToneMapping;t.nodeArray;t.nodeImmutable;t.nodeObject;t.nodeObjectIntent;t.nodeObjects;t.nodeProxy;t.nodeProxyIntent;t.normalFlat;t.normalGeometry;t.normalLocal;t.normalMap;t.normalView;t.normalViewGeometry;t.normalWorld;t.normalWorldGeometry;t.normalize;t.not;t.notEqual;t.numWorkgroups;t.objectDirection;t.objectGroup;t.objectPosition;t.objectRadius;t.objectScale;t.objectViewPosition;t.objectWorldMatrix;t.OnBeforeObjectUpdate;t.OnBeforeMaterialUpdate;t.OnObjectUpdate;const at=t.OnMaterialUpdate;t.oneMinus;t.or;t.orthographicDepthToViewZ;t.oscSawtooth;t.oscSine;t.oscSquare;t.oscTriangle;t.output;t.outputStruct;t.overloadingFn;t.packHalf2x16;t.packSnorm2x16;t.packUnorm2x16;t.parabola;t.parallaxDirection;t.parallaxUV;t.parameter;t.pass;t.passTexture;t.pcurve;t.perspectiveDepthToViewZ;t.pmremTexture;t.pointShadow;t.pointUV;t.pointWidth;t.positionGeometry;t.positionLocal;t.positionPrevious;t.positionView;t.positionViewDirection;t.positionWorld;t.positionWorldDirection;t.posterize;t.pow;t.pow2;t.pow3;t.pow4;t.premultiplyAlpha;t.property;t.radians;t.rand;t.range;t.rangeFog;t.rangeFogFactor;t.reciprocal;t.reference;t.referenceBuffer;t.reflect;t.reflectVector;t.reflectView;t.reflector;t.refract;t.refractVector;t.refractView;t.reinhardToneMapping;t.remap;t.remapClamp;t.renderGroup;const lt=t.renderOutput;t.rendererReference;t.replaceDefaultUV;t.rotate;t.rotateUV;t.roughness;t.round;t.rtt;t.sRGBTransferEOTF;t.sRGBTransferOETF;t.sample;t.sampler;t.samplerComparison;t.saturate;t.saturation;t.screen;t.screenCoordinate;t.screenDPR;t.screenSize;const ct=t.screenUV;t.select;t.setCurrentStack;t.setName;t.shaderStages;t.shadow;t.shadowPositionWorld;t.shapeCircle;t.sharedUniformGroup;t.sheen;t.sheenRoughness;t.shiftLeft;t.shiftRight;t.shininess;t.sign;t.sin;t.sinh;t.sinc;t.skinning;t.smoothstep;t.smoothstepElement;t.specularColor;t.specularF90;t.spherizeUV;t.split;t.spritesheetUV;t.sqrt;t.stack;const H=t.step;t.stepElement;t.storage;t.storageBarrier;t.storageTexture;t.string;t.struct;t.sub;t.subgroupAdd;t.subgroupAll;t.subgroupAnd;t.subgroupAny;t.subgroupBallot;t.subgroupBroadcast;t.subgroupBroadcastFirst;t.subBuild;t.subgroupElect;t.subgroupExclusiveAdd;t.subgroupExclusiveMul;t.subgroupInclusiveAdd;t.subgroupInclusiveMul;t.subgroupIndex;t.subgroupMax;t.subgroupMin;t.subgroupMul;t.subgroupOr;t.subgroupShuffle;t.subgroupShuffleDown;t.subgroupShuffleUp;t.subgroupShuffleXor;t.subgroupSize;t.subgroupXor;t.tan;t.tanh;t.tangentGeometry;t.tangentLocal;t.tangentView;t.tangentWorld;t.texture;t.texture3D;t.textureBarrier;t.textureBicubic;t.textureBicubicLevel;t.textureCubeUV;t.textureLoad;t.textureSize;t.textureLevel;t.textureStore;t.thickness;t.time;t.toneMapping;t.toneMappingExposure;t.toonOutlinePass;t.transformDirection;t.transformNormal;t.transformNormalToView;t.transformedClearcoatNormalView;t.transformedNormalView;t.transformedNormalWorld;t.transmission;t.transpose;t.triNoise3D;t.triplanarTexture;t.triplanarTextures;t.trunc;t.uint;t.uintBitsToFloat;const dt=t.uniform;t.uniformArray;t.uniformCubeTexture;t.uniformGroup;t.uniformFlow;t.uniformTexture;t.unpackHalf2x16;t.unpackSnorm2x16;t.unpackUnorm2x16;t.unpremultiplyAlpha;t.userData;t.uv;t.uvec2;t.uvec3;t.uvec4;t.varying;t.varyingProperty;const ht=t.vec2,oe=t.vec3,pt=t.vec4;t.vectorComponents;t.velocity;t.vertexColor;t.vertexIndex;t.vertexStage;t.vibrance;t.viewZToLogarithmicDepth;t.viewZToOrthographicDepth;t.viewZToPerspectiveDepth;t.viewZToReversedOrthographicDepth;t.viewZToReversedPerspectiveDepth;t.viewport;t.viewportCoordinate;t.viewportDepthTexture;t.viewportLinearDepth;t.viewportMipTexture;t.viewportOpaqueMipTexture;t.viewportResolution;t.viewportSafeUV;t.viewportSharedTexture;t.viewportSize;t.viewportTexture;t.viewportUV;t.wgsl;t.wgslFn;t.workgroupArray;t.workgroupBarrier;t.workgroupId;t.workingToColorSpace;t.xor;const mt=ot(([m,e])=>{const i=dt(0);at(()=>{const{width:a,height:l}=e.value;i.value=a/l});const n=m.sub(.5),r=ht(n.x.div(i),n.y).add(.5),o=H(0,r.x).mul(H(r.x,1)).mul(H(0,r.y)).mul(H(r.y,1));return oe(r,o)});class ut extends D{constructor(e={}){super("Viewer",e);const i=new O("Viewer","Name");i.setGridStyle("150px minmax(200px, 2fr)"),i.domElement.style.minWidth="400px";const n=document.createElement("div");n.className="list-scroll-wrapper",n.appendChild(i.domElement),this.content.appendChild(n);const s=new v("Nodes");i.add(s),this.itemLibrary=new Map,this.folderLibrary=new Map,this.canvasNodes=new Map,this.currentDataList=[],this.nodeList=i,this.nodes=s}getFolder(e){let i=this.folderLibrary.get(e);return i===void 0&&(i=new v(e),this.folderLibrary.set(e,i),this.nodeList.add(i)),i}addNodeItem(e){let i=this.itemLibrary.get(e.id);if(i===void 0){const n=e.name,s=e.canvasTarget.domElement;i=new v(s,n),i.itemRow.children[1].style["justify-content"]="flex-start",this.itemLibrary.set(e.id,i)}return i}getCanvasDataByNode(e,i){let n=this.canvasNodes.get(i);if(n===void 0){const s=document.createElement("canvas"),r=new he(s);r.setPixelRatio(window.devicePixelRatio),r.setSize(140,140);const o=i.id,{path:a,name:l}=Ye(qe(i.getName()||"(unnamed)")),c=i.context({getUV:u=>{const g=mt(ct,u),b=g.xy,C=g.z;return b.mul(C)}});let d=pt(oe(c),1);d=lt(d,q,e.outputColorSpace),d=d.context({inspector:!0});const p=new pe;p.outputNode=d;const h=new me(p);h.name="Viewer - "+l,n={id:o,name:l,path:a,node:i,quad:h,canvasTarget:r,material:p},this.canvasNodes.set(i,n)}return n}update(e){const i=e.getRenderer(),n=e.getNodes();if(n.length>0){if(!i.backend.isWebGPUBackend){e.resolveConsoleOnce("warn","Inspector: Viewer is only available with WebGPU.");return}this.isVisible||this.show()}if(!this.isActive)return;const s=n.map(a=>this.getCanvasDataByNode(i,a)),r=[...this.currentDataList];for(const a of r)if(this.itemLibrary.has(a.id)&&s.indexOf(a)===-1){const l=this.itemLibrary.get(a.id),c=l.parent;c.remove(l),this.folderLibrary.has(c.data[0])&&c.children.length===0&&(c.parent.remove(c),this.folderLibrary.delete(c.data[0])),this.itemLibrary.delete(a.id)}const o={};for(const a of s){const l=this.addNodeItem(a),c=i.getCanvasTarget(),d=a.path;if(d){const h=this.getFolder(d);o[d]===void 0&&(o[d]=0),(h.parent===null||l.parent!==h||h.children.indexOf(l)!==o[d])&&h.add(l),o[d]++}else l.parent||this.nodes.add(l);this.currentDataList=s;const p=Y.resetRendererState(i);i.toneMapping=q,i.outputColorSpace=fe,i.setCanvasTarget(a.canvasTarget),a.quad.render(i),i.setCanvasTarget(c),Y.restoreRendererState(i,p)}}}const J=500,K=60;class gt extends D{constructor(e={}){super("Timeline",e),this.isRecording=!1,this.frames=[],this.baseTriangles=0,this.currentFrame=null,this.isHierarchicalView=!0,this.callBlocks=new WeakMap,this.fallbackBlocks=[],this.originalBackend=null,this.originalMethods=new Map,this.renderer=null,this.graph=new $(J),this.graph.addLine("fps","var( --color-fps )"),this.graph.addLine("calls","var( --color-call )"),this.graph.addLine("triangles","var( --color-red )");const i=document.createElement("div");i.className="list-scroll-wrapper",this.scrollWrapper=i,this.content.appendChild(i),this.buildHeader(),this.buildUI(),window.addEventListener("resize",()=>{!this.isRecording&&this.frames.length>0&&this.renderSlider()})}buildHeader(){const e=document.createElement("div");e.className="console-header",this.recordButton=document.createElement("button"),this.recordButton.className="console-copy-button",this.recordButton.title="Record",this.recordButton.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4" fill="currentColor"></circle></svg>',this.recordButton.style.padding="0 10px",this.recordButton.style.lineHeight="24px",this.recordButton.style.display="flex",this.recordButton.style.alignItems="center",this.recordButton.addEventListener("click",()=>this.toggleRecording());const i=document.createElement("button");i.className="console-copy-button",i.title="Clear",i.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',i.style.padding="0 10px",i.style.lineHeight="24px",i.style.display="flex",i.style.alignItems="center",i.addEventListener("click",()=>this.clear()),this.viewModeButton=document.createElement("button"),this.viewModeButton.className="console-copy-button",this.viewModeButton.title="Toggle View Mode",this.viewModeButton.textContent="Mode: Hierarchy",this.viewModeButton.style.padding="0 10px",this.viewModeButton.style.lineHeight="24px",this.viewModeButton.addEventListener("click",()=>{this.isHierarchicalView=!this.isHierarchicalView,this.viewModeButton.textContent=this.isHierarchicalView?"Mode: Hierarchy":"Mode: Counts",this.selectedFrameIndex!==void 0&&this.selectedFrameIndex!==-1&&this.selectFrame(this.selectedFrameIndex)}),this.recordRefreshButton=document.createElement("button"),this.recordRefreshButton.className="console-copy-button",this.recordRefreshButton.title="Refresh & Record",this.recordRefreshButton.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><circle cx="12" cy="12" r="3" fill="currentColor"></circle></svg>',this.recordRefreshButton.style.padding="0 10px",this.recordRefreshButton.style.lineHeight="24px",this.recordRefreshButton.style.display="flex",this.recordRefreshButton.style.alignItems="center",this.recordRefreshButton.addEventListener("click",()=>{const r=A("timeline");r.recording=!0,P("timeline",r),window.location.reload()}),this.exportButton=document.createElement("button"),this.exportButton.className="console-copy-button",this.exportButton.title="Export",this.exportButton.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',this.exportButton.style.padding="0 10px",this.exportButton.style.lineHeight="24px",this.exportButton.style.display="flex",this.exportButton.style.alignItems="center",this.exportButton.addEventListener("click",()=>this.exportData());const n=document.createElement("div");n.className="console-buttons-group",n.appendChild(this.viewModeButton),n.appendChild(this.recordButton),n.appendChild(this.recordRefreshButton),n.appendChild(this.exportButton),n.appendChild(i),e.style.display="flex",e.style.justifyContent="space-between",e.style.padding="6px",e.style.borderBottom="1px solid var(--border-color)";const s=document.createElement("div");s.textContent="Backend Calls",s.style.display="flex",s.style.alignItems="center",s.style.color="var(--text-primary)",s.style.alignSelf="center",s.style.paddingLeft="5px",this.frameInfo=document.createElement("span"),this.frameInfo.style.display="inline-flex",this.frameInfo.style.alignItems="center",this.frameInfo.style.marginLeft="15px",this.frameInfo.style.fontFamily="monospace",this.frameInfo.style.color="var(--text-secondary)",this.frameInfo.style.fontSize="12px",s.appendChild(this.frameInfo),e.appendChild(s),e.appendChild(n),this.scrollWrapper.appendChild(e)}buildUI(){const e=document.createElement("div");e.style.display="flex",e.style.flexDirection="column",e.style.height="calc(100% - 37px)",e.style.width="100%";const i=document.createElement("div");i.style.height="60px",i.style.minHeight="60px",i.style.borderBottom="1px solid var(--border-color)",i.style.backgroundColor="var(--background-color)",this.graphSlider=document.createElement("div"),this.graphSlider.style.height="100%",this.graphSlider.style.margin="0 10px",this.graphSlider.style.position="relative",this.graphSlider.style.cursor="crosshair",i.appendChild(this.graphSlider),this.graph.domElement.style.width="100%",this.graph.domElement.style.height="100%",this.graphSlider.appendChild(this.graph.domElement),this.hoverIndicator=document.createElement("div"),this.hoverIndicator.style.position="absolute",this.hoverIndicator.style.top="0",this.hoverIndicator.style.bottom="0",this.hoverIndicator.style.width="1px",this.hoverIndicator.style.backgroundColor="rgba(255, 255, 255, 0.3)",this.hoverIndicator.style.pointerEvents="none",this.hoverIndicator.style.display="none",this.hoverIndicator.style.zIndex="9",this.hoverIndicator.style.transform="translateX(-50%)",this.graphSlider.appendChild(this.hoverIndicator),this.playhead=document.createElement("div"),this.playhead.style.position="absolute",this.playhead.style.top="0",this.playhead.style.bottom="0",this.playhead.style.width="2px",this.playhead.style.backgroundColor="var(--color-red)",this.playhead.style.boxShadow="0 0 4px rgba(255,0,0,0.5)",this.playhead.style.pointerEvents="none",this.playhead.style.display="none",this.playhead.style.zIndex="10",this.playhead.style.transform="translateX(-50%)",this.graphSlider.appendChild(this.playhead);const n=document.createElement("div");n.style.position="absolute",n.style.top="0",n.style.left="50%",n.style.transform="translate(-50%, 0)",n.style.width="0",n.style.height="0",n.style.borderLeft="6px solid transparent",n.style.borderRight="6px solid transparent",n.style.borderTop="8px solid var(--color-red)",this.playhead.appendChild(n),this.graphSlider.tabIndex=0,this.graphSlider.style.outline="none";let s=!1;const r=a=>{if(this.frames.length===0)return;const l=this.graphSlider.getBoundingClientRect();let c=a.clientX-l.left;c=Math.max(0,Math.min(c,l.width)),this.fixedScreenX=c;const d=this.graph.lines.calls.points.length;if(d===0)return;const p=l.width/(this.graph.maxPoints-1),h=l.width-(d-1)*p;let u=Math.round((c-h)/p);u=Math.max(0,Math.min(u,d-1)),u>=d-2?this.isTrackingLatest=!0:this.isTrackingLatest=!1;let g=u;this.frames.length>d&&(g+=this.frames.length-d),this.playhead.style.display="block",this.selectFrame(g)};this.graphSlider.addEventListener("mousedown",a=>{s=!0,this.isManualScrubbing=!0,this.graphSlider.focus(),r(a)}),this.graphSlider.addEventListener("mouseenter",()=>{this.frames.length>0&&!this.isRecording&&(this.hoverIndicator.style.display="block")}),this.graphSlider.addEventListener("mouseleave",()=>{this.hoverIndicator.style.display="none"}),this.graphSlider.addEventListener("mousemove",a=>{if(this.frames.length===0||this.isRecording)return;const l=this.graphSlider.getBoundingClientRect();let c=a.clientX-l.left;c=Math.max(0,Math.min(c,l.width));const d=this.graph.lines.calls.points.length;if(d>0){const p=l.width/(this.graph.maxPoints-1),h=l.width-(d-1)*p;let u=Math.round((c-h)/p);u=Math.max(0,Math.min(u,d-1));let g=h+u*p;g=Math.max(1,Math.min(g,l.width-1)),this.hoverIndicator.style.left=g+"px"}else{const p=Math.max(1,Math.min(c,l.width-1));this.hoverIndicator.style.left=p+"px"}}),this.graphSlider.addEventListener("keydown",a=>{if(this.frames.length===0||this.isRecording)return;let l=this.selectedFrameIndex;if(a.key==="ArrowLeft"?(l=Math.max(0,this.selectedFrameIndex-1),a.preventDefault()):a.key==="ArrowRight"&&(l=Math.min(this.frames.length-1,this.selectedFrameIndex+1),a.preventDefault()),l!==this.selectedFrameIndex){this.selectFrame(l);const c=this.graph.lines.calls.points.length;if(c>0){let d=l;this.frames.length>c&&(d=l-(this.frames.length-c)),d>=c-2?this.isTrackingLatest=!0:this.isTrackingLatest=!1;const p=this.graphSlider.getBoundingClientRect(),h=p.width/(this.graph.maxPoints-1),u=p.width-(c-1)*h;this.fixedScreenX=u+d*h}}}),window.addEventListener("mousemove",a=>{if(s){r(a);const l=this.graphSlider.getBoundingClientRect();let c=a.clientX-l.left;c=Math.max(0,Math.min(c,l.width));const d=this.graph.lines.calls.points.length;if(d>0){const p=l.width/(this.graph.maxPoints-1),h=l.width-(d-1)*p;let u=Math.round((c-h)/p);u=Math.max(0,Math.min(u,d-1));let g=h+u*p;g=Math.max(1,Math.min(g,l.width-1)),this.hoverIndicator.style.left=g+"px"}else{const p=Math.max(1,Math.min(c,l.width-1));this.hoverIndicator.style.left=p+"px"}}}),window.addEventListener("mouseup",()=>{s=!1,this.isManualScrubbing=!1}),e.appendChild(i);const o=document.createElement("div");o.style.flex="1",o.style.display="flex",o.style.flexDirection="column",o.style.overflow="hidden",this.timelineTrack=document.createElement("div"),this.timelineTrack.style.flex="1",this.timelineTrack.style.overflowY="auto",this.timelineTrack.style.margin="10px",this.timelineTrack.style.backgroundColor="var(--background-color)",o.appendChild(this.timelineTrack),e.appendChild(o),this.scrollWrapper.appendChild(e)}setRenderer(e){this.renderer=e;const i=A("timeline");i.recording&&(i.recording=!1,P("timeline",i),this.toggleRecording())}toggleRecording(){if(!this.renderer){console.warn("Timeline: No renderer defined.");return}this.isRecording=!this.isRecording,this.isRecording?(this.recordButton.title="Stop",this.recordButton.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>',this.recordButton.style.color="var(--color-red)",this.startRecording()):(this.recordButton.title="Record",this.recordButton.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4" fill="currentColor"></circle></svg>',this.recordButton.style.color="",this.stopRecording(),this.renderSlider())}startRecording(){this.frames=[],this.currentFrame=null,this.selectedFrameIndex=-1,this.fixedScreenX=0,this.isTrackingLatest=!0,this.isManualScrubbing=!1,this.clear(),this.frameInfo.textContent="Recording...";const e=this.renderer.backend,i=Object.getOwnPropertyNames(Object.getPrototypeOf(e)).filter(n=>n!=="constructor");for(const n of i){const s=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(e),n);if(s&&(s.get||s.set))continue;const r=e[n];typeof r=="function"&&typeof n=="string"&&(this.originalMethods.set(n,r),e[n]=(...o)=>{if(n.toLowerCase().includes("timestamp")||n.startsWith("get")||n.startsWith("set")||n.startsWith("has")||n.startsWith("_")||n.startsWith("needs"))return r.apply(e,o);const a=this.renderer.info.frame;if(!this.currentFrame||this.currentFrame.id!==a){if(this.currentFrame){this.currentFrame.fps=this.renderer.inspector?this.renderer.inspector.fps:0,isFinite(this.currentFrame.fps)||(this.currentFrame.fps=0);const d=this.currentFrame.triangles||0;if(d>this.baseTriangles){const h=this.baseTriangles;if(this.baseTriangles=d,h>0){const u=h/this.baseTriangles,g=this.graph.lines.triangles.points;for(let b=0;b<g.length;b++)g[b]*=u}}const p=this.baseTriangles>0?d/this.baseTriangles*K:0;this.graph.addPoint("calls",this.currentFrame.calls.length),this.graph.addPoint("fps",this.currentFrame.fps),this.graph.addPoint("triangles",p),this.graph.update()}if(this.currentFrame={id:a,calls:[],fps:0,triangles:0},this.frames.push(this.currentFrame),this.frames.length>J&&this.frames.shift(),!this.isManualScrubbing){if(this.isTrackingLatest){const d=this.frames.length>1?this.frames.length-2:0;this.selectFrame(d)}else if(this.selectedFrameIndex!==-1){const d=this.graph.lines.calls.points.length;if(d>0){const p=this.graphSlider.getBoundingClientRect(),h=p.width/(this.graph.maxPoints-1),u=p.width-(d-1)*h;let g=Math.round((this.fixedScreenX-u)/h);g=Math.max(0,Math.min(g,d-1));let b=g;this.frames.length>d&&(b+=this.frames.length-d),this.selectFrame(b)}}}}const l={method:n,target:o[0]},c=this.getCallDetail(n,o);return c&&(l.details=c,c.triangles!==void 0&&(this.currentFrame.triangles+=c.triangles)),this.currentFrame.calls.push(l),r.apply(e,o)})}}stopRecording(){if(this.originalMethods.size>0){const e=this.renderer.backend;for(const[i,n]of this.originalMethods.entries())e[i]=n;this.originalMethods.clear(),this.currentFrame&&(this.currentFrame.fps=this.renderer.inspector?this.renderer.inspector.fps:0)}}clear(){this.frames=[],this.timelineTrack.innerHTML="",this.playhead.style.display="none",this.frameInfo.textContent="",this.baseTriangles=0,this.graph.lines.calls.points=[],this.graph.lines.fps.points=[],this.graph.lines.triangles.points=[],this.graph.resetLimit(),this.graph.update()}exportData(){if(this.frames.length===0)return;const e=JSON.stringify(this.frames,null,"	"),i=new Blob([e],{type:"application/json"}),n=URL.createObjectURL(i),s=document.createElement("a");s.href=n,s.download="threejs-timeline.json",s.click(),URL.revokeObjectURL(n)}getRenderTargetDetails(e){const i=e.textures,n=[],s=a=>{switch(a.type){case Be:case Ie:return"8";case Le:case Se:case Ee:case Te:case ke:return"16";case Ce:case we:case ye:case ve:case xe:case be:return"32";default:return"?"}},r=a=>{switch(a.format){case _e:return"a";case Ve:case Pe:return"r";case Ae:case De:return"rg";case We:case Ne:return"rgb";case ze:return"depth";case Fe:return"depth-stencil";case Re:case Me:default:return"rgba"}};for(let a=0;a<i.length;a++){const l=i[a],c=s(l),d=r(l);let p=`[${a}]`;l.name&&!(l.isDepthTexture&&l.name==="depth")&&(p+=` ${l.name}`),p+=` ${d} ${c} bpc`,n.push(p)}const o={target:e.name||"RenderTarget",[`attachments(${i.length})`]:n.join(", ")};return e.depthTexture&&(o.depth=`${s(e.depthTexture)} bpc`),o}getCallDetail(e,i){switch(e){case"draw":{const n=i[0],s={object:n.object.name||n.object.type,material:n.material.name||n.material.type,geometry:n.geometry.name||n.geometry.type};if(n.getDrawParameters){const r=n.getDrawParameters();r&&(n.object.isMesh||n.object.isSprite)&&(s.triangles=r.vertexCount/3,n.object.count>1&&(s.instance=n.object.count,s["triangles per instance"]=s.triangles,s.triangles*=s.instance))}return s}case"beginRender":{const n=i[0],s={scene:this.renderer.inspector.currentRender.name||"unknown",camera:n.camera.name||n.camera.type};return n.renderTarget&&!n.renderTarget.isPostProcessingRenderTarget?Object.assign(s,this.getRenderTargetDetails(n.renderTarget)):s.target="CanvasTarget",s}case"beginCompute":return{compute:this.renderer.inspector.currentCompute.name||"unknown"};case"compute":{const n=i[1],s=i[2],r=i[4]||n.dispatchSize||n.count,o=n.name||n.type||"unknown";let a=0;s&&(a=s.length);let l;return r.isIndirectStorageBufferAttribute?l="indirect":Array.isArray(r)?l=r.join(", "):l=r,{node:o,bindings:a,dispatch:l}}case"updateBinding":return{group:i[0].name||"unknown"};case"clear":{const n=i[3],s={color:i[0],depth:i[1],stencil:i[2]};if(n.renderTarget&&!n.renderTarget.isPostProcessingRenderTarget){const r=this.getRenderTargetDetails(n.renderTarget);r.depth&&(r["depth texture"]=r.depth,delete r.depth),Object.assign(s,r)}else s.target="CanvasTarget";return s}case"updateViewport":{const n=i[0],{x:s,y:r,width:o,height:a}=n.viewportValue;return{x:s,y:r,width:o,height:a}}case"updateScissor":{const n=i[0],{x:s,y:r,width:o,height:a}=n.scissorValue;return{x:s,y:r,width:o,height:a}}case"createProgram":case"destroyProgram":{const n=i[0];return{stage:n.stage,name:n.name||"unknown"}}case"createRenderPipeline":{const n=i[0];return{object:n.object&&(n.object.name||n.object.type)||"unknown",material:n.material&&(n.material.name||n.material.type)||"unknown"}}case"createComputePipeline":case"destroyComputePipeline":return{name:i[0].name||"unknown"};case"createBindings":case"updateBindings":{const n=i[0],s={group:n.name||"unknown"};return n.bindings&&(s.count=n.bindings.length),s}case"createNodeBuilder":{const n=i[0],s={object:n.name||n.type||"unknown"};return n.material&&(s.material=n.material.name||n.material.type||"unknown"),s}case"createAttribute":case"createIndexAttribute":case"createStorageAttribute":case"destroyAttribute":case"destroyIndexAttribute":case"destroyStorageAttribute":{const n=i[0],s={};return n.name&&(s.name=n.name),n.count!==void 0&&(s.count=n.count),n.itemSize!==void 0&&(s.itemSize=n.itemSize),s}case"copyFramebufferToTexture":{const n=i[0],s=i[2];return{target:this.getTextureName(n),width:s.z,height:s.w}}case"copyTextureToTexture":{const n=i[0],s=i[1];return{source:this.getTextureName(n),destination:this.getTextureName(s)}}case"updateSampler":{const n=i[0];return{magFilter:this.getTextureFilterName(n.magFilter),minFilter:this.getTextureFilterName(n.minFilter),wrapS:this.getTextureWrapName(n.wrapS),wrapT:this.getTextureWrapName(n.wrapT),anisotropy:n.anisotropy}}case"updateTexture":case"generateMipmaps":case"createTexture":case"destroyTexture":{const n=i[0],r={texture:this.getTextureName(n)};return n.image&&(n.image.width!==void 0&&(r.width=n.image.width),n.image.height!==void 0&&(r.height=n.image.height)),r}}return null}getTextureName(e){if(e.name)return e.name;const i=["isFramebufferTexture","isDepthTexture","isDataArrayTexture","isData3DTexture","isDataTexture","isCompressedArrayTexture","isCompressedTexture","isCubeTexture","isVideoTexture","isCanvasTexture","isTexture"];for(const n of i)if(e[n])return n.replace("is","");return"Texture"}getTextureFilterName(e){return{1003:"Nearest",1004:"NearestMipmapNearest",1005:"NearestMipmapLinear",1006:"Linear",1007:"LinearMipmapNearest",1008:"LinearMipmapLinear"}[e]||e}getTextureWrapName(e){return{1e3:"Repeat",1001:"ClampToEdge",1002:"MirroredRepeat"}[e]||e}formatDetails(e){const i=[];for(const n in e)e[n]!==void 0&&i.push(`<span style="opacity: 0.5">${n}:</span> <span style="color: var(--text-secondary); opacity: 1">${e[n]}</span>`);return i.length===0?"":`<span style="font-size: 11px; margin-left: 8px; color: var(--text-secondary); opacity: 1;">{ ${i.join('<span style="opacity: 0.5">, </span>')} }</span>`}renderSlider(){if(this.frames.length===0){this.playhead.style.display="none",this.frameInfo.textContent="";return}this.graph.lines.calls.points=[],this.graph.lines.fps.points=[],this.graph.lines.triangles.points=[],this.graph.resetLimit();let e=this.frames;e.length>this.graph.maxPoints&&(e=e.slice(-this.graph.maxPoints),this.frames=e);let i=0;for(let s=0;s<e.length;s++){const r=e[s].triangles||0;r>i&&(i=r)}for(let s=0;s<e.length;s++){const r=e[s].triangles||0,o=i>0?r/i*K:0;this.graph.addPoint("calls",e[s].calls.length),this.graph.addPoint("fps",e[s].fps||0),this.graph.addPoint("triangles",o)}this.graph.update(),this.playhead.style.display="block";let n=0;this.selectedFrameIndex!==-1&&this.selectedFrameIndex<this.frames.length?n=this.selectedFrameIndex:this.frames.length>0&&(n=this.frames.length-1),this.selectFrame(n)}selectFrame(e){if(e<0||e>=this.frames.length)return;this.selectedFrameIndex=e;const i=this.frames[e];this.renderTimelineTrack(i);const n=(a,l)=>`<span style="display:inline-flex;align-items:center;margin-left:12px;"><span style="width:6px;height:6px;border-radius:50%;background-color:${a};margin-right:6px;"></span>${l}</span>`,s=Math.max(this.baseTriangles,i.triangles||0);this.frameInfo.innerHTML="Frame: "+i.id+n("var(--color-fps)",(i.fps||0).toFixed(1)+" FPS")+n("var(--color-call)",i.calls.length+" calls")+n("var(--color-red)",(i.triangles||0)+" / "+s+" triangles");const r=this.graphSlider.getBoundingClientRect(),o=this.graph.lines.calls.points.length;if(o>0){const a=r.width/(this.graph.maxPoints-1);let l=e;this.frames.length>o&&(l=e-(this.frames.length-o));let d=r.width-(o-1)*a+l*a;d=Math.max(1,Math.min(d,r.width-1)),this.playhead.style.left=d+"px",this.playhead.style.display="block"}}getCallBlock(e,i,n=0){const s=e.target;let r;if(s&&typeof s=="object"){let o=this.callBlocks.get(s);o||(o=[],this.callBlocks.set(s,o)),r=o[n]}else r=this.fallbackBlocks[i];return r||(r=document.createElement("div"),r.style.padding="4px 8px",r.style.margin="2px 0",r.style.backgroundColor="rgba(255, 255, 255, 0.03)",r.style.fontFamily="monospace",r.style.fontSize="12px",r.style.color="var(--text-primary)",r.style.whiteSpace="nowrap",r.style.overflow="hidden",r.style.textOverflow="ellipsis",r.style.display="flex",r.style.alignItems="center",r.arrow=document.createElement("span"),r.arrow.style.fontSize="10px",r.arrow.style.marginRight="10px",r.arrow.style.cursor="pointer",r.arrow.style.width="26px",r.arrow.style.textAlign="center",r.appendChild(r.arrow),r.titleSpan=document.createElement("span"),r.appendChild(r.titleSpan),r.addEventListener("click",o=>{r._groupId&&(o.stopPropagation(),this.collapsedGroups.has(r._groupId)?this.collapsedGroups.delete(r._groupId):this.collapsedGroups.add(r._groupId),this.renderTimelineTrack(this.frames[this.selectedFrameIndex]))}),s&&typeof s=="object"?this.callBlocks.get(s)[n]=r:this.fallbackBlocks[i]=r),r.style.cursor="default",r._groupId=null,r.arrow.style.display="none",r}renderTimelineTrack(e){if(!e||e.calls.length===0){this.timelineTrack.innerHTML="";return}this.collapsedGroups||(this.collapsedGroups=new Set);let i=0;const n=this.timelineTrack.children;let s=0;const r=new WeakMap;if(this.isHierarchicalView){const o=[];let a=null;for(let p=0;p<e.calls.length;p++){const h=e.calls[p],u=h.method.startsWith("begin")||h.method.startsWith("finish"),g=h.details?this.formatDetails(h.details):"";a&&a.method===h.method&&a.formatedDetails===g&&!u?a.count++:(a={method:h.method,count:1,formatedDetails:g,target:h.target},o.push(a))}let l=0;const c=24,d=[{element:this.timelineTrack,isCollapsed:!1,id:"",beginCount:0}];for(let p=0;p<o.length;p++){const h=o[p];let u=0;h.target&&typeof h.target=="object"&&(u=r.get(h.target)||0,r.set(h.target,u+1));const g=this.getCallBlock(h,i++,u);g.style.marginLeft=l*c+"px",g.style.borderLeft="4px solid "+this.getColorForMethod(h.method);const b=d[d.length-1];if(b.isCollapsed||(n[s]!==g&&this.timelineTrack.insertBefore(g,n[s]),s++),h.method.startsWith("begin")){const C=b.beginCount++,y=b.id+"/"+h.method+"-"+C,w=this.collapsedGroups.has(y);g._groupId=y,g.style.cursor="pointer",g.arrow.style.display="inline-block",g.arrow.textContent=w?"[ + ]":"[ - ]",g.titleSpan.innerHTML=h.method+(h.formatedDetails?h.formatedDetails:"")+(h.count>1?` <span style="opacity: 0.5">( ${h.count} )</span>`:""),l++,d.push({element:g,isCollapsed:b.isCollapsed||w,id:y,beginCount:0})}else h.method.startsWith("finish")?(g.titleSpan.innerHTML=h.method+(h.formatedDetails?h.formatedDetails:"")+(h.count>1?` <span style="opacity: 0.5">( ${h.count} )</span>`:""),l=Math.max(0,l-1),d.pop()):g.titleSpan.innerHTML=h.method+(h.formatedDetails?h.formatedDetails:"")+(h.count>1?` <span style="opacity: 0.5">( ${h.count} )</span>`:"")}}else{const o={};for(let l=0;l<e.calls.length;l++){const c=e.calls[l].method;c.startsWith("finish")||(o[c]=(o[c]||0)+1)}const a=Object.keys(o).map(l=>({method:l,count:o[l]}));a.sort((l,c)=>c.count-l.count);for(let l=0;l<a.length;l++){const c=a[l],d=this.getCallBlock(c,i++);d.style.marginLeft="0px",d.style.borderLeft="4px solid "+this.getColorForMethod(c.method),d.titleSpan.innerHTML=c.method+(c.count>1?` <span style="opacity: 0.5">( ${c.count} )</span>`:""),n[s]!==d&&this.timelineTrack.insertBefore(d,n[s]),s++}}for(;this.timelineTrack.children.length>s;)this.timelineTrack.removeChild(this.timelineTrack.lastChild)}getColorForMethod(e){return e.startsWith("begin")?"var(--color-green)":e.startsWith("finish")||e.startsWith("destroy")?"var(--color-red)":e.startsWith("draw")||e.startsWith("compute")||e.startsWith("create")||e.startsWith("generate")?"var(--color-yellow)":"var(--text-secondary)"}}class xt extends Ge{constructor(){super();const e=new Xe(this);e.addEventListener("resize",c=>this.dispatchEvent(c));const i=new ne({builtin:!0,icon:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M4 6l8 0" /><path d="M16 6l4 0" /><path d="M8 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M4 12l2 0" /><path d="M10 12l10 0" /><path d="M17 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M4 18l11 0" /><path d="M19 18l1 0" /></svg>'});i.hide(),e.addTab(i);const n=new ut;n.hide(),e.addTab(n);const s=new Ze;e.addTab(s);const r=new Qe;e.addTab(r);const o=new gt;e.addTab(o);const a=new Je;e.addTab(a);const l=new rt;e.addTab(l),e.loadLayout(),e.activeTabId||e.setActiveTab(s.id),this.statsData=new Map,this.profiler=e,this.performance=s,this.memory=r,this.console=a,this.parameters=i,this.viewer=n,this.timeline=o,this.settings=l,this.once={},this.extensionsData=new WeakMap,this.displayCycle={text:{needsUpdate:!1,duration:.25,time:0},graph:{needsUpdate:!1,duration:.02,time:0}}}get domElement(){return this.profiler.domElement}onExtension(e,i){const n=s=>{s.name===e&&(i(s.tab),this.settings.removeEventListener("extensionadded",n))};return this.settings.extensions[e]&&this.settings.extensions[e].loaded?i(this.settings.extensions[e]):this.settings.addEventListener("extensionadded",n),this}hide(){this.profiler.hide()}show(){this.profiler.show()}getSize(){return this.profiler.getSize()}setActiveTab(e){return this.profiler.setActiveTab(e.id),this}addTab(e){return this.profiler.addTab(e),this}removeTab(e){return this.profiler.removeTab(e),this}setActiveExtension(e,i){return this.settings.setActiveExtension(e,i),this}resolveConsoleOnce(e,i){const n=e+i;this.once[n]!==!0&&(this.resolveConsole(e,i),this.once[n]=!0)}resolveConsole(e,i,n=null){switch(e){case"log":this.console.addMessage("info",i),console.log(i);break;case"warn":this.console.addMessage("warn",i),n&&n.isStackTrace?console.warn(n.getError(i)):console.warn(i);break;case"error":this.console.addMessage("error",i),n&&n.isStackTrace?console.error(n.getError(i)):console.error(i);break}}init(){const e=this.getRenderer();let i=`THREE.WebGPURenderer: ${Oe} [ "`;e.backend.isWebGPUBackend?i+="WebGPU":e.backend.isWebGLBackend&&(i+="WebGL2"),i+='" ]',this.console.addMessage("info",i),e.inspector.domElement.parentElement===null&&e.domElement.parentElement!==null&&e.domElement.parentElement.appendChild(e.inspector.domElement)}setRenderer(e){return super.setRenderer(e),e!==null&&(He(this.resolveConsole.bind(this)),this.isAvailable&&(e.init().then(()=>{e.backend.trackTimestamp=!0,e.hasFeature("timestamp-query")!==!0&&this.console.addMessage("error","THREE.Inspector: GPU Timestamp Queries not available.")}),this.timeline.setRenderer(e))),this}createParameters(e){return this.parameters.isVisible===!1&&this.parameters.show(),this.parameters.createGroup(e)}getStatsData(e){let i=this.statsData.get(e);return i===void 0&&(i={},this.statsData.set(e,i)),i}resolveStats(e){const i=this.getStatsData(e.cid);i.initialized!==!0&&(i.cpu=e.cpu,i.gpu=e.gpu,i.stats=[],i.initialized=!0),i.stats.length>this.maxFrames&&i.stats.shift(),i.stats.push(e),i.cpu=this.getAverageDeltaTime(i,"cpu"),i.gpu=this.getAverageDeltaTime(i,"gpu"),i.total=i.cpu+i.gpu;for(const n of e.children){this.resolveStats(n);const s=this.getStatsData(n.cid);i.cpu+=s.cpu,i.gpu+=s.gpu,i.total+=s.total}}getNodes(){return this.currentNodes}getAverageDeltaTime(e,i,n=this.fps){const s=e.stats;let r=0,o=0;for(let a=s.length-1;a>=0&&o<n;a--){const c=s[a][i];c>0&&(r+=c,o++)}return o>0?r/o:0}updateTabs(){const e=Object.values(this.profiler.tabs);for(const i of e){let n=this.extensionsData.get(i);n===void 0&&(i.init(this),n={},this.extensionsData.set(i,n)),i.update(this)}}resolveFrame(e){const i=this.getFrameById(e.frameId+1);if(i){e.cpu=0,e.gpu=0,e.total=0;for(const n of e.children){this.resolveStats(n);const s=this.getStatsData(n.cid);e.cpu+=s.cpu,e.gpu+=s.gpu,e.total+=s.total}e.deltaTime=i.startTime-e.startTime,e.miscellaneous=e.deltaTime-e.total,e.miscellaneous<0&&(e.miscellaneous=0),this.updateCycle(this.displayCycle.text),this.updateCycle(this.displayCycle.graph),this.displayCycle.text.needsUpdate&&(x("fps-counter",this.fps.toFixed()),this.performance.updateText(this,e),this.memory.updateText(this)),this.displayCycle.graph.needsUpdate&&(this.performance.updateGraph(this,e),this.memory.updateGraph(this)),this.displayCycle.text.needsUpdate=!1,this.displayCycle.graph.needsUpdate=!1}}updateCycle(e){e.time+=this.nodeFrame.deltaTime,e.time>=e.duration&&(e.needsUpdate=!0,e.time=0)}static getItem(e){return console.warn("Inspector.getItem is deprecated. Use getItem directly instead."),A(e)}static setItem(e,i){console.warn("Inspector.setItem is deprecated. Use setItem directly instead."),P(e,i)}}function A(m){return JSON.parse(localStorage.getItem("threejs-inspector")||"{}")[m]||{}}function P(m,e){const i=JSON.parse(localStorage.getItem("threejs-inspector")||"{}");e===null?delete i[m]:i[m]=e,localStorage.setItem("threejs-inspector",JSON.stringify(i))}export{xt as Inspector,A as getItem,P as setItem};
