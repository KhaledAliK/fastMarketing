const { z } = require("zod");

module.exports.createSharingRewardSchema = z.object({
  title: z.string().min(2, "Reward title must be at least 2 characters"),
  description: z
    .string()
    .min(10, "Reward description must be at least 10 characters"),
  diamondReward: z.coerce.number({
    message: "Diamond reward must be of type number and required",
  }),
  requiredShares: z.coerce.number({
    message: "Reward requiredShares must be of type number and required",
  }),
});

module.exports.updateSharingRewardSchema = z.object({
  title: z
    .string()
    .min(2, "Reward title must be at least 2 characters")
    .optional(),
  description: z
    .string()
    .min(10, "Reward description must be at least 10 characters")
    .optional(),
  diamondReward: z.coerce
    .number({
      message: "Diamond reward must be of type number",
    })
    .optional(),
  requiredShares: z.coerce
    .number({
      message: "Reward requiredShares must be of type number",
    })
    .optional(),
});

