const { z } = require("zod");

const platformSchema = z.object({
  name: z
    .string()
    .min(1, "Platform name must be at least 1 characters")
    .max(50, "Platform name must be at most 50 characters"),
  status: z.boolean().optional(),
  platformUrl: z.string().url("Invalid URL").optional(),
  publicId: z.string().optional(),
});

const updatePlatformSchema = z.object({
  name: z
    .string()
    .min(1, "Platform name must be at least 1 characters")
    .max(50, "Platform name must be at most 50 characters")
    .optional(),
  status: z.boolean().optional(),
  platformUrl: z.string().url("Invalid URL").optional(),
  publicId: z.string().optional(),
});

module.exports = { platformSchema, updatePlatformSchema };
