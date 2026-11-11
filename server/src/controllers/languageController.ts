import { Request, Response } from "express";
import { LanguageService } from "@/services/LanguageService";
import {
  createLanguageSchema,
  findOrCreateLanguageSchema,
  languageIsoCodeParamsSchema,
} from "@/schemas/languageSchemas";

export class LanguageController {
  constructor(private languageService: LanguageService) {}

  index = async (req: Request, res: Response) => {
    const languages = await this.languageService.listAll();

    res.status(200).json(languages.map(l => ({ isoCode: l.isoCode, name: l.name })));
  };

  show = async (req: Request, res: Response) => {
    const { iso_code } = languageIsoCodeParamsSchema.parse(req.params);
    const language = await this.languageService.getByIsoCode(iso_code);

    res.status(200).json(language);
  };

  create = async (req: Request, res: Response) => {
    const { isoCode, name } = createLanguageSchema.parse(req.body);
    const { entity, created } = await this.languageService.create(isoCode, name);

    res.status(created ? 201 : 200).json(entity);
  };

  findOrCreate = async (req: Request, res: Response) => {
    const { name, isoCode } = findOrCreateLanguageSchema.parse(req.body);
    const { entity, created } = await this.languageService.findOrCreate(name, isoCode);

    res.status(created ? 201 : 200).json(entity);
  };
}
