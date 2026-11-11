import z from "zod";

export const userCpfParamsSchema = z.object({
  cpf: z.string().min(11).max(14),
});

export const createReservationSchema = z.object({
  itemID: z.uuid(),
  startAt: z.coerce.number(),
  endAt: z.coerce.number(),
});
