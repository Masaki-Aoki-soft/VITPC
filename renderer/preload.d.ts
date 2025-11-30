import { IpcHandler } from '../main/preload'

declare global {
  interface Window {
    ipc: IpcHandler & {
      invoke(channel: string, ...args: unknown[]): Promise<unknown>
    }
  }
}
