const { z } = require("zod");

module.exports.createGroupSchema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters"),
  description: z.string().optional(),
  countryName: z.string().min(2, "Country name is required"),
});
