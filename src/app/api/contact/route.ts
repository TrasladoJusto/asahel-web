import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { checkRateLimit } from '@/lib/rateLimiter';

// Edge runtime requerido por @cloudflare/next-on-pages
export const runtime = 'edge';

const resend = new Resend(process.env.RESEND_API_KEY);

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://asaheldev.com';
const MAX_BODY_BYTES = 10_000;

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  Vary: 'Origin',
};

function handleOptions() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
}

export async function POST(request: Request) {
  // Anti-abuso: mismo origen (el formulario solo se postea desde el sitio)
  const origin = request.headers.get('origin');
  if (origin && origin !== ALLOWED_ORIGIN) {
    return NextResponse.json(
      { success: false, message: 'Origen no permitido' },
      { status: 403, headers: corsHeaders }
    );
  }

  // Anti-abuso: tamaño máximo del payload
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { success: false, message: 'Payload demasiado grande' },
      { status: 413, headers: corsHeaders }
    );
  }

  const rateLimitCookie = request.headers.get('cookie')?.match(/rl=([^;]+)/)?.[1];
  const rateLimit = checkRateLimit(rateLimitCookie);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
      { status: 429, headers: { ...corsHeaders, 'Set-Cookie': `rl=${rateLimit.cookieValue}; Path=/; HttpOnly; SameSite=Strict; Max-Age=900` } }
    );
  }

  try {
    const body = await request.json();

    // Honeypot anti-bot: campos trampa que los bots autocompletan
    if (body.company || body.website || body.botfield) {
      // Respuesta fingida exitosa para no revelar el trampa
      return NextResponse.json(
        { success: true, message: 'Mensaje enviado correctamente' },
        { headers: corsHeaders }
      );
    }

    const { name, email, projectType, timeline, budget, description, hasDesign, hasBackend } = body;

    if (!name || !email || !projectType || !timeline || !budget || !description || hasDesign === undefined || hasBackend === undefined) {
      return NextResponse.json(
        { success: false, message: 'Todos los campos son requeridos' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Sanitización de entrada: tipos + límites de longitud
    if (
      typeof name !== 'string' || typeof email !== 'string' || typeof description !== 'string' ||
      name.length > 100 || email.length > 200 || description.length > 5000
    ) {
      return NextResponse.json(
        { success: false, message: 'Campos inválidos' },
        { status: 400, headers: corsHeaders }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Email inválido' },
        { status: 400, headers: corsHeaders }
      );
    }

    const sanitizedName = escapeHtml(name);
    const hasDesignBool = parseBoolean(hasDesign);
    const hasBackendBool = parseBoolean(hasBackend);

    await resend.emails.send({
      from: 'Asahel Portfolio <onboarding@resend.dev>',
      to: process.env.CONTACT_EMAIL || 'asahel20tj@hotmail.com',
      subject: `[Portfolio] Nuevo brief: ${projectTypeLabels[projectType] || projectType} - ${sanitizedName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #06b6d4; color: white; padding: 24px; border-radius: 8px 8px 0 0; }
              .content { background: #fafafa; padding: 24px; border: 1px solid #e4e4e7; border-top: none; border-radius: 0 0 8px 8px; }
              .field { margin-bottom: 16px; }
              .label { font-weight: 600; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
              .value { color: #111827; font-size: 16px; }
              .description { white-space: pre-wrap; background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">Nuevo Brief de Proyecto</h1>
              <p style="margin: 8px 0 0; opacity: 0.9;">Recibido desde asaheldev.com</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Nombre</div>
                <div class="value">${escapeHtml(name)}</div>
              </div>
              <div class="field">
                <div class="label">Email</div>
                <div class="value"><a href="mailto:${escapeHtml(email)}" style="color: #06b6d4;">${escapeHtml(email)}</a></div>
              </div>
              <div class="field">
                <div class="label">Tipo de Proyecto</div>
                <div class="value">${projectTypeLabels[projectType] || projectType}</div>
              </div>
              <div class="field">
                <div class="label">Timeline</div>
                <div class="value">${timelineLabels[timeline] || timeline}</div>
              </div>
              <div class="field">
                <div class="label">Presupuesto</div>
                <div class="value">${budgetLabels[budget] || budget}</div>
              </div>
              <div class="field">
                <div class="label">¿Tiene Diseño?</div>
                <div class="value">${hasDesignBool ? 'Sí' : 'No'}</div>
              </div>
              <div class="field">
                <div class="label">¿Requiere Backend?</div>
                <div class="value">${hasBackendBool ? 'Sí' : 'No'}</div>
              </div>
              <div class="field">
                <div class="label">Descripción</div>
                <div class="description">${escapeHtml(description)}</div>
              </div>
            </div>
          </body>
        </html>
      `,
      replyTo: escapeHtml(email),
    });

    return NextResponse.json(
      { success: true, message: 'Mensaje enviado correctamente' },
      { headers: { ...corsHeaders, 'Set-Cookie': `rl=${rateLimit.cookieValue}; Path=/; HttpOnly; SameSite=Strict; Max-Age=900` } }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, message: 'Error al enviar el mensaje. Intenta de nuevo.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

const projectTypeLabels: Record<string, string> = {
  webapp: 'Aplicación Web',
  ecommerce: 'E-commerce',
  api: 'API / Backend',
  migration: 'Migración / Refactor',
  other: 'Otro',
};

const timelineLabels: Record<string, string> = {
  asap: 'ASAP',
  '1-2months': '1-2 meses',
  '3-6months': '3-6 meses',
  flexible: 'Flexible',
};

const budgetLabels: Record<string, string> = {
  '5k-15k': '5k - 15k PEN',
  '15k-30k': '15k - 30k PEN',
  '30k-50k': '30k - 50k PEN',
  '50k+': '50k+ PEN',
  'discovery-first': 'Primero discovery',
};