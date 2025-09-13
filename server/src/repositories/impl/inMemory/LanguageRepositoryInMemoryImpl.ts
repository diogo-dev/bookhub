import { LanguageRepository } from "@/repositories/LanguageRepository";
import { Language } from "@/domain/Language";

export class LanguageRepositoryInMemoryImpl implements LanguageRepository {
  private languages: Map<string, Language> = new Map();

  public async find(isoCode: string): Promise<Language | null> {
    return this.languages.get(isoCode) || null;
  }

  public async save(language: Language): Promise<void> {
    this.languages.set(language.isoCode, language);
  }
}
