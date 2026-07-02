import Link from "next/link";
import { BUSINESS_CONFIG } from "@/lib/config";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            <span className="font-bold text-lg text-stone-900">{BUSINESS_CONFIG.name}</span>
          </div>
          <Link href="/reservar" className="btn-primary">
            Reservar cita
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-800 text-white">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Tu mejor versión,<br />
            <span className="text-brand-200">a tu medida</span>
          </h1>
          <p className="mt-6 text-lg text-brand-100 max-w-2xl mx-auto">
            Peluquería profesional para hombres. Cortes clásicos y modernos,
            arreglo de barba y tratamientos capilares. Reserva online en segundos.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/reservar" className="btn-primary bg-white text-brand-700 hover:bg-brand-50 shadow-lg text-base px-8 py-4">
              Reservar ahora
            </Link>
            <a
              href={`tel:${BUSINESS_CONFIG.phone}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-transparent px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10 active:scale-95"
            >
              {BUSINESS_CONFIG.phone}
            </a>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="py-16 bg-stone-50">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-center text-stone-900 mb-10">
            Servicios
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: "✂️", title: "Corte de pelo", desc: "Técnicas clásicas y modernas adaptadas a tu estilo" },
              { icon: "🪒", title: "Arreglo de barba", desc: "Perfilado, afeitado y tratamiento de barba" },
              { icon: "💈", title: "Corte + Barba", desc: "El pack completo para un look impecable" },
            ].map((s) => (
              <div key={s.title} className="card text-center">
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="font-bold text-stone-900 mb-2">{s.title}</h3>
                <p className="text-stone-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Horario */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-center text-stone-900 mb-10">
            Horario
          </h2>
          <div className="max-w-md mx-auto card">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-stone-100">
                {[
                  ["Lunes – Viernes", `${BUSINESS_CONFIG.openTime} – 14:00 / 16:00 – ${BUSINESS_CONFIG.closeTime}`],
                  ["Sábado", `${BUSINESS_CONFIG.openTime} – ${BUSINESS_CONFIG.closeTime}`],
                  ["Domingo", "Cerrado"],
                ].map(([day, hours]) => (
                  <tr key={day} className="flex justify-between py-3">
                    <td className="font-medium text-stone-700">{day}</td>
                    <td className="text-stone-500 text-right">{hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-600">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para tu próximo corte?
          </h2>
          <p className="text-brand-100 mb-8">
            Reserva tu cita online en menos de 1 minuto. Sin esperas, sin llamadas.
          </p>
          <Link href="/reservar" className="btn-primary bg-white text-brand-700 hover:bg-brand-50 text-base px-8 py-4">
            Reservar cita online
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-8">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm">
          <p className="font-semibold text-white mb-1">{BUSINESS_CONFIG.name}</p>
          <p>{BUSINESS_CONFIG.address}</p>
          <p className="mt-1">
            <a href={`tel:${BUSINESS_CONFIG.phone}`} className="hover:text-white transition">
              {BUSINESS_CONFIG.phone}
            </a>
          </p>
          <p className="mt-4 text-xs text-stone-600">
            © {new Date().getFullYear()} {BUSINESS_CONFIG.name}
          </p>
        </div>
      </footer>
    </div>
  );
}
