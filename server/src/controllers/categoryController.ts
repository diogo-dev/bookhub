import { Request, Response } from "express";
import { CategoryService } from "@/services/CategoryService";
import { categoryIdParamsSchema, createCategorySchema } from "@/schemas/categorySchemas";

export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  index = async (req: Request, res: Response) => {
    const categories = await this.categoryService.listAll();

    res.status(200).json(categories.map(c => ({ ID: c.ID, name: c.name, decimal: c.decimal })));
  };

  show = async (req: Request, res: Response) => {
    const { id } = categoryIdParamsSchema.parse(req.params);
    const categoryTree = await this.categoryService.getHierarchy(id);

    res.status(200).json(categoryTree);
  };

  create = async (req: Request, res: Response) => {
    const data = createCategorySchema.parse(req.body);
    const category = await this.categoryService.create(data);

    res.status(201).json(category);
  };
}
