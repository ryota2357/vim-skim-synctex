import { Denops } from "./deps.ts";
import SynctexServer from "./synctexServer.ts";

export default class Application {
  private denops: Denops;
  private server: SynctexServer;

  constructor(denops: Denops) {
    this.denops = denops;
    this.server = new SynctexServer();
  }

  public async startServer(): Promise<void> {
    if (this.server.isRunning) {
      this.server.close();
      await this.echo("synctex restart");
    } else {
      await this.echo("synctex start");
    }
    this.attachListener();
    this.server.serve();
  }

  public async closeServer(): Promise<void> {
    if (this.server.isRunning == false) {
      await this.echo("synctex is already stopped");
    } else {
      this.server.close();
      await this.echo("synctex stop");
    }
  }

  public async toggleServerState(): Promise<void> {
    if (this.server.isRunning) {
      this.server.close();
      await this.echo("server stopped");
    } else {
      this.server.serve();
      await this.echo("server started");
    }
  }

  public async forwardSearch() {
    const bufname = await this.call<string>("expand", "%:p");
    const cursorLine = (await this.call<number[]>("getpos", "."))[1];
    this.server.request(this.denops, {
      file: bufname,
      line: cursorLine,
    });
  }

  private attachListener() {
    this.server.setListener(async (request: Request) => {
      if (request.method == "GET") return null;
      if (request.method == "PUT") {
        const data = await request.text();
        this.setCursor(data);
        return data;
      }
      return undefined;
    });
  }

  private async setCursor(data: string): Promise<void> {
    const line = parseInt(data.split(" ")[0]);
    await this.denops.cmd(`echo "on put"`);
    console.log(line);
    await this.denops.call("cursor", line, 2);
  }

  private async echo(message: string): Promise<void> {
    await this.denops.cmd(`echo ${message}`);
  }

  private async call<T>(fn: string, ...args: unknown[]): Promise<T> {
    return await this.denops.call(fn, args) as T;
  }
}
