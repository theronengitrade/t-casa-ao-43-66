import { z } from "zod";

export const coordinationMemberSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  position: z.string().min(2, "Cargo deve ter pelo menos 2 caracteres").max(100, "Cargo muito longo"),
  phone: z.string().optional().refine(
    (val) => !val || /^\+?[\d\s\-()]{8,15}$/.test(val.replace(/\s/g, "")),
    "Formato de telefone inválido"
  ),
  role: z.enum(['coordinator', 'financial', 'security', 'maintenance', 'administration', 'secretary']),
  has_system_access: z.boolean().default(false)
});

export type CoordinationMemberFormData = z.infer<typeof coordinationMemberSchema>;

export const roleLabels = {
  coordinator: "Coordenador",
  financial: "Financeiro", 
  security: "Segurança",
  maintenance: "Manutenção",
  administration: "Administração",
  secretary: "Secretaria"
} as const;