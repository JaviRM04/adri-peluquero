"use client";

import { useState, useEffect } from "react";
import { BUSINESS_CONFIG, isWorkingDay } from "@/lib/config";
import { cn } from "@/lib/utils";

interface Slot {
  time: string;
  available: boolean;
}

interface Props {
  onSelect: (date: string, time: string) => void;
  selected: { date: string; time: string } | null;
}

const DAY_NAMES = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export default function BookingCalendar({ onSelect, selected }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(selected?.date || null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + BUSINESS_CONFIG.maxAdvanceDays);

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    fetch(`/api/appointments?date=${selectedDate}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots || []);
      })
      .finally(() => setLoadingSlots(false));
  }, [selectedDate]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function handleDayClick(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    if (d < today || d > maxDate || !isWorkingDay(d)) return;
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(iso);
  }

  function handleTimeClick(time: string) {
    if (!selectedDate) return;
    onSelect(selectedDate, time);
  }

  return (
    <div className="space-y-6">
      {/* Month navigation */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-stone-100 transition text-stone-600"
            aria-label="Mes anterior"
          >
            ←
          </button>
          <span className="font-semibold text-stone-900 capitalize">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-stone-100 transition text-stone-600"
            aria-label="Mes siguiente"
          >
            →
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-stone-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const d = new Date(viewYear, viewMonth, day);
            const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isPast = d < today;
            const isTooFar = d > maxDate;
            const isWorking = isWorkingDay(d);
            const isDisabled = isPast || isTooFar || !isWorking;
            const isSelected = selectedDate === iso;
            const isToday = d.getTime() === today.getTime();

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                disabled={isDisabled}
                className={cn(
                  "aspect-square rounded-lg text-sm font-medium transition-all",
                  isDisabled && "text-stone-300 cursor-not-allowed",
                  !isDisabled && !isSelected && "text-stone-700 hover:bg-brand-50 hover:text-brand-700",
                  isSelected && "bg-brand-600 text-white shadow-md",
                  isToday && !isSelected && "ring-2 ring-brand-400 ring-offset-1",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div className="card">
          <h3 className="font-semibold text-stone-900 mb-4">
            Horas disponibles
          </h3>
          {loadingSlots ? (
            <div className="text-center py-6 text-stone-400">Cargando horarios…</div>
          ) : slots.length === 0 ? (
            <p className="text-stone-500 text-sm text-center py-4">
              No hay huecos disponibles para este día.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map(({ time, available }) => (
                <button
                  key={time}
                  onClick={() => available && handleTimeClick(time)}
                  disabled={!available}
                  className={cn(
                    "rounded-lg border py-2 text-sm font-medium transition-all",
                    available
                      ? selected?.time === time && selected?.date === selectedDate
                        ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                        : "border-stone-200 bg-white text-stone-700 hover:border-brand-400 hover:text-brand-700"
                      : "border-stone-100 bg-stone-50 text-stone-300 line-through cursor-not-allowed"
                  )}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
