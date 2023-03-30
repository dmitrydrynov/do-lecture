import { Telegraf } from "telegraf";
import { IBotContext } from "../context/context.interface";

export abstract class Command {
  abstract readonly name: string;

  constructor(public bot: Telegraf<IBotContext>) {}

  abstract handle(): void;
}
