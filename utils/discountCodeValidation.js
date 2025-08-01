const { z } = require("zod");

module.exports.createDiscountCodeSchema = z.object({
  code: z
    .string({ required_error: "Discount code is required" })
    .min(3, { message: "Code must be at least 3 characters long" }),

  percentage: z
    .number({ required_error: "Percentage is required" })
    .int({ message: "Percentage must be an integer" })
    .min(1, { message: "Percentage must be at least 1%" })
    .max(100, { message: "Percentage cannot exceed 100%" }),

  superAdminId: z
    .string()
    .uuid({ message: "Invalid Super Admin ID" })
    .optional(),

  userId: z.string().uuid({ message: "Invalid User ID" }).optional(),
});

module.exports.updateDiscountCodeSchema = z.object({
  code: z
    .string()
    .min(3, { message: "Code must be at least 3 characters long" })
    .optional(),

  percentage: z
    .number()
    .int({ message: "Percentage must be an integer" })
    .min(1, { message: "Percentage must be at least 1%" })
    .max(100, { message: "Percentage cannot exceed 100%" })
    .optional(),

  superAdminId: z
    .string()
    .uuid({ message: "Invalid Super Admin ID" })
    .optional(),

  userId: z.string().uuid({ message: "Invalid User ID" }).optional(),
});
