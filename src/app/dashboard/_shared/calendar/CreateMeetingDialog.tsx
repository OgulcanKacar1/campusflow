'use client';

import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, Link as LinkIcon, Type, AlignLeft, Users, CheckCircle2 } from 'lucide-react';

interface CreateMeetingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    meeting_link: string;
    start_time: string;
    end_time: string;
    team_id: string | null;
    sprint_id: string | null;
    course_id: string;
  }) => Promise<void>;
  courses: { id: string; name: string }[];
  teams: { id: string; name: string; course_id: string }[];
  sprints?: { id: string; title: string; team_id: string | null; course_id: string | null }[];
  isInstructor: boolean;
}

export const CreateMeetingDialog: React.FC<CreateMeetingDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  courses,
  teams,
  sprints = [],
  isInstructor,
}) => {
  const [loading, setLoading] = useState(false);
  
  // States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // Selection States
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || '');
  
  // Öğrenciler "Tüm Sınıf" seçemeyeceği için, default olarak ilk takımlarını seçili bırakıyoruz.
  const initialTeamsForCourse = teams.filter(t => t.course_id === (courses[0]?.id || ''));
  const [selectedTeam, setSelectedTeam] = useState<string>(
    isInstructor ? 'all' : (initialTeamsForCourse[0]?.id || 'all')
  );
  
  const [selectedSprint, setSelectedSprint] = useState<string>('none'); // 'none' means no sprint attached

  if (!isOpen) return null;

  // Filtrelenmiş takımlar (Seçili derse göre)
  const availableTeams = teams.filter(t => t.course_id === selectedCourse);

  // Filtrelenmiş Sprintler (Seçili derse veya takıma göre)
  const availableSprints = sprints.filter(s => {
    // Sprint'in course_id'sini takım üzerinden bulalım (çünkü DB'de sprintler takıma bağlı)
    const sprintTeam = teams.find(t => t.id === s.team_id);
    const sprintCourseId = sprintTeam ? sprintTeam.course_id : s.course_id; // fallback

    if (selectedTeam !== 'all') {
      return s.team_id === selectedTeam;
    }
    return sprintCourseId === selectedCourse;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Birleştirip ISO string yapalım
      const startIso = new Date(`${date}T${startTime}:00`).toISOString();
      const endIso = new Date(`${date}T${endTime}:00`).toISOString();

      await onSubmit({
        title,
        description,
        meeting_link: link,
        start_time: startIso,
        end_time: endIso,
        team_id: selectedTeam === 'all' ? null : selectedTeam,
        sprint_id: selectedSprint === 'none' ? null : selectedSprint,
        course_id: selectedCourse,
      });

      // Formu temizle
      setTitle('');
      setDescription('');
      setLink('');
      setDate('');
      setStartTime('');
      setEndTime('');
      setSelectedTeam('all');
      setSelectedSprint('none');
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card/60 backdrop-blur-3xl border border-border/40 shadow-2xl shadow-black/50 rounded-2xl w-full max-w-lg p-6 sm:p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Dekoratif Glow */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h2 className="text-xl font-bold text-white flex items-center">
            <CalendarIcon className="mr-2 text-primary" />
            Yeni Toplantı Planla
          </h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          
          {/* Ders ve Takım Seçimi */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center">
                <CheckCircle2 size={14} className="mr-1" /> Ders
              </label>
              <select
                required
                value={selectedCourse}
                onChange={(e) => {
                  const newCourseId = e.target.value;
                  setSelectedCourse(newCourseId);
                  
                  // Ders değiştiğinde takımı da doğru şekilde resetle
                  const teamsForNewCourse = teams.filter(t => t.course_id === newCourseId);
                  setSelectedTeam(isInstructor ? 'all' : (teamsForNewCourse[0]?.id || 'all'));
                }}
                className="w-full bg-background/40 border border-border/50 rounded-lg px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id} className="bg-card">{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 gap-4 relative">
                <div className="flex items-center text-sm font-medium text-emerald-400 mb-2">
                  <Users size={16} className="mr-2" />
                  Hedef Takım
                </div>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full bg-background/40 border border-emerald-500/20 text-foreground text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 appearance-none transition-all"
                >
                  {isInstructor && <option value="all">Tüm Sınıf (Genel Duyuru)</option>}
                  {availableTeams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                  {!isInstructor && availableTeams.length === 0 && (
                    <option value="all" disabled>Takımınız bulunamadı</option>
                  )}
                </select>
                {/* Custom arrow for select */}
                <div className="absolute right-4 bottom-3.5 pointer-events-none text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              {/* Hangi Sprint? (Opsiyonel) */}
              <div className="relative">
                <div className="flex items-center text-sm font-medium text-amber-400 mb-2">
                  <CalendarIcon size={16} className="mr-2" />
                  Bağlı Olduğu Sprint (İsteğe Bağlı)
                </div>
                <select
                  value={selectedSprint}
                  onChange={(e) => setSelectedSprint(e.target.value)}
                  className="w-full bg-background/40 border border-amber-500/20 text-foreground text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-amber-500/50 appearance-none transition-all"
                >
                  <option value="none">Sprint'e Bağlama (Sadece Toplantı)</option>
                  {availableSprints.map(s => {
                    const cleanTitle = s.title.replace(/\[.*?\]\s*/g, ''); // [CSE101] gibi prefixleri kaldır
                    return (
                      <option key={s.id} value={s.id}>{cleanTitle}</option>
                    );
                  })}
                </select>
                <div className="absolute right-4 bottom-3.5 pointer-events-none text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center">
              <Type size={14} className="mr-1" /> Toplantı Başlığı
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Sprint 1 Değerlendirmesi"
              className="w-full bg-background/40 border border-border/50 rounded-lg px-4 py-2.5 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center">
                <CalendarIcon size={14} className="mr-1" /> Tarih
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-background/40 border border-border/50 rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center">
                <Clock size={14} className="mr-1" /> Başlangıç
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-background/40 border border-border/50 rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center">
                <Clock size={14} className="mr-1" /> Bitiş
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-background/40 border border-border/50 rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center">
              <LinkIcon size={14} className="mr-1" /> Görüşme Linki (Zoom, Meet, Teams vb.)
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="w-full bg-background/40 border border-border/50 rounded-lg px-4 py-2.5 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center">
              <AlignLeft size={14} className="mr-1" /> Açıklama (Opsiyonel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Toplantı gündemi vb."
              rows={3}
              className="w-full bg-background/40 border border-border/50 rounded-lg px-4 py-2.5 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none transition-all"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-[11px] uppercase tracking-widest font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all shadow-md shadow-primary/20 disabled:opacity-50 flex items-center"
            >
              {loading ? 'Planlanıyor...' : 'Toplantıyı Planla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
