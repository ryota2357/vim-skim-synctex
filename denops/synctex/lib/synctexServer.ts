export default class SynctexSever {
  private listener?: Deno.Listener;
  private hostname?: string;
  private port?: number;
  private observer?: ((request: Request) => ObserverResponseType);

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

  private currentStatusJson(): string {
    return `{"name":"vim-synctex-skim","hostname":${this.hostname},"port":${this.port},}\n`;
  }

  public setListener(func: (request: Request) => ObserverResponseType) {
    this.observer = func;
  }

  public request(request: ForwardSearchRequest) {
    // TODO: impliment
    console.log(request);
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
}

type ObserverResponseType = Promise<string | null | undefined>;

interface ForwardSearchRequest {
  file: string;
  line: number;
}
