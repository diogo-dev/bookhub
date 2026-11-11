import z from "zod";

export const roleIdParamsSchema = z.object({
  id: z.uuid(),
});

export const createRoleSchema = z.object({
  name: z.string(),
  permissionNames: z.array(z.string()).optional(),
});
