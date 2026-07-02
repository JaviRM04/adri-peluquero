import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { addMinutes, BUSINESS_CONFIG, generateTimeSlots } from "@/lib/config";
import { Prisma } from "@prisma/client";

const blockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().max(200).optional(),
});

// POST /api/admin/blocked-slots
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = blockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 422 });
  }

  const { date, startTime, reason } = parsed.data;
  const validSlots = generateTimeSlots();
  if (!validSlots.includes(startTime)) {
    return NextResponse.json({ error: "Horario inválido" }, { status: 400 });
  }

  const endTime = addMinutes(startTime, BUSINESS_CONFIG.appointmentDurationMinutes);

  try {
    const blocked = await prisma.blockedSlot.create({
      data: { date, startTime, endTime, reason: reason || null },
    });
    return NextResponse.json({ blocked }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ese hueco ya está bloqueado" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// GET /api/admin/blocked-slots?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const date = req.nextUrl.searchParams.get("date");
  const where = date ? { date } : {};
  const slots = await prisma.blockedSlot.findMany({ where, orderBy: [{ date: "asc" }, { startTime: "asc" }] });
  return NextResponse.json({ slots });
}

// DELETE /api/admin/blocked-slots?date=YYYY-MM-DD&startTime=HH:MM
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const date = req.nextUrl.searchParams.get("date");
  const startTime = req.nextUrl.searchParams.get("startTime");

  if (!date || !startTime) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  try {
    await prisma.blockedSlot.delete({
      where: { date_startTime: { date, startTime } },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
}
