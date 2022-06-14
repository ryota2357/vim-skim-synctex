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
          app.readingBar = val;
          break;
        }
        case "hostname": {
          const val = unknown.ensureString(value);
          app.serverHost = val;
          break;
        }
        case "port": {
          const val = unknown.ensureNumber(value);
          app.serverPort = val;
          break;
        }
        case "autoActive": {
          const val = unknown.ensureBoolean(value);
          app.autoActive = val;
          break;
        }
        default:
          await denops.cmd([
            `echohl ErrorMsg`,
            `echo "[synctex] undefined option: ${key}"`,
            `echohl None`,
          ].join(" | "));
      }
    },
  };
}
