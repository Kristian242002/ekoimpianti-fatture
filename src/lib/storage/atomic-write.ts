import { mkdir, open, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Write to a temporary file, fsync it, then rename over the target.
 * rename() is atomic within a filesystem, so a reader never sees a half
 * written file and a crash mid-write cannot corrupt the existing one.
 */
export async function atomicWrite(path: string, content: string): Promise<void> {
  const dir = dirname(path);
  await mkdir(dir, { recursive: true });

  const temporary = join(dir, `.${Date.now()}-${process.pid}.tmp`);

  try {
    await writeFile(temporary, content, "utf8");

    // Without fsync the rename can land before the data does: after a power
    // loss the file exists but is empty.
    const handle = await open(temporary, "r+");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }

    await rename(temporary, path);
  } catch (cause) {
    await import("node:fs/promises").then(({ rm }) =>
      rm(temporary, { force: true }),
    );
    throw cause;
  }
}