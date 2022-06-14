import { Denops } from "./deps.ts";
import SynctexServer from "./synctexServer.ts";

export default class Application {
  private denops: Denops;
  private server: SynctexServer;
  private option: Option = {
    tex2pdfFunctionId: undefined,
    readingBar: true,
    serverHost: "localhost",
    serverPort: 8080,
    autoActive: false,
  };

  constructor(denops: Denops) {
    this.denops = denops;
    this.server = new SynctexServer();
  }

  public async startServer(): Promise<void> {
    if (this.server.isRunning) {
      this.server.close();
      this.attachListener();
      this.server.serve(this.option.serverHost, this.option.serverPort);
      await this.echo("synctex restart");
    } else {
      this.attachListener();
      this.server.serve(this.option.serverHost, this.option.serverPort);
      await this.echo("synctex start");
    }
  }

  public async closeServer(): Promise<void> {
    if (this.server.isRunning) {
      this.server.close();
      await this.echo("synctex stop");
    } else {
      await this.echo("synctex is already stopped");
    }
  }

  public async forwardSearch() {
    if (this.server.isRunning == false) {
      await this.echo("synctex is not running");
      return;
    }
    const bufname = await this.call<string>("expand", "%:p");
    const cursorLine = (await this.call<number[]>("getpos", "."))[1];
    this.server.request(this.denops, {
      texFile: bufname,
      pdfFile: await this.createPdfPath(bufname),
      line: cursorLine,
      readingBar: this.option.readingBar,
      activate: this.option.autoActive,
    });
  }

  public set tex2pdfFunctionId(id: string) {
    this.option.tex2pdfFunctionId = id;
  }

  public set readingBar(value: boolean) {
    this.option.readingBar = value;
  }

  public set serverHost(hostname: string) {
    this.option.serverHost = hostname;
  }

  public set serverPort(port: number) {
    this.option.serverPort = port;
  }

  public set autoActive(value: boolean) {
    this.option.autoActive = value;
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
    await this.call("cursor", line, 2);
  }

  private async createPdfPath(texPath: string): Promise<string> {
    const id = this.option.tex2pdfFunctionId;
    return id
      ? await this.call<string>("denops#callback#call", id, texPath)
      : texPath.replace(/tex$/, "pdf");
  }

  private async echo(message: string): Promise<void> {
    await this.denops.cmd(`echo "${message}"`);
  }

  private async call<T>(fn: string, ...args: unknown[]): Promise<T> {
    return await this.denops.call(fn, ...args) as T;
  }
}

interface Option {
  tex2pdfFunctionId?: string;
  readingBar: boolean;
  serverHost: string;
  serverPort: number;
  autoActive: boolean;
}
