/**
 * Low-level storage backend for reading and writing raw files.
 */
export interface Store {
  /** Write content to the given path, creating parent directories as needed. */
  write(path: string, content: Buffer): Promise<void>;
  /** Read raw content from the given path. */
  read(path: string): Promise<Buffer>;
  /** List immediate child directory names under the given prefix. */
  list(prefix: string): Promise<string[]>;
  /** Check whether a file or directory exists at the given path. */
  exists(path: string): Promise<boolean>;
  /** Recursively delete the file or directory at the given path. */
  delete(path: string): Promise<void>;
}

export { Memory } from "./memory.js";
export { FS } from "./fs.js";
