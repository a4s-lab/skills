import type { Store } from "./index.js";

export class Memory implements Store {
  private files = new Map<string, Buffer>();

  async write(path: string, content: Buffer): Promise<void> {
    this.files.set(path, content);
  }

  async read(path: string): Promise<Buffer> {
    const content = this.files.get(path);
    if (!content) {
      throw new Error(`ENOENT: no such file: ${path}`);
    }
    return content;
  }

  async list(prefix: string): Promise<string[]> {
    const normalizedPrefix = prefix.endsWith("/") ? prefix : prefix + "/";
    const dirs = new Set<string>();

    for (const key of this.files.keys()) {
      if (!key.startsWith(normalizedPrefix)) continue;
      const rest = key.slice(normalizedPrefix.length);
      const slashIndex = rest.indexOf("/");
      if (slashIndex !== -1) {
        dirs.add(rest.slice(0, slashIndex));
      }
    }

    return [...dirs];
  }

  async exists(path: string): Promise<boolean> {
    if (this.files.has(path)) return true;
    const dirPrefix = path.endsWith("/") ? path : path + "/";
    for (const key of this.files.keys()) {
      if (key.startsWith(dirPrefix)) return true;
    }
    return false;
  }

  async delete(path: string): Promise<void> {
    const dirPrefix = path.endsWith("/") ? path : path + "/";
    const toDelete = [path];
    for (const key of this.files.keys()) {
      if (key.startsWith(dirPrefix)) toDelete.push(key);
    }
    for (const key of toDelete) this.files.delete(key);
  }
}
