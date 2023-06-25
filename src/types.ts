import type { Server } from "gms-notebook-file-server";

export interface ServerConfig {
  port: number;
  folderPath: string;
  connected?: boolean;
  indexingKey?: string;
}

export interface ServerRecord extends ServerConfig {
  server: Server;
}

export interface Settings {
  servers: ServerConfig[];
}

export interface GmsNotebookNamespace {
  saveSettings(): void;
  getServers(): ServerConfig[];
  startServer(folderPath: string): Promise<number>;
  stopServer(port: number): Promise<void>;
  stopAllServers(): Promise<void>;
  chooseFolder(): Promise<ServerConfig | undefined>;
}

declare global {
  interface Window {
    GmsNotebook: GmsNotebookNamespace;
  }
}
