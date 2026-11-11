import { Request, Response } from "express";
import { RoleService } from "@/services/RoleService";
import { createRoleSchema, roleIdParamsSchema } from "@/schemas/roleSchemas";

export class RoleController {
  constructor(private roleService: RoleService) {}

  show = async (req: Request, res: Response) => {
    const { id } = roleIdParamsSchema.parse(req.params);
    const role = await this.roleService.getById(id);

    res.status(200).json(role);
  };

  create = async (req: Request, res: Response) => {
    const { name, permissionNames } = createRoleSchema.parse(req.body);
    const role = await this.roleService.create(name, permissionNames);

    res.status(201).json(role);
  };
}
