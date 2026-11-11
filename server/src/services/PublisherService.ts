import { Publisher } from "@/domain/Publisher";
import { PublisherRepository } from "@/repositories/PublisherRepository";
import { HttpError } from "@/errors/HttpError";
import { FindOrCreateResult } from "@/services/LanguageService";

export class PublisherService {
  constructor(private publisherRepository: PublisherRepository) {}

  async getByName(name: string): Promise<Publisher> {
    const publisher = await this.publisherRepository.find(name);
    if (!publisher) throw new HttpError(404, "publisher not found");
    return publisher;
  }

  async listAll(): Promise<Publisher[]> {
    return this.publisherRepository.findAll();
  }

  async findOrCreate(displayName: string): Promise<FindOrCreateResult<Publisher>> {
    const existing = await this.publisherRepository.find(displayName);
    if (existing) return { entity: existing, created: false };

    const publisher = new Publisher();
    publisher.displayName = displayName;

    await this.publisherRepository.save(publisher);
    return { entity: publisher, created: true };
  }
}
