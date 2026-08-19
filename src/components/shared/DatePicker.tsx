'use client';

import { useState, useRef, useEffect } from 'react';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_CORTOS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

interface Props {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
}

export default function DatePicker({ value, onChange, minDate }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };

  const selectDate = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (minDate && dateStr < minDate) return;
    onChange(dateStr);
    setOpen(false);
  };

  const isDisabled = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return minDate ? dateStr < minDate : false;
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} className="w-full input-dark rounded-lg px-4 py-3 text-sm text-left flex justify-between items-center">
        <span className={value ? 'text-text-primary' : 'text-text-muted'}>{value || 'Seleccionar fecha'}</span>
        <span className="text-text-muted text-xs">📅</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-72 card-glass rounded-xl border border-border-dim p-4 glow-cyan shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <button type="button" onClick={prevMonth} className="text-text-muted hover:text-text-primary text-lg px-2 transition-colors">‹</button>
            <span className="font-bold text-sm text-text-primary font-display tracking-wider">{MESES[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="text-text-muted hover:text-text-primary text-lg px-2 transition-colors">›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DIAS_CORTOS.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-text-muted uppercase tracking-wider py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} />;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const selected = value === dateStr;
              const disabled = isDisabled(day);
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDate(day)}
                  className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                    selected
                      ? 'bg-accent-cyan text-bg-primary font-bold glow-cyan'
                      : isToday
                      ? 'border border-accent-cyan/30 text-accent-cyan'
                      : disabled
                      ? 'text-text-muted/30 cursor-not-allowed'
                      : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
