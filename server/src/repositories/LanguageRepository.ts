import { Language } from "@/domain/Language";

export interface LanguageRepository {
  save(language: Language): Promise<void>;
  find(isoCode: string): Promise<Language | null>;
  findByName(name: string): Promise<Language | null>;
  findAll(): Promise<Language[]>;
}
