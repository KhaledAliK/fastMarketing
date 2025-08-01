const { z } = require("zod");

const prisma = require("../config/prisma");
const roles = ["SUPER_ADMIN", "SUPERVISOR", "SALES", "REGULAR_USER"];

const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(64, "Password must not exceed 64 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[\W_]/, "Password must contain at least one special character");

const phoneSchema = z
  .string({ required_error: "Phone number is required" })
  .regex(/^\+?[0-9]{10,15}$/, "Invalid phone number format");

const emailSchema = z
  .string({ required_error: "Email is required" })
  .email("Invalid email format")
  .min(3, "Email should be at least 3 characters")
  .max(200, "Email should be at most 200 characters");

const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(20, "Name should be at most 20 characters");

const countryCodeSchema = z
  .string()
  .min(2, "Country code must be at least 2 characters")
  .max(10, "Country code should be at most 10 characters");

const registerSchema = z
  .object({
    firstName: nameSchema,
    middleName: nameSchema.optional(),
    lastName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(roles, { message: "Invalid role" }).default("REGULAR_USER"),
    phoneNumber: phoneSchema,
    countryCode: countryCodeSchema,
    permissions: z
      .array(z.string().min(1, "Permission must not be empty"))
      .optional(),
  })
  .refine(
    async (data) => {
      const userExists = await prisma.$transaction([
        prisma.superAdmin.findUnique({ where: { email: data.email } }),
        prisma.regularUser.findUnique({ where: { email: data.email } }),
        prisma.supervisor.findUnique({ where: { email: data.email } }),
        prisma.sales.findUnique({ where: { email: data.email } }),
        prisma.superAdmin.findUnique({
          where: { phoneNumber: data.phoneNumber },
        }),
        prisma.regularUser.findUnique({
          where: { phoneNumber: data.phoneNumber },
        }),
        prisma.supervisor.findUnique({
          where: { phoneNumber: data.phoneNumber },
        }),
        prisma.sales.findUnique({ where: { phoneNumber: data.phoneNumber } }),
      ]);

      return !userExists.some((user) => user !== null);
    },
    {
      message: "Email or Phone number already exists in another table",
      path: ["email", "phoneNumber"],
    }
  );

const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
});

const updateUserSchema = z
  .object({
    firstName: nameSchema.optional(),
    middleName: nameSchema.optional(),
    lastName: nameSchema.optional(),
    email: emailSchema.optional(),
    phoneNumber: phoneSchema.optional(),
    country: z
      .string()
      .min(2, "Country must be at least 2 characters")
      .max(50, "Country must be at most 50 characters")
      .optional(),
    city: z
      .string()
      .min(2, "City must be at least 2 characters")
      .max(50, "City must be at most 50 characters")
      .optional(),
    image: z.string().url("Invalid image URL").optional(),
    bankName: z
      .string()
      .min(2, "Bank name must be at least 2 characters")
      .max(50, "Bank name must be at most 50 characters")
      .optional(),
    bankAccountNumber: z
      .string()
      .min(5, "Bank account number must be at least 5 characters")
      .max(50, "Bank account number must be at most 50 characters")
      .optional(),
    permissions: z
      .array(z.string().min(1, "Permission must not be empty"))
      .optional(),
  })
  .refine(
    async (data) => {
      if (!data.email && !data.phoneNumber) return true;

      const checks = [];
      if (data.email) {
        checks.push(
          prisma.superAdmin.findUnique({ where: { email: data.email } }),
          prisma.regularUser.findUnique({ where: { email: data.email } }),
          prisma.supervisor.findUnique({ where: { email: data.email } }),
          prisma.sales.findUnique({ where: { email: data.email } })
        );
      }
      if (data.phoneNumber) {
        checks.push(
          prisma.superAdmin.findUnique({
            where: { phoneNumber: data.phoneNumber },
          }),
          prisma.regularUser.findUnique({
            where: { phoneNumber: data.phoneNumber },
          }),
          prisma.supervisor.findUnique({
            where: { phoneNumber: data.phoneNumber },
          }),
          prisma.sales.findUnique({ where: { phoneNumber: data.phoneNumber } })
        );
      }

      const existingUsers = await prisma.$transaction(checks);
      return !existingUsers.some((user) => user !== null);
    },
    {
      message: "Email or Phone number already exists in another table",
      path: ["email", "phoneNumber"],
    }
  );

const updateUserEmail = z.object({
  email: z.string().email({ message: "Invalid email format" }),
});

const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
});

const subscriptionPackageSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  price: z
    .number({ required_error: "Price is required" })
    .positive("Price must be greater than 0"),
  duration: z
    .number({ required_error: "Duration is required" })
    .int("Duration must be an integer")
    .positive("Duration must be greater than 0"),
});

const UpdateSubscriptionPackageSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  price: z.number().positive("Price must be greater than 0").optional(),
  duration: z
    .number()
    .int("Duration must be an integer")
    .positive("Duration must be greater than 0")
    .optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateUserSchema,
  updateUserEmail,
  resetPasswordSchema,
  subscriptionPackageSchema,
  UpdateSubscriptionPackageSchema,
};
