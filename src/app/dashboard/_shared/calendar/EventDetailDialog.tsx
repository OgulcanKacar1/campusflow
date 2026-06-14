'use client';

import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, Link as LinkIcon, AlignLeft, ArrowRight, Video, Users, BookOpen, AlertTriangle } from 'lucide-react';
import type { CalendarEvent } from '@/types/kanban';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { updateMeetingNotes, updateMeetingDetails } from '@/app/dashboard/shared/calendar-actions';

interface EventDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  teams: { id: string; name: string; course_id: string }[];
  courses: { id: string; name: string; code: string }[];
  isInstructor: boolean;
  currentUserId: string;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
}

export const EventDetailDialog: React.FC<EventDetailDialogProps> = ({
  isOpen,
  onClose,
  event,
  teams,
  courses,
  isInstructor,
  currentUserId,
  onDelete,
  onRefresh,
}) => {
  const router = useRouter();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLink, setEditLink] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const canEdit = event?.type === 'meeting' && (isInstructor || event?.originalData?.created_by === currentUserId);

  // Modal açıldığında veya event değiştiğinde state'leri resetle
  React.useEffect(() => {
    if (event?.originalData?.meeting_notes) {
      setNotes(event.originalData.meeting_notes);
    } else {
      setNotes('');
    }
    
    if (event) {
      // Calendar view için eklenen [KOD] veya Takım Adı gibi önekleri veritabanına geri kaydetmemek için, 
      // orijinal veritabanı başlığını kullanıyoruz.
      let rawTitle = '';
      if (event.type === 'sprint') rawTitle = event.originalData?.name || '';
      else rawTitle = event.originalData?.title || '';
      
      setEditTitle(rawTitle);
      setEditDate(format(new Date(event.start), 'yyyy-MM-dd'));
      setEditStartTime(format(new Date(event.start), 'HH:mm'));
      setEditEndTime(format(new Date(event.end), 'HH:mm'));
      setEditDescription(event.description || '');
      setEditLink((event as any).link || '');
    }

    setIsEditingNotes(false);
    setIsConfirmingDelete(false);
    setIsEditingDetails(false);
  }, [event, isOpen]);

  // Modal kapandığında state'i sıfırla
  const handleClose = () => {
    setIsConfirmingDelete(false);
    setIsEditingNotes(false);
    setIsEditingDetails(false);
    onClose();
  };

  const handleSaveDetails = async () => {
    if (!event) return;
    setIsSavingDetails(true);
    const startIso = new Date(`${editDate}T${editStartTime}:00`).toISOString();
    const endIso = new Date(`${editDate}T${editEndTime}:00`).toISOString();
    
    const res = await updateMeetingDetails(event.id, {
      title: editTitle,
      description: editDescription,
      meeting_link: editLink,
      start_time: startIso,
      end_time: endIso
    });
    
    setIsSavingDetails(false);
    if (!res.error) {
       setToastMessage('Değişiklikler kaydedildi!');
       setTimeout(() => {
         setIsEditingDetails(false);
         setToastMessage('');
         if (onRefresh) onRefresh();
         onClose();
       }, 1500);
    } else {
       alert(res.error);
    }
  };

  if (!isOpen || !event) return null;

  // Takım ve Kurs ID'lerini bulalım (Yönlendirme için)
  const teamId = event.originalData?.team_id;
  const team = teams.find((t) => t.id === teamId);
  const courseId = event.originalData?.course_id || team?.course_id;
  const course = courses.find((c) => c.id === courseId);

  const handleNavigate = () => {
    if (!courseId) return;

    if (isInstructor) {
      if (teamId) {
        router.push(`/dashboard/instructor/courses/${courseId}/teams/${teamId}`);
      } else {
        router.push(`/dashboard/instructor/courses/${courseId}`);
      }
    } else {
      router.push(`/dashboard/student/courses/${courseId}`);
    }
    onClose();
  };

  // Renk ve Tip Ayarları
  let typeLabel = 'Etkinlik';
  let badgeColor = 'bg-gray-500/20 text-gray-300 border-gray-500/30';

  if (event.type === 'meeting') {
    typeLabel = 'Toplantı';
    badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  } else if (event.type === 'sprint') {
    typeLabel = 'Sprint Dönemi';
    badgeColor = 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  } else if (event.type === 'task') {
    typeLabel = 'Görev (Task)';
    badgeColor = 'bg-green-500/20 text-green-300 border-green-500/30';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-[#1a1f37] border border-white/10 shadow-2xl rounded-2xl w-full max-w-md p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Dekoratif Glow */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-4">
            {toastMessage}
          </div>
        )}

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="flex-1 mr-4">
            <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md border mb-3 ${badgeColor}`}>
              {typeLabel}
            </span>
            {isEditingDetails ? (
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xl font-bold text-white focus:outline-none focus:border-indigo-500/50"
                placeholder="Toplantı Başlığı"
              />
            ) : (
              <h2 className="text-xl font-bold text-white leading-tight">
                {event.type === 'sprint' ? event.originalData?.name : event.originalData?.title || event.title}
              </h2>
            )}
          </div>
          <button onClick={handleClose} className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 relative z-10">
          
          {/* Bağlı olduğu Takım ve Ders Bilgisi */}
          <div className="flex flex-col space-y-2 mb-4 bg-black/10 p-3.5 rounded-xl border border-white/5">
            {course && (
              <div className="flex items-center gap-2.5 text-sm text-white/80">
                <BookOpen size={16} className="text-indigo-400 shrink-0" />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-indigo-300">{course.code}</span>
                  <span className="text-white/60 truncate">{course.name}</span>
                  {!teamId && <span className="text-[10px] uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">Tüm Sınıf</span>}
                </div>
              </div>
            )}
            {team && (
              <div className="flex items-center gap-2.5 text-sm text-white/80">
                <Users size={16} className="text-emerald-400 shrink-0" />
                <div className="flex items-center gap-1.5">
                  <span className="text-white/60">Takım:</span>
                  <span className="font-medium text-emerald-300">{team.name}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-white/80 bg-black/20 p-3.5 rounded-xl border border-white/5">
            <CalendarIcon size={18} className="text-indigo-400 shrink-0" />
            <div className="flex flex-col gap-2 w-full">
              {isEditingDetails ? (
                <>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded p-1 text-white focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded p-1 text-white focus:outline-none"
                    />
                    <span>-</span>
                    <input
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded p-1 text-white focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="font-medium">{format(new Date(event.start), 'd MMMM yyyy, EEEE', { locale: tr })}</div>
                  {event.type !== 'task' && (
                    <div className="text-white/50 text-xs flex items-center gap-1.5">
                      <Clock size={12} />
                      <span>{format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {(event.description || isEditingDetails) && (
            <div className="flex items-start gap-3 text-sm text-white/80 bg-black/20 p-3.5 rounded-xl border border-white/5">
              <AlignLeft size={18} className="text-indigo-400 shrink-0 mt-0.5" />
              {isEditingDetails ? (
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:outline-none h-20 resize-none"
                  placeholder="Açıklama"
                />
              ) : (
                <div className="leading-relaxed">{event.description}</div>
              )}
            </div>
          )}

          {(event.type === 'meeting' && (event.link || isEditingDetails)) && (
            <div className="flex items-center gap-3 text-sm text-white/80 bg-black/20 p-3.5 rounded-xl border border-white/5">
              <Video size={18} className="text-blue-400 shrink-0" />
              {isEditingDetails ? (
                <input
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                  placeholder="Görüşme Linki (Zoom, Meet vs.)"
                />
              ) : (
                <a 
                  href={event.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors truncate font-medium"
                >
                  Toplantıya Katıl
                </a>
              )}
            </div>
          )}

          {/* Toplantı Kararları / Notları Alanı */}
          {event.type === 'meeting' && (
            <div className="flex flex-col gap-2 bg-black/20 p-4 rounded-xl border border-white/5 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm font-semibold text-emerald-400">
                  <AlignLeft size={16} className="mr-2" />
                  Toplantı Kararları & Notlar
                </div>
                {!isEditingNotes && (
                  <button 
                    onClick={() => setIsEditingNotes(true)}
                    className="text-xs text-white/50 hover:text-white transition-colors"
                  >
                    {notes ? 'Düzenle' : 'Not Ekle'}
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <div className="mt-2 space-y-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Toplantıda alınan kararları, tartışılan konuları buraya yazın..."
                    className="w-full h-32 bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setIsEditingNotes(false)}
                      className="px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                      disabled={isSavingNotes}
                    >
                      İptal
                    </button>
                    <button 
                      onClick={async () => {
                        setIsSavingNotes(true);
                        const res = await updateMeetingNotes(event.id, notes);
                        setIsSavingNotes(false);
                        if (!res.error) {
                          setIsEditingNotes(false);
                          if (event.originalData) event.originalData.meeting_notes = notes;
                        } else {
                          alert(res.error);
                        }
                      }}
                      disabled={isSavingNotes}
                      className="px-3 py-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-colors disabled:opacity-50"
                    >
                      {isSavingNotes ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                  {notes ? notes : <span className="text-white/30 italic">Henüz not eklenmemiş.</span>}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 relative z-10">
          {isConfirmingDelete ? (
            <div className="flex flex-col space-y-3 bg-red-500/10 border border-red-500/20 p-4 rounded-xl animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center text-red-400 text-sm font-medium mb-1">
                <AlertTriangle size={16} className="mr-2 shrink-0" />
                Bu toplantıyı silmek istediğinize emin misiniz?
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  onClick={() => {
                    if (onDelete) onDelete(event.id);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-lg shadow-red-500/20 transition-all hover:scale-105"
                >
                  Evet, Sil
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {event.type === 'meeting' && (isInstructor || event.originalData?.created_by === currentUserId) && onDelete && (
                  <button
                    onClick={() => setIsConfirmingDelete(true)}
                    className="px-4 py-2 text-sm font-medium text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 border border-red-500/20 rounded-lg transition-colors"
                  >
                    Toplantıyı İptal Et
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {canEdit && !isEditingDetails && !isEditingNotes && (
                  <button
                    onClick={() => setIsEditingDetails(true)}
                    className="px-4 py-2 text-sm font-medium text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500 border border-blue-500/20 rounded-lg transition-colors"
                  >
                    Düzenle
                  </button>
                )}
                {isEditingDetails && (
                  <button
                    onClick={handleSaveDetails}
                    disabled={isSavingDetails}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSavingDetails ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Kapat
                </button>

                {event.type !== 'meeting' && teamId && (
                  <button
                    onClick={handleNavigate}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                  >
                    Panoya Git
                    <ArrowRight size={16} className="ml-2" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
