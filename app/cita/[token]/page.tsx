import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BUSINESS_CONFIG, addMinutes } from "@/lib/config";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: { token: string };
}

export default async function CitaPage({ params }: Props) {
  const appointment = await prisma.appointment.findUnique({
    where: { cancellationToken: params.token },
  });

  if (!appointment) notFound();

  const isCancelled = appointment.status === "CANCELLED";
  const isPast = (() => {
    const [year, month, day] = appointment.date.split("-").map(Number);
    const [hour, minute] = appointment.startTime.split(":").map(Number);
    return new Date(year, month - 1, day, hour, minute) < new Date();
  })();

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        {/* Header card */}
        <div className="card text-center">
          <div className="text-5xl mb-3">
            {isCancelled ? "❌" : isPast ? "✅" : "📅"}
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-1">
            {isCancelled ? "Cita cancelada" : isPast ? "Cita completada" : "Tu cita"}
          </h1>
          {!isCancelled && !isPast && (
            <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
              Confirmada
            </span>
          )}
        </div>

        {/* Details */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-stone-900">Detalles de la cita</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">Peluquería</dt>
              <dd className="font-medium text-stone-900">{BUSINESS_CONFIG.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Fecha</dt>
              <dd className="font-medium text-stone-900">{formatDate(appointment.date)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Hora</dt>
              <dd className="font-medium text-stone-900">
                {appointment.startTime} – {addMinutes(appointment.startTime, BUSINESS_CONFIG.appointmentDurationMinutes)}
              </dd>
            </div>
            <div className="border-t border-stone-100 pt-3 flex justify-between">
              <dt className="text-stone-500">Nombre</dt>
              <dd className="font-medium text-stone-900">{appointment.clientName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Teléfono</dt>
              <dd className="font-medium text-stone-900">{appointment.clientPhone}</dd>
            </div>
            {appointment.clientEmail && (
              <div className="flex justify-between">
                <dt className="text-stone-500">Email</dt>
                <dd className="font-medium text-stone-900">{appointment.clientEmail}</dd>
              </div>
            )}
            {appointment.notes && (
              <div className="border-t border-stone-100 pt-3">
                <dt className="text-stone-500 mb-1">Notas</dt>
                <dd className="text-stone-700">{appointment.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Actions */}
        {!isCancelled && !isPast && (
          <div className="card bg-red-50 border border-red-100">
            <p className="text-sm text-stone-600 mb-3">
              ¿Necesitas cancelar tu cita? Puedes hacerlo hasta la hora de la cita.
            </p>
            <Link
              href={`/cita/${params.token}/cancelar`}
              className="btn-danger w-full"
            >
              Cancelar cita
            </Link>
          </div>
        )}

        <Link href="/" className="btn-secondary w-full text-center block">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
