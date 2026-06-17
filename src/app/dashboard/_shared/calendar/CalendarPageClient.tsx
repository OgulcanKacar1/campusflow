'use client';

import React, { useState, useEffect } from 'react';
import { CalendarView } from './CalendarView';
import { CreateMeetingDialog } from './CreateMeetingDialog';
import { EventDetailDialog } from './EventDetailDialog';
import { CalendarEvent } from '@/types/kanban';
import { Plus, Loader2 } from 'lucide-react';
import { createMeeting, getGlobalCalendarEvents, deleteMeeting } from '@/app/dashboard/shared/calendar-actions';

interface CalendarPageClientProps {
  courseIds: string[];
  teamIds: string[];
  courses: { id: string; name: string }[];
  teams: { id: string; name: string; course_id: string }[];
  isInstructor: boolean;
  currentUserId: string;
}

export const CalendarPageClient: React.FC<CalendarPageClientProps> = ({
  courseIds,
  teamIds,
  courses,
  teams,
  isInstructor,
  currentUserId,
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    const result = await getGlobalCalendarEvents(courseIds, teamIds, !isInstructor);
    if (result.data) {
      // Etkinlik başlıklarına Ders Kodunu ([CSE101] gibi) ve Hoca için Takım Adını ekle
      const formattedEvents = (result.data || []).map((event) => {
        const teamId = event.originalData?.team_id;
        const team = teams.find((t) => t.id === teamId);
        const courseId = event.originalData?.course_id || team?.course_id;
        const course = courses.find((c) => c.id === courseId);

        let prefix = '';
        if (course) prefix += `[${course.code}] `;
        if (isInstructor && team) prefix += `${team.name} - `;

        if (prefix) {
          return {
            ...event,
            title: `${prefix}${event.title}`,
          };
        }
        return event;
      });

      setEvents(formattedEvents);
    } else {
      console.error(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [courseIds, teamIds]);

  const handleCreateMeeting = async (data: any) => {
    const result = await createMeeting(data);
    if (result.error) {
      alert(result.error);
    } else {
      setCreateDialogOpen(false);
      fetchEvents();
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    setLoading(true);
    const result = await deleteMeeting(id);
    if (result.error) {
      alert(result.error);
      setLoading(false);
    } else {
      setDetailDialogOpen(false);
      setSelectedEvent(null);
      fetchEvents();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] relative animate-fade-in-up">
      {/* Üst Kısım: Başlık ve Buton */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Global Takvim</h1>
          <p className="text-sm text-muted-foreground">Tüm derslerinizdeki sprintler ve toplantılar.</p>
        </div>
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center px-4 py-2 text-sm font-bold uppercase tracking-widest rounded-lg transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
        >
          <Plus size={16} className="mr-2" />
          Yeni Toplantı
        </button>
      </div>

      {/* Takvim Görünümü */}
      <div className="flex-1 relative min-h-0">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-card backdrop-blur-sm rounded-2xl z-10 border border-border">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <CalendarView
            events={events}
            onEventClick={(ev) => {
              setSelectedEvent(ev);
              setDetailDialogOpen(true);
            }}
            currentUserId={currentUserId}
          />
        )}
      </div>

      <CreateMeetingDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateMeeting}
        courses={courses}
        teams={teams}
        sprints={events.filter(e => e.type === 'sprint').map(e => ({
          id: e.originalData?.id || e.id,
          title: e.title,
          team_id: e.originalData?.team_id || null,
          course_id: e.originalData?.course_id || null,
        }))}
        isInstructor={isInstructor}
      />

      <EventDetailDialog
        isOpen={detailDialogOpen}
        onClose={() => {
          setDetailDialogOpen(false);
          setTimeout(() => setSelectedEvent(null), 200);
        }}
        event={selectedEvent}
        teams={teams}
        courses={courses}
        isInstructor={isInstructor}
        currentUserId={currentUserId}
        onDelete={handleDeleteMeeting}
        onRefresh={fetchEvents}
      />
    </div>
  );
};
