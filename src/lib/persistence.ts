import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Database } from "./types";

/**
 * Where the database document and uploaded photographs are kept.
 *
 * - Locally (and on any single long-running server) everything lives in
 *   `.data/` on disk.
 * - On Vercel, where several function instances run side by side and the
 *   filesystem is per-instance, a private Vercel Blob store is used instead,
 *   with ETag-conditional writes so concurrent bids cannot overwrite each other.
 */
export type Stored = { db: Database; etag: string | null };

export type Upload = { body: ReadableStream<Uint8Array> | Uint8Array; contentType: string };

export interface Backend {
  /** True when several server instances share this backend, so local caches can go stale. */
  readonly shared: boolean;
  read(): Promise<Stored | null>;
  /**
   * Writes the database. `etag` is the version the change was based on (null
   * when creating it). Throws `ConflictError` if someone else wrote first.
   */
  write(db: Database, etag: string | null): Promise<string | null>;
  saveUpload(name: string, bytes: Uint8Array, contentType: string): Promise<void>;
  readUpload(name: string): Promise<Upload | null>;
}

export class ConflictError extends Error {
  constructor() {
    super("The database changed while this update was being made.");
  }
}

export const DATA_DIR = process.env.MALISA_DATA_DIR ?? path.join(process.cwd(), ".data");

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export function fileBackend(dir: string = DATA_DIR): Backend {
  const dbFile = path.join(dir, "db.json");
  const uploads = path.join(dir, "uploads");
  let warned = false;

  return {
    shared: false,
    async read() {
      try {
        const [text, info] = await Promise.all([readFile(dbFile, "utf8"), stat(dbFile)]);
        return { db: JSON.parse(text) as Database, etag: String(info.mtimeMs) };
      } catch {
        return null;
      }
    },
    async write(db) {
      // A single process serialises its own writes, so there is nothing to conflict with.
      try {
        await mkdir(dir, { recursive: true });
        const tmp = `${dbFile}.${randomUUID()}.tmp`;
        await writeFile(tmp, JSON.stringify(db));
        await rename(tmp, dbFile);
      } catch (error) {
        if (!warned) {
          warned = true;
          console.warn("[malisa] Could not write the data file; changes stay in memory only.", error);
        }
      }
      return null;
    },
    async saveUpload(name, bytes) {
      await mkdir(uploads, { recursive: true });
      await writeFile(path.join(uploads, name), bytes);
    },
    async readUpload(name) {
      try {
        const bytes = await readFile(path.join(uploads, name));
        return { body: new Uint8Array(bytes), contentType: TYPES[name.split(".").pop() ?? ""] ?? "application/octet-stream" };
      } catch {
        return null;
      }
    },
  };
}

const DB_PATH = "malisa/db.json";
const UPLOAD_PREFIX = "malisa/uploads/";

export function blobBackend(): Backend {
  // Loaded lazily so local development never needs the Blob SDK or credentials.
  const sdk = import("@vercel/blob");

  return {
    shared: true,
    async read() {
      const { get } = await sdk;
      const result = await get(DB_PATH, { access: "private", useCache: false });
      if (!result || result.statusCode !== 200) return null;
      const text = await new Response(result.stream).text();
      return { db: JSON.parse(text) as Database, etag: result.blob.etag };
    },
    async write(db, etag) {
      const { put, BlobPreconditionFailedError } = await sdk;
      try {
        const blob = await put(DB_PATH, JSON.stringify(db), {
          access: "private",
          contentType: "application/json",
          addRandomSuffix: false,
          cacheControlMaxAge: 60,
          ...(etag ? { allowOverwrite: true, ifMatch: etag } : { allowOverwrite: false }),
        });
        return blob.etag;
      } catch (error) {
        // A failed create means another instance seeded the store first.
        if (error instanceof BlobPreconditionFailedError || !etag) throw new ConflictError();
        throw error;
      }
    },
    async saveUpload(name, bytes, contentType) {
      const { put } = await sdk;
      await put(`${UPLOAD_PREFIX}${name}`, Buffer.from(bytes), {
        access: "private",
        contentType,
        addRandomSuffix: false,
      });
    },
    async readUpload(name) {
      const { get } = await sdk;
      const result = await get(`${UPLOAD_PREFIX}${name}`, { access: "private" });
      if (!result || result.statusCode !== 200) return null;
      return { body: result.stream, contentType: result.blob.contentType };
    },
  };
}

/** Blob when the deployment has Blob credentials, the local filesystem otherwise. */
export function selectBackend(): Backend {
  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN || (!!process.env.BLOB_STORE_ID && !!process.env.VERCEL);
  return hasBlob ? blobBackend() : fileBackend();
}
