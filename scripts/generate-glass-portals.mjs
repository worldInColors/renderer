// Generate the labeled playground showcase: node scripts/generate-glass-portals.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import init, { SchematicWrapper } from "nucleation";

await init();
const schematic = new SchematicWrapper();
schematic.setName("Glass and Portals Showcase");
schematic.setDescription("All 16 stained glass colors and panes; clear/tinted connected glass; pane junctions; X/Z Nether portals; raised End portal with an open underside.");
const put = (x, y, z, name) => schematic.set_block_from_string(x, y, z, `minecraft:${name}`);
const colors = [
	"white", "orange", "magenta", "light_blue",
	"yellow", "lime", "pink", "gray",
	"light_gray", "cyan", "purple", "blue",
	"brown", "green", "red", "black",
];
const signPositions = [];
function sign(x, y, z, lines) {
	put(x, y, z, "dark_oak_sign[rotation=0,waterlogged=false]");
	const messages = Array.from({ length: 4 }, (_, i) => JSON.stringify(JSON.stringify({ text: lines[i] ?? "" })));
	const side = `{messages:[${messages.join(",")}],color:"white",has_glowing_text:1b}`;
	schematic.setBlockEntity(x, y, z, "minecraft:sign", `{front_text:${side},back_text:${side},is_waxed:1b}`);
	signPositions.push([x, y, z]);
}
function platform(x, z, width, depth, accent = "light_gray_concrete") {
	for (let dx = 0; dx < width; dx++)
		for (let dz = 0; dz < depth; dz++)
			put(x + dx, 0, z + dz, dz === depth - 1 ? accent : "smooth_quartz");
}
function wall(x, z, name, width = 3, height = 3) {
	for (let dx = 0; dx < width; dx++)
		for (let y = 1; y <= height; y++) put(x + dx, y, z, name);
}
function paneWall(x, z, name, axis = "x", width = 3) {
	for (let a = 0; a < width; a++)
		for (let y = 1; y <= 3; y++)
			put(x + (axis === "x" ? a : 0), y, z + (axis === "z" ? a : 0),
				`${name}[east=${axis === "x" && a < width - 1},west=${axis === "x" && a > 0},south=${axis === "z" && a < width - 1},north=${axis === "z" && a > 0},waterlogged=false]`);
}

// Four rows of four colors. Blocks and panes stand side by side on each plinth.
colors.forEach((color, i) => {
	const x = 1 + (i % 4) * 9, z = 1 + Math.floor(i / 4) * 7;
	platform(x, z, 7, 5, `${color}_concrete`);
	wall(x, z + 1, `${color}_stained_glass`);
	paneWall(x + 4, z + 1, `${color}_stained_glass_pane`);
	sign(x + 3, 1, z + 3, [color.replaceAll("_", " ").toUpperCase(), "GLASS | PANES", "Connected 3 x 3"]);
});

// Clear glass turns a corner; adjacent same-color faces merge on both axes.
platform(1, 30, 7, 7);
wall(1, 31, "glass");
for (let z = 32; z <= 33; z++) for (let y = 1; y <= 3; y++) put(1, y, z, "glass");
paneWall(5, 31, "glass_pane", "z");
sign(4, 1, 35, ["CLEAR GLASS", "Corner + panes", "Both directions"]);

platform(10, 30, 5, 7, "black_concrete");
wall(11, 31, "tinted_glass");
sign(12, 1, 35, ["TINTED GLASS", "Connected 3 x 3"]);

// An L with a missing diagonal tests inner corners, spanning the x=16 boundary.
platform(16, 30, 5, 7, "lime_concrete");
for (let dx = 0; dx < 3; dx++) for (let y = 1; y <= 3; y++)
	if (dx === 0 || y === 1) put(15 + dx, y, 31, "lime_stained_glass");
put(15, 0, 31, "smooth_quartz");
sign(18, 1, 35, ["CONNECTED L", "Inner corners", "Across x = 16"]);

platform(22, 30, 5, 7, "purple_concrete");
wall(22, 31, "red_stained_glass", 2);
wall(24, 31, "blue_stained_glass", 2);
sign(24, 1, 35, ["COLOR BOUNDARY", "Red meets blue", "Borders retained"]);

// Cross-shaped panes and an isolated pane exercise every arm and the center post.
platform(28, 30, 7, 7, "cyan_concrete");
for (let y = 1; y <= 3; y++) {
	put(30, y, 32, "cyan_stained_glass_pane[north=true,south=true,east=true,west=true,waterlogged=false]");
	for (const [dx, dz, arms] of [
		[-1, 0, "east=true,west=false,north=false,south=false"],
		[1, 0, "east=false,west=true,north=false,south=false"],
		[0, -1, "east=false,west=false,north=false,south=true"],
		[0, 1, "east=false,west=false,north=true,south=false"],
	]) put(30 + dx, y, 32 + dz, `cyan_stained_glass_pane[${arms},waterlogged=false]`);
}
put(34, 1, 32, "glass_pane[north=false,south=false,east=false,west=false,waterlogged=false]");
sign(31, 1, 35, ["PANE JUNCTION", "Four-way + solo"]);

// Vanilla Nether portals have two legal horizontal axes. Gold behind each makes
// transparency apparent from the front, and both sides remain open for orbiting.
for (const [axis, ox, oz] of [["x", 2, 41], ["z", 16, 40]]) {
	platform(ox - 1, oz - 1, axis === "x" ? 7 : 5, axis === "x" ? 6 : 8, "purple_concrete");
	for (let a = 0; a < 5; a++) for (let y = 1; y <= 6; y++)
		put(ox + (axis === "x" ? a : 0), y, oz + (axis === "z" ? a : 0),
			a === 0 || a === 4 || y === 1 || y === 6 ? "obsidian" : `nether_portal[axis=${axis}]`);
	put(ox + (axis === "x" ? 2 : -1), 2, oz + (axis === "z" ? 2 : -1), "gold_block");
	sign(ox + 2, 1, oz + (axis === "x" ? 3 : 6), ["NETHER PORTAL", `Axis ${axis.toUpperCase()}`, axis === "x" ? "East / west" : "North / south"]);
}

// Raised 3 x 3 End surface, inward-facing eyes, and no floor beneath the opening.
for (let x = 27; x <= 31; x++) for (let z = 41; z <= 45; z++) {
	const edge = x === 27 || x === 31 || z === 41 || z === 45;
	const corner = (x === 27 || x === 31) && (z === 41 || z === 45);
	if (corner) {
		for (let y = 0; y <= 4; y++) put(x, y, z, "end_stone_bricks");
	} else if (edge) {
		put(x, 3, z, "end_stone_bricks");
		const facing = x === 27 ? "east" : x === 31 ? "west" : z === 41 ? "south" : "north";
		put(x, 4, z, `end_portal_frame[eye=true,facing=${facing}]`);
	} else put(x, 4, z, "end_portal");
}
platform(27, 47, 5, 1, "cyan_concrete");
sign(29, 1, 47, ["END PORTAL", "Raised surface", "Orbit underneath"]);

const bytes = schematic.to_litematic();
const output = new URL("../test/public/schematics/glass-portals.litematic", import.meta.url);
fs.writeFileSync(output, bytes);

// Validate the delivered file, including block-entity text surviving serialization.
const loaded = new SchematicWrapper();
loaded.from_litematic(bytes);
for (const color of colors) {
	const i = colors.indexOf(color), x = 1 + (i % 4) * 9, z = 2 + Math.floor(i / 4) * 7;
	assert.equal(loaded.get_block_string(x, 2, z), `minecraft:${color}_stained_glass`);
	assert.match(loaded.get_block_string(x + 5, 2, z), new RegExp(`${color}_stained_glass_pane`));
}
assert.equal(loaded.get_block_string(3, 2, 41), "minecraft:nether_portal[axis=x]");
assert.equal(loaded.get_block_string(16, 2, 41), "minecraft:nether_portal[axis=z]");
assert.equal(loaded.get_block_string(29, 4, 43), "minecraft:end_portal");
for (const p of signPositions) assert.ok(loaded.get_block_entity(...p)?.nbt?.front_text);
console.log(`Saved ${output.pathname}: ${loaded.get_block_count()} blocks, ${signPositions.length} labels, ${bytes.length} bytes.`);
loaded.free();
schematic.free();
