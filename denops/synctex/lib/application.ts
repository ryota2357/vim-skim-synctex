import { Denops } from "./deps.ts";
import Server from "./server.ts";

export default class Application {
  private denops: Denops;
  private server: Server;

  constructor(denops: Denops) {
    this.denops = denops;
    this.server = new Server();
    this.server.onPut = this.setCursor.bind(this);
  }

  public async startServer(): Promise<void> {
    if (this.server.isRunning) {
      this.server.close();
      await this.denops.cmd(`echo "synctex restarted"`);
      this.server.serve();
    } else {
      this.server.serve();
      await this.denops.cmd(`echo "synctex started"`);
    }
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

  private async setCursor(data: string): Promise<void> {
    const line = parseInt(data.split(" ")[0]);
    await this.denops.cmd(`echo "on put"`);
    console.log(line);
    await this.denops.call("cursor", line, 2);
  }
}
