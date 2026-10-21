/**
 * Trailing-edge debounce with cancel/flush. Used by the slicer overlay so
 * scrubbing a slider doesn't trigger a `rebuildMesh()` on every pointer move.
 *
 * - `delay <= 0` runs synchronously (no setTimeout).
 * - Calls during the delay window re-arm the timer and overwrite the args.
 * - `cancel()` drops any pending call. `flush()` invokes it immediately.
 */
export interface DebouncedFunction<TArgs extends unknown[]> {
    (...args: TArgs): void;
    cancel(): void;
    flush(): void;
}
export declare function debounce<TArgs extends unknown[]>(fn: (...args: TArgs) => void, delay: number): DebouncedFunction<TArgs>;
//# sourceMappingURL=debounce.d.ts.map