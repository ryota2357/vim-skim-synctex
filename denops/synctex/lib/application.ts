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
      await this.denops.cmd(`echo "synctex restart"`);
    } else {
      await this.denops.cmd(`echo "synctex start"`);
    }
    this.attachListener();
    this.server.serve();
  }

  public async closeServer(): Promise<void> {
    if (this.server.isRunning == false) {
      await this.denops.cmd(`echo "synctex is already stopped"`);
    } else {
      this.server.close();
      await this.denops.cmd(`echo "synctex stop"`);
    }
  }

  public async toggleServerState(): Promise<void> {
    if (this.server.isRunning) {
      this.server.close();
      await this.denops.cmd(`echo "server stopped"`);
    } else {
      this.server.serve();
      await this.denops.cmd(`echo "server started"`);
    }
  }

  public async forwardSearch() {
    const bufname = await this.denops.call("expand", "%:p") as string;
    const cursorLine = (await this.denops.call("getpos", ".") as number[])[1];
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
}
