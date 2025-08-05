import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateTime } from "luxon";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onClose?: () => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onDateRangeChange,
  onClose,
}: DateRangePickerProps) {
  // Always show previous month (left) and current month (right)
  const previousMonth = DateTime.now().minus({ months: 1 }).startOf("month");
  const currentMonth = DateTime.now().startOf("month");

  const [selectedStart, setSelectedStart] = useState(
    startDate ? DateTime.fromISO(startDate) : null
  );
  const [selectedEnd, setSelectedEnd] = useState(
    endDate ? DateTime.fromISO(endDate) : null
  );
  const [hoveredDate, setHoveredDate] = useState<DateTime | null>(null);
  const [selectionStep, setSelectionStep] = useState<"start" | "end">("start");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose?.();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [onClose]);

  const handleDateClick = (date: DateTime) => {
    if (selectionStep === "start") {
      setSelectedStart(date);
      setSelectedEnd(null);
      setSelectionStep("end");
    } else {
      if (selectedStart && date < selectedStart) {
        // If end date is before start, swap them
        setSelectedEnd(selectedStart);
        setSelectedStart(date);
      } else {
        setSelectedEnd(date);
      }
      setSelectionStep("start"); // Reset for next selection
    }
  };

  const handleApply = () => {
    if (selectedStart && selectedEnd) {
      onDateRangeChange(selectedStart.toISODate()!, selectedEnd.toISODate()!);
      onClose?.();
    } else if (selectedStart) {
      // If only start date is selected, use it as both start and end
      onDateRangeChange(selectedStart.toISODate()!, selectedStart.toISODate()!);
      onClose?.();
    }
  };

  const handleCancel = () => {
    onClose?.();
  };

  const handleQuickSelect = (preset: string) => {
    const now = DateTime.now();
    let start: DateTime;
    let end: DateTime = now;

    switch (preset) {
      case "today":
        start = now;
        end = now;
        break;
      case "yesterday":
        start = now.minus({ days: 1 });
        end = now.minus({ days: 1 });
        break;
      case "last7":
        start = now.minus({ days: 6 });
        break;
      case "last14":
        start = now.minus({ days: 13 });
        break;
      case "last30":
        start = now.minus({ days: 29 });
        break;
      case "thisMonth":
        start = now.startOf("month");
        end = now.endOf("month");
        break;
      case "lastMonth":
        start = now.minus({ months: 1 }).startOf("month");
        end = now.minus({ months: 1 }).endOf("month");
        break;
      default:
        return;
    }

    setSelectedStart(start);
    setSelectedEnd(end);
    setSelectionStep("start");
  };

  const renderCalendar = (month: DateTime) => {
    const startOfMonth = month.startOf("month");
    const endOfMonth = month.endOf("month");
    const startOfWeek = startOfMonth.startOf("week");
    const endOfWeek = endOfMonth.endOf("week");

    const days = [];
    let current = startOfWeek;

    while (current <= endOfWeek) {
      days.push(current);
      current = current.plus({ days: 1 });
    }

    const isInRange = (date: DateTime) => {
      if (!selectedStart) return false;
      if (!selectedEnd && !hoveredDate) return date.equals(selectedStart);

      const end = selectedEnd || (selectionStep === "end" ? hoveredDate : null);
      if (!end) return date.equals(selectedStart);

      const rangeStart = selectedStart;
      const rangeEnd = end;

      return date >= rangeStart && date <= rangeEnd;
    };

    const isRangeStart = (date: DateTime) => selectedStart?.equals(date);
    const isRangeEnd = (date: DateTime) => selectedEnd?.equals(date);

    return (
      <div className="p-4">
        <div className="flex items-center justify-center mb-4">
          <h3 className="font-semibold text-sm text-center min-w-[120px]">
            {month.toFormat("MMMM yyyy")}
          </h3>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div
              key={day}
              className="h-8 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const isCurrentMonth = day.month === month.month;
            const isToday = day.hasSame(DateTime.now(), "day");
            const inRange = isInRange(day);
            const rangeStart = isRangeStart(day);
            const rangeEnd = isRangeEnd(day);
            const isFutureDate = day > DateTime.now();

            return (
              <Button
                key={day.toISODate()}
                variant="ghost"
                size="sm"
                disabled={!isCurrentMonth || isFutureDate}
                className={`h-8 w-8 p-0 text-sm font-normal relative transition-all duration-150 ${
                  !isCurrentMonth || isFutureDate
                    ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    : "text-gray-900 dark:text-gray-100 hover:bg-pink-50 dark:hover:bg-pink-900/20 cursor-pointer"
                } ${
                  isToday && isCurrentMonth
                    ? "ring-2 ring-pink-400 dark:ring-pink-500 ring-offset-1 dark:ring-offset-gray-800"
                    : ""
                } ${
                  inRange && !rangeStart && !rangeEnd && isCurrentMonth
                    ? "bg-pink-100 dark:bg-pink-900/40 text-pink-900 dark:text-pink-200"
                    : ""
                } ${
                  (rangeStart || rangeEnd) && isCurrentMonth
                    ? "bg-pink-500 dark:bg-pink-600 text-white hover:bg-pink-600 dark:hover:bg-pink-700 font-semibold"
                    : ""
                }`}
                onClick={() =>
                  isCurrentMonth && !isFutureDate && handleDateClick(day)
                }
                onMouseEnter={() => {
                  if (
                    isCurrentMonth &&
                    !isFutureDate &&
                    selectedStart &&
                    selectionStep === "end"
                  ) {
                    setHoveredDate(day);
                  }
                }}
                onMouseLeave={() => setHoveredDate(null)}
              >
                {day.day}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="absolute top-full right-0 mt-2 z-50 min-w-[320px] sm:min-w-[600px] max-w-[90vw] w-auto"
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl w-full">
        {/* Header with close button and instructions */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Select Date Range</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {selectionStep === "start"
                ? "Click a date to select start of range"
                : "Click a date to select end of range"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick presets */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-3">
            Quick Select:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              { label: "Today", value: "today" },
              { label: "Yesterday", value: "yesterday" },
              { label: "Last 7 days", value: "last7" },
              { label: "Last 14 days", value: "last14" },
              { label: "Last 30 days", value: "last30" },
              { label: "This month", value: "thisMonth" },
              { label: "Last month", value: "lastMonth" },
            ].map((preset) => (
              <Button
                key={preset.value}
                variant="outline"
                size="sm"
                className="text-xs whitespace-nowrap h-8 bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200"
                onClick={() => handleQuickSelect(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Calendar section */}
        <div className="flex flex-col md:flex-row overflow-hidden">
          <div className="flex-1 min-w-0">{renderCalendar(previousMonth)}</div>
          <div className="flex-1 min-w-0 border-l-0 md:border-l border-t md:border-t-0">
            {renderCalendar(currentMonth)}
          </div>
        </div>

        {/* Footer with selected range and action buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 gap-3">
          <div className="text-sm">
            {selectedStart && selectedEnd ? (
              <div>
                <span className="text-gray-600 dark:text-gray-300">Selected range: </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedStart.toFormat("MMM d, yyyy")} -{" "}
                  {selectedEnd.toFormat("MMM d, yyyy")}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                  ({Math.abs(selectedEnd.diff(selectedStart, "days").days) + 1}{" "}
                  days)
                </span>
              </div>
            ) : selectedStart ? (
              <div>
                <span className="text-gray-600 dark:text-gray-300">Start date: </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedStart.toFormat("MMM d, yyyy")}
                </span>
                <span className="text-pink-600 dark:text-pink-400 ml-2">
                  ← Now select end date
                </span>
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">No dates selected</span>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="flex-1 sm:flex-none bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!selectedStart}
              className="bg-pink-600 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600 text-white flex-1 sm:flex-none disabled:opacity-50"
            >
              Select Range
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
