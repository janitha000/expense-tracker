import { z } from "zod";

export const expenseSchema = z.object({
  amount: z.coerce
    .number({ message: "Amount must be a valid number" })
    .positive({ message: "Amount must be greater than zero" })
    .max(9999999.99, { message: "Amount is too large" }),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format" }),
  categoryId: z.string().min(1, { message: "Please select a category" }),
  parentType: z.enum(["normal", "one_time"], {
    message: "Type must be either Normal or One-Time",
  }),
  note: z.string().max(255, { message: "Note cannot exceed 255 characters" }).optional().nullable(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, { message: "Category name is required" })
    .max(50, { message: "Category name must be 50 characters or less" }),
  icon: z.string().min(1, { message: "Please select an icon" }),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: "Must be a valid hex color code (e.g. #3B82F6)" }),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

export const budgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, { message: "Month must be YYYY-MM" }),
  baselineAmount: z.coerce
    .number({ message: "Baseline budget must be a number" })
    .positive({ message: "Budget must be greater than 0" }),
});

export type BudgetFormData = z.infer<typeof budgetSchema>;
