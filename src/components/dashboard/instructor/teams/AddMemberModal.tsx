'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, UserPlus, Search, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { addTeamMember } from '@/app/dashboard/instructor/teams/actions';
import type { Team } from '@/types/team';

interface EnrolledStudent {
  student_id: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface AvailableStudentRow {
  student_id: string;
  full_name?: string | null;
  email?: string | null;
}

interface AddMemberModalProps {
  team: Team | null;
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddMemberModal({ team, courseId, open, onOpenChange, onSuccess }: AddMemberModalProps) {
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<EnrolledStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const supabase = createClient();

  // Derse kayıtlı öğrencileri çek
  useEffect(() => {
    if (!open || !team) return;

    async function fetchStudents() {
      if (!team) return;
      setIsLoading(true);
      setError(null);

      // RPC ile bu dersteki takımsız öğrencileri getir
      const { data: availableStudents, error: rpcError } = await supabase
        .rpc('get_available_students_for_team', {
          p_course_id: courseId,
          p_exclude_team_id: team.id
        });

      if (rpcError) {
        setError('Öğrenci listesi alınamadı');
        setIsLoading(false);
        return;
      }

      const formattedStudents: EnrolledStudent[] = (availableStudents || []).map((s: AvailableStudentRow) => ({
        student_id: s.student_id,
        profiles: {
          id: s.student_id,
          full_name: s.full_name || 'İsimsiz',
          email: s.email || '',
        },
      }));

      startTransition(() => {
        setStudents(formattedStudents);
        setFilteredStudents(formattedStudents);
      });
      setIsLoading(false);
    }

    fetchStudents();

    // Reset state when modal opens
    startTransition(() => {
      setSelectedStudentIds(new Set());
      setSearchQuery('');
    });
  }, [open, team, courseId, supabase, startTransition]);

  // Arama filtreleme
  useEffect(() => {
    if (!searchQuery.trim()) {
      startTransition(() => setFilteredStudents(students));
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = students.filter(
      (s) =>
        s.profiles.full_name.toLowerCase().includes(query) ||
        s.profiles.email.toLowerCase().includes(query)
    );
    startTransition(() => setFilteredStudents(filtered));
  }, [searchQuery, students, startTransition]);

  const toggleStudent = (studentId: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setSelectedStudentIds(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || selectedStudentIds.size === 0) return;

    setIsSubmitting(true);
    setError(null);

    // Her öğrenci için sırayla ekle
    const promises = Array.from(selectedStudentIds).map((studentId) =>
      addTeamMember({ teamId: team.id, studentId })
    );

    const results = await Promise.all(promises);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      const addedCount = selectedStudentIds.size - errors.length;
      if (addedCount > 0) {
        setError(`${addedCount} öğrenci eklendi. ${errors.length} öğrenci zaten başka takımda olduğu için eklenemedi.`);
        onSuccess?.();
      } else {
        setError('Seçtiğiniz öğrencilerin tümü zaten başka takımlarda aktif üye.');
      }
    } else {
      onOpenChange(false);
      onSuccess?.();
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card border-gray-800 text-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Üye Ekle: {team?.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Arama */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="İsim veya email ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1f2e] border-gray-700 text-white"
              disabled={isLoading || isSubmitting}
            />
          </div>

          {/* Öğrenci Listesi - Grid Layout */}
          <div className="border border-gray-800 rounded-lg max-h-72 overflow-y-auto p-3">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Yükleniyor...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchQuery ? 'Arama sonucu bulunamadı' : 'Eklenecek öğrenci kalmadı'}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {filteredStudents.map((student) => {
                  const isSelected = selectedStudentIds.has(student.student_id);
                  return (
                    <button
                      key={student.student_id}
                      type="button"
                      onClick={() => toggleStudent(student.student_id)}
                      className={`relative p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-700 bg-[#1a1f2e] hover:border-gray-600 hover:bg-[#2a3142]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white leading-tight">
                            {student.profiles.full_name}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5 break-all leading-tight">
                            {student.profiles.email}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0">
                            <Check className="w-4 h-4 text-primary" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Seçili Sayısı */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              <span className="text-primary font-medium">{selectedStudentIds.size}</span> öğrenci seçildi
            </p>
            {selectedStudentIds.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedStudentIds(new Set())}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Tümünü Kaldır
              </button>
            )}
          </div>

          {/* Hata */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Butonlar */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-gray-700 text-gray-300"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || selectedStudentIds.size === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ekleniyor...
                </>
              ) : (
                `Ekle (${selectedStudentIds.size})`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
