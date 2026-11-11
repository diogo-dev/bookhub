import { Request, Response } from "express";
import { PermissionService } from "@/services/PermissionService";
import { createPermissionSchema, permissionIdParamsSchema } from "@/schemas/permissionSchemas";

export class PermissionController {
  constructor(private permissionService: PermissionService) {}

  show = async (req: Request, res: Response) => {
    const { id } = permissionIdParamsSchema.parse(req.params);
    const permission = await this.permissionService.getById(id);

    res.status(200).json(permission);
  };

  create = async (req: Request, res: Response) => {
    const { name } = createPermissionSchema.parse(req.body);
    const permission = await this.permissionService.create(name);

    res.status(201).json(permission);
  };
}
