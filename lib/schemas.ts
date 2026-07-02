import { z } from "zod";

export const createAppointmentSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
  clientName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100),
  clientPhone: z
    .string()
    .min(9, "El teléfono debe tener al menos 9 dígitos")
    .max(20)
    .regex(/^[+\d\s()-]+$/, "Teléfono inválido"),
  clientEmail: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  notes: z.string().max(500).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
