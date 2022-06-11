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
      const op = unknown.ensureString(key);
      switch (op) {
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
        case "hostname": {
          const val = unknown.ensureString(value);
          app.serverHostname = val;
          break;
        }
        case "port": {
          const val = unknown.ensureNumber(value);
          app.serverPortNumber = val;
          break;
        }
        default:
          await denops.call(`echomsg "undefind option: ${key}"`);
      }
    },
  };
}
