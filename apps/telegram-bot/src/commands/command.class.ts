import { Telegraf } from "telegraf";
import { IBotContext } from "../context/context.interface";
import { IConfigService } from "../config/config.interface";

export abstract class Command {
  abstract readonly name: string;

  constructor(public bot: Telegraf<IBotContext>) {}

  abstract handle(config?: IConfigService): void;
}
