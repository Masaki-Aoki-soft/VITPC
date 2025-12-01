import { IpcHandler } from '../main/preload'

interface ElectronAPI {
  getConfig: () => Promise<{
    clerkPublishableKey?: string;
    clerkSecretKey?: string;
    [key: string]: any;
  }>;
}

declare global {
  interface Window {
    ipc: IpcHandler;
    electronAPI: ElectronAPI;
  }
}
