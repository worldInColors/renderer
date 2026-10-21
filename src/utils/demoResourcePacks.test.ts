import { describe, expect, it, vi } from "vitest";
import { ensureDemoResourcePacks } from "../../test/pages/scripts/demo-packs";
import type { SchematicRenderer } from "../SchematicRenderer";

function fixture(priority?: number, enabled = true) {
	const vanilla = { id: "base", name: "vanillaPack", priority: 0, enabled: true };
	const all = priority === undefined ? [vanilla] : [
		vanilla, { id: "tweaks", name: "Redstone Tweaks", priority, enabled },
	];
	const packs = {
		getAllPacks: () => all,
		getEnabledPacks: () => all.filter((pack) => pack.enabled),
		beginPackBatchUpdate: vi.fn(),
		endPackBatchUpdate: vi.fn().mockResolvedValue(undefined),
		loadPackFromUrl: vi.fn().mockResolvedValue("tweaks"),
		enablePack: vi.fn().mockResolvedValue(undefined),
		setPackPriority: vi.fn().mockResolvedValue(undefined),
		onPackEvent: vi.fn(),
	};
	return { packs, run: () => ensureDemoResourcePacks({ packs } as unknown as SchematicRenderer) };
}

describe("shared demo resource packs", () => {
	it("adds Redstone Tweaks above a previously cached vanilla pack", async () => {
		const { packs, run } = fixture();
		await run();
		expect(packs.loadPackFromUrl).toHaveBeenCalledWith("packs/redstone-tweaks.zip", {
			name: "Redstone Tweaks", priority: -1,
		});
		expect(packs.endPackBatchUpdate).toHaveBeenCalledOnce();
	});
	it("corrects a disabled overlay below vanilla without downloading it again", async () => {
		const { packs, run } = fixture(1, false);
		await run();
		expect(packs.enablePack).toHaveBeenCalledWith("tweaks");
		expect(packs.setPackPriority).toHaveBeenCalledWith("tweaks", -1);
		expect(packs.loadPackFromUrl).not.toHaveBeenCalled();
	});
	it("leaves an already enabled overlay unchanged", async () => {
		const { packs, run } = fixture(-1);
		await run();
		expect(packs.loadPackFromUrl).not.toHaveBeenCalled();
		expect(packs.enablePack).not.toHaveBeenCalled();
		expect(packs.setPackPriority).not.toHaveBeenCalled();
	});
});
