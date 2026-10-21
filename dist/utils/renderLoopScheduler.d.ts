/**
 * Schedules the render loop's next tick, owning the (frame | poll) handles so the
 * loop can re-arm correctly after it idles.
 *
 * The bug this fixes: the loop idles by scheduling a slow `setTimeout` poll instead
 * of a `requestAnimationFrame`. The old inline logic never cleared the *frame*
 * handle when a frame fired, so during an idle poll the handle still held a stale,
 * already-fired rAF id. `invalidate()` checked `frameId === null` to decide whether
 * to re-arm, saw the stale non-null id, and scheduled nothing — leaving the loop
 * dead (e.g. a mouse drag begun after the scene settled looked frozen until a direct
 * render). `beginTick()` clears that spent handle at the start of every tick, so the
 * pending-state is always accurate and `wake()` can re-arm.
 *
 * Invariant: at most one of (frame, poll) is pending at any time.
 *
 * Timer primitives are injected so this is unit-testable without a real rAF clock.
 */
export interface LoopTimers {
    requestFrame: (cb: () => void) => number;
    cancelFrame: (id: number) => void;
    setTimer: (cb: () => void, ms: number) => number;
    clearTimer: (id: number) => void;
}
export declare class RenderLoopScheduler {
    private readonly timers;
    private readonly tick;
    private frameId;
    private pollId;
    constructor(timers: LoopTimers, tick: () => void);
    /**
     * Call at the very start of each tick: the frame that invoked it has fired, so
     * its handle is spent. Clearing it keeps the pending-state accurate for wake().
     */
    beginTick(): void;
    /** Queue the next tick as a vsync-aligned frame. No-op if a tick is already queued. */
    requestFrame(): void;
    /**
     * Queue the next tick as a slow idle poll: wait `delayMs`, then run a vsync-aligned
     * frame. No-op if a tick is already queued.
     */
    requestPoll(delayMs: number): void;
    /** Wake immediately: drop a pending idle poll and ensure a frame is queued. */
    wake(): void;
    /** Cancel any pending frame/poll (suspend, dispose). */
    stop(): void;
}
//# sourceMappingURL=renderLoopScheduler.d.ts.map