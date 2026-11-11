import { Publisher } from "@/domain/Publisher";

export interface PublisherRepository {
  save(publisher: Publisher): Promise<void>;
  find(name: string): Promise<Publisher | null>;
  findAll(): Promise<Publisher[]>;
}
