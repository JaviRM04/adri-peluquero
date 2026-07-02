import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAppointmentSchema } from "@/lib/schemas";
import { addMinutes, BUSINESS_CONFIG, generateTimeSlots, isWorkingDay } from "@/lib/config";
import { Prisma } from "@prisma/client";
import { sendConfirmationEmail } from "@/lib/email";

// GET /api/appointments?date=YYYY-MM-DD — slots disponibles para ese día
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  const [year, month, day] = date.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);

  if (!isWorkingDay(dateObj)) {
    return NextResponse.json({ slots: [], isWorkingDay: false });
  }

  const allSlots = generateTimeSlots();

  const [takenAppointments, blockedSlots] = await Promise.all([
    prisma.appointment.findMany({
      where: { date, status: "CONFIRMED" },
      select: { startTime: true },
    }),
    prisma.blockedSlot.findMany({
      where: { date },
      select: { startTime: true },
    }),
  ]);

  const takenTimes = new Set([
    ...takenAppointments.map((a) => a.startTime),
    ...blockedSlots.map((b) => b.startTime),
  ]);

  // Bloquear slots pasados si la fecha es hoy
  const now = new Date();
  const isToday =
    now.getFullYear() === year &&
    now.getMonth() + 1 === month &&
    now.getDate() === day;

  const slots = allSlots.map((time) => {
    let available = !takenTimes.has(time);
    if (available && isToday) {
      const [slotH, slotM] = time.split(":").map(Number);
      const slotMinutes = slotH * 60 + slotM;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (slotMinutes <= nowMinutes) available = false;
    }
    return { time, available };
  });

  return NextResponse.json({ slots, isWorkingDay: true });
}

// POST /api/appointments — crear cita
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createAppointmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { date, startTime, clientName, clientPhone, clientEmail, notes } = parsed.data;

    // Verificar que el slot existe en la configuración
    const validSlots = generateTimeSlots();
    if (!validSlots.includes(startTime)) {
      return NextResponse.json(
        { error: "Ese horario no está disponible" },
        { status: 400 }
      );
    }

    // Verificar que la fecha es válida y futura
    const [year, month, day] = date.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) {
      return NextResponse.json({ error: "No se pueden reservar fechas pasadas" }, { status: 400 });
    }
    if (!isWorkingDay(dateObj)) {
      return NextResponse.json({ error: "Ese día no trabajamos" }, { status: 400 });
    }

    const endTime = addMinutes(startTime, BUSINESS_CONFIG.appointmentDurationMinutes);

    // Transacción: verificar disponibilidad + insertar (protección contra race conditions)
    const appointment = await prisma.$transaction(async (tx) => {
      const existingBlocked = await tx.blockedSlot.findUnique({
        where: { date_startTime: { date, startTime } },
      });
      if (existingBlocked) {
        throw new Error("SLOT_UNAVAILABLE");
      }

      return tx.appointment.create({
        data: {
          date,
          startTime,
          endTime,
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          clientEmail: clientEmail?.trim() || null,
          notes: notes?.trim() || null,
          status: "CONFIRMED",
        },
      });
    });

    // Enviar emails en background (no bloqueamos la respuesta si falla)
    sendConfirmationEmail({
      clientName: appointment.clientName,
      clientEmail: appointment.clientEmail || "",
      clientPhone: appointment.clientPhone,
      date: appointment.date,
      startTime: appointment.startTime,
      cancellationToken: appointment.cancellationToken,
      notes: appointment.notes,
    }).catch((err) => console.error("Email error:", err));

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "SLOT_UNAVAILABLE"
    ) {
      return NextResponse.json(
        { error: "Este hueco ya no está disponible, elige otro" },
        { status: 409 }
      );
    }

    // Unique constraint violation de Prisma (dos peticiones simultáneas)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Este hueco ya no está disponible, elige otro" },
        { status: 409 }
      );
    }

    console.error("Error creating appointment:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
