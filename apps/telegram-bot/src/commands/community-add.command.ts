import { Markup, Telegraf } from "telegraf";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";
import { message } from "telegraf/filters";
import { ConfigService } from "../config/config.service";

export class CommunityAddCommand extends Command {
  name = "AddCommunity";

  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(config: ConfigService): void {
    this.bot.command("community_add", (ctx) => {
      ctx.reply(
        "To connect your community, please click on the button below.",
        Markup.keyboard(
          [
            Markup.button.groupRequest("Connect my community", 1, {
              chat_is_created: true,
            }),
          ],
          {
            columns: 2,
          }
        )
          .placeholder(
            "To connect your community, please click on the button below."
          )
          .resize(true)
          .oneTime()
      );
    });

    this.bot.on(message("chat_shared"), (ctx) => {
      // ctx.session.courseLike = true;
      // ctx.editMessageText("Cool!");
      console.log(ctx);
      ctx.reply(
        "Successful! You community connected. Now you can set a manager and share the first lecture after that.",
        Markup.inlineKeyboard([
          Markup.button.callback("Button 1", "data"),
          Markup.button.login("Login", config.get("TELEGRAM_BOT_DOMAIN")),
        ])
      );
    });

    // this.bot.action("course_dislike", (ctx) => {
    //   ctx.session.courseLike = false;
    //   ctx.editMessageText("Bad :(");
    // });
  }
}
