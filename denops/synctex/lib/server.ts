export default class Sever {
  private listener: Deno.Listener | undefined;
  private hostname: string | undefined;
  private port: number | undefined;
  private getEvent: (() => Promise<void>) | undefined;
  private putEvent: ((data: string) => Promise<void>) | undefined;

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
      if (request.method == "GET") {
        respondWith(
          new Response(
            `{"name":"vim-synctex-skim","hostname":${this.hostname},"port":${this.port},}\n`,
            {
              status: 200,
              headers: new Headers({ "content-type": "text/json" }),
            },
          ),
        );
        if (this.getEvent) this.getEvent();
      } else if (request.method == "PUT") {
        const data = await request.text();
        console.log("Request Data:", data);
        respondWith(
          new Response(data, {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          }),
        );
        if (this.putEvent) this.putEvent(data);
      } else {
        respondWith(new Response("Not Found", { status: 404 }));
      }
    }
  }

  public set onGet(event: () => Promise<void>) {
    this.getEvent = event;
  }

  public set onPut(event: (data: string) => Promise<void>) {
    this.putEvent = event;
  }

  public close() {
    if (this.listener != undefined) {
      this.listener.close();
      this.listener = undefined;
    }
  }

  public get isRunning(): boolean {
    return this.listener != undefined;
  }
}
