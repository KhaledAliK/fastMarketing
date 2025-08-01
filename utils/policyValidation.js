const { z } = require("zod");

const policySchema = z.object({
  content: z
    .string()
    .min(5, "The content must be more than 20 characters")
    .max(5000, "The content must be less than 5000 characters"),
});

const updatePolicySchema = z.object({
    content: z
      .string()
      .min(5, "The content must be more than 20 characters")
      .max(5000, "The content must be less than 5000 characters").optional(),
  });
module.exports = { policySchema, updatePolicySchema };
