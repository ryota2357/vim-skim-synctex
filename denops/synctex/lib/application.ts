import { autocmd, Denops, func, helper } from "./deps.ts";
import SynctexServer from "./synctexServer.ts";

export default class Application {
  private denops: Denops;
  private server: SynctexServer;
  private attachedBuf?: string;
  private autocmdName?: string;
  private option: Option = {
    tex2pdfFunctionId: undefined,
    readingBar: false,
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
      await helper.echo(this.denops, "synctex is already started");
    } else {
      this.attachListener();
      this.attachedBuf = await func.expand(this.denops, "%:p") as string;
      this.autocmdName = await this.createAutocmd();
      this.server.serve(this.option.serverHost, this.option.serverPort);
      await helper.echo(this.denops, "synctex start");
    }
  }

  public async closeServer(): Promise<void> {
    if (this.server.isRunning) {
      this.server.close();
      await this.denops.cmd(`autocmd! ${this.autocmdName}`);
      this.autocmdName = undefined;
      this.attachedBuf = undefined;
      await helper.echo(this.denops, "synctex stop");
    } else {
      await helper.echo(this.denops, "synctex is already stopped");
    }
  }

  public async forwardSearch() {
    if (this.server.isRunning == false) {
      await helper.echo(this.denops, "synctex is not started");
      return;
    }

    const currentBuf = await func.expand(this.denops, "%:p") as string;
    const cursorLine = (await func.getcurpos(this.denops))[1];

    if (currentBuf == this.attachedBuf) {
      this.server.request(this.denops, {
        texFile: currentBuf,
        pdfFile: await this.createPdfPath(currentBuf),
        line: cursorLine,
        readingBar: this.option.readingBar,
        activate: this.option.autoActive,
      });
    } else {
      await helper.echo(this.denops, "synctex is started in other buffer");
    }
  }

  public status() {
    const info = this.server.info();
    info["attached"] = this.attachedBuf ?? "";
    return info;
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
      switch (request.method) {
        case "GET":
          return null;
        case "PUT": {
          const data = await request.text();
          const line = parseInt(data.split(" ")[0]);
          const file = data.split(" ")[1];
          const currentBuf = await func.expand(this.denops, "%:p") as string;
          console.log([
            `file: ${file}`,
            `attached: ${this.attachedBuf}`,
            `currentBuf: ${currentBuf}`,
            `equal: ${file == this.attachedBuf && file == currentBuf}`,
          ].join("\n"));
          if (file == this.attachedBuf && file == currentBuf) {
            await func.cursor(this.denops, line, 1);
          }
          return data;
        }
        default:
          return undefined;
      }
    });
  }

  private async createAutocmd(): Promise<string> {
    const name = `synctex-${await func.bufname(this.denops)}`;
    await autocmd.group(this.denops, name, (helper) => {
      helper.define(
        ["BufDelete"],
        "<buffer>",
        `call denops#notify("synctex", "stop", [])`,
      );
    });
    return name;
  }

  private async createPdfPath(texPath: string): Promise<string> {
    const id = this.option.tex2pdfFunctionId;
    return id
      ? await this.denops.call("denops#callback#call", id, texPath) as string
      : texPath.replace(/tex$/, "pdf");
  }
}

interface Option {
  tex2pdfFunctionId?: string;
  readingBar: boolean;
  serverHost: string;
  serverPort: number;
  autoActive: boolean;
}
