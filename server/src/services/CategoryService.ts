import { DeweyCategory } from "@/domain/DeweyCategory";
import { CategoryRepository } from "@/repositories/CategoryRepository";
import { HttpError } from "@/errors/HttpError";

export interface CreateCategoryData {
  parentID?: string;
  decimal: string;
  name: string;
}

export class CategoryService {
  constructor(private categoryRepository: CategoryRepository) {}

  async getHierarchy(id: string): Promise<DeweyCategory[]> {
    const category = await this.categoryRepository.find(id);
    if (!category) throw new HttpError(404, "category not found");

    return this.categoryRepository.findHierarchy(category.decimal);
  }

  async listAll(): Promise<DeweyCategory[]> {
    return this.categoryRepository.findAll();
  }

  async create(data: CreateCategoryData): Promise<DeweyCategory> {
    if (data.parentID) {
      const parent = await this.categoryRepository.find(data.parentID);
      if (!parent) throw new HttpError(400, "parent category not found");
    }

    const category = new DeweyCategory();
    category.parentID = data.parentID || null;
    category.decimal = data.decimal;
    category.name = data.name;

    await this.categoryRepository.save(category);
    return category;
  }
}
