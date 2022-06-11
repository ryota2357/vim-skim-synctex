import { Denops } from "./deps.ts";

export default class SynctexSever {
  private listener?: Deno.Listener;
  private hostname?: string;
  private port?: number;
  private observer?: (request: Request) => ObserverResponseType;

  public async serve(hostname = "localhost", port = 8080): Promise<void> {
    if (this.listener != undefined) {
      this.listener.close();
      this.listener = undefined;
    }
    this.hostname = hostname;
    this.port = port;
    this.listener = Deno.listen({ hostname: hostname, port: port });
    for await (const conn of this.listener) {
      this.handleHttp(conn);
    }
  }

  public setListener(func: (request: Request) => ObserverResponseType) {
    this.observer = func;
  }

  public close() {
    if (this.listener != undefined) {
      this.listener.close();
      this.listener = undefined;
    }
    this.observer = undefined;
  }

  public get isRunning(): boolean {
    return this.listener != undefined;
  }

  private async handleHttp(conn: Deno.Conn) {
    for await (const event of Deno.serveHttp(conn)) {
      const { request, respondWith } = event;
      if (this.observer) {
        const data = await this.observer(request);
        if (data === null) {
          respondWith(new Response(this.currentStatusJson(), { status: 200 }));
        } else if (data === undefined) {
          respondWith(new Response("Not Found", { status: 404 }));
        } else {
          respondWith(new Response(data, { status: 200 }));
        }
      }
    }
  }

  public async request(denops: Denops, request: ForwardSearchRequest) {
    const script = [
      `osascript -l JavaScript -e '`,
      `var app = Application("Skim");`,
      `if(app.exists()) {`,
      `  app.activate();`,
      `  app.open("${request.pdfFile}");`,
      `  app.document.go({to: ${request.line}, from: "${request.texFile}", showingReadingBar: ${request.readingBar}});`,
      `}'`,
    ].join(" ");
    const ret = await denops.call("system", ["sh", "-c", script]) as string;
    console.log(ret);
  }

  private currentStatusJson(): string {
    return `{"name":"vim-synctex-skim","hostname":${this.hostname},"port":${this.port},}\n`;
  }
}

type ObserverResponseType = Promise<string | null | undefined>;

interface ForwardSearchRequest {
  pdfFile: string;
  texFile: string;
  line: number;
  readingBar?: boolean;
}
