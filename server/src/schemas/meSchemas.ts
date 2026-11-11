import z from "zod";

export const updateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.email().optional(),
  password: z.string().optional(),
});

export const addInterestSchema = z.object({
  bookISBN: z.string().max(13).regex(/^\d+$/),
});

export const interestIsbnParamsSchema = z.object({
  isbn: z.string().max(13).regex(/^\d+$/),
});
