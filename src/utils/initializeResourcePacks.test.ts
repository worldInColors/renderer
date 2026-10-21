import { describe, expect, it, vi } from "vitest";
import { initializeResourcePacks } from "./initializeResourcePacks";
import type { Cubane } from "../cubane/Cubane";
import type { ResourcePackManager } from "../managers/ResourcePackManager";

function fixture(restored: string[] = [], enabled = ["tweaks", "vanilla"], count = enabled.length) {
	const desired = enabled.map((hash) => ({ hash, blob: new Blob([hash]) }));
	const cubane = {
		ready: vi.fn().mockResolvedValue(undefined),
		getEnabledPacks: vi.fn(() => restored.map((hash) => ({ hash }))),
		beginPackBatchUpdate: vi.fn(),
		removeAllPacks: vi.fn().mockResolvedValue(undefined),
		loadResourcePack: vi.fn().mockResolvedValue(undefined),
		endPackBatchUpdate: vi.fn().mockResolvedValue(undefined),
	};
	const manager = {
		initPromise: Promise.resolve(),
		getResourcePackBlobs: vi.fn().mockResolvedValue(desired.map((pack) => pack.blob)),
		getEnabledPacksWithBlobs: vi.fn(() => [...desired]),
		getPackCount: vi.fn(() => count),
	};
	const run = () =>
		initializeResourcePacks(cubane as unknown as Cubane, manager as unknown as ResourcePackManager);
	return { cubane, manager, desired, run };
}

describe("resource pack startup", () => {
	it("waits for restoration before inspecting or changing packs", async () => {
		const { cubane, manager, run } = fixture();
		let resolve!: () => void;
		cubane.ready.mockReturnValue(
			new Promise<void>((done) => {
				resolve = done;
			})
		);
		const pending = run();
		await Promise.resolve();
		expect(cubane.getEnabledPacks).not.toHaveBeenCalled();
		expect(manager.getResourcePackBlobs).not.toHaveBeenCalled();
		resolve();
		await pending;
		expect(cubane.loadResourcePack).toHaveBeenCalledTimes(2);
	});
	it("loads vanilla first and the higher-priority overlay last in one batch", async () => {
		const { cubane, desired, run } = fixture();
		await run();
		expect(cubane.loadResourcePack.mock.calls).toEqual([[desired[1].blob], [desired[0].blob]]);
		expect(cubane.beginPackBatchUpdate).toHaveBeenCalledTimes(1);
		expect(cubane.endPackBatchUpdate).toHaveBeenCalledTimes(1);
	});
	it("repairs the order of restored packs, even when the count matches", async () => {
		const { cubane, run } = fixture(["tweaks", "vanilla"]);
		await run();
		expect(cubane.removeAllPacks).toHaveBeenCalledOnce();
		expect(cubane.loadResourcePack).toHaveBeenCalledTimes(2);
	});
	it("keeps a matching cached atlas without loading packs or rebuilding", async () => {
		const { cubane, manager, run } = fixture(["vanilla", "tweaks"]);
		await run();
		expect(manager.getResourcePackBlobs).toHaveBeenCalledOnce();
		expect(cubane.loadResourcePack).not.toHaveBeenCalled();
		expect(cubane.beginPackBatchUpdate).not.toHaveBeenCalled();
	});
	it("clears restored packs when all configured packs are disabled", async () => {
		const { cubane, run } = fixture(["vanilla"], [], 1);
		await run();
		expect(cubane.removeAllPacks).toHaveBeenCalledOnce();
		expect(cubane.loadResourcePack).not.toHaveBeenCalled();
	});
	it("preserves standalone Cubane packs if no renderer packs are configured", async () => {
		const { cubane, run } = fixture(["custom"], [], 0);
		await run();
		expect(cubane.removeAllPacks).not.toHaveBeenCalled();
	});
});
