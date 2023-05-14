// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { startServer } from "gms-notebook-file-server";
import { ipcRenderer, IpcRendererEvent } from "electron";

import {
  GmsNotebookNamespace,
  ServerPortAndFolderPath,
  ServerRecord,
} from "./types";

const startingPort = 3001;

export class GmsNotebookServers implements GmsNotebookNamespace {
  private servers: ServerRecord[] = [];

  public async startServer(folderPath: string): Promise<number> {
    const port = startingPort + this.servers.length;
    const server = startServer(port, folderPath);
    const serverRecord = { port, folderPath, server };
    this.servers.push(serverRecord);
    return port;
  }

  public async stopServer(port: number): Promise<void> {
    const serverRecord = this.servers.find(
      (serverRecord) => serverRecord.port === port
    );
    if (serverRecord) {
      await new Promise((resolve) => serverRecord.server.close(resolve));
      this.servers = this.servers.filter(
        (serverRecord) => serverRecord.port !== port
      );
    }
  }

  public async stopAllServers(): Promise<void> {
    await Promise.all(
      this.servers.map(
        (serverRecord) =>
          new Promise((resolve) => serverRecord.server.close(resolve))
      )
    );
    this.servers = [];
  }

  public chooseFolder(): Promise<ServerPortAndFolderPath> {
    return new Promise<ServerPortAndFolderPath>((resolve) => {
      ipcRenderer.once(
        "folder-chosen",
        async (event: IpcRendererEvent, arg: string) => {
          const port = await this.startServer(arg);
          resolve({ port, folderPath: arg });
        }
      );

      ipcRenderer.once("folder-choose-cancelled", () => {
        resolve(undefined);
      });

      ipcRenderer.send("choose-folder");
    });
  }
}

window.GmsNotebook = new GmsNotebookServers();
