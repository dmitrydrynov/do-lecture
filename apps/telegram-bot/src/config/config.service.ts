import { DotenvParseOutput, config } from "dotenv";
import { IConfigService } from "./config.interface";

export class ConfigService implements IConfigService {
  private config: DotenvParseOutput;

  constructor() {
    const { error, parsed } = config();

    if (error) throw Error("Not found .env file");
    if (!parsed) throw Error("File .env is empty");

    this.config = parsed;
  }

  get(key: string): string {
    const res = this.config[key];
    if (!res) throw Error("There is not the key");

    return res;
  }
}
