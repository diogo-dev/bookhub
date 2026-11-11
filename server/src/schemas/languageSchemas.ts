import z from "zod";

export const bcp47Pattern = /^[a-zA-Z]{2,3}(-[a-zA-Z]{4})?(-[a-zA-Z]{2}|\d{3})?$/;
const isoCode = z.string().min(2).max(35).regex(bcp47Pattern);

export const languageIsoCodeParamsSchema = z.object({
  iso_code: isoCode,
});

export const createLanguageSchema = z.object({
  isoCode,
  name: z.string(),
});

export const findOrCreateLanguageSchema = z.object({
  name: z.string().min(1),
  isoCode: isoCode.optional(),
});
