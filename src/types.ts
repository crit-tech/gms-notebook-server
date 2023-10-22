export interface ServerConfig {
  port: number;
  folderPath: string;
  connected: boolean;
  indexingEnabled: boolean;
  indexingKey: string;
  providerId: string;
}

export interface Settings {
  servers: ServerConfig[];
}

export interface GmsNotebookNamespace {
  saveSettings(): void;
  getServers(): ServerConfig[];
  startServer(server: ServerConfig): Promise<number>;
  stopServer(port: number): Promise<void>;
  stopAllServers(): Promise<void>;
  chooseFolder(): Promise<ServerConfig | undefined>;
  onServersRefreshed(callback: (newServers: ServerConfig[]) => void): void;
  onLogMessage(callback: (message: string) => void): void;
  toggleIndexing(port: number): void;
  openConnect(port: number): void;
}

declare global {
  interface Window {
    GmsNotebook: GmsNotebookNamespace;
  }
}
