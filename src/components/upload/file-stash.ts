"use client";

// Google sign-in leaves the page, which drops a file held in memory. Before that redirect we park the
// file in IndexedDB and pick it back up when the visitor returns (see ResumeStashedUpload).

const DB = "unspool";
const STORE = "pending-upload";
const KEY = "file";
const MAX_AGE_MS = 30 * 60 * 1000;

type Stashed = { bytes: ArrayBuffer; name: string; type: string; lastModified: number; at: number };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(req.result);
        };
        tx.onerror = tx.onabort = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

export const canStashFiles = () => typeof window !== "undefined" && "indexedDB" in window;

/** Park a file across a full-page redirect. Resolves false if the browser won't store it. */
export async function stashFile(file: File): Promise<boolean> {
  if (!canStashFiles()) return false;
  try {
    const value: Stashed = { bytes: await file.arrayBuffer(), name: file.name, type: file.type, lastModified: file.lastModified, at: Date.now() };
    await run("readwrite", (s) => s.put(value, KEY));
    return true;
  } catch {
    return false;
  }
}

/** Take the parked file back out (removing it). Null if there is none or it's stale. */
export async function takeStashedFile(): Promise<File | null> {
  if (!canStashFiles()) return null;
  try {
    const value = (await run("readonly", (s) => s.get(KEY))) as Stashed | undefined;
    if (!value) return null;
    await run("readwrite", (s) => s.delete(KEY));
    if (!value.bytes || Date.now() - value.at > MAX_AGE_MS) return null;
    return new File([value.bytes], value.name, { type: value.type, lastModified: value.lastModified });
  } catch {
    return null;
  }
}

/** Query flag on the OAuth return URL (`/?resume=1`) so the page knows to resume the parked upload. */
export const RESUME_PARAM = "resume";
export const RESUME_VALUE = "1";
