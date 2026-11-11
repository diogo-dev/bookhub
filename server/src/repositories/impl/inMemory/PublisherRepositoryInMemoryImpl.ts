import { PublisherRepository } from "@/repositories/PublisherRepository";
import { Publisher } from "@/domain/Publisher";

export class PublisherRepositoryInMemoryImpl implements PublisherRepository {
  private publishers: Map<string, Publisher> = new Map();

  public async find(name: string): Promise<Publisher | null> {
    return this.publishers.get(this.normalized(name)) || null;
  }

  public async findAll(): Promise<Publisher[]> {
    return [...this.publishers.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  public async save(publisher: Publisher): Promise<void> {
    this.publishers.set(publisher.name, publisher);
  }

  private normalized(name: string): string {
    return name.toLowerCase().trim();
  }
}
