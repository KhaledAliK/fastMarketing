const { z } = require("zod");

module.exports.createPackageSchema = z.object({
  name: z.string().min(3, "Name is required"),
  description: z.string().optional(),
  priceSAR: z.number().positive("Price must me positive"),
  priceUSD: z.number().positive("Price must be positive"),
  durationInDays: z.number().int().positive().default(28),
  freeHours: z.number().int().nonnegative().optional(),
  features: z
    .array(z.string().min(3))
    .min(1, "Features must be at least one features"),
});

module.exports.updatePackageSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  priceSAR: z.number().positive("Price must me positive").optional(),
  priceUSD: z.number().positive("Price must be positive").optional(),
  durationInDays: z.number().int().positive().default(28).optional(),
  freeHours: z.number().int().nonnegative().optional().optional(),
  features: z
    .array(z.string().min(3))
    .min(1, "Features must be at least one features")
    .optional(),
});
