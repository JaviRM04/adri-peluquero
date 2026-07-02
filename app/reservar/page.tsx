"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BookingCalendar from "@/components/BookingCalendar";
import { BUSINESS_CONFIG, addMinutes } from "@/lib/config";
import { formatDate } from "@/lib/utils";

type Step = "datetime" | "form" | "confirm";

interface FormData {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes: string;
}

export default function ReservarPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("datetime");
  const [selected, setSelected] = useState<{ date: string; time: string } | null>(null);
  const [form, setForm] = useState<FormData>({ clientName: "", clientPhone: "+34 ", clientEmail: "", notes: "" });
  const [errors, setErrors] = useState<Partial<FormData & { submit: string }>>({});
  const [loading, setLoading] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  function handleDateTimeSelect(date: string, time: string) {
    setSelected({ date, time });
  }

  function handleNextStep() {
    if (!selected) return;
    setStep("form");
  }

  function validateForm(): boolean {
    const newErrors: Partial<FormData> = {};
    if (!form.clientName.trim() || form.clientName.trim().length < 2) {
      newErrors.clientName = "El nombre debe tener al menos 2 caracteres";
    }
    if (!form.clientPhone.trim() || form.clientPhone.trim().length < 9) {
      newErrors.clientPhone = "Introduce un teléfono válido (mínimo 9 dígitos)";
    }
    if (form.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail)) {
      newErrors.clientEmail = "El email no tiene un formato válido";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm() || !selected) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selected.date,
          startTime: selected.time,
          clientName: form.clientName.trim(),
          clientPhone: form.clientPhone.trim(),
          clientEmail: form.clientEmail.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setErrors({ submit: data.error });
          setStep("datetime");
          setSelected(null);
        } else if (data.details) {
          const fieldErrors: Partial<FormData> = {};
          Object.entries(data.details).forEach(([k, v]) => {
            (fieldErrors as Record<string, string>)[k] = (v as string[])[0];
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ submit: data.error || "Error al crear la cita" });
        }
        return;
      }

      setCreatedToken(data.appointment.cancellationToken);
      setStep("confirm");
    } catch {
      setErrors({ submit: "Error de conexión. Inténtalo de nuevo." });
    } finally {
      setLoading(false);
    }
  }

  if (step === "confirm" && createdToken) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="card text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-stone-900 mb-2">¡Cita confirmada!</h1>
            <p className="text-stone-500 mb-6">
              Tu cita ha sido reservada correctamente. Guarda este enlace para gestionarla.
            </p>
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-6">
              <p className="text-xs text-brand-600 font-medium mb-1">Tu enlace personal</p>
              <p className="text-sm text-brand-800 break-all font-mono">
                {typeof window !== "undefined" ? window.location.origin : ""}/cita/{createdToken}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href={`/cita/${createdToken}`}
                className="btn-primary w-full"
              >
                Ver mi cita
              </Link>
              <Link href="/" className="btn-secondary w-full">
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-stone-400 hover:text-stone-600 transition">
            ←
          </Link>
          <div>
            <h1 className="font-bold text-stone-900">{BUSINESS_CONFIG.name}</h1>
            <p className="text-xs text-stone-400">Reservar cita</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {(["datetime", "form"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === s ? "bg-brand-600 text-white" :
                (step === "form" && s === "datetime") || step === "confirm" ? "bg-brand-100 text-brand-600" :
                "bg-stone-200 text-stone-400"
              }`}>
                {i + 1}
              </div>
              <span className="text-sm text-stone-500 hidden sm:block">
                {s === "datetime" ? "Fecha y hora" : "Tus datos"}
              </span>
              {i < 1 && <div className="h-px w-8 bg-stone-200 flex-1" />}
            </div>
          ))}
        </div>

        {/* Error de submit */}
        {errors.submit && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {errors.submit}
          </div>
        )}

        {step === "datetime" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-stone-900">Elige fecha y hora</h2>
            <BookingCalendar onSelect={handleDateTimeSelect} selected={selected} />
            {selected && (
              <div className="card bg-brand-50 border border-brand-200">
                <p className="text-sm text-brand-700">
                  <span className="font-semibold">Seleccionado:</span>{" "}
                  {formatDate(selected.date)} a las {selected.time} –{" "}
                  {addMinutes(selected.time, BUSINESS_CONFIG.appointmentDurationMinutes)}
                </p>
              </div>
            )}
            <button
              onClick={handleNextStep}
              disabled={!selected}
              className="btn-primary w-full"
            >
              Continuar →
            </button>
          </div>
        )}

        {step === "form" && selected && (
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <h2 className="text-xl font-bold text-stone-900 mb-1">Tus datos</h2>
              <p className="text-sm text-stone-500">
                Cita: {formatDate(selected.date)} · {selected.time} –{" "}
                {addMinutes(selected.time, BUSINESS_CONFIG.appointmentDurationMinutes)}
              </p>
            </div>

            <div className="card space-y-5">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.clientName}
                  onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                  placeholder="Tu nombre"
                  className={`input-field ${errors.clientName ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : ""}`}
                  autoComplete="name"
                />
                {errors.clientName && <p className="mt-1.5 text-xs text-red-600">{errors.clientName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.clientPhone}
                  onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
                  placeholder="+34 600 000 000"
                  className={`input-field ${errors.clientPhone ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : ""}`}
                  autoComplete="tel"
                />
                {errors.clientPhone && <p className="mt-1.5 text-xs text-red-600">{errors.clientPhone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Email <span className="text-stone-400 font-normal">(opcional, para recordatorio)</span>
                </label>
                <input
                  type="email"
                  value={form.clientEmail}
                  onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
                  placeholder="tu@email.com"
                  className={`input-field ${errors.clientEmail ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : ""}`}
                  autoComplete="email"
                />
                {errors.clientEmail && <p className="mt-1.5 text-xs text-red-600">{errors.clientEmail}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Notas <span className="text-stone-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Ej: corte en degradado, me gusta corto por los lados…"
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("datetime")}
                className="btn-secondary flex-1"
              >
                ← Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? "Reservando…" : "Confirmar cita"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
