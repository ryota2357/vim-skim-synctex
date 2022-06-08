import { Denops } from "./lib/deps.ts";
import Application from "./lib/application.ts";

export function main(denops: Denops): void {
  const app = new Application(denops);
  denops.dispatcher = {
    async start(): Promise<void> {
      await app.startServer();
    },
    async stop(): Promise<void> {
      await app.closeServer();
    },
    async toggle(): Promise<void> {
      await app.toggleServerState();
    },
    async forwardSearch(): Promise<void> {
      await app.forwardSearch();
    },
  };
}
