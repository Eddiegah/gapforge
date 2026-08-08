"use client";

import { useState, useEffect } from "react";
import { AppNav } from "@/components/nav";
import {
  CalendarDays, Plus, Trash2, ChevronLeft, ChevronRight,
  Clock, Tag, Loader2, Edit2, Check, X, Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO
  type: "deadline" | "milestone" | "meeting" | "review" | "submission";
  linked_gap?: string;
  linked_issue?: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
}

const TYPE_COLORS: Record<string, string> = {
  deadline: "bg-red-500/20 text-red-400 border-red-500/30",
  milestone: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  meeting: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  review: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  submission: "bg-green-500/20 text-green-400 border-green-500/30",
};

const PRIORITY_ICONS: Record<string, string> = {
  high: "text-red-400",
  medium: "text-amber-400",
  low: "text-green-400",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", date: "", type: "deadline" as CalendarEvent["type"],
    priority: "medium" as CalendarEvent["priority"],
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetch("/api/calendar")
      .then(r => r.json())
      .then(d => setEvents(d.events ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const eventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(e => e.date.startsWith(dateStr));
  };

  const openAddForm = (day?: number) => {
    const d = day ?? selectedDay ?? today.getDate();
    setForm({
      title: "", description: "",
      date: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      type: "deadline", priority: "medium",
    });
    setEditId(null);
    setShowForm(true);
  };

  const saveEvent = async () => {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    try {
      const method = editId ? "PATCH" : "POST";
      const url = editId ? `/api/calendar/${editId}` : "/api/calendar";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (d.event) {
        if (editId) setEvents(prev => prev.map(e => e.id === editId ? d.event : e));
        else setEvents(prev => [d.event, ...prev]);
        setShowForm(false);
        setEditId(null);
        showToast(editId ? "Event updated" : "Event added");
      }
    } catch { showToast("Failed to save"); }
    finally { setSaving(false); }
  };

  const deleteEvent = async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    await fetch(`/api/calendar/${id}`, { method: "DELETE" });
    showToast("Event deleted");
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, completed: !completed } : e));
    await fetch(`/api/calendar/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    });
  };

  const upcomingEvents = events
    .filter(e => !e.completed && new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8);

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 px-4 md:px-8 py-8 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
                <CalendarDays size={22} className="text-violet-400" />
                Research Calendar
              </h1>
              <p className="text-sm text-[rgb(var(--muted))] mt-1">Track deadlines, milestones, and submissions</p>
            </div>
            <button onClick={() => openAddForm()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
              <Plus size={14} /> Add event
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <div className="card p-5">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-5">
                  <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-[rgb(var(--bg))] transition-colors">
                    <ChevronLeft size={16} className="text-[rgb(var(--muted))]" />
                  </button>
                  <h2 className="text-base font-semibold text-[rgb(var(--fg))]">{MONTH_NAMES[month]} {year}</h2>
                  <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-[rgb(var(--bg))] transition-colors">
                    <ChevronRight size={16} className="text-[rgb(var(--muted))]" />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d} className="text-center text-xs font-medium text-[rgb(var(--muted))] py-1">{d}</div>
                  ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayEvents = eventsForDay(day);
                    const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
                    const isSelected = selectedDay === day;
                    return (
                      <button
                        key={day}
                        onClick={() => { setSelectedDay(day === selectedDay ? null : day); }}
                        onDoubleClick={() => openAddForm(day)}
                        className={cn(
                          "relative rounded-lg p-1.5 text-center transition-colors min-h-[44px] flex flex-col items-center",
                          isSelected ? "bg-violet-600/20 ring-1 ring-violet-500/50" : "hover:bg-[rgb(var(--bg))]",
                          isToday && !isSelected && "ring-1 ring-violet-500/40"
                        )}
                      >
                        <span className={cn(
                          "text-xs font-medium w-6 h-6 rounded-full flex items-center justify-center",
                          isToday ? "bg-violet-600 text-white" : "text-[rgb(var(--fg))]"
                        )}>{day}</span>
                        {dayEvents.length > 0 && (
                          <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                            {dayEvents.slice(0, 3).map(e => (
                              <div key={e.id} className={cn("w-1.5 h-1.5 rounded-full",
                                e.type === "deadline" ? "bg-red-400" :
                                e.type === "milestone" ? "bg-violet-400" :
                                e.type === "meeting" ? "bg-blue-400" :
                                e.type === "review" ? "bg-amber-400" : "bg-green-400"
                              )} />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected day events */}
                {selectedDay && (
                  <div className="mt-5 pt-4 border-t border-[rgb(var(--border))]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">
                        {MONTH_NAMES[month]} {selectedDay}
                      </h3>
                      <button onClick={() => openAddForm(selectedDay)}
                        className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                        <Plus size={12} /> Add event
                      </button>
                    </div>
                    {eventsForDay(selectedDay).length === 0 ? (
                      <p className="text-xs text-[rgb(var(--muted))] text-center py-3">No events. Double-click a day to add.</p>
                    ) : (
                      <div className="space-y-2">
                        {eventsForDay(selectedDay).map(event => (
                          <div key={event.id} className={cn("flex items-start gap-2.5 p-2.5 rounded-lg border", TYPE_COLORS[event.type], event.completed && "opacity-50")}>
                            <button onClick={() => toggleComplete(event.id, event.completed)}
                              className="mt-0.5 w-4 h-4 rounded border border-current flex items-center justify-center flex-shrink-0">
                              {event.completed && <Check size={10} />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-xs font-medium", event.completed && "line-through")}>{event.title}</p>
                              {event.description && <p className="text-xs opacity-70 mt-0.5">{event.description}</p>}
                            </div>
                            <Flag size={12} className={cn("flex-shrink-0", PRIORITY_ICONS[event.priority])} />
                            <button onClick={() => deleteEvent(event.id)} className="p-0.5 rounded hover:bg-red-400/20 transition-colors">
                              <X size={12} className="text-red-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming sidebar */}
            <div className="space-y-4">
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-4 flex items-center gap-2">
                  <Clock size={14} className="text-violet-400" /> Upcoming
                </h3>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-violet-400" />
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <p className="text-xs text-[rgb(var(--muted))] text-center py-4">No upcoming events</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingEvents.map(event => {
                      const d = new Date(event.date);
                      const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
                      return (
                        <div key={event.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[rgb(var(--bg))]">
                          <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                            event.type === "deadline" ? "bg-red-400" :
                            event.type === "milestone" ? "bg-violet-400" :
                            event.type === "meeting" ? "bg-blue-400" :
                            event.type === "review" ? "bg-amber-400" : "bg-green-400"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[rgb(var(--fg))] truncate">{event.title}</p>
                            <p className="text-xs text-[rgb(var(--muted))] mt-0.5">
                              {diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : `in ${diff} days`}
                              {" · "}{d.toLocaleDateString("en", { month: "short", day: "numeric" })}
                            </p>
                          </div>
                          <Flag size={11} className={cn("flex-shrink-0 mt-0.5", PRIORITY_ICONS[event.priority])} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="card p-4">
                <p className="text-xs font-semibold text-[rgb(var(--muted))] mb-3 uppercase tracking-widest">Event types</p>
                <div className="space-y-1.5">
                  {Object.entries(TYPE_COLORS).map(([type, cls]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border capitalize", cls)}>{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-base font-semibold text-[rgb(var(--fg))]">{editId ? "Edit event" : "Add event"}</h2>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Event title"
              className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description (optional)" rows={2}
              className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none focus:border-violet-500" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1 block">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CalendarEvent["type"] }))}
                  className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none focus:border-violet-500">
                  {["deadline", "milestone", "meeting", "review", "submission"].map(t => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--muted))] mb-1 block">Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as CalendarEvent["priority"] }))}
                  className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none focus:border-violet-500">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-lg border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                Cancel
              </button>
              <button onClick={saveEvent} disabled={saving || !form.title.trim()}
                className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                {saving && <Loader2 size={14} className="animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] shadow-xl text-sm text-[rgb(var(--fg))]">
          {toast}
        </div>
      )}
    </div>
  );
}
