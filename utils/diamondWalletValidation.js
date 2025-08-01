const { z } = require("zod");

const createDiamondWalletSchema = z.object({
  diamondCount: z
    .number({ required_error: "Diamond count is required" })
    .int({ message: "Diamond count must be an integer" })
    .nonnegative({ message: "Diamond count cannot be negative" }),

  priceSAR: z
    .number({ required_error: "Price in SAR is required" })
    .nonnegative({ message: "Price in SAR cannot be negative" }),

  priceUSD: z
    .number({ required_error: "Price in USD is required" })
    .nonnegative({ message: "Price in USD cannot be negative" }),
});

const updateDiamondWalletSchema = z.object({
  diamondCount: z
    .number({ invalid_type_error: "Diamond count must be a number" })
    .int({ message: "Diamond count must be an integer" })
    .nonnegative({ message: "Diamond count cannot be negative" })
    .optional(),

  priceSAR: z
    .number({ invalid_type_error: "Price in SAR must be a number" })
    .nonnegative({ message: "Price in SAR cannot be negative" })
    .optional(),

  priceUSD: z
    .number({ invalid_type_error: "Price in USD must be a number" })
    .nonnegative({ message: "Price in USD cannot be negative" })
    .optional(),
});

module.exports = {
  createDiamondWalletSchema,
  updateDiamondWalletSchema,
};
