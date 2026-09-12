import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimiter';
import { contactSchema, projectTypeLabels, timelineLabels, budgetLabels } from '@/lib/validation';

// Edge runtime requerido por @cloudflare/next-on-pages.
// NOTA: se usa fetch() directo a la API de Resend (compatible con edge),
// en lugar del SDK `resend` que requiere APIs de Node no disponibles en Workers.
export const runtime = 'edge';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// SITE_URL es server-only (sin NEXT_PUBLIC_) → nunca se expone al bundle client
const ALLOWED_ORIGIN = process.env.SITE_URL || 'https://asahel.pages.dev';
const MAX_BODY_BYTES = 10_000;

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  Vary: 'Origin',
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
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
  const rateLimit = await checkRateLimit(rateLimitCookie);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Set-Cookie': `rl=${rateLimit.cookieValue}; Path=/; HttpOnly; SameSite=Strict; Max-Age=900`,
        },
      }
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

    // Validación estricta con zod (reemplaza la validación manual anterior)
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Campos inválidos' },
        { status: 400, headers: corsHeaders }
      );
    }
    const { name, email, projectType, timeline, budget, description, hasDesign, hasBackend } =
      parsed.data;

    const sanitizedName = escapeHtml(name);
    const hasDesignBool = hasDesign;
    const hasBackendBool = hasBackend;

    await sendEmail({
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
              <p style="margin: 8px 0 0; opacity: 0.9;">Recibido desde asahel.pages.dev</p>
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
      {
        headers: {
          ...corsHeaders,
          'Set-Cookie': `rl=${rateLimit.cookieValue}; Path=/; HttpOnly; SameSite=Strict; Max-Age=900`,
        },
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Error al enviar el mensaje. Intenta de nuevo.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Envía un email vía la API HTTP de Resend usando fetch() — compatible con
 * el runtime edge de Cloudflare Workers (el SDK `resend` requiere Node).
 */
async function sendEmail(payload: {
  to: string;
  subject: string;
  html: string;
  replyTo: string;
}): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY no configurada');
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Asahel Portfolio <onboarding@resend.dev>',
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      reply_to: payload.replyTo,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend API error: ${res.status} ${await res.text()}`);
  }
}
