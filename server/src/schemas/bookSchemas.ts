import z from "zod";
import { bcp47Pattern } from "@/schemas/languageSchemas";

const isbn = z.string().max(13).regex(/^\d+$/, "ISBN inválido");

// Remove hífens/espaços antes de validar (ex.: "978-85-..." -> "97885...")
const normalizedIsbn = z.preprocess(
  value => (typeof value === "string" ? value.replace(/\D/g, "") : value),
  isbn
);

const languageCode = z.string().min(2).max(35).regex(bcp47Pattern);

export const isbnParamsSchema = z.object({
  isbn: normalizedIsbn,
});

export const genreParamsSchema = z.object({
  genre: z.string().min(1),
});

export const listBooksQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(1000).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  letter: z.string().length(1).optional(),
});

export const searchBooksQuerySchema = z.object({
  q: z.string().trim().min(1, "Query de busca é obrigatória"),
  limit: z.coerce.number().min(1).max(200).optional().default(50),
});

export const adminSearchBooksQuerySchema = searchBooksQuerySchema.extend({
  limit: z.coerce.number().min(1).max(200).optional().default(100),
});

export const listBooksByGenreQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(200).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
  sortBy: z.enum(["popularity", "title", "date", "pages"]).optional().default("popularity"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  yearFrom: z.coerce.number().min(1000).max(3000).optional(),
  yearTo: z.coerce.number().min(1000).max(3000).optional(),
});

export const addItemsQuerySchema = z.object({
  n: z.coerce.number().min(1).default(1),
});

export const createBookSchema = z.object({
  ISBN: isbn,
  workID: isbn.optional(),
  categoryID: z.uuid().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  cover: z.string().optional(),
  authorIDs: z.array(z.uuid()).min(1),
  publisherName: z.string().optional(),
  edition: z.string().optional(),
  languageCode: languageCode.optional(),
  numberOfPages: z.coerce.number().min(1),
  publishedAt: z.coerce.date().optional(),
});

export const updateBookSchema = createBookSchema
  .omit({ ISBN: true })
  .partial();

export type CreateBookData = z.infer<typeof createBookSchema>;
export type UpdateBookData = z.infer<typeof updateBookSchema>;
export type ListBooksQuery = z.infer<typeof listBooksQuerySchema>;
export type ListBooksByGenreQuery = z.infer<typeof listBooksByGenreQuerySchema>;
