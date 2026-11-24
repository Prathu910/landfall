import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";
import { headersFor, parseHeadersFile, type HeaderRule } from "./headers";

/**
 * A static server for out/ that behaves like Cloudflare Pages where Lighthouse
 * can tell: brotli or gzip for text, `_headers` caching, a trailing-slash
 * redirect for directories and 404.html with a 404 status. python's
 * http.server sends everything uncompressed, which skews every score.
 */
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

const COMPRESSIBLE = new Set([
  ".html",
  ".js",
  ".css",
  ".json",
  ".txt",
  ".xml",
  ".svg",
]);

const DEFAULT_CACHE = "public, max-age=0, must-revalidate";

interface Encoded {
  brotli: Buffer;
  gzip: Buffer;
}

function resolveFile(root: string, pathname: string): string | undefined {
  const target = normalize(join(root, decodeURIComponent(pathname)));
  if (!target.startsWith(root)) return undefined;
  if (existsSync(target) && statSync(target).isFile()) return target;
  const index = join(target, "index.html");
  if (existsSync(index)) return index;
  return undefined;
}

export function startStaticServer(options: {
  dir: string;
  host: string;
  port: number;
}): Promise<Server> {
  const root = resolve(options.dir);
  const headersPath = join(root, "_headers");
  const rules: HeaderRule[] = existsSync(headersPath)
    ? parseHeadersFile(readFileSync(headersPath, "utf8"))
    : [];
  const encodedCache = new Map<string, Encoded>();

  function encoded(file: string, body: Buffer): Encoded {
    const cached = encodedCache.get(file);
    if (cached) return cached;
    const result = {
      brotli: brotliCompressSync(body, {
        params: { [constants.BROTLI_PARAM_QUALITY]: 5 },
      }),
      gzip: gzipSync(body, { level: 6 }),
    };
    encodedCache.set(file, result);
    return result;
  }

  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    const pathname = url.pathname;
    let file = resolveFile(root, pathname);
    let status = 200;
    const isDirectory =
      file?.endsWith("index.html") && !pathname.endsWith("index.html");
    if (isDirectory && !pathname.endsWith("/")) {
      response.writeHead(308, { location: `${pathname}/${url.search}` });
      response.end();
      return;
    }
    if (!file) {
      file = join(root, "404.html");
      status = 404;
    }
    const extension = extname(file);
    const body = readFileSync(file);
    const headers: Record<string, string> = {
      "content-type": TYPES[extension] ?? "application/octet-stream",
      "cache-control": DEFAULT_CACHE,
      "x-content-type-options": "nosniff",
      ...headersFor(rules, pathname),
    };
    const accept = String(request.headers["accept-encoding"] ?? "");
    let payload: Buffer = body;
    if (COMPRESSIBLE.has(extension)) {
      headers.vary = "Accept-Encoding";
      if (/\bbr\b/.test(accept)) {
        payload = encoded(file, body).brotli;
        headers["content-encoding"] = "br";
      } else if (/\bgzip\b/.test(accept)) {
        payload = encoded(file, body).gzip;
        headers["content-encoding"] = "gzip";
      }
    }
    headers["content-length"] = String(payload.length);
    response.writeHead(status, headers);
    response.end(request.method === "HEAD" ? undefined : payload);
  });

  return new Promise((done, fail) => {
    server.once("error", fail);
    server.listen(options.port, options.host, () => done(server));
  });
}
