export const BUSINESS_CONFIG = {
  name: "Adrian Rosa Peluqueros",
  phone: "+34 600 000 000",
  address: "Calle Mayor 1, Tu Ciudad",
  instagram: "@adrian_peluquero",

  // 0 = domingo, 1 = lunes, ..., 6 = sábado
  workingDays: [1, 2, 3, 4, 5, 6], // lunes a sábado

  openTime: "09:00",
  closeTime: "20:00",

  appointmentDurationMinutes: 30,

  // Pausas (formato "HH:MM" - "HH:MM")
  breaks: [{ start: "14:00", end: "16:00" }],

  // Días festivos hardcoded (YYYY-MM-DD)
  holidays: [] as string[],

  // Máximo de días en el futuro que se pueden reservar
  maxAdvanceDays: 60,
};

export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  const [openHour, openMin] = BUSINESS_CONFIG.openTime.split(":").map(Number);
  const [closeHour, closeMin] = BUSINESS_CONFIG.closeTime.split(":").map(Number);
  const duration = BUSINESS_CONFIG.appointmentDurationMinutes;

  let current = openHour * 60 + openMin;
  const end = closeHour * 60 + closeMin;

  while (current + duration <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, "0");
    const m = (current % 60).toString().padStart(2, "0");
    const slotStart = `${h}:${m}`;

    const isInBreak = BUSINESS_CONFIG.breaks.some((brk) => {
      const [bsh, bsm] = brk.start.split(":").map(Number);
      const [beh, bem] = brk.end.split(":").map(Number);
      const breakStart = bsh * 60 + bsm;
      const breakEnd = beh * 60 + bem;
      return current >= breakStart && current < breakEnd;
    });

    if (!isInBreak) {
      slots.push(slotStart);
    }

    current += duration;
  }

  return slots;
}

export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60).toString().padStart(2, "0");
  const nm = (total % 60).toString().padStart(2, "0");
  return `${nh}:${nm}`;
}

export function isWorkingDay(date: Date): boolean {
  const day = date.getDay();
  if (!BUSINESS_CONFIG.workingDays.includes(day)) return false;
  const iso = date.toISOString().split("T")[0];
  if (BUSINESS_CONFIG.holidays.includes(iso)) return false;
  return true;
}
