import * as THREE from "three";
import { SchematicRenderer } from "../../../src/SchematicRenderer";
import { demoResourcePacks, ensureDemoResourcePacks } from "./demo-packs";
import type { SchematicObject } from "../../../src/managers/SchematicObject";

const status = document.getElementById("status")!;
const fileInput = document.getElementById("file") as HTMLInputElement;
let schematic: SchematicObject;
const targets = new Map<string, THREE.Vector3>();
const blockCells = new Map<string, THREE.Vector3[]>();
const blocks = document.getElementById("blocks") as HTMLSelectElement;
let selectedIndex = 0;
const offsets: Record<string, THREE.Vector3> = {
	chest: new THREE.Vector3(2, 1.5, 5),
	scaffolding: new THREE.Vector3(2, 1.8, 3),
	bubble_column: new THREE.Vector3(-2, 0, -4),
};

const waterloggedStairOffset = new THREE.Vector3(1, 0.4, 2);

function inspect() {
	targets.clear();
	blockCells.clear();
	const counts: Record<string, number> = { chest: 0, scaffolding: 0, bubble_column: 0 };
	const w = schematic.schematicWrapper;
	const [sx, sy, sz] = w.get_dimensions();
	for (let y = 0; y < sy; y++) for (let z = 0; z < sz; z++) for (let x = 0; x < sx; x++) {
		const name = w.get_block(x, y, z)?.replace("minecraft:", "");
		if (!name || name === "air") continue;
		if (!blockCells.has(name)) blockCells.set(name, []);
		blockCells.get(name)!.push(new THREE.Vector3(x, y, z));
		if (name === "scaffolding" || name.endsWith("_stairs")) {
			const state = w.get_block_with_properties(x, y, z);
			if (state?.properties().waterlogged === "true") {
				const key = `${name} (waterlogged)`;
				if (!blockCells.has(key)) blockCells.set(key, []);
				blockCells.get(key)!.push(new THREE.Vector3(x, y, z));
			}
			state?.free();
		}
		if (!(name in counts)) continue;
		counts[name]++;
		if (!targets.has(name) || name === "chest") targets.set(name, new THREE.Vector3(x, y + (name === "chest" ? 0 : 2), z));
	}
	for (const name of Object.keys(counts)) (document.getElementById(name) as HTMLButtonElement).disabled = !counts[name];
	status.textContent = `${counts.chest} chest halves · ${counts.scaffolding} scaffolding · ${counts.bubble_column} bubble column cells`;
	blocks.replaceChildren(...[...blockCells.keys()].sort().map(name => new Option(`${name} (${blockCells.get(name)!.length})`, name)));
	blocks.disabled = false;
	for (const id of ["next", "overview"]) (document.getElementById(id) as HTMLButtonElement).disabled = false;
}

const renderer = new SchematicRenderer(document.getElementById("canvas") as HTMLCanvasElement, {}, demoResourcePacks, {
	meshBuildingMode: "batched",
	singleSchematicMode: true,
	enableProgressBar: false,
	enableDragAndDrop: false,
	targetFPS: 0,
	callbacks: {
		onRendererInitialized: async () => {
			await ensureDemoResourcePacks(renderer);
			status.textContent = "Choose a schematic, then use the close-up buttons. Drag to orbit; scroll to zoom.";
			fileInput.disabled = false;
		},
	},
});

fileInput.onchange = async () => {
	const file = fileInput.files?.[0];
	if (!file) return;
	status.textContent = "Loading schematic…";
	try {
		await renderer.schematicManager!.loadSchematicFromFile(file);
		schematic = renderer.schematicManager!.getSchematic(file.name)!;
		inspect();
	} catch (error) {
		status.textContent = String(error);
	}
};

function focus(local: THREE.Vector3, offset: THREE.Vector3) {
	const target = schematic.group.localToWorld(local.clone());
	const cm = renderer.cameraManager;
	cm.activeCamera.position = target.clone().add(offset);
	const controls = cm.controls.get(cm.activeControlKey);
	controls.target.copy(target);
	controls.update();
	renderer.invalidate();
}

function inspectSelected() {
	const cells = blockCells.get(blocks.value);
	if (!cells?.length) return;
	const offset = blocks.value.endsWith("_stairs (waterlogged)")
		? waterloggedStairOffset
		: offsets[blocks.value] ?? new THREE.Vector3(2, 1.8, 4);
	focus(cells[selectedIndex % cells.length], offset);
}
blocks.onchange = () => { selectedIndex = 0; inspectSelected(); };
document.getElementById("next")!.onclick = () => { selectedIndex++; inspectSelected(); };
document.getElementById("overview")!.onclick = () => renderer.cameraManager.focusOnSchematics({ animationDuration: 0 });

for (const [name, offset] of Object.entries(offsets)) {
	document.getElementById(name)!.onclick = () => {
		const local = targets.get(name);
		if (!local) return;
		focus(local, offset);
	};
}
