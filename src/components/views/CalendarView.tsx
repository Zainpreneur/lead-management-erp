'use client';
import * as React from 'react';
import { cn } from '@/lib/cn';

export interface CalendarEvent {
  id: string | number;
  title: string;
  date: string;
  color?: string;
  url?: string;
}

export function CalendarView({ 
  events, 
  onEventClick 
}: { 
  events: CalendarEvent[]; 
  onEventClick?: (event: CalendarEvent) => void;
}) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  events.forEach((e) => {
    const dateStr = e.date.split('T')[0];
    if (!eventsByDate[dateStr]) eventsByDate[dateStr] = [];
    eventsByDate[dateStr].push(e);
  });
  
  const cells: React.ReactNode[] = [];
  // Empty cells for days before the first
  for (let i = 0; i < startDay; i++) {
    cells.push(<div key={`empty-${i}`} className="min-h-[60px] border border-slate-100 bg-slate-50/50" />);
  }
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = eventsByDate[dateStr] || [];
    const isToday = dateStr === new Date().toISOString().slice(0, 10);
    
    cells.push(
      <div key={day} className={cn('min-h-[60px] border border-slate-100 p-1', isToday && 'bg-brand-50')}>
        <div className={cn('text-xs font-medium mb-1', isToday ? 'text-brand-600' : 'text-slate-500')}>{day}</div>
        <div className="space-y-0.5">
          {dayEvents.slice(0, 3).map((e) => (
            <button
              key={e.id}
              onClick={() => onEventClick?.(e)}
              className={cn('w-full truncate rounded px-1 py-0.5 text-[10px] font-medium text-white', e.color || 'bg-brand-500')}
            >
              {e.title}
            </button>
          ))}
          {dayEvents.length > 3 && (
            <div className="text-[10px] text-slate-400">+{dayEvents.length - 3} more</div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100">←</button>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{monthNames[month]} {year}</h3>
          <button onClick={today} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200">Today</button>
        </div>
        <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100">→</button>
      </div>
      <div className="grid grid-cols-7">
        {dayNames.map((d) => (
          <div key={d} className="border-b border-slate-200 px-2 py-1.5 text-center text-xs font-medium text-slate-500">{d}</div>
        ))}
        {cells}
      </div>
    </div>
  );
}