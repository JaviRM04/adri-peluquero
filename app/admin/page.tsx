import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  // Obtener citas de hoy y los próximos 30 días
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const future = new Date(today);
  future.setDate(future.getDate() + 30);
  const futureStr = future.toISOString().split("T")[0];

  const [appointments, blockedSlots] = await Promise.all([
    prisma.appointment.findMany({
      where: { date: { gte: todayStr, lte: futureStr } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.blockedSlot.findMany({
      where: { date: { gte: todayStr, lte: futureStr } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
  ]);

  return (
    <AdminDashboard
      initialAppointments={appointments}
      initialBlockedSlots={blockedSlots}
      todayStr={todayStr}
    />
  );
}
