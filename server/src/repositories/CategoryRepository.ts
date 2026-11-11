import { DeweyCategory } from "@/domain/DeweyCategory";

export interface CategoryRepository {
  save(category: DeweyCategory): Promise<void>;
  find(id: string): Promise<DeweyCategory | null>;
  findAll(): Promise<DeweyCategory[]>;
  findHierarchy(decimal: string): Promise<DeweyCategory[]>;
}
