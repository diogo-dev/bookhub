import z from "zod";

export { userCpfParamsSchema } from "@/schemas/reservationSchemas";

export const createLoanSchema = z.object({
  itemID: z.uuid(),
  userID: z.uuid(),
  startAt: z.coerce.number(),
  dueAt: z.coerce.number(),
  reservationID: z.uuid().optional(),
});

export const loanIdParamsSchema = z.object({
  id: z.uuid(),
});
