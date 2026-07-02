"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  params: { token: string };
}

export default function CancelarPage({ params }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${params.token}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al cancelar la cita");
        return;
      }
      router.push(`/cita/${params.token}`);
      router.refresh();
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">¿Cancelar tu cita?</h1>
          <p className="text-stone-500 mb-6">
            Esta acción no se puede deshacer. Si cancelas, tendrás que reservar una nueva cita.
          </p>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="btn-danger w-full"
            >
              {loading ? "Cancelando…" : "Sí, cancelar mi cita"}
            </button>
            <Link
              href={`/cita/${params.token}`}
              className="btn-secondary w-full"
            >
              No, mantener la cita
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
