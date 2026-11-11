import z from "zod";

export const registerAccountSchema = z.object({
  email: z.email(),
  password: z.string(),
});
