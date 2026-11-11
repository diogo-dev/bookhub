import z from "zod";

export const permissionIdParamsSchema = z.object({
  id: z.uuid(),
});

export const createPermissionSchema = z.object({
  name: z.string(),
});
