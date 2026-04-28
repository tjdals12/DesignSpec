import fs from "node:fs/promises";
import path from "node:path";

export class FileSystemUtils {
  static async createDirectory(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  static async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch (error) {
      if (error instanceof Error && "code" in error) {
        if (error.code !== "ENOENT") {
          console.debug(
            `Unable to check if directory exists at ${dirPath}: ${error.message}`,
          );
        }
      }
      return false;
    }
  }

  static async ensureWritePermissions(dirPath: string): Promise<boolean> {
    try {
      const dirExists = await this.directoryExists(dirPath);
      if (!dirExists) {
        const parentDir = path.dirname(dirPath);
        const parentDirExists = await this.directoryExists(parentDir);
        if (!parentDirExists) {
          await this.createDirectory(parentDir);
        }
        const hasPermissions = await this.ensureWritePermissions(parentDir);
        return hasPermissions;
      }

      const testFile = path.join(
        dirPath,
        ".design-spec-test-" +
          Date.now() +
          "-" +
          Math.random().toString(36).slice(2),
      );
      await fs.writeFile(testFile, "");

      const maxRetries = 3;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          await fs.unlink(testFile);
          break;
        } catch (error) {
          if (attempt === maxRetries - 1) {
            const message =
              error instanceof Error ? error.message : String(error);
            console.debug(
              `Could not clean up test file ${testFile}: ${message}`,
            );
          } else {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.debug(
        `Insufficient permissions to write to ${dirPath}: ${message}`,
      );
      return false;
    }
  }

  static async writeFile(filePath: string, content: string): Promise<void> {
    const dirPath = path.dirname(filePath);
    await this.createDirectory(dirPath);
    await fs.writeFile(filePath, content, "utf-8");
  }

  static async toCanonicalPath(targetPath: string): Promise<string> {
    try {
      return await fs.realpath(targetPath);
    } catch {
      return path.resolve(targetPath);
    }
  }

  static toPoxisPath(targetPath: string): string {
    return targetPath.replace(/\\/g, "/");
  }
}
