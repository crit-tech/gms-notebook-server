// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { startServer, Event } from "gms-notebook-file-server";
import { ipcRenderer, IpcRendererEvent } from "electron";

import {
  GmsNotebookNamespace,
  ServerConfig,
  ServerRecord,
  Settings,
} from "./types";

interface ConnectEvent {
  type: "connect";
  payload: {
    port: number;
    indexingKey: string;
    providerId: string;
  };
}

const startingPort = 3001;

export class GmsNotebookServers implements GmsNotebookNamespace {
  private servers: ServerRecord[] = [];
  private tempDir: string;
  private onServersRefreshedCallback: (newServers: ServerConfig[]) => void;
  private onLogMessageCallback: (message: string) => void;

  constructor() {
    let settings: Settings = { servers: [] };
    try {
      const settingsString = process.argv
        .find((arg) => arg.startsWith("--settings="))
        .substring(11);
      console.log("Settings:", settingsString);
      settings = JSON.parse(settingsString);
    } catch (e) {
      // Ignore
    }

    this.tempDir = process.argv
      .find((arg) => arg.startsWith("--tempdir="))
      .substring(10);
    console.log("Temp Dir:", this.tempDir);

    settings.servers.forEach((server) => {
      server.connected = !!server.connected;
      server.indexingEnabled = !!server.indexingEnabled;
      server.indexingKey = server.indexingKey ?? "";
      this.startServer(server);
    });
  }

  public getServers(): ServerConfig[] {
    return this.servers.map((serverRecord) => ({
      port: serverRecord.port,
      folderPath: serverRecord.folderPath,
      connected: serverRecord.connected,
      indexingEnabled: serverRecord.indexingEnabled,
      indexingKey: serverRecord.indexingKey,
      providerId: serverRecord.providerId,
    }));
  }

  public saveSettings(): void {
    const settings: Settings = {
      servers: this.getServers(),
    };
    ipcRenderer.send("save-settings", settings);
  }

  public onServersRefreshed(
    callback: (newServers: ServerConfig[]) => void
  ): void {
    this.onServersRefreshedCallback = callback;
  }

  public onLogMessage(callback: (message: string) => void): void {
    this.onLogMessageCallback = callback;
  }

  serverEventHandler(event: Event) {
    if (event.type === "log") {
      if (this.onLogMessageCallback) {
        this.onLogMessageCallback(event.payload);
      }
      return;
    }

    if (event.type === "error") {
      if (this.onLogMessageCallback) {
        this.onLogMessageCallback("ERROR: " + event.payload);
      }
      return;
    }

    if (event.type !== "connect") {
      console.log("Unhandled event:", event);
      return;
    }

    const connectEvent = event as ConnectEvent;
    const serverRecord = this.servers.find(
      (serverRecord) => serverRecord.port === connectEvent.payload.port
    );
    if (!serverRecord) {
      console.error("Server not found:", connectEvent.payload.port);
      return;
    }
    serverRecord.connected = true;
    serverRecord.indexingKey = connectEvent.payload.indexingKey;
    serverRecord.providerId = connectEvent.payload.providerId;
    this.saveSettings();
    if (this.onServersRefreshedCallback) {
      this.onServersRefreshedCallback(this.getServers());
    }
  }

  public async startServer(server: ServerConfig): Promise<number> {
    let port = startingPort;
    while (this.servers.find((serverRecord) => serverRecord.port === port)) {
      port++;
    }

    const newServer = startServer(
      {
        port,
        folder: server.folderPath,
        indexingEnabled: server.indexingEnabled,
        indexingKey: server.indexingKey,
        providerId: server.providerId,
      },
      this.tempDir,
      this.serverEventHandler.bind(this)
    );
    const serverRecord = { ...server, port, server: newServer };
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

  public chooseFolder(): Promise<ServerConfig> {
    return new Promise<ServerConfig>((resolve) => {
      ipcRenderer.once(
        "folder-chosen",
        async (event: IpcRendererEvent, arg: string) => {
          const newServer: ServerConfig = {
            port: 0,
            folderPath: arg,
            connected: false,
            indexingEnabled: false,
            indexingKey: "",
            providerId: "",
          };
          newServer.port = await this.startServer(newServer);
          resolve(newServer);
        }
      );

      ipcRenderer.once("folder-choose-cancelled", () => {
        resolve(undefined);
      });

      ipcRenderer.send("choose-folder");
    });
  }

  public toggleIndexing(port: number): Promise<void> {
    const serverRecord = this.servers.find(
      (serverRecord) => serverRecord.port === port
    );
    if (!serverRecord) {
      console.error("Server not found:", port);
      return;
    }
    serverRecord.indexingEnabled = !serverRecord.indexingEnabled;
    this.saveSettings();
  }

  public openConnect(port: number): void {
    ipcRenderer.send("open-connect", port);
  }
}

window.GmsNotebook = new GmsNotebookServers();
