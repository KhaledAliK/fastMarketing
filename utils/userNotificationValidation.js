const { z } = require("zod");

module.exports.notificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  audience: z.enum(["ALL", "REGULAR_USER", "USER_SUBSCRIPTION"], {
    message: "Audience must be ALL, REGULAR_USER, or USER_SUBSCRIPTION",
  }),
});
