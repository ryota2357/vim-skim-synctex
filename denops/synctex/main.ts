import { ensure, Entrypoint, is } from "./lib/deps.ts";
import Application from "./lib/application.ts";

export const main: Entrypoint = (denops) => {
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
    status(): Promise<Record<string, string | number>> {
      return Promise.resolve(app.status());
    },
    async option(key: unknown, value: unknown): Promise<void> {
      const op = ensure(key, is.String);
      switch (op) {
        case "pdfFile": {
          const val = ensure(value, is.String);
          app.tex2pdfFunctionId = val;
          break;
        }
        case "readingBar": {
          const val = ensure(value, is.Boolean);
          app.readingBar = val;
          break;
        }
        case "hostname": {
          const val = ensure(value, is.String);
          app.serverHost = val;
          break;
        }
        case "port": {
          const val = ensure(value, is.Number);
          app.serverPort = val;
          break;
        }
        case "autoActive": {
          const val = ensure(value, is.Boolean);
          app.autoActive = val;
          break;
        }
        case "autoQuit": {
          const val = ensure(value, is.Boolean);
          app.autoQuit = val;
          break;
        }
        default:
          await denops.call(
            "synctex#__print_error",
            `Undefined option: ${key}`,
          );
      }
    },
  };
};
