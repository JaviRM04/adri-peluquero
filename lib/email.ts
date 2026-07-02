import { Resend } from "resend";
import { BUSINESS_CONFIG, addMinutes } from "@/lib/config";
import { formatDate } from "@/lib/utils";

const FROM = "Adrian Rosa Peluqueros <onboarding@resend.dev>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

interface AppointmentEmailData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  startTime: string;
  cancellationToken: string;
  notes?: string | null;
}

function getAppointmentUrl(token: string) {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${base}/cita/${token}`;
}

function clientConfirmationHtml(data: AppointmentEmailData) {
  const endTime = addMinutes(data.startTime, BUSINESS_CONFIG.appointmentDurationMinutes);
  const citaUrl = getAppointmentUrl(data.cancellationToken);

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#c55a14,#a44214);padding:32px 32px 24px;text-align:center;">
            <div style="display:inline-block;width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:50%;line-height:48px;font-size:22px;font-weight:bold;color:#fff;margin-bottom:12px;">A</div>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${BUSINESS_CONFIG.name}</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Confirmación de cita</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 20px;font-size:16px;color:#1c1917;">Hola <strong>${data.clientName}</strong>, tu cita está confirmada 🎉</p>
            <!-- Details box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6ee;border:1px solid #f3ce9b;border-radius:12px;padding:20px;margin-bottom:24px;">
              <tr><td style="padding:6px 0;">
                <span style="color:#a44214;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Fecha</span><br>
                <span style="color:#1c1917;font-size:15px;font-weight:600;">${formatDate(data.date)}</span>
              </td></tr>
              <tr><td style="padding:6px 0;border-top:1px solid #f3ce9b;">
                <span style="color:#a44214;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Hora</span><br>
                <span style="color:#1c1917;font-size:15px;font-weight:600;">${data.startTime} – ${endTime}</span>
              </td></tr>
              ${data.notes ? `
              <tr><td style="padding:6px 0;border-top:1px solid #f3ce9b;">
                <span style="color:#a44214;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Notas</span><br>
                <span style="color:#57534e;font-size:14px;">${data.notes}</span>
              </td></tr>` : ""}
            </table>
            <!-- CTA -->
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${citaUrl}" style="display:inline-block;background:#c55a14;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;">Ver mi cita</a>
            </div>
            <p style="margin:0;font-size:13px;color:#78716c;text-align:center;">
              Si necesitas cancelar, puedes hacerlo desde el enlace anterior.<br>
              Para cualquier consulta llámanos al <strong>${BUSINESS_CONFIG.phone}</strong>.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f5f5f4;padding:16px 32px;text-align:center;border-top:1px solid #e7e5e4;">
            <p style="margin:0;font-size:12px;color:#a8a29e;">${BUSINESS_CONFIG.name}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function adminNotificationHtml(data: AppointmentEmailData) {
  const endTime = addMinutes(data.startTime, BUSINESS_CONFIG.appointmentDurationMinutes);
  const citaUrl = getAppointmentUrl(data.cancellationToken);

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background:#f5f5f4;font-family:sans-serif;">
  <table width="100%" style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <tr><td style="background:#1c1917;padding:20px 24px;">
      <h2 style="margin:0;color:#fff;font-size:16px;">Nueva reserva — ${BUSINESS_CONFIG.name}</h2>
    </td></tr>
    <tr><td style="padding:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;border-bottom:1px solid #f5f5f4;font-size:14px;">
          <span style="color:#78716c;">Cliente</span><br>
          <strong>${data.clientName}</strong>
        </td></tr>
        <tr><td style="padding:6px 0;border-bottom:1px solid #f5f5f4;font-size:14px;">
          <span style="color:#78716c;">Teléfono</span><br>
          <strong><a href="tel:${data.clientPhone}" style="color:#c55a14;">${data.clientPhone}</a></strong>
        </td></tr>
        ${data.clientEmail ? `<tr><td style="padding:6px 0;border-bottom:1px solid #f5f5f4;font-size:14px;">
          <span style="color:#78716c;">Email</span><br>
          <strong>${data.clientEmail}</strong>
        </td></tr>` : ""}
        <tr><td style="padding:6px 0;border-bottom:1px solid #f5f5f4;font-size:14px;">
          <span style="color:#78716c;">Fecha y hora</span><br>
          <strong>${formatDate(data.date)} · ${data.startTime} – ${endTime}</strong>
        </td></tr>
        ${data.notes ? `<tr><td style="padding:6px 0;font-size:14px;">
          <span style="color:#78716c;">Notas</span><br>
          <em>${data.notes}</em>
        </td></tr>` : ""}
      </table>
      <div style="margin-top:20px;text-align:center;">
        <a href="${citaUrl}" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:13px;">Ver cita en el panel</a>
      </div>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendConfirmationEmail(data: AppointmentEmailData) {
  if (!process.env.RESEND_API_KEY) return;

  const endTime = addMinutes(data.startTime, BUSINESS_CONFIG.appointmentDurationMinutes);
  const promises: Promise<unknown>[] = [];

  // Email al cliente (solo si dejó su email)
  if (data.clientEmail) {
    promises.push(
      getResend().emails.send({
        from: FROM,
        to: data.clientEmail,
        replyTo: ADMIN_EMAIL,
        subject: `Cita confirmada — ${formatDate(data.date)} a las ${data.startTime}`,
        html: clientConfirmationHtml(data),
      })
    );
  }

  // Notificación a Adrián siempre
  promises.push(
    getResend().emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `Nueva reserva: ${data.clientName} — ${formatDate(data.date)} ${data.startTime}`,
      html: adminNotificationHtml(data),
    })
  );

  const results = await Promise.allSettled(promises);
  results.forEach((r) => {
    if (r.status === "rejected") {
      console.error("Error enviando email:", r.reason);
    }
  });
}
