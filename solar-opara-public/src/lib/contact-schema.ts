import { z } from "zod";

export const contactSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(100),
  telefone: z.string().trim().regex(/^[\d\s()+-]{10,20}$/, "Informe um WhatsApp/telefone válido com DDD"),
  email: z.string().trim().email("Informe um e-mail válido").max(255),
  tipo: z.string().min(1, "Selecione o tipo de evento"),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha a data desejada"),
  convidados: z.string().trim().regex(/^\d{0,5}$/, "Use apenas números").optional(),
  mensagem: z.string().trim().max(1000, "Máximo de 1000 caracteres").optional(),
});
export type ContactData = z.infer<typeof contactSchema>;