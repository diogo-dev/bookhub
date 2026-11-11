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
