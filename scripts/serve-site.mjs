// serve-site.mjs — static server for dist-site/ with the headers the renderer needs
// (COOP/COEP for SharedArrayBuffer-based worker pools; correct MIME for wasm/data files).
// usage: node scripts/serve-site.mjs [port]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import zlib from "node:zlib";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist-site");
const port = parseInt(process.argv[2] || "5199", 10);

const MIME = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json",
	".wasm": "application/wasm",
	".png": "image/png",
	".jpg": "image/jpeg",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
	".zip": "application/zip",
	".litematic": "application/octet-stream",
	".schem": "application/octet-stream",
	".nbt": "application/octet-stream",
	".hdr": "application/octet-stream",
	".exr": "application/octet-stream",
	".ktx2": "image/ktx2",
};

const server = http.createServer((req, res) => {
	try {
		const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
		let file = path.join(root, urlPath);
		if (urlPath.endsWith("/")) file = path.join(file, "index.html");
		// resolve and prevent traversal
		const resolved = path.resolve(file);
		if (!resolved.startsWith(root)) { res.writeHead(403).end(); return; }
		let target = resolved;
		if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
			// SPA-ish fallback for page routes
			target = path.join(root, "index.html");
			if (!fs.existsSync(target)) { res.writeHead(404).end("not found"); return; }
		}
		const ext = path.extname(target).toLowerCase();
		const data = fs.readFileSync(target);
		const etag = '"' + createHash("sha1").update(data).digest("hex").slice(0, 16) + '"';
		if (req.headers["if-none-match"] === etag) { res.writeHead(304).end(); return; }
		const headers = {
			"Content-Type": MIME[ext] || "application/octet-stream",
			"Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600",
			ETag: etag,
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cross-Origin-Embedder-Policy": "credentialless",
		};
		// the JS bundle is ~12.5MB raw / 2.7MB gzipped — compress text types when the
		// client accepts it (tunnels like localhost.run don't compress for us)
		const compressible = /\.(js|mjs|css|html|json|svg|wasm)$/.test(ext);
		const accept = String(req.headers["accept-encoding"] || "");
		if (compressible && data.length > 1024) {
			if (accept.includes("gzip")) {
				const gz = zlib.gzipSync(data, { level: 6 });
				headers["Content-Encoding"] = "gzip";
				headers["Content-Length"] = gz.length;
				res.writeHead(200, headers);
				res.end(gz);
				return;
			}
			if (accept.includes("deflate")) {
				const df = zlib.deflateSync(data, { level: 6 });
				headers["Content-Encoding"] = "deflate";
				headers["Content-Length"] = df.length;
				res.writeHead(200, headers);
				res.end(df);
				return;
			}
		}
		headers["Content-Length"] = data.length;
		res.writeHead(200, headers);
		res.end(data);
	} catch (e) {
		res.writeHead(500).end(String(e));
	}
});
server.listen(port, () => console.log(`dist-site on http://localhost:${port}`));
