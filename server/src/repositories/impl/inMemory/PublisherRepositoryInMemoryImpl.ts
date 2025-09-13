import { PublisherRepository } from "@/repositories/PublisherRepository";
import { Publisher } from "@/domain/Publisher";

export class PublisherRepositoryInMemoryImpl implements PublisherRepository {
  private publishers: Map<string, Publisher> = new Map();

  public async find(id: string): Promise<Publisher | null> {
    return this.publishers.get(id) || null;
  }

  public async save(publisher: Publisher): Promise<void> {
    this.publishers.set(publisher.ID, publisher);
  }
}
