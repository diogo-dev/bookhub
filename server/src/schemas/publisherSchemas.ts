import z from "zod";

export const publisherNameParamsSchema = z.object({
  name: z.string(),
});

export const createPublisherSchema = z.object({
  displayName: z.string(),
});

export const findOrCreatePublisherSchema = z.object({
  displayName: z.string().min(1),
});
