// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { Event } from "./backend/server";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { GmsNotebookNamespace, ServerConfig, Settings } from "./types";

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
  private servers: ServerConfig[] = [];
  private onServersRefreshedCallback: (newServers: ServerConfig[]) => void;
  private onLogMessageCallback: (message: string) => void;

  constructor(settings: Settings) {
    ipcRenderer.on("server-event-received", (_, event) => {
      this.serverEventHandler(event);
    });

    settings.servers.forEach((server) => {
      server.connected = !!server.connected;
      server.indexingEnabled = !!server.indexingEnabled;
      server.indexingKey = server.indexingKey ?? "";
      this.startServer(server);
    });
  }

  public getServers(): ServerConfig[] {
    return this.servers;
  }

  public saveSettings(): void {
    const settings: Settings = {
      servers: this.getServers(),
    };
    ipcRenderer.send("save-settings", settings);
    if (this.onServersRefreshedCallback) {
      this.onServersRefreshedCallback(this.servers);
    }
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

    if (event.type === "search_index") {
      this.toggleIndexing(event.payload.port, true);
      return;
    }

    if (event.type === "search_index_disable") {
      this.toggleIndexing(event.payload.port, false);
      return;
    }

    if (event.type === "remove_server") {
      this.stopServer(event.payload.port);
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
  }

  private reloadTimer: NodeJS.Timeout;

  private reloadServerDebounced(serverRecord: ServerConfig) {
    clearTimeout(this.reloadTimer);
    this.reloadTimer = setTimeout(() => {
      ipcRenderer.send("reload-server", serverRecord);
    }, 1000);
  }

  public async startServer(server: ServerConfig): Promise<number> {
    let port = startingPort;
    while (this.servers.find((serverRecord) => serverRecord.port === port)) {
      port++;
    }

    server.port = server.port === 0 ? port : server.port;

    await new Promise((resolve) => {
      ipcRenderer.once("server-started", resolve);
      ipcRenderer.send("start-server", server);
    });

    this.servers.push(server);
    this.saveSettings();

    return port;
  }

  public async stopServer(port: number): Promise<void> {
    const serverRecord = this.servers.find(
      (serverRecord) => serverRecord.port === port
    );
    if (serverRecord) {
      await new Promise((resolve) => {
        ipcRenderer.once("server-stopped", resolve);
        ipcRenderer.send("stop-server", serverRecord);
      });
      this.servers = this.servers.filter(
        (serverRecord) => serverRecord.port !== port
      );
      this.saveSettings();
    }
  }

  public async stopAllServers(): Promise<void> {
    await Promise.all(
      this.servers.map((serverRecord) => this.stopServer(serverRecord.port))
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

  public toggleIndexing(port: number, force?: boolean): Promise<void> {
    const serverRecord = this.servers.find(
      (serverRecord) => serverRecord.port === port
    );
    if (!serverRecord) {
      console.error("Server not found:", port);
      return;
    }
    serverRecord.indexingEnabled =
      force !== undefined ? force : !serverRecord.indexingEnabled;
    this.saveSettings();
    this.reloadServerDebounced(serverRecord);
  }

  public openConnect(port: number): void {
    ipcRenderer.send("open-connect", port);
  }
}

ipcRenderer.on("settings-loaded", (_, settings) => {
  window.GmsNotebook = new GmsNotebookServers(settings);
});
