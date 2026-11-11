import { LanguageRepository } from "@/repositories/LanguageRepository";
import { Language } from "@/domain/Language";

export class LanguageRepositoryInMemoryImpl implements LanguageRepository {
  private languages: Map<string, Language> = new Map();

  public async find(isoCode: string): Promise<Language | null> {
    return this.languages.get(isoCode) || null;
  }

  public async findByName(name: string): Promise<Language | null> {
    const lower = name.toLowerCase();
    return [...this.languages.values()].find(l => l.name.toLowerCase() == lower) || null;
  }

  public async findAll(): Promise<Language[]> {
    return [...this.languages.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  public async save(language: Language): Promise<void> {
    this.languages.set(language.isoCode, language);
  }
}
