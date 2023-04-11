import { Markup, Telegraf } from "telegraf";
import { type Update } from "typegram/update";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";
import { either, message } from "telegraf/filters";
import { ConfigService } from "../config/config.service";

export class StartCommand extends Command {
  name = "Start";

  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(config: ConfigService): void {
    this.bot.start((ctx) => {
      ctx.reply(
        "Welcome! Let's try to work together ;)",
        Markup.inlineKeyboard([
          Markup.button.login("Login", config.get("TELEGRAM_BOT_DOMAIN"), {
            request_write_access: true,
          }),
        ])
        // Markup.inlineKeyboard([
        //   Markup.button.callback("Like", "course_like"),
        //   Markup.button.callback("Dislike", "course_dislike"),
        // ])
      );
    });

    // this.bot.use((ctx, next) => {
    //   console.log(ctx);
    //   return next();
    // });

    // this.bot.action("course_like", (ctx) => {
    //   ctx.session.courseLike = true;
    //   ctx.editMessageText("Cool!");
    // });

    // this.bot.action("course_dislike", (ctx) => {
    //   ctx.session.courseLike = false;
    //   ctx.editMessageText("Bad :(");
    // });
  }
}
