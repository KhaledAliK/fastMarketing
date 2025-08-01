const { z } = require("zod");

module.exports.socialAccountSchema = z.object({
  platform: z.string(),
  username: z.string().min(3).max(50).optional(),
  url: z.string().url(),
});

module.exports.updateSocialAccountSchema = z.object({
  platform: z.string().optional(),
  username: z.string().min(3).max(50).optional(),
  url: z.string().url().optional(),
});
