import crypto from "crypto";
import fs from "fs";
import path from "path";
import { isNotJunk } from "junk";
import slash from "slash";
import fetch, { Response } from "node-fetch";
//import Queue from "queue";

import pdf2text from "./pdf2text";
import { Logger, ServerOptions, FileType, getFileType } from "./types";

export type FileToProcess = {
  path: string;
  id: string;
  contentHash: string;
  fileType: FileType;
};

const TWELVE_HOURS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

function getChecksum(fullPath: string): Promise<string> {
  return new Promise(function (resolve, reject) {
    const hash = crypto.createHash("md5");
    const input = fs.createReadStream(fullPath);

    input.on("error", reject);

    input.on("data", function (chunk) {
      hash.update(chunk);
    });

    input.on("close", function () {
      resolve(hash.digest("hex"));
    });
  });
}

export class IndexingServer {
  private baseUrl: string;
  private port: number;
  private folder: string;
  private indexingKey?: string;
  private lastFullIndex?: Date;
  private lastFullIndexTime: number;
  private providerId?: string;
  private log: Logger;

  constructor(options: ServerOptions, log: Logger) {
    this.baseUrl = process.env["GMN_BASE_URL"] ?? "https://gmsnotebook.com";
    this.port = options.port;
    this.folder = options.folder;
    this.indexingKey = options.indexingKey;
    this.lastFullIndex = options.lastFullIndex;
    this.lastFullIndexTime = this.lastFullIndex?.getTime() ?? 0;
    this.providerId = options.providerId;
    this.log = (message: string, type: "log" | "error" = "log") => {
      log(`[${this.port}] ${message}`, type);
    };
  }

  async scanFolder(startPath: string): Promise<FileToProcess[]> {
    const result: FileToProcess[] = [];

    const parentFolderPath = path.join(this.folder, startPath);
    const files = await fs.promises.readdir(parentFolderPath);
    await Promise.all(
      files.filter(isNotJunk).map(async (file) => {
        const fullPath = path.join(parentFolderPath, file);
        const stats = await fs.promises.stat(fullPath);
        if (stats.isDirectory()) {
          const subFiles = await this.scanFolder(path.join(startPath, file));
          result.push(...subFiles);
        } else {
          result.push({
            path: fullPath,
            id: slash(fullPath.replace(this.folder, "")).toLowerCase(),
            contentHash: await getChecksum(fullPath),
            fileType: getFileType(fullPath),
          });
        }
      })
    );

    return result;
  }

  async getFileContents(file: FileToProcess): Promise<string | undefined> {
    if (file.fileType === "markdown") {
      const contents = await fs.promises.readFile(file.path, "utf8");
      return contents.replace(/\r\n/g, "\n");
    } else if (file.fileType === "pdf") {
      const pdfTextResult = await pdf2text(file.path);
      if (pdfTextResult.filter((t) => t.length > 0).length === 0) {
        return "";
      }
      return JSON.stringify(pdfTextResult);
    } else {
      return undefined;
    }
  }

  async indexFile(file: FileToProcess) {
    this.log(`Indexing file ${file.id}`);
    this.log("Getting file contents");
    const content = await this.getFileContents(file);
    if (!content) {
      this.log(`No content for file ${file.id}`);
      return;
    }

    this.log("Posting to indexing service");
    const response = await fetch(`${this.baseUrl}/api/indexing/file`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.indexingKey ?? "",
        "x-port": this.port.toString(),
        "x-provider-id": this.providerId ?? "",
      },
      body: JSON.stringify({
        id: file.id,
        contentHash: file.contentHash,
        fileType: file.fileType,
        content,
      }),
    });

    if (response.status !== 204) {
      this.log(
        `Error indexing file ${file.id}: ${response.status} ${response.statusText}`,
        "error"
      );
    }
  }

  async runIndexing() {
    const files = await this.scanFolder("/");
    const filesToCheck = files.map((file) => ({
      id: file.id,
      contentHash: file.contentHash,
    }));
    let response: Response;
    this.log(`Checking ${filesToCheck.length} files for changes`);
    try {
      response = await fetch(`${this.baseUrl}/api/indexing/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.indexingKey ?? "",
          "x-port": this.port.toString(),
          "x-provider-id": this.providerId ?? "",
        },
        body: JSON.stringify({ files: filesToCheck }),
      });
    } catch (e: any) {
      this.log(
        `Error running indexing (fetching /check): ${e.message}`,
        "error"
      );
      return;
    }

    if (response.status !== 200) {
      this.log(
        `Error running indexing: ${response.status} ${response.statusText}`,
        "error"
      );
      console.log(response.url);
      return;
    }

    const json = await response.json();
    const changedFiles = (json as any).changedFiles as string[];
    const filesToIndex = files.filter((file) => changedFiles.includes(file.id));

    // const q = new Queue({ concurrency: 10 });
    for (const file of filesToIndex) {
      // q.push(async () => {
      //   console.log("Q pre", file.id);
      //   await this.indexFile(file);
      //   console.log("Q post", file.id);
      // });
      await this.indexFile(file);
    }

    // q.addEventListener("success", (e) => {
    //   console.log("job finished processing:", e);
    //   console.log("Queue length:", q.length);
    // });

    // await q.start();

    this.lastFullIndexTime = Date.now();
  }

  async checkTimer() {
    const targetTime = this.lastFullIndexTime + TWELVE_HOURS;
    if (this.lastFullIndexTime === 0 || Date.now() >= targetTime) {
      this.log(`Triggering an indexing run`);
      try {
        await this.runIndexing();
        this.log(`Indexing complete`);
      } catch (e: any) {
        this.log(`Error running indexing: ${e.message}`, "error");
      }
    }
    setTimeout(() => {
      this.checkTimer();
    }, targetTime - this.lastFullIndexTime);
  }
}
