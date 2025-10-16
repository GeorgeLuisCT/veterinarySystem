import { z } from "zod";

export const loginSchema = z.object({
  user: z.string().min(1, "usuario requerido"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});