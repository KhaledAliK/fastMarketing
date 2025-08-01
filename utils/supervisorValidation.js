const { z } = require("zod");

const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .regex(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter (A-Z)",
  })
  .regex(/[a-z]/, {
    message: "Password must contain at least one lowercase letter (a-z)",
  })
  .regex(/[0-9]/, {
    message: "Password must contain at least one number (0-9)",
  })
  .regex(/[@$!%*?&#]/, {
    message: "Password must contain at least one special character (@$!%*?&#)",
  });

const supervisorSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  middleName: z.string().min(2, "Middle name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: passwordSchema,
  phoneNumber: z
    .string()
    .regex(/^\+?\d{10,15}$/, "Invalid phone number format"),
});

const loginSupervisorSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: passwordSchema,
});

const updateSupervisorSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .optional(),
  middleName: z
    .string()
    .min(2, "Middle name must be at least 2 characters")
    .optional(),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .optional(),
  email: z.string().email("Invalid email format").optional(),
  password: passwordSchema.optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?\d{10,15}$/, "Invalid phone number format")
    .optional(),
});

const updateSupervisorEmail = z.object({
  supervisorId: z.string().uuid({ message: "Invalid Supervisor ID format" }),
  email: z.string().email({ message: "Invalid email format" }),
})

module.exports = {
  supervisorSchema,
  loginSupervisorSchema,
  updateSupervisorSchema,
  updateSupervisorEmail
};
