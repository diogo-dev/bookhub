import z from "zod";

export const userIdParamsSchema = z.object({
  id: z.uuid(),
});

export const userCpfParamsSchema = z.object({
  cpf: z.string().min(11).max(14),
});

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  cpf: z.string().min(11).max(14),
  password: z.string().min(6),
  roleName: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.email().optional(),
  password: z.string().optional(),
  roleNames: z.array(z.string()).optional(),
});

export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
