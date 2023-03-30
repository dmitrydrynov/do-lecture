import { Markup, Telegraf } from "telegraf";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";

export class CommunityAddCommand extends Command {
  name = "AddCommunity";

  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.command("communityAdd", (ctx) => {
      ctx.reply(
        "text",
        Markup.inlineKeyboard([Markup.button.groupRequest("Select group", 1)])
      );
    });

    this.bot.action("chat_shared", (ctx) => {
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
