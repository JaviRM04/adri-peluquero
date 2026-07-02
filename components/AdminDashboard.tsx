"use client";

import { useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import { BUSINESS_CONFIG, generateTimeSlots, addMinutes } from "@/lib/config";
import { formatDate, formatDateShort } from "@/lib/utils";

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  notes: string | null;
  status: string;
  cancellationToken: string;
}

interface BlockedSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
}

interface Props {
  initialAppointments: Appointment[];
  initialBlockedSlots: BlockedSlot[];
  todayStr: string;
}

export default function AdminDashboard({ initialAppointments, initialBlockedSlots, todayStr }: Props) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>(initialBlockedSlots);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeTab, setActiveTab] = useState<"agenda" | "bloquear">("agenda");
  const [blockReason, setBlockReason] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const dayAppointments = appointments.filter((a) => a.date === selectedDate);
  const dayBlocked = blockedSlots.filter((b) => b.date === selectedDate);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  async function cancelAppointment(id: string) {
    if (!confirm("¿Cancelar esta cita?")) return;
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "CANCELLED" } : a))
        );
        showMessage("success", "Cita cancelada");
      } else {
        const data = await res.json();
        showMessage("error", data.error || "Error al cancelar");
      }
    } catch {
      showMessage("error", "Error de conexión");
    } finally {
      setLoading(null);
    }
  }

  async function blockSlot(startTime: string) {
    setLoading(`block-${startTime}`);
    try {
      const res = await fetch("/api/admin/blocked-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, startTime, reason: blockReason || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedSlots((prev) => [...prev, data.blocked]);
        showMessage("success", "Hueco bloqueado");
      } else {
        const data = await res.json();
        showMessage("error", data.error || "Error al bloquear");
      }
    } catch {
      showMessage("error", "Error de conexión");
    } finally {
      setLoading(null);
    }
  }

  async function unblockSlot(date: string, startTime: string) {
    setLoading(`unblock-${startTime}`);
    try {
      const res = await fetch(
        `/api/admin/blocked-slots?date=${date}&startTime=${encodeURIComponent(startTime)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setBlockedSlots((prev) =>
          prev.filter((b) => !(b.date === date && b.startTime === startTime))
        );
        showMessage("success", "Hueco desbloqueado");
      } else {
        showMessage("error", "Error al desbloquear");
      }
    } catch {
      showMessage("error", "Error de conexión");
    } finally {
      setLoading(null);
    }
  }

  // Generate next 30 days
  const dateOptions: string[] = [];
  const d = new Date(todayStr);
  for (let i = 0; i < 30; i++) {
    dateOptions.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }

  const allSlots = generateTimeSlots();
  const confirmedTimes = new Set(dayAppointments.filter((a) => a.status === "CONFIRMED").map((a) => a.startTime));
  const blockedTimes = new Set(dayBlocked.map((b) => b.startTime));

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Top bar */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-stone-900">{BUSINESS_CONFIG.name}</h1>
            <p className="text-xs text-stone-400">Panel de administración</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/admin/login" })} className="btn-secondary text-xs px-4 py-2">
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Message toast */}
        {message && (
          <div className={`rounded-xl p-4 text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {message.text}
          </div>
        )}

        {/* Date selector */}
        <div className="card">
          <h2 className="font-semibold text-stone-900 mb-3">Seleccionar día</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dateOptions.map((d) => {
              const [year, month, day] = d.split("-").map(Number);
              const dateObj = new Date(year, month - 1, day);
              const count = appointments.filter((a) => a.date === d && a.status === "CONFIRMED").length;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`flex-shrink-0 rounded-xl px-3 py-2 text-center text-xs transition-all ${
                    selectedDate === d
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-stone-50 border border-stone-200 text-stone-700 hover:bg-brand-50 hover:border-brand-200"
                  }`}
                >
                  <div className="font-semibold">
                    {dateObj.toLocaleDateString("es-ES", { weekday: "short" })}
                  </div>
                  <div className="text-lg font-bold">{day}</div>
                  {count > 0 && (
                    <div className={`text-xs ${selectedDate === d ? "text-brand-200" : "text-brand-600"}`}>
                      {count} cita{count !== 1 ? "s" : ""}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-stone-200">
          {(["agenda", "bloquear"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-stone-500 hover:text-stone-700"
              }`}
            >
              {tab === "agenda" ? "Agenda del día" : "Gestionar huecos"}
            </button>
          ))}
        </div>

        {activeTab === "agenda" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-stone-900">
              {formatDate(selectedDate)} — {dayAppointments.filter((a) => a.status === "CONFIRMED").length} citas confirmadas
            </h2>

            {dayAppointments.length === 0 ? (
              <div className="card text-center py-8 text-stone-400">
                No hay citas para este día
              </div>
            ) : (
              <div className="space-y-3">
                {dayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className={`card ${apt.status === "CANCELLED" ? "opacity-50 bg-stone-50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-bold text-brand-700">
                            {apt.startTime} – {apt.endTime}
                          </span>
                          {apt.status === "CANCELLED" && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                              Cancelada
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-stone-900">{apt.clientName}</p>
                        <p className="text-sm text-stone-500">{apt.clientPhone}</p>
                        {apt.clientEmail && <p className="text-sm text-stone-500">{apt.clientEmail}</p>}
                        {apt.notes && (
                          <p className="text-xs text-stone-400 mt-1 italic">&ldquo;{apt.notes}&rdquo;</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {apt.status === "CONFIRMED" && (
                          <button
                            onClick={() => cancelAppointment(apt.id)}
                            disabled={loading === apt.id}
                            className="btn-danger text-xs px-3 py-1.5"
                          >
                            {loading === apt.id ? "…" : "Cancelar"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "bloquear" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-stone-900">
              Gestionar huecos — {formatDate(selectedDate)}
            </h2>
            <div className="card">
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Motivo del bloqueo (opcional)
              </label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ej: Vacaciones, descanso…"
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {allSlots.map((time) => {
                const isBooked = confirmedTimes.has(time);
                const isBlocked = blockedTimes.has(time);
                const endTime = addMinutes(time, BUSINESS_CONFIG.appointmentDurationMinutes);
                return (
                  <div
                    key={time}
                    className={`rounded-xl border p-3 text-sm ${
                      isBooked
                        ? "border-brand-200 bg-brand-50"
                        : isBlocked
                        ? "border-red-200 bg-red-50"
                        : "border-stone-200 bg-white"
                    }`}
                  >
                    <div className="font-mono font-bold text-stone-800 mb-1">
                      {time} – {endTime}
                    </div>
                    {isBooked ? (
                      <span className="text-xs text-brand-600 font-medium">Reservado</span>
                    ) : isBlocked ? (
                      <button
                        onClick={() => unblockSlot(selectedDate, time)}
                        disabled={loading === `unblock-${time}`}
                        className="text-xs text-red-600 font-medium hover:underline"
                      >
                        {loading === `unblock-${time}` ? "…" : "Desbloquear"}
                      </button>
                    ) : (
                      <button
                        onClick={() => blockSlot(time)}
                        disabled={loading === `block-${time}`}
                        className="text-xs text-stone-500 hover:text-red-600 font-medium hover:underline"
                      >
                        {loading === `block-${time}` ? "…" : "Bloquear"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
