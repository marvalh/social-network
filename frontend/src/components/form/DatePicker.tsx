'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select } from './Select';

interface DatePickerProps {
  id?: string;
  /** Date as "YYYY-MM-DD", or "" when nothing is picked. */
  value: string;
  onChange: (value: string) => void;
  /** Earliest and latest dates that can be picked. */
  minDate: Date;
  maxDate: Date;
  /** Month shown first when nothing is picked yet. Defaults to maxDate. */
  startDate?: Date;
  placeholder?: string;
  invalid?: boolean;
  /** Taller trigger that lines up with the auth form inputs. */
  large?: boolean;
}

interface View {
  year: number;
  month: number;
  today: Date;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, month) => ({
  value: month,
  label: new Date(2000, month, 1).toLocaleDateString(undefined, { month: 'long' }),
}));

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// "YYYY-MM-DD" parsed as a local date (new Date("2001-03-12") would be UTC).
function parseValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function DatePicker({
  id,
  value,
  onChange,
  minDate,
  maxDate,
  startDate,
  placeholder = 'Pick a date',
  invalid,
  large,
}: DatePickerProps) {
  const selected = parseValue(value);
  const [view, setView] = useState<View | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const open = view !== null;

  const min = startOfDay(minDate);
  const max = startOfDay(maxDate);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      // The month/year dropdown menus are rendered outside this box.
      if (target.closest?.('[data-select-menu]')) return;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setView(null);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setView(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  function toggle() {
    if (view) {
      setView(null);
      return;
    }
    const first = selected ?? startDate ?? max;
    setView({ year: first.getFullYear(), month: first.getMonth(), today: startOfDay(new Date()) });
  }

  function monthIsInRange(year: number, month: number) {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    return last >= min && first <= max;
  }

  function shiftMonth(delta: number) {
    setView((current) => {
      if (!current) return current;
      const next = new Date(current.year, current.month + delta, 1);
      if (!monthIsInRange(next.getFullYear(), next.getMonth())) return current;
      return { ...current, year: next.getFullYear(), month: next.getMonth() };
    });
  }

  function pick(day: Date) {
    onChange(toValue(day));
    setView(null);
  }

  function renderPanel(current: View) {
    const leadingBlanks = new Date(current.year, current.month, 1).getDay();
    const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
    const days = Array.from(
      { length: daysInMonth },
      (_, i) => new Date(current.year, current.month, i + 1)
    );

    const yearOptions: { value: number; label: string }[] = [];
    for (let year = max.getFullYear(); year >= min.getFullYear(); year--) {
      yearOptions.push({ value: year, label: String(year) });
    }

    const prev = new Date(current.year, current.month - 1, 1);
    const next = new Date(current.year, current.month + 1, 1);
    const canGoBack = monthIsInRange(prev.getFullYear(), prev.getMonth());
    const canGoForward = monthIsInRange(next.getFullYear(), next.getMonth());

    return (
      <div
        role="dialog"
        aria-label="Choose a date"
        className="absolute top-full left-0 z-30 mt-2 w-[19.5rem] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-3 shadow-2xl shadow-black/30"
      >
        <div className="mb-3 flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Previous month"
            disabled={!canGoBack}
            onClick={() => shiftMonth(-1)}
            className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
            <Select
              ariaLabel="Month"
              value={current.month}
              options={MONTH_OPTIONS}
              onChange={(month) => setView({ ...current, month })}
              className="w-[6.75rem]"
            />
            <Select
              ariaLabel="Year"
              value={current.year}
              options={yearOptions}
              onChange={(year) => setView({ ...current, year })}
              className="w-[4.75rem]"
            />
          </div>

          <button
            type="button"
            aria-label="Next month"
            disabled={!canGoForward}
            onClick={() => shiftMonth(1)}
            className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((day) => (
            <span key={day} className="py-1 text-xs text-muted-foreground">
              {day}
            </span>
          ))}
          {Array.from({ length: leadingBlanks }, (_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {days.map((day) => {
            const disabled = day < min || day > max;
            const isSelected = selected ? sameDay(day, selected) : false;
            const isToday = sameDay(day, current.today);
            return (
              <button
                key={day.getTime()}
                type="button"
                disabled={disabled}
                aria-pressed={isSelected}
                onClick={() => pick(day)}
                className={`grid size-9 place-items-center rounded-lg text-sm disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent ${
                  isSelected
                    ? 'gradient font-semibold text-white'
                    : isToday
                      ? 'text-foreground ring-1 ring-brand-400 hover:bg-muted'
                      : 'text-foreground hover:bg-muted'
                }`}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex w-full items-center gap-2 rounded-lg border px-3 text-left text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring ${
          large ? 'field h-8' : 'h-9 bg-surface'
        } ${invalid ? 'border-destructive' : large ? '' : 'border-border'}`}
      >
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected
            ? selected.toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : placeholder}
        </span>
      </button>

      {view && renderPanel(view)}
    </div>
  );
}
