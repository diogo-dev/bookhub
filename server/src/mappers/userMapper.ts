import { UserAccount } from "@/domain/UserAccount";

export function toUserResponse(user: UserAccount) {
  return {
    id: user.ID,
    name: user.name,
    email: user.email,
    cpf: user.cpf,
    roles: user.roles.map(r => r.name),
    createdAt: user.createdAt,
  };
}

// Mantém o formato do domínio (ID, roles completos) usado pelo client, apenas sem o hash da senha
export function withoutPasswordHash<T extends { password_hash: string }>(entity: T): Omit<T, "password_hash"> {
  const { password_hash, ...rest } = entity;
  return rest;
}
