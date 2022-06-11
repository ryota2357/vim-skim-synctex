import { Denops, unknown } from "./lib/deps.ts";
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
    async forwardSearch(): Promise<void> {
      await app.forwardSearch();
    },
    async option(key: unknown, value: unknown): Promise<void> {
      const id = unknown.ensureString(key);
      switch (id) {
        case "pdfFile": {
          // TODO: 正しいfunctionになってるかチェックしたほうがいい？
          const val = unknown.ensureString(value);
          app.tex2pdfFunctionId = val;
          break;
        }
        case "readingBar": {
          const val = unknown.ensureBoolean(value);
          app.useReadingBar = val;
          break;
        }
        default:
          await denops.call(`echomsg "undefind cuntom option: ${key}"`);
      }
    },
  };
}
