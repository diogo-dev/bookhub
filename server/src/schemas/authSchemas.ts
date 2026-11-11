import z from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  cpf: z.string().min(11).max(14),
  password: z.string(),
  roleName: z.string().optional(),
});
