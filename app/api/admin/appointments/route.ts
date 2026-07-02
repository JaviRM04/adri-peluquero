import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/admin/appointments?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const date = req.nextUrl.searchParams.get("date");
  const where = date ? { date } : {};

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ appointments });
}
