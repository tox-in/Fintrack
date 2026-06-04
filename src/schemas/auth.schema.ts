import { z } from "zod";

enum WalletType {
  BANK,
  CASH,
  MOMO,
  RECEIVABLE
}

enum FlowType {
  INFLOW,
  OUTFLOW
}

enum TransactionCategory {
  TRANSPORT,
  FOOD,
  UTILITIES,
  ENTERTAINMENT,
  HEALTH,
  EDUCATION,
  SHOPPING,
  WASTED,
  SALARY,
  FREELANCE,
  GIFT,
  RECHARGE,
  REBATE,
  OTHER
}

export const RegisterSchema = z.object({
    email: z.string ().trim().toLowerCase().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters long").max(100),
    name: z.string().trim().min(2, "Name must is too short").max(50),
    phoneNumber: z.string().trim().min(10, "Phone number must be at least 10 digits").max(15).trim().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number").optional(),
}).strict();

export const LoginSchema = z.object({
    email: z.string().trim().toLowerCase().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters long").max(100)
}).strict();

export const UpdateWalletSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters long").max(100).optional(),
    currency: z.string().trim().max(3, "Currency must be a 3-character code").optional(),
    description: z.string().trim().max(200).optional(),
    isActive: z.boolean().default(true).optional()
}).strict();

export const CreateWalletSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters long").max(100),
    type: z.string().trim().refine((val) => Object.values(WalletType).includes(val), {
        message: `Type must be one of: ${Object.values(WalletType).join(", ")}`,
    }),
    balance: z.string().regex(/^\d+(\.\d+)?$/, "Invalid balance format").optional(),
    currency: z.string().trim().max(3, "Currency must be a 3-character code"),
    description: z.string().trim().max(200).optional(),
    isActive: z.boolean().default(true)
}).strict();

export const CreateCashflowSchema = z.object({
    type: z.string().trim().refine((val) => Object.values(FlowType).includes(val), {
        message: `Type must be one of: ${Object.values(FlowType).join(", ")}`,
    }),
    amount: z.string().regex(/^\d+(\.\d+)?$/, "Invalid amount format"),
    category: z.string().trim().refine((val) => Object.values(TransactionCategory).includes(val), {
        message: `Category must be one of: ${Object.values(TransactionCategory).join(", ")}`,
    }).max(100).optional(),
    description: z.string().trim().max(200),
    walletId: z.string().cuid(),
    occurredAt: z.string().datetime().optional()
}).strict();