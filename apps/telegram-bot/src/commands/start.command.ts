import { Markup, Telegraf } from "telegraf";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";
import { message } from "telegraf/filters";

export class StartCommand extends Command {
  name = "Start";

  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.start((ctx) => {
      ctx.setChatMenuButton
      ctx.reply(
        "Welcome! Let's try to work together ;)",
        // Markup.inlineKeyboard([
        //   Markup.button.callback("Like", "course_like"),
        //   Markup.button.callback("Dislike", "course_dislike"),
        // ])
      );
    });

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
