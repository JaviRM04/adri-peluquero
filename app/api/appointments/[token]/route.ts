import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/appointments/[token] — obtener cita por token
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const appointment = await prisma.appointment.findUnique({
    where: { cancellationToken: params.token },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ appointment });
}

// DELETE /api/appointments/[token] — cancelar cita por token
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const appointment = await prisma.appointment.findUnique({
    where: { cancellationToken: params.token },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  if (appointment.status === "CANCELLED") {
    return NextResponse.json({ error: "Esta cita ya está cancelada" }, { status: 400 });
  }

  // Verificar que la cita es futura
  const now = new Date();
  const [year, month, day] = appointment.date.split("-").map(Number);
  const [hour, minute] = appointment.startTime.split(":").map(Number);
  const appointmentDate = new Date(year, month - 1, day, hour, minute);

  if (appointmentDate < now) {
    return NextResponse.json(
      { error: "No se pueden cancelar citas pasadas" },
      { status: 400 }
    );
  }

  const updated = await prisma.appointment.update({
    where: { cancellationToken: params.token },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ appointment: updated });
}
