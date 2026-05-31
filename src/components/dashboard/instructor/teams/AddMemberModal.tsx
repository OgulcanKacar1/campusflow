'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, Search } from 'lucide-react';
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
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const supabase = createClient();

  // Derse kayıtlı öğrencileri çek
  useEffect(() => {
    if (!open || !team) return;

    async function fetchStudents() {
      if (!team) return;
      setIsLoading(true);
      setError(null);

      // 1. Derse kayıtlı tüm öğrencileri al (sadece student_id)
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('student_id')
        .eq('course_id', courseId)
        .eq('status', 'enrolled');

      if (enrollError) {
        setError('Öğrenci listesi alınamadı');
        setIsLoading(false);
        return;
      }

      // 2. Mevcut takım üyelerini hariç tut
      const { data: members, error: memberError } = await supabase
        .from('team_members')
        .select('student_id')
        .eq('team_id', team.id)
        .is('left_at', null);

      if (memberError) {
        setError('Takım üyeleri alınamadı');
        setIsLoading(false);
        return;
      }

      const memberIds = new Set(members?.map((m) => m.student_id) || []);
      const availableStudentIds = (enrollments || [])
        .filter((e: any) => !memberIds.has(e.student_id))
        .map((e: any) => e.student_id) as string[];

      // 3. Profile bilgilerini ayrı sorguyla al (RLS bypass için)
      let availableStudents: EnrolledStudent[] = [];
      if (availableStudentIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', availableStudentIds);

        availableStudents = (profiles || []).map((p) => ({
          student_id: p.id,
          profiles: {
            id: p.id,
            full_name: p.full_name || 'İsimsiz',
            email: p.email || '',
          },
        }));
      }

      setStudents(availableStudents);
      setFilteredStudents(availableStudents);
      setIsLoading(false);
    }

    fetchStudents();

    // Reset state when modal opens
    setSelectedStudentId(null);
    setSearchQuery('');
  }, [open, team, courseId, supabase]);

  // Arama filtreleme
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = students.filter(
      (s) =>
        s.profiles.full_name.toLowerCase().includes(query) ||
        s.profiles.email.toLowerCase().includes(query)
    );
    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !selectedStudentId) return;

    setIsSubmitting(true);
    setError(null);

    const result = await addTeamMember({
      teamId: team.id,
      studentId: selectedStudentId,
    });

    if (result.error) {
      setError(result.error);
    } else {
      onOpenChange(false);
      onSuccess?.();
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0f1523] border-gray-800 text-white max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
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

          {/* Öğrenci Listesi */}
          <div className="border border-gray-800 rounded-lg max-h-60 overflow-y-auto">
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
              <div className="divide-y divide-gray-800">
                {filteredStudents.map((student) => (
                  <label
                    key={student.student_id}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                      selectedStudentId === student.student_id
                        ? 'bg-blue-600/20'
                        : 'hover:bg-[#1a1f2e]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="student"
                      value={student.student_id}
                      checked={selectedStudentId === student.student_id}
                      onChange={() => setSelectedStudentId(student.student_id)}
                      className="w-4 h-4 text-blue-600 border-gray-600 bg-[#1a1f2e]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {student.profiles.full_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {student.profiles.email}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
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
              disabled={isSubmitting || !selectedStudentId}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ekleniyor...
                </>
              ) : (
                'Ekle'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
