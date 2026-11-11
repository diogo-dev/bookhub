import z from "zod";

export const categoryIdParamsSchema = z.object({
  id: z.uuid(),
});

export const createCategorySchema = z.object({
  parentID: z.uuid().optional(),
  decimal: z.string(),
  name: z.string(),
});
