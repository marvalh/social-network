'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DateTimePickerProps {
  id?: string;
  /** Local date and time as "YYYY-MM-DDTHH:mm", or "" when nothing is picked. */
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}

interface QuickPick {
  label: string;
  date: Date;
}

interface CalendarState {
  viewMonth: Date;
  today: Date;
  quickPicks: QuickPick[];
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const SELECT_CLASS =
  'h-8 rounded-lg border border-border bg-surface px-2 text-sm text-foreground outline-none [color-scheme:dark] focus-visible:ring-1 focus-visible:ring-ring';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseValue(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildQuickPicks(now: Date): QuickPick[] {
  const at7pm = (daysAhead: number) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead, 19, 0);

  const picks: QuickPick[] = [];
  const tonight = at7pm(0);
  if (tonight.getTime() > now.getTime()) picks.push({ label: 'Tonight', date: tonight });
  picks.push({ label: 'Tomorrow', date: at7pm(1) });
  const daysToSaturday = (6 - now.getDay() + 7) % 7 || 7;
  if (daysToSaturday > 1) picks.push({ label: 'Saturday', date: at7pm(daysToSaturday) });
  picks.push({ label: 'Next week', date: at7pm(7) });
  return picks;
}

function formatSelected(date: Date) {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function DateTimePicker({ id, value, onChange, invalid }: DateTimePickerProps) {
  const selected = parseValue(value);
  const [calendar, setCalendar] = useState<CalendarState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const open = calendar !== null;

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setCalendar(null);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setCalendar(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  function toggle() {
    if (calendar) {
      setCalendar(null);
      return;
    }
    const now = new Date();
    setCalendar({
      viewMonth: startOfMonth(selected ?? now),
      today: startOfDay(now),
      quickPicks: buildQuickPicks(now),
    });
  }

  const hour24 = selected ? selected.getHours() : 19;
  const minute = selected ? Math.floor(selected.getMinutes() / 5) * 5 : 0;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const isPm = hour24 >= 12;

  function pickDay(day: Date) {
    onChange(toValue(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour24, minute)));
  }

  function changeTime(nextHour12: number, nextMinute: number, nextPm: boolean) {
    if (!calendar) return;
    const base = selected ?? calendar.today;
    const nextHour24 = (nextHour12 % 12) + (nextPm ? 12 : 0);
    onChange(
      toValue(new Date(base.getFullYear(), base.getMonth(), base.getDate(), nextHour24, nextMinute))
    );
  }

  function applyQuickPick(date: Date) {
    onChange(toValue(date));
    setCalendar((current) => (current ? { ...current, viewMonth: startOfMonth(date) } : current));
  }

  function shiftMonth(delta: number) {
    setCalendar((current) =>
      current ? { ...current, viewMonth: addMonths(current.viewMonth, delta) } : current
    );
  }

  function renderPanel(cal: CalendarState) {
    const monthStart = cal.viewMonth;
    const leadingBlanks = monthStart.getDay();
    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    const days = Array.from(
      { length: daysInMonth },
      (_, i) => new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1)
    );
    const canGoBack = monthStart.getTime() > startOfMonth(cal.today).getTime();

    return (
      <div
        role="dialog"
        aria-label="Choose date and time"
        className="absolute top-full left-0 z-30 mt-2 w-[19.5rem] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-3 shadow-2xl shadow-black/30"
      >
        <div className="mb-3 flex flex-wrap gap-1.5">
          {cal.quickPicks.map((pick) => (
            <button
              key={pick.label}
              type="button"
              onClick={() => applyQuickPick(pick.date)}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {pick.label} · 7 PM
            </button>
          ))}
        </div>

        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            disabled={!canGoBack}
            onClick={() => shiftMonth(-1)}
            className="grid size-8 place-items-center rounded-lg hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="size-4" />
          </button>
          <p className="text-sm font-semibold">
            {monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </p>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
            className="grid size-8 place-items-center rounded-lg hover:bg-muted"
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
            const isPast = day.getTime() < cal.today.getTime();
            const isSelected = selected ? sameDay(day, selected) : false;
            const isToday = sameDay(day, cal.today);
            return (
              <button
                key={day.getTime()}
                type="button"
                disabled={isPast}
                aria-pressed={isSelected}
                onClick={() => pickDay(day)}
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

        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <span className="text-xs font-medium text-muted-foreground">Time</span>
          <select
            aria-label="Hour"
            value={hour12}
            onChange={(e) => changeTime(Number(e.target.value), minute, isPm)}
            className={SELECT_CLASS}
          >
            {HOURS.map((h) => (
              <option key={h} value={h} className="bg-card text-foreground">
                {h}
              </option>
            ))}
          </select>
          <span className="text-muted-foreground">:</span>
          <select
            aria-label="Minute"
            value={minute}
            onChange={(e) => changeTime(hour12, Number(e.target.value), isPm)}
            className={SELECT_CLASS}
          >
            {MINUTES.map((m) => (
              <option key={m} value={m} className="bg-card text-foreground">
                {pad(m)}
              </option>
            ))}
          </select>
          <div
            role="group"
            aria-label="AM or PM"
            className="ml-auto flex overflow-hidden rounded-lg border border-border"
          >
            {(['AM', 'PM'] as const).map((label) => {
              const active = (label === 'PM') === isPm;
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => changeTime(hour12, minute, label === 'PM')}
                  className={`px-2.5 py-1 text-xs font-medium ${
                    active ? 'gradient text-white' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <Button type="button" size="sm" className="mt-3 w-full" onClick={() => setCalendar(null)}>
          Done
        </Button>
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
        aria-invalid={invalid || undefined}
        className={`flex h-9 w-full items-center gap-2 rounded-lg border bg-surface px-3 text-left text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring ${
          invalid ? 'border-destructive' : 'border-border'
        }`}
      >
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected ? formatSelected(selected) : 'Pick a date and time'}
        </span>
      </button>

      {calendar && renderPanel(calendar)}
    </div>
  );
}
