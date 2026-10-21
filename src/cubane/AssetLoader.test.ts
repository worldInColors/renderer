import { describe, expect, it, vi } from "vitest";
import { AssetLoader } from "./AssetLoader";

describe("renamed chain blockstates", () => {
	it.each([
		["iron_chain", "chain"],
		["chain", "iron_chain"],
	])("loads %s from an older/newer pack and caches it", async (name, alias) => {
		const loader = new AssetLoader(false);
		const definition = { variants: { "axis=y": { model: `minecraft:block/${alias}` } } };
		const read = vi
			.spyOn(loader, "getResourceString")
			.mockImplementation(async (path) =>
				path === `blockstates/${alias}.json` ? JSON.stringify(definition) : undefined
			);
		expect(await loader.getBlockState(`minecraft:${name}`)).toEqual(definition);
		expect(await loader.getBlockState(name)).toEqual(definition);
		expect(read).toHaveBeenCalledTimes(2);
	});
	it("prefers the exact pack definition", async () => {
		const loader = new AssetLoader(false);
		const read = vi.spyOn(loader, "getResourceString").mockResolvedValue('{"variants":{}}');
		await loader.getBlockState("iron_chain");
		expect(read).toHaveBeenCalledExactlyOnceWith("blockstates/iron_chain.json");
	});
});
