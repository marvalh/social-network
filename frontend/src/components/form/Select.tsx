'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
  /** Small grey line under the label. */
  description?: string;
}

interface SelectProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  ariaLabel: string;
  id?: string;
  size?: 'sm' | 'md';
  /** Which edge of the trigger the menu lines up with. */
  align?: 'left' | 'right';
  disabled?: boolean;
  className?: string;
}

const TRIGGER_SIZE = {
  sm: 'h-8 gap-1.5 px-2.5 text-xs',
  md: 'h-9 gap-2 px-3 text-sm',
};

const MENU_MAX_HEIGHT = 288;
const MENU_GAP = 6;

export function Select<T extends string | number>({
  value,
  onChange,
  options,
  ariaLabel,
  id,
  size = 'sm',
  align = 'left',
  disabled,
  className = '',
}: SelectProps<T>) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [place, setPlace] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  function openMenu() {
    const trigger = triggerRef.current;
    if (!trigger || disabled) return;
    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - MENU_GAP - 12;
    const above = rect.top - MENU_GAP - 12;
    const flip = below < 200 && above > below;
    const room = Math.max(120, Math.min(MENU_MAX_HEIGHT, flip ? above : below));

    const next: CSSProperties = { minWidth: rect.width, maxHeight: room };
    if (flip) next.bottom = window.innerHeight - rect.top + MENU_GAP;
    else next.top = rect.bottom + MENU_GAP;
    if (align === 'right') next.right = document.documentElement.clientWidth - rect.right;
    else next.left = rect.left;

    setPlace(next);
    setActive(Math.max(0, selectedIndex));
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
  }

  function choose(index: number) {
    const option = options[index];
    if (option) onChange(option.value);
    closeMenu();
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    function handlePointer(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleScroll(event: Event) {
      if (menuRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    function handleResize() {
      setOpen(false);
    }
    document.addEventListener('mousedown', handlePointer);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    menuRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActive((current) => Math.min(options.length - 1, current + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActive((current) => Math.max(0, current - 1));
        break;
      case 'Home':
        event.preventDefault();
        setActive(0);
        break;
      case 'End':
        event.preventDefault();
        setActive(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        choose(active);
        break;
      case 'Escape':
        // Keep a parent popover (like the date picker) from closing too.
        event.preventDefault();
        event.stopPropagation();
        closeMenu();
        break;
      case 'Tab':
        closeMenu();
        break;
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleKeyDown}
        className={`flex items-center justify-between rounded-lg border border-border bg-surface text-foreground outline-none transition-colors hover:border-white/20 focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${TRIGGER_SIZE[size]} ${className}`}
      >
        <span className="truncate">{selected?.label ?? ''}</span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            data-select-menu
            style={place}
            className="fixed z-[60] w-max max-w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-2xl shadow-black/50 ring-1 ring-white/5"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === active;
              return (
                <div
                  key={String(option.value)}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  data-active={isActive}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(index)}
                  className={`flex cursor-pointer items-start gap-2 rounded-lg px-2.5 py-2 text-sm ${
                    isActive ? 'bg-muted' : ''
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate ${
                        isSelected ? 'font-medium text-brand-400' : 'text-foreground'
                      }`}
                    >
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </span>
                  <Check
                    className={`mt-0.5 size-4 shrink-0 text-brand-400 ${
                      isSelected ? '' : 'invisible'
                    }`}
                  />
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}