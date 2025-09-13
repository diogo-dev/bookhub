import { LanguageRepository } from "@/repositories/LanguageRepository";
import { Language } from "@/domain/Language";
import { Client } from "pg";

export interface LanguageRecord {
  iso_code: string;
  name: string;
}

export class LanguageRepositoryPostgresImpl implements LanguageRepository {
  constructor(private client: Client) {}

  public async find(isoCode: string): Promise<Language | null> {
    const result = await this.client.query("SELECT * FROM language WHERE iso_code = $1;", [isoCode]);

    if (result.rows.length == 0) return null;
    else return this.deserialize(result.rows[0]);
  }

  public async save(language: Language): Promise<void> {
    const result = await this.client.query("SELECT * FROM language WHERE iso_code = $1;", [language.isoCode]);
    const recordExists = result.rows.length > 0;

    if (recordExists) {
      await this.client.query(
        "UPDATE language SET name = $2 WHERE iso_code = $1;",
        [language.isoCode, language.name]
      );
    } else {
      await this.client.query(
        "INSERT INTO language (iso_code, name) VALUES ($1, $2);",
        [language.isoCode, language.name]
      );
    }
  }

  private deserialize(record: LanguageRecord): Language {
    const language = new Language();
    language.isoCode = record.iso_code;
    language.name = record.name;
    return language;
  }
}
