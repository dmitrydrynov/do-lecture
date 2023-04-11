import { Context } from "telegraf";
import { IConfigService } from "../config/config.interface";

export interface SessionData {
  courseLike: boolean;
}

export interface IBotContext extends Context {
  session: SessionData;
  env: IConfigService;
}
