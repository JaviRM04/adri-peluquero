import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// DELETE /api/admin/appointments/[id] — cancelar por id (solo admin)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  const updated = await prisma.appointment.update({
    where: { id: params.id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ appointment: updated });
}
