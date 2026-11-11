import { Request, Response } from "express";
import { AuthorService } from "@/services/AuthorService";
import { authorIdParamsSchema, createAuthorSchema, findOrCreateAuthorSchema } from "@/schemas/authorSchemas";

export class AuthorController {
  constructor(private authorService: AuthorService) {}

  index = async (req: Request, res: Response) => {
    const authors = await this.authorService.listAll();

    res.status(200).json(authors.map(a => ({ ID: a.ID, name: a.name })));
  };

  show = async (req: Request, res: Response) => {
    const { id } = authorIdParamsSchema.parse(req.params);
    const author = await this.authorService.getById(id);

    res.status(200).json(author);
  };

  create = async (req: Request, res: Response) => {
    const data = createAuthorSchema.parse(req.body);
    const { entity, created } = await this.authorService.findOrCreate(data);

    res.status(created ? 201 : 200).json(entity);
  };

  findOrCreate = async (req: Request, res: Response) => {
    const { name } = findOrCreateAuthorSchema.parse(req.body);
    const { entity, created } = await this.authorService.findOrCreate({ name });

    res.status(created ? 201 : 200).json(entity);
  };
}
