import { z } from "zod";

export const preRegisterSchema = z.object({
  name: z.string().trim().min(1, "Укажите имя").max(80),
  contact: z.string().trim().min(3, "Укажите способ связи").max(120),
  // Honeypot: настоящие пользователи оставляют поле пустым; боты часто заполняют.
  website: z.string().max(200).optional(),
});

export type PreRegisterInput = z.infer<typeof preRegisterSchema>;
