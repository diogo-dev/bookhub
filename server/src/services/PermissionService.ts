import { Permission } from "@/domain/Permission";
import { PermissionRepository } from "@/repositories/PermissionRepository";
import { HttpError } from "@/errors/HttpError";

export class PermissionService {
  constructor(private permissionRepository: PermissionRepository) {}

  async getById(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.find(id);
    if (!permission) throw new HttpError(404, "permission not found");
    return permission;
  }

  async create(name: string): Promise<Permission> {
    const existing = await this.permissionRepository.findByName(name);
    if (existing) throw new HttpError(400, "permission name already registered");

    const permission = new Permission(name);
    await this.permissionRepository.save(permission);
    return permission;
  }
}
