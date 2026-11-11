import { Request, Response } from "express";
import { PublisherService } from "@/services/PublisherService";
import {
  createPublisherSchema,
  findOrCreatePublisherSchema,
  publisherNameParamsSchema,
} from "@/schemas/publisherSchemas";

export class PublisherController {
  constructor(private publisherService: PublisherService) {}

  index = async (req: Request, res: Response) => {
    const publishers = await this.publisherService.listAll();

    res.status(200).json(publishers.map(p => ({ name: p.name, displayName: p.displayName })));
  };

  show = async (req: Request, res: Response) => {
    const { name } = publisherNameParamsSchema.parse(req.params);
    const publisher = await this.publisherService.getByName(name);

    res.status(200).json(publisher);
  };

  create = async (req: Request, res: Response) => {
    const { displayName } = createPublisherSchema.parse(req.body);
    const { entity, created } = await this.publisherService.findOrCreate(displayName);

    res.status(created ? 201 : 200).json(entity);
  };

  findOrCreate = async (req: Request, res: Response) => {
    const { displayName } = findOrCreatePublisherSchema.parse(req.body);
    const { entity, created } = await this.publisherService.findOrCreate(displayName);

    res.status(created ? 201 : 200).json(entity);
  };
}
