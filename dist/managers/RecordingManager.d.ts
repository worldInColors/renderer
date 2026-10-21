import { SchematicRenderer } from "../SchematicRenderer";
/**
 * Video output codec / format.
 * - "h264":        H.264 in MP4 — opaque, lossy, very small (~1–10 Mbps).
 * - "dnxhr_444":   Avid DNxHR 444 in MOV — 12-bit 4:4:4 + alpha. Fixed-bitrate (~880 Mbps @ 1080p60).
 * - "prores_4444": Apple ProRes 4444 in MOV — 4:4:4 + alpha. Fixed-bitrate (~330 Mbps @ 1080p60).
 * - "vp9_alpha":   VP9 in WebM — yuva420p alpha. Variable bitrate, fully tunable (~5–60 Mbps).
 * - "png_zip":     ZIP archive of PNG frames — lossless, frame-perfect, no encoding step.
 *                  Often smallest for sparse transparent scenes; works with any compositor.
 *
 * Any codec marked alpha-capable implies transparent recording: alpha mode is enabled
 * on the renderer and intermediate frames are forced to PNG.
 */
export type RecordingCodec = "h264" | "dnxhr_444" | "prores_4444" | "vp9_alpha" | "png_zip";
export interface RecordingOptions {
    width?: number;
    height?: number;
    frameRate?: number;
    quality?: number;
    /** Output codec. Default "h264". Use "dnxhr_444" for transparent MOV. */
    codec?: RecordingCodec;
    /**
     * Force a transparent-background recording. When true, the output is hard-locked to
     * DNxHR 444 in a QuickTime MOV with a real alpha channel — regardless of any `codec`
     * passed alongside. Use this when you want "transparent or fail," not "transparent if convenient."
     */
    transparent?: boolean;
    /** Use JPEG for intermediate frames (faster, smaller) vs PNG (lossless). Ignored for codec="dnxhr_444" (PNG forced). */
    useJpegFrames?: boolean;
    /** JPEG quality for intermediate frames (0.8-0.95 recommended) */
    jpegQuality?: number;
    /** Batch size for writing frames to FFmpeg (higher = more memory, faster) */
    batchSize?: number;
    /** FFmpeg encoding preset (H.264 only — ignored for DNxHR) */
    encodingPreset?: "ultrafast" | "superfast" | "veryfast" | "faster" | "fast" | "medium";
    /** CRF value for encoding quality. H.264: 18–28 (lower=better). VP9: 15–35 (lower=better, default 30). Ignored for DNxHR/ProRes (fixed bitrate). */
    crf?: number;
    /**
     * Target video bitrate in Mbps. Only honored by `vp9_alpha` — switches it from
     * constant-quality to constant-bitrate. Ignored by every other codec.
     */
    bitrateMbps?: number;
    onStart?: () => void;
    onProgress?: (progress: number) => void;
    onFfmpegProgress?: (progress: number, time: number) => void;
    onComplete?: (blob: Blob) => void;
    /**
     * Custom camera driver callback. Called before each frame with progress (0-1).
     * When provided, the recording loop uses this instead of animateCameraAlongPath.
     * Use this to drive the camera with keyframes, custom paths, etc.
     */
    onFrame?: (progress: number) => void;
}
/**
 * True for codecs that produce a real alpha channel.
 * Drives the alpha-mode renderer toggle and PNG-frames enforcement.
 */
export declare function codecNeedsAlpha(codec: RecordingCodec): boolean;
/**
 * True for codecs that go through FFmpeg. The `png_zip` codec skips FFmpeg
 * entirely (we zip the captured PNG frames directly with JSZip).
 */
export declare function codecIsFFmpegEncoded(codec: RecordingCodec): boolean;
/**
 * Resolve the effective codec from a (possibly partial) RecordingOptions.
 * `transparent: true` hard-locks the result to an alpha-capable codec — there is no
 * fallback to H.264 once transparent is requested. If the caller specified a non-alpha
 * codec alongside `transparent: true`, we upgrade to the DNxHR 444 default.
 * Pure helper — exported for testing.
 */
export declare function resolveCodec(opts: {
    codec?: RecordingCodec;
    transparent?: boolean;
}): RecordingCodec;
/**
 * Build the FFmpeg argv array for the given codec.
 * Pure helper — exported for testing.
 *
 * `bitrateMbps` is only used by codecs that support variable bitrate (currently vp9_alpha).
 * When provided, VP9 switches from constant-quality to constant-bitrate.
 */
export declare function buildFfmpegArgs(opts: {
    codec: RecordingCodec;
    frameRate: number;
    ext: string;
    encodingPreset: string;
    crf: number;
    bitrateMbps?: number;
}): string[];
/**
 * Output filename + MIME type for the given codec.
 * Pure helper — exported for testing.
 */
export declare function getOutputInfo(codec: RecordingCodec): {
    filename: string;
    mimeType: string;
};
export interface ScreenshotOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: "image/png" | "image/jpeg" | "image/webp";
    /** Capture with transparent background (requires alpha-capable renderer) */
    transparent?: boolean;
}
export declare class RecordingManager {
    private static warnedNoFfmpeg;
    isRecording: boolean;
    private schematicRenderer;
    private recordingCanvas;
    private ctx2d;
    private ffmpeg?;
    private frameCount;
    private originalSettings;
    private frameBuffer;
    private pendingWrites;
    private useJpegFrames;
    private jpegQuality;
    private rawFrames;
    private useFastCapture;
    private alphaModeToRestore;
    private ffmpegLogBuffer;
    private readonly FFMPEG_LOG_MAX;
    private ffmpegLogHandler;
    constructor(schematicRenderer: SchematicRenderer);
    /**
     * Fast synchronous frame capture - stores raw ImageData for later encoding
     * This is much faster than toBlob() during real-time capture
     */
    private captureFrameSync;
    /**
     * Convert ImageData to JPEG/PNG blob asynchronously
     */
    private imageDataToBlob;
    /**
     * Capture a frame optimized for video recording
     * Uses JPEG by default for much faster encoding (3-5x faster than PNG)
     */
    private captureFrame;
    /**
     * Capture frame for PNG screenshots (lossless)
     */
    private captureFramePNG;
    setCameraToFirstPathPoint(): void;
    /**
     * Takes a screenshot of the current view.
     * Supports PNG, JPEG, WebP formats with optional transparency.
     */
    takeScreenshot(options?: ScreenshotOptions): Promise<Blob>;
    /** Re-encode a blob to a different image format via offscreen canvas */
    private reencodeBlob;
    private setupTemporarySettings;
    private restoreSettings;
    private setupRecording;
    /**
     * Write frames to FFmpeg in batches for better performance
     */
    private flushFrameBuffer;
    startRecording(duration: number, options?: RecordingOptions): Promise<void>;
    /**
     * Cleanup frames asynchronously in background
     */
    private cleanupFramesAsync;
    /**
     * Read PNG frames out of FFmpeg's MEMFS and pack them into a ZIP blob.
     * Used by the `png_zip` codec — bypasses video encoding entirely so the
     * output is the original lossless frames, plus a manifest.json.
     */
    private packFramesAsZip;
    /** Start buffering ffmpeg's log output for error surfacing. */
    private attachFfmpegLogCapture;
    private detachFfmpegLogCapture;
    /**
     * Wrap an ffmpeg.exec failure with the last log lines so the caller sees a
     * real error message instead of "undefined". The original ffmpeg.wasm
     * exception is usually a plain non-zero exit code with no message.
     */
    private wrapFfmpegError;
    private cleanup;
    stopRecording(): void;
    /**
     * Recording path using a custom onFrame callback for camera control.
     * Captures frames synchronously in a loop, then encodes with FFmpeg.
     */
    private startRecordingWithFrameCallback;
    dispose(): void;
}
//# sourceMappingURL=RecordingManager.d.ts.map