import { z } from 'zod';

export const projectTypeLabels: Record<string, string> = {
  webapp: 'Aplicación Web',
  ecommerce: 'E-commerce',
  api: 'API / Backend',
  migration: 'Migración / Refactor',
  other: 'Otro',
};

export const timelineLabels: Record<string, string> = {
  asap: 'ASAP',
  '1-2months': '1-2 meses',
  '3-6months': '3-6 meses',
  flexible: 'Flexible',
};

export const budgetLabels: Record<string, string> = {
  '5k-15k': '5k - 15k PEN',
  '15k-30k': '15k - 30k PEN',
  '30k-50k': '30k - 50k PEN',
  '50k+': '50k+ PEN',
  'discovery-first': 'Primero discovery',
};

export const contactSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  projectType: z.enum(['webapp', 'ecommerce', 'api', 'migration', 'other']),
  timeline: z.enum(['asap', '1-2months', '3-6months', 'flexible']),
  budget: z.enum(['5k-15k', '15k-30k', '30k-50k', '50k+', 'discovery-first']),
  description: z.string().min(50, 'La descripción debe tener al menos 50 caracteres'),
  hasDesign: z.boolean(),
  hasBackend: z.boolean(),
  // Honeypot anti-bot (opcionales, nunca visibles)
  company: z.string().max(0).optional().or(z.literal('')),
  website: z.string().max(0).optional().or(z.literal('')),
});

export type ContactFormData = z.infer<typeof contactSchema>;