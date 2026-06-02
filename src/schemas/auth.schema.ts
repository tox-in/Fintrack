import { z } from "zod";

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