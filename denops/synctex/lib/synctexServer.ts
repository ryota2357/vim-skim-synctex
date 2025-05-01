import { Denops, func } from "./deps.ts";

export default class SynctexSever {
  private server?: Deno.HttpServer<Deno.NetAddr>;
  private observer?: (request: Request) => ObserverResponseType;

  public async serve(hostname: string, port: number): Promise<void> {
    if (this.server) {
      await this.server.shutdown();
      this.server = undefined;
    }
    this.server = Deno.serve({ hostname, port }, async (request) => {
      if (this.observer) {
        const data = await this.observer(request);
        if (data === null) {
          return new Response(this.currentStatusJson(), { status: 200 });
        } else if (data === undefined) {
          return new Response("Not Found", { status: 404 });
        } else {
          return new Response(data, { status: 200 });
        }
      } else {
        return new Response();
      }
    });
  }

  public setListener(func: (request: Request) => ObserverResponseType) {
    this.observer = func;
  }

  public close() {
    if (this.server) {
      this.server.shutdown();
    }
    this.server = undefined;
    this.observer = undefined;
  }

  public async request(denops: Denops, request: ForwardSearchRequest) {
    await func.system(denops, "osascript -l JavaScript", [
      `var app = Application("Skim");`,
      `if(app.exists()) {`,
      `  ${request.activate ? "app.activate();" : ""}`,
      `  app.open("${request.pdfFile}");`,
      `  app.document.go(${
        JSON.stringify({
          to: request.line,
          from: request.texFile,
          showingReadingBar: request.readingBar,
        })
      });`,
      `}`,
    ]);
  }

  public get isRunning(): boolean {
    return this.server !== undefined;
  }

  public info(): Record<string, string | number> {
    return {
      hostname: this.server?.addr.hostname ?? "",
      port: this.server?.addr.port ?? "",
      status: this.isRunning ? "running" : "stopped",
    };
  }

  private currentStatusJson(): string {
    const hostname = this.server?.addr.hostname;
    const port = this.server?.addr.port;
    return `{"name":"vim-skim-synctex","hostname":${hostname},"port":${port},}\n`;
  }
}

type ObserverResponseType = Promise<string | null | undefined>;

interface ForwardSearchRequest {
  pdfFile: string;
  texFile: string;
  line: number;
  readingBar: boolean;
  activate: boolean;
}
