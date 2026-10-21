import type { SchematicRenderer } from "../../../src/SchematicRenderer";

/** Both file viewers use the same bundled base pack and Redstone Tweaks overlay. */
export const demoResourcePacks = {
	vanillaPack: async () => {
		const response = await fetch("pack.zip");
		if (!response.ok) throw new Error(`Default resource pack: ${response.status}`);
		return response.blob();
	},
};

export async function ensureDemoResourcePacks(renderer: SchematicRenderer): Promise<void> {
	const packs = renderer.packs;
	const all = packs.getAllPacks();
	const tweaks = all.find((pack) => /redstone.?tweaks/i.test(pack.name));
	const vanilla = all.find((pack) => pack.name === "vanillaPack");
	packs.beginPackBatchUpdate();
	try {
		if (!tweaks) {
			await packs.loadPackFromUrl("packs/redstone-tweaks.zip", {
				name: "Redstone Tweaks",
				priority: Math.min(0, ...all.map((pack) => pack.priority)) - 1,
			});
		} else {
			if (!tweaks.enabled) await packs.enablePack(tweaks.id);
			if (vanilla && tweaks.priority >= vanilla.priority) {
				await packs.setPackPriority(tweaks.id, vanilla.priority - 1);
			}
		}
	} finally {
		await packs.endPackBatchUpdate();
	}
	const updateLabel = () => {
		const label = document.getElementById("pack-status");
		if (label) label.textContent = "Textures: " + packs.getEnabledPacks().reverse()
			.map((pack) => pack.name === "vanillaPack" ? "Vanilla" : pack.name).join(" + ");
	};
	updateLabel();
	packs.onPackEvent("packsChanged", updateLabel);
}
