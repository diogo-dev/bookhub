import { Role } from "@/domain/Role";
import { Permission } from "@/domain/Permission";
import { RoleRepository } from "@/repositories/RoleRepository";
import { PermissionRepository } from "@/repositories/PermissionRepository";
import { HttpError } from "@/errors/HttpError";

export class RoleService {
  constructor(
    private roleRepository: RoleRepository,
    private permissionRepository: PermissionRepository,
  ) {}

  async getById(id: string): Promise<Role> {
    const role = await this.roleRepository.find(id);
    if (!role) throw new HttpError(404, "role not found");
    return role;
  }

  async create(name: string, permissionNames: string[] = []): Promise<Role> {
    const existing = await this.roleRepository.getRoleByName(name);
    if (existing) throw new HttpError(400, "role name already registered");

    const permissions: Permission[] = await Promise.all(
      permissionNames.map(async (permName) => {
        const permission = await this.permissionRepository.findByName(permName);
        if (!permission) throw new HttpError(404, `Permission '${permName}' not found`);
        return permission;
      })
    );

    const role = new Role(name, permissions);
    await this.roleRepository.save(role);
    return role;
  }
}
