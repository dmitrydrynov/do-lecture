import { Markup, Telegraf } from "telegraf";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";
import { message } from "telegraf/filters";

export class CommunityAddCommand extends Command {
  name = "AddCommunity";

  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.command("communityAdd", (ctx) => {
      ctx.reply(
        "text",
        Markup.keyboard(
          [
            Markup.button.groupRequest("Select group", 1, {
              chat_is_created: true,
            }),
          ],
          {
            columns: 2,
          }
        ),
      );
    });

    this.bot.on(message("chat_shared"), (ctx) => {
      // ctx.session.courseLike = true;
      // ctx.editMessageText("Cool!");
      console.log(ctx);
      ctx.reply("Hm");
    });

    // this.bot.action("course_dislike", (ctx) => {
    //   ctx.session.courseLike = false;
    //   ctx.editMessageText("Bad :(");
    // });
  }
}
