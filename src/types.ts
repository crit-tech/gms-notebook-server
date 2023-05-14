import type { Server } from "gms-notebook-file-server";

export interface ServerPortAndFolderPath {
  port: number;
  folderPath: string;
}

export interface ServerRecord extends ServerPortAndFolderPath {
  server: Server;
}

export interface GmsNotebookNamespace {
  startServer(folderPath: string): Promise<number>;
  stopServer(port: number): Promise<void>;
  stopAllServers(): Promise<void>;
  chooseFolder(): Promise<ServerPortAndFolderPath | undefined>;
}

declare global {
  interface Window {
    GmsNotebook: GmsNotebookNamespace;
  }
}
