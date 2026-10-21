import { describe, it, expect } from "vitest";
import { shouldRenderFrame } from "../../utils/renderGate";

describe("on-demand rendering gate", () => {
	it("limits idle particle redraws to 20 Hz and stops when no particles are active", () => {
		const state = { needsRender: false, continuous: false, particlesAnimating: true };
		expect(shouldRenderFrame({ ...state, elapsedMs: 49 })).toBe(false);
		expect(shouldRenderFrame({ ...state, elapsedMs: 50 })).toBe(true);
		expect(shouldRenderFrame({ ...state, particlesAnimating: false, elapsedMs: 1000 })).toBe(false);
	});
	it("renders when dirty, skips when clean", () => {
		expect(shouldRenderFrame({ needsRender: true, continuous: false })).toBe(true);
		expect(shouldRenderFrame({ needsRender: false, continuous: false })).toBe(false);
	});

	it("always renders while continuous (animated textures, recording, etc.)", () => {
		expect(shouldRenderFrame({ needsRender: false, continuous: true })).toBe(true);
		expect(shouldRenderFrame({ needsRender: true, continuous: true })).toBe(true);
	});

	it("models continuous reasons as a set: empty = not continuous", () => {
		const reasons = new Set<string>();
		const continuous = () => reasons.size > 0;
		expect(shouldRenderFrame({ needsRender: false, continuous: continuous() })).toBe(false);
		reasons.add("animatedTextures");
		expect(shouldRenderFrame({ needsRender: false, continuous: continuous() })).toBe(true);
		reasons.delete("animatedTextures");
		expect(shouldRenderFrame({ needsRender: false, continuous: continuous() })).toBe(false);
	});
});
