// nbtParseWorker.ts — boss-class litematic parsing off the main thread.
// The JS NBT read of a 465MB-decompressed boss file takes tens of seconds; on the
// main thread that freezes the tab for the duration. The raw (already-gunzipped)
// ArrayBuffer is transferred in, the populated grid + plain palette transferred out;
// SchematicWrapper.fromParsed revives the duck-typed instance on the main side.
import { SchematicWrapper } from "./JsNbtSchematic";

self.onmessage = (e: MessageEvent) => {
	const { buf } = e.data as { buf: ArrayBuffer };
	try {
		const w = new SchematicWrapper(buf);
		const grid = (w as any).grid as Uint32Array;
		const palette = (w as any).palette as any[];
		const dims = w.get_dimensions();
		(self as any).postMessage({ ok: true, grid, palette, sx: dims[0], sy: dims[1], sz: dims[2] }, [
			grid.buffer,
		]);
	} catch (err) {
		(self as any).postMessage({ ok: false, error: String(err) });
	}
};
