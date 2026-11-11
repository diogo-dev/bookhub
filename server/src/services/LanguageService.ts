import { Language } from "@/domain/Language";
import { LanguageRepository } from "@/repositories/LanguageRepository";
import { HttpError } from "@/errors/HttpError";

export interface FindOrCreateResult<T> {
  entity: T;
  created: boolean;
}

export class LanguageService {
  constructor(private languageRepository: LanguageRepository) {}

  async getByIsoCode(isoCode: string): Promise<Language> {
    const language = await this.languageRepository.find(isoCode);
    if (!language) throw new HttpError(404, "language not found");
    return language;
  }

  async listAll(): Promise<Language[]> {
    return this.languageRepository.findAll();
  }

  async create(isoCode: string, name: string): Promise<FindOrCreateResult<Language>> {
    const existing = await this.languageRepository.find(isoCode);
    if (existing) return { entity: existing, created: false };

    return { entity: await this.save(isoCode, name), created: true };
  }

  async findOrCreate(name: string, isoCode?: string): Promise<FindOrCreateResult<Language>> {
    if (isoCode) {
      const existing = await this.languageRepository.find(isoCode);
      if (existing) return { entity: existing, created: false };
    }

    const existingByName = await this.languageRepository.findByName(name);
    if (existingByName) return { entity: existingByName, created: false };

    return { entity: await this.save(isoCode || this.guessIsoCode(name), name), created: true };
  }

  private async save(isoCode: string, name: string): Promise<Language> {
    const language = new Language();
    language.isoCode = isoCode;
    language.name = name;

    await this.languageRepository.save(language);
    return language;
  }

  private guessIsoCode(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes("português")) return "pt-BR";
    if (lower.includes("inglês")) return "en-US";
    if (lower.includes("espanhol")) return "es-ES";
    if (lower.includes("francês")) return "fr-FR";
    return name.substring(0, 2).toLowerCase() + "-" + name.substring(0, 2).toUpperCase();
  }
}
