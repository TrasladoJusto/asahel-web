import { z } from 'zod';

export const projectTypeLabels: Record<string, string> = {
  landing: 'Landing Page',
  webapp: 'Página Web / App',
  ecommerce: 'E-commerce',
  api: 'API / Backend',
  seo: 'SEO & Performance',
  other: 'Otro',
};

export const timelineLabels: Record<string, string> = {
  asap: 'ASAP',
  '1-2months': '1-2 semanas',
  '3-6months': '3-4 semanas',
  flexible: 'Flexible',
};

export const budgetLabels: Record<string, string> = {
  'under-200': 'Menos de $400',
  '200-500': '$400 - $1,000',
  '500-1000': '$1,000 - $2,000',
  '1000+': '$2,000+',
  'discovery-first': 'Primero discovery',
};

export const contactSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  projectType: z.enum(['landing', 'webapp', 'ecommerce', 'api', 'seo', 'other']),
  timeline: z.enum(['asap', '1-2months', '3-6months', 'flexible']),
  budget: z.enum(['under-200', '200-500', '500-1000', '1000+', 'discovery-first']),
  description: z.string().min(50, 'La descripción debe tener al menos 50 caracteres'),
  hasDesign: z.boolean(),
  hasBackend: z.boolean(),
  // Honeypot anti-bot (opcionales, nunca visibles)
  company: z.string().max(0).optional().or(z.literal('')),
  website: z.string().max(0).optional().or(z.literal('')),
});

export type ContactFormData = z.infer<typeof contactSchema>;
