import { Telegraf } from "telegraf";
import { IConfigService } from "./config/config.interface";
import { ConfigService } from "./config/config.service";
import { IBotContext } from "./context/context.interface";
import { Command } from "./commands/command.class";
import { StartCommand } from "./commands/start.command";
import LocalSession from "telegraf-session-local";
import { CommunityAddCommand } from "./commands/community-add.command";

class Bot {
  bot: Telegraf<IBotContext>;
  commands: Command[] = [];

  constructor(public readonly configService: IConfigService) {
    this.bot = new Telegraf<IBotContext>(
      this.configService.get("TELEGRAM_BOT_TOKEN")
    );
    this.bot.use(new LocalSession({ database: "sessions.json" }).middleware());
  }

  init() {
    this.commands = [
      new StartCommand(this.bot),
      new CommunityAddCommand(this.bot),
    ];

    console.log(
      "Initialized the following commands: " +
        this.commands.map((c) => c.name).join(", ")
    );

    for (const command of this.commands) {
      command.handle(this.configService);
    }

    this.bot.launch();
  }
}

const bot = new Bot(new ConfigService());
bot.init();
