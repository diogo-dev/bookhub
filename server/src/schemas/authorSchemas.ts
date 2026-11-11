import z from "zod";

export const authorIdParamsSchema = z.object({
  id: z.uuid(),
});

export const createAuthorSchema = z.object({
  name: z.string(),
  biography: z.string().optional().default(""),
  birthDate: z.coerce.date().optional(),
  deathDate: z.coerce.date().optional(),
});

export const findOrCreateAuthorSchema = z.object({
  name: z.string().min(1),
});
