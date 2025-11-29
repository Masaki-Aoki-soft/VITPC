export interface IpcApi {
  send: (channel: string, value: unknown) => void;
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
}

declare global {
  interface Window {
    ipc: IpcApi;
  }
}
