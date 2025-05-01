import { autocmd, Denops, func, helper, variable } from "./deps.ts";
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
    autoQuit: false,
  };

  constructor(denops: Denops) {
    this.denops = denops;
    this.server = new SynctexServer();
  }

  public async startServer(): Promise<void> {
    if (this.server.isRunning) {
      await helper.echo(this.denops, "[synctex] Already started");
    } else {
      const filetype =
        await variable.options.get(this.denops, "filetype") as string ??
          "no filetype";
      if (!filetype.includes("tex")) {
        await this.denops.call(
          "synctex#__print_error",
          `Unsupported filetypes: ${filetype}`,
        );
        return;
      }
      this.attachListener();
      this.attachedBuf = await func.expand(this.denops, "%:p") as string;
      this.autocmdName = await this.createAutocmd();
      await this.server.serve(this.option.serverHost, this.option.serverPort);
      await helper.echo(this.denops, "synctex start");
    }
  }

  public async closeServer(): Promise<void> {
    if (this.server.isRunning) {
      this.server.close();
      await this.denops.cmd(`autocmd! ${this.autocmdName}`);
      this.autocmdName = undefined;
      this.attachedBuf = undefined;
      if (this.option.autoQuit) {
        await func.system(this.denops, "osascript -l JavaScript", [
          `var app = Application("Skim");`,
          `if(app.exists()) {`,
          `  app.quit();`,
          `}`,
        ]);
      }
      await helper.echo(this.denops, "[synctex] Stop");
    } else {
      await helper.echo(this.denops, "[synctex] Already stopped");
    }
  }

  public async forwardSearch() {
    if (this.server.isRunning == false) {
      await helper.echo(this.denops, "[synctex] Not started");
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
      await helper.echo(this.denops, "[synctex] Attached to other buffer");
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

  public set autoQuit(value: boolean) {
    this.option.autoQuit = value;
  }

  private attachListener() {
    this.server.setListener(async (request: Request) => {
      switch (request.method) {
        case "GET":
          return null;
        case "PUT": {
          const data = await request.text();
          const line = parseInt(data.split(" ")[0]);
          const file = data.split(" ").slice(1).join(" ");
          const currentBuf = await func.expand(this.denops, "%:p") as string;
          if (file == this.attachedBuf && file == currentBuf) {
            await func.cursor(this.denops, line, 1);
            await this.denops.cmd("normal! zv"); // Open folds
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
  autoQuit: boolean;
}
