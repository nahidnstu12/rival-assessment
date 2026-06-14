"use client";

import { todayISO } from "@/lib/utils";
import { addDays, format, parseISO } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

type InlineDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
};

function toDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  return parseISO(iso);
}

function toISO(date: Date | undefined): string {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}

const QUICK_OPTIONS = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "Next week", days: 7 },
] as const;

export function InlineDatePicker({ value, onChange }: InlineDatePickerProps) {
  const selected = toDate(value);

  return (
    <div className="inline-datepicker">
      <div className="inline-datepicker-bar">
        <div>
          <p className="inline-datepicker-label">Selected date</p>
          <p className="inline-datepicker-value">
            {selected ? format(selected, "EEEE, MMM d, yyyy") : "No due date set"}
          </p>
        </div>
        {value && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange("")}>
            Clear
          </button>
        )}
      </div>

      <DayPicker
        mode="single"
        selected={selected}
        onSelect={(date) => onChange(toISO(date))}
        defaultMonth={selected ?? new Date()}
        showOutsideDays
        fixedWeeks
        classNames={{
          root: "rdp-root rdp-themed",
          months: "rdp-months",
          month: "rdp-month",
          month_caption: "rdp-month_caption",
          caption_label: "rdp-caption_label",
          nav: "rdp-nav",
          button_previous: "rdp-button_previous",
          button_next: "rdp-button_next",
          month_grid: "rdp-month_grid",
          weekdays: "rdp-weekdays",
          weekday: "rdp-weekday",
          week: "rdp-week",
          day: "rdp-day",
          day_button: "rdp-day_button",
          selected: "rdp-selected",
          today: "rdp-today",
          outside: "rdp-outside",
        }}
      />

      <div className="inline-datepicker-quick">
        {QUICK_OPTIONS.map(({ label, days }) => {
          const iso = days === 0 ? todayISO() : format(addDays(new Date(), days), "yyyy-MM-dd");
          return (
            <button
              key={label}
              type="button"
              className={`quick-date ${value === iso ? "active" : ""}`}
              onClick={() => onChange(iso)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
