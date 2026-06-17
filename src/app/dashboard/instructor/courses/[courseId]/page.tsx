'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Users, Settings, Loader2, CheckCircle } from 'lucide-react';
import { getCourseById, updateCourse, getCourseStudents, enrollSingleStudent, removeStudentsFromCourse, deleteCourse, archiveCourse } from '../../actions';
import { getTeamsByCourse, removeTeamMember, moveTeamMember, regenerateTeamInviteCode, setTeamLeader } from '@/app/dashboard/instructor/teams/actions';
import { TeamsList } from '@/components/dashboard/instructor/teams/TeamsList';
import { EditTeamModal } from '@/components/dashboard/instructor/teams/EditTeamModal';
import { DeleteTeamDialog } from '@/components/dashboard/instructor/teams/DeleteTeamDialog';
import { AddMemberModal } from '@/components/dashboard/instructor/teams/AddMemberModal';
import { RemoveMemberDialog } from '@/components/dashboard/instructor/teams/RemoveMemberDialog';
import { CreateTeamButton } from '@/components/dashboard/instructor/teams/CreateTeamButton';
import { RandomTeamsButton } from '@/components/dashboard/instructor/teams/RandomTeamsButton';
import { SprintTemplateModal } from '@/components/dashboard/instructor/courses/SprintTemplateModal';
import { DashboardBreadcrumb } from '@/components/dashboard/DashboardBreadcrumb';
import type { InstructorCourse } from '@/types/course';
import type { Team, TeamMember } from '@/types/team';
import type { CourseStudentSummary } from '@/types/instructor';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<InstructorCourse | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [students, setStudents] = useState<CourseStudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  
  // Team mode from settings (instructor | random | student)
  const [teamMode, setTeamMode] = useState<'instructor' | 'random' | 'student'>('instructor');
  // Sprint mode from settings (instructor | team)
  const [sprintMode, setSprintMode] = useState<'instructor' | 'team'>('team');
  
  // Team size settings
  const [teamSettings, setTeamSettings] = useState({
    minSize: 3,
    maxSize: 5
  });
  
  // Course settings form
  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    section: ''
  });

  // Modal states
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [addMemberTeam, setAddMemberTeam] = useState<Team | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [removeMemberTeam, setRemoveMemberTeam] = useState<Team | null>(null);
  const [removeMember, setRemoveMember] = useState<TeamMember | null>(null);
  const [isRemoveMemberOpen, setIsRemoveMemberOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Öğrenci Yönetimi State
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isRemovingStudents, setIsRemovingStudents] = useState(false);
  const [isRemoveStudentsModalOpen, setIsRemoveStudentsModalOpen] = useState(false);
  
  // Course action modals
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeleteCourseModalOpen, setIsDeleteCourseModalOpen] = useState(false);
  const [isDeleteSuccessModalOpen, setIsDeleteSuccessModalOpen] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const loadCourse = useCallback(async () => {
    setLoading(true);
    const result = await getCourseById(courseId);
    if (result.data) {
      setCourse(result.data);
      // Form state'ini doldur
      setCourseForm({
        name: result.data.name,
        code: result.data.code,
        section: result.data.section || ''
      });
      setTeamMode(result.data.teamMode ?? 'instructor');
      setSprintMode(result.data.sprintMode ?? 'team');
      setTeamSettings({
        minSize: result.data.teamMinSize ?? 3,
        maxSize: result.data.teamMaxSize ?? 5
      });
    }
    setLoading(false);
  }, [courseId]);

  const loadTeams = useCallback(async () => {
    setTeamsLoading(true);
    const result = await getTeamsByCourse(courseId);
    if (result.data) setTeams(result.data);
    setTeamsLoading(false);
  }, [courseId]);

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true);
    const result = await getCourseStudents(courseId);
    if (result.data) setStudents(result.data);
    setStudentsLoading(false);
  }, [courseId]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentEmail.trim()) return;
    setIsAddingStudent(true);
    const res = await enrollSingleStudent(courseId, newStudentEmail);
    if (res.error) {
      alert(res.error);
    } else {
      setNewStudentEmail('');
      loadStudents();
    }
    setIsAddingStudent(false);
  };

  const handleRemoveStudents = async () => {
    setIsRemovingStudents(true);
    const res = await removeStudentsFromCourse(courseId, selectedStudents);
    if (res.error) {
      alert(res.error);
    } else {
      setSelectedStudents([]);
      setIsRemoveStudentsModalOpen(false);
      loadStudents();
      loadTeams(); // Öğrenci takımdan da çıkmış olabilir, takımları yenile
    }
    setIsRemovingStudents(false);
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]);
  };

  const toggleAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void loadCourse();
      void loadTeams();
      void loadStudents();
    });

    return () => cancelAnimationFrame(frame);
  }, [loadCourse, loadTeams, loadStudents]);

  // Handlers
  const handleEdit = (team: Team) => {
    setEditTeam(team);
    setIsEditOpen(true);
  };

  const handleDelete = (team: Team) => {
    setDeleteTeam(team);
    setIsDeleteOpen(true);
  };

  const handleAddMember = (team: Team) => {
    setAddMemberTeam(team);
    setIsAddMemberOpen(true);
  };

  const handleRemoveMemberClick = (team: Team, member: TeamMember) => {
    setRemoveMemberTeam(team);
    setRemoveMember(member);
    setIsRemoveMemberOpen(true);
  };

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // TODO: Show toast
  };

  const handleRemoveMemberConfirm = async () => {
    if (!removeMemberTeam || !removeMember) return;
    const result = await removeTeamMember({
      teamId: removeMemberTeam.id,
      studentId: removeMember.studentId,
    });

    if (result.error) {
      alert('Üye çıkarılırken hata: ' + result.error);
    } else {
      setIsRemoveMemberOpen(false);
      setRemoveMemberTeam(null);
      setRemoveMember(null);
      void loadTeams();
    }
  };

  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    const timeout = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeout);
  }, []);

  const handleTeamsRefresh = useCallback(async () => {
    await Promise.all([loadTeams(), loadStudents()]);
    showToast('Takımlar güncellendi', 'success');
  }, [loadTeams, loadStudents, showToast]);

  const handleRegenerateInvite = async (team: Team) => {
    const result = await regenerateTeamInviteCode(team.id);
    if (result.error) {
      showToast('Hata: ' + result.error, 'error');
      return;
    }
    showToast('Yeni davet kodu oluşturuldu', 'success');
    await loadTeams();
  };

  const handleMoveMember = async (studentId: string, fromTeamId: string, toTeamId: string) => {
    const result = await moveTeamMember(studentId, fromTeamId, toTeamId);
    if (result.error) {
      showToast('Hata: ' + result.error, 'error');
    } else {
      showToast('Takım ayarları güncellendi', 'success');
      void loadCourse();
    }
  };

  const confirmArchiveCourse = async () => {
    setIsProcessingAction(true);
    const result = await archiveCourse(courseId);
    setIsProcessingAction(false);
    if (result.error) {
      showToast('Hata: ' + result.error, 'error');
    } else {
      showToast('Ders başarıyla arşivlendi.', 'success');
      setIsArchiveModalOpen(false);
      void loadCourse();
    }
  };

  const confirmDeleteCourse = async () => {
    setIsProcessingAction(true);
    const result = await deleteCourse(courseId);
    setIsProcessingAction(false);
    if (result.error) {
      showToast('Hata: ' + result.error, 'error');
    } else {
      setIsDeleteCourseModalOpen(false);
      setIsDeleteSuccessModalOpen(true);
    }
  };

  const handleSetLeader = async (team: Team, member: TeamMember) => {
    const result = await setTeamLeader(courseId, team.id, member.studentId);
    if (result.error) {
      showToast('Hata: ' + result.error, 'error');
    } else {
      showToast(`${member.studentName || 'Öğrenci'} takım lideri yapıldı`, 'success');
      void loadTeams();
    }
  };

  const handleSaveCourse = async () => {
    const result = await updateCourse({
      courseId,
      name: courseForm.name,
      code: courseForm.code,
      section: courseForm.section
    });
    
    if (result.error) {
      showToast('Hata: ' + result.error, 'error');
    } else {
      await loadCourse(); // Tüm state'leri yenile
      showToast('Ders bilgileri güncellendi', 'success');
    }
  };

  const handleSaveTeamSettings = async () => {
    const result = await updateCourse({
      courseId,
      teamMode: teamMode,
      minTeamSize: teamSettings.minSize,
      maxTeamSize: teamSettings.maxSize
    });
    
    if (result.error) {
      showToast('Hata: ' + result.error, 'error');
    } else {
      showToast('Takım ayarları kaydedildi', 'success');
    }
  };

  const handleSaveSprintSettings = async () => {
    const result = await updateCourse({
      courseId,
      sprintMode: sprintMode
    });
    
    if (result.error) {
      showToast('Hata: ' + result.error, 'error');
    } else {
      showToast('Kanban ve Sprint ayarları kaydedildi', 'success');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all ${
          toast.type === 'success' 
            ? 'bg-emerald-500/90 text-white' 
            : 'bg-red-500/90 text-white'
        }`}>
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <DashboardBreadcrumb 
          items={[
            { label: 'Derslerim', href: '/dashboard/instructor/courses' },
            { label: course?.name || 'Yükleniyor...' }
          ]} 
        />

        {course?.status === 'archived' && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-yellow-500 font-bold text-lg">Bu Ders Arşivlenmiştir</h3>
              <p className="text-yellow-500/80 text-sm">Arşivlenmiş derslerde öğrenciler ve siz değişiklik yapamazsınız. Sadece okuma amaçlı görüntülenebilir.</p>
            </div>
            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 whitespace-nowrap">
              Salt Okunur
            </Badge>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{course?.code || courseForm.code}</h1>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  Aktif
                </Badge>
              </div>
              <p className="text-gray-400 text-lg">{course?.name || courseForm.name}</p>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <BookOpen className="w-4 h-4" />
              <span>Şube {course?.section || courseForm.section || '1'}</span>
              <span className="mx-2">•</span>
              <span>{course?.year || '2026'} - {course?.term === 'fall' ? 'Güz' : course?.term === 'spring' ? 'Bahar' : course?.term === 'summer' ? 'Yaz' : 'Güz'}</span>
            </div>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card/40 border-border/50 shadow-sm transition-colors group relative overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <CardContent className="p-6">
              <div className="absolute -right-4 -top-4 p-4 pointer-events-none transition-opacity" style={{ opacity: 0.05 }}>
                <Users className="w-24 h-24 text-emerald-500" />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                  <Users className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Kayıtlı Öğrenci</p>
                  <p className="text-2xl font-bold text-foreground tracking-tight">
                    {studentsLoading ? '…' : students.length || course?.studentCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/40 border-border/50 shadow-sm transition-colors group relative overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <CardContent className="p-6">
              <div className="absolute -right-4 -top-4 p-4 pointer-events-none transition-opacity" style={{ opacity: 0.05 }}>
                <Users className="w-24 h-24 text-blue-500" />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2.5 bg-blue-500/10 rounded-xl">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Proje Takımı</p>
                  <p className="text-2xl font-bold text-foreground tracking-tight">
                    {teamsLoading ? '…' : teams.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/40 border-border/50 shadow-sm transition-colors group relative overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <CardContent className="p-6">
              <div className="absolute -right-4 -top-4 p-4 pointer-events-none transition-opacity" style={{ opacity: 0.05 }}>
                <BookOpen className="w-24 h-24 text-[#ea580c]" />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2.5 rounded-xl bg-[#ea580c]/10">
                  <BookOpen className="w-5 h-5 text-[#ea580c]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Katılım Kodu</p>
                  <p className="text-lg font-mono font-bold text-[#ea580c] tracking-wider">
                    {course?.joinCode || '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="teams" className="w-full">
          <TabsList className="mb-8 bg-muted/50 p-1.5 h-auto rounded-xl inline-flex">
            <TabsTrigger 
              value="teams" 
              className="rounded-lg px-6 py-2 transition-all font-medium text-muted-foreground data-[state=active]:!bg-background data-[state=active]:!text-foreground data-[state=active]:shadow-sm data-active:!bg-background data-active:!text-foreground data-active:shadow-sm hover:text-foreground"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Takımlar</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="students" 
              className="rounded-lg px-6 py-2 transition-all font-medium text-muted-foreground data-[state=active]:!bg-background data-[state=active]:!text-foreground data-[state=active]:shadow-sm data-active:!bg-background data-active:!text-foreground data-active:shadow-sm hover:text-foreground"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>Öğrenciler</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="rounded-lg px-6 py-2 transition-all font-medium text-muted-foreground data-[state=active]:!bg-background data-[state=active]:!text-foreground data-[state=active]:shadow-sm data-active:!bg-background data-active:!text-foreground data-active:shadow-sm hover:text-foreground"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>Ayarlar</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teams">
            {teamsLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2">
                    {teamMode === 'instructor' && (
                      <CreateTeamButton courseId={courseId} onSuccess={handleTeamsRefresh} />
                    )}
                    {teamMode === 'random' && (
                      <RandomTeamsButton
                        courseId={courseId}
                        defaultTeamSize={teamSettings.maxSize ?? 3}
                        minTeamSize={teamSettings.minSize ?? 1}
                        maxTeamSize={teamSettings.maxSize ?? 3}
                        onSuccess={handleTeamsRefresh}
                      />
                    )}
                    {teamMode === 'student' && (
                      <p className="text-gray-400 text-sm">Öğrenciler kendi takımlarını seçebilir</p>
                    )}
                  </div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Mod: {teamMode === 'instructor' ? 'Eğitmen' : teamMode === 'random' ? 'Rastgele' : 'Öğrenci'}
                  </Badge>
                </div>
                <TeamsList 
                  teams={teams}
                  teamMode={teamMode}
                  courseId={courseId}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddMember={handleAddMember}
                  onCopyInviteCode={handleCopyInviteCode}
                  onRegenerateInviteCode={handleRegenerateInvite}
                  onRemoveMember={handleRemoveMemberClick}
                  onMoveMember={handleMoveMember}
                  onSetLeader={handleSetLeader}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="students">
            <Card className="bg-card/40 border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
                <div>
                  <CardTitle className="text-foreground">Kayıtlı Öğrenciler</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Derse kayıtlı tüm öğrenciler</p>
                </div>
                <div className="flex gap-2">
                  <form onSubmit={handleAddStudent} className="flex gap-2">
                    <input
                      type="email"
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                      placeholder="Öğrenci E-posta..."
                      className="bg-background border border-border/50 rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary w-full sm:w-48 transition-colors"
                      disabled={isAddingStudent}
                    />
                    <Button type="submit" disabled={isAddingStudent || !newStudentEmail.trim()} style={{ backgroundColor: '#ea580c', color: 'white' }} className="h-9 hover:opacity-90 transition-opacity">
                      {isAddingStudent ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ekle'}
                    </Button>
                  </form>
                  {selectedStudents.length > 0 && (
                    <Button 
                      variant="destructive" 
                      onClick={() => setIsRemoveStudentsModalOpen(true)}
                      disabled={isRemovingStudents}
                    >
                      Seçilenleri Çıkar ({selectedStudents.length})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {studentsLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : students.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Henüz kayıtlı öğrenci yok</p>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/30 border-b border-border/50 text-muted-foreground font-medium">
                      <tr>
                        <th className="px-4 py-3 w-12">
                          <label className="flex items-center cursor-pointer relative">
                            <input 
                              type="checkbox" 
                              checked={students.length > 0 && selectedStudents.length === students.length}
                              onChange={toggleAllStudents}
                              className="peer h-4 w-4 cursor-pointer transition-all appearance-none rounded shadow-sm border border-border bg-background checked:bg-[#ea580c] checked:border-[#ea580c] focus:outline-none focus:ring-2 focus:ring-[#ea580c]/30"
                            />
                            <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                              </svg>
                            </span>
                          </label>
                        </th>
                        <th className="px-4 py-3">Öğrenci</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Takım</th>
                        <th className="px-4 py-3">Katılım Tarihi</th>
                        <th className="px-4 py-3 text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 text-foreground">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <label className="flex items-center cursor-pointer relative">
                              <input 
                                type="checkbox"
                                checked={selectedStudents.includes(student.id)}
                                onChange={() => toggleStudentSelection(student.id)}
                                className="peer h-4 w-4 cursor-pointer transition-all appearance-none rounded shadow-sm border border-border bg-background checked:bg-[#ea580c] checked:border-[#ea580c] focus:outline-none focus:ring-2 focus:ring-[#ea580c]/30"
                              />
                              <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                              </span>
                            </label>
                          </td>
                          <td className="px-4 py-3 font-medium">{student.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{student.email}</td>
                          <td className="px-4 py-3">
                            {student.team ? (
                              <Badge variant="outline" className="bg-[#ea580c]/10 text-[#ea580c] border-[#ea580c]/20">
                                {student.team}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-muted text-muted-foreground border-border/50">
                                -
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{student.date}</td>
                          <td className="px-4 py-3 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setSelectedStudents([student.id]);
                                setIsRemoveStudentsModalOpen(true);
                              }}
                              disabled={isRemovingStudents}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              Çıkar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Modal for Removing Students */}
            <Dialog open={isRemoveStudentsModalOpen} onOpenChange={setIsRemoveStudentsModalOpen}>
              <DialogContent className="sm:max-w-md bg-card border-gray-800 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">Öğrencileri Dersten Çıkar</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-gray-300 text-sm">
                    {selectedStudents.length} öğrenciyi dersten çıkarmak istediğinize emin misiniz? Bu işlem, öğrencilerin mevcut takımlarından da kalıcı olarak çıkarılmasına neden olacaktır.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setIsRemoveStudentsModalOpen(false)} disabled={isRemovingStudents} className="text-gray-400 hover:text-foreground">
                    İptal
                  </Button>
                  <Button variant="destructive" onClick={handleRemoveStudents} disabled={isRemovingStudents}>
                    {isRemovingStudents ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Evet, Çıkar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Genel Ayarlar */}
              <Card className="bg-card/40 border-border/50 shadow-sm">
                <CardHeader className="border-b border-border/50 pb-4 mb-4">
                  <CardTitle className="text-foreground">Genel Ayarlar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Ders Adı</label>
                    <input 
                      type="text" 
                      value={courseForm?.name ?? ''}
                      onChange={(e) => setCourseForm(prev => ({...prev, name: e.target.value}))}
                      className="w-full bg-background border border-border/50 rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Ders Kodu</label>
                      <input 
                        type="text" 
                        value={courseForm?.code ?? ''}
                        onChange={(e) => setCourseForm(prev => ({...prev, code: e.target.value}))}
                        className="w-full bg-background border border-border/50 rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Şube</label>
                      <input 
                        type="text" 
                        value={courseForm?.section ?? ''}
                        onChange={(e) => setCourseForm(prev => ({...prev, section: e.target.value}))}
                        className="w-full bg-background border border-border/50 rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button onClick={handleSaveCourse} className="bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
                      Kaydet
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Takım Ayarları */}
              <Card className="bg-card/40 border-border/50 shadow-sm">
                <CardHeader className="border-b border-border/50 pb-4 mb-4">
                  <CardTitle className="text-foreground">Takım Ayarları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Takım Oluşturma Modu</label>
                    <select 
                      value={teamMode ?? 'instructor'}
                      onChange={(e) => setTeamMode(e.target.value as 'instructor' | 'random' | 'student')}
                      className="w-full bg-background border border-border/50 rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                    >
                      <option value="instructor">Eğitmen Oluşturur (Manuel)</option>
                      <option value="random">Rastgele Dağıtım</option>
                      <option value="student">Öğrenci Seçimi</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Min. Takım Boyutu</label>
                      <input 
                        type="number" 
                        value={teamSettings?.minSize ?? 3}
                        onChange={(e) => setTeamSettings(prev => ({...prev, minSize: parseInt(e.target.value) || 1}))}
                        className="w-full bg-background border border-border/50 rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Max. Takım Boyutu</label>
                      <input 
                        type="number" 
                        value={teamSettings?.maxSize ?? 5}
                        onChange={(e) => setTeamSettings(prev => ({...prev, maxSize: parseInt(e.target.value) || 1}))}
                        className="w-full bg-background border border-border/50 rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button onClick={handleSaveTeamSettings} className="bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
                      Kaydet
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tehlikeli Bölge */}
              <Card className="bg-destructive/5 border-destructive/20 shadow-sm col-span-1 lg:col-span-2">
                <CardHeader className="border-b border-destructive/10 pb-4 mb-4">
                  <CardTitle className="text-destructive">Tehlikeli Bölge</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-foreground font-medium">Dersi Arşivle</p>
                      <p className="text-sm text-muted-foreground mt-1">Dersi arşive taşı, öğrenciler erişemez</p>
                    </div>
                    <Button 
                      onClick={() => setIsArchiveModalOpen(true)} 
                      disabled={course?.status === 'archived'} 
                      className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto"
                    >
                      {course?.status === 'archived' ? 'Arşivlendi' : 'Arşivle'}
                    </Button>
                  </div>
                  <div className="border-t border-destructive/10 pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-destructive font-medium">Dersi Sil</p>
                        <p className="text-sm text-muted-foreground mt-1">Bu işlem geri alınamaz</p>
                      </div>
                      <Button 
                        onClick={() => setIsDeleteCourseModalOpen(true)} 
                        variant="destructive"
                        className="w-full sm:w-auto"
                      >
                        Sil
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <EditTeamModal
        team={editTeam}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={handleTeamsRefresh}
      />

      <DeleteTeamDialog
        team={deleteTeam}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onSuccess={handleTeamsRefresh}
      />

      <AddMemberModal
        team={addMemberTeam}
        courseId={courseId}
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
        onSuccess={handleTeamsRefresh}
      />

      <RemoveMemberDialog
        team={removeMemberTeam}
        member={removeMember}
        open={isRemoveMemberOpen}
        onOpenChange={setIsRemoveMemberOpen}
        onConfirm={handleRemoveMemberConfirm}
      />

      {/* Course Action Modals */}
      <Dialog open={isArchiveModalOpen} onOpenChange={setIsArchiveModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Dersi Arşivle</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-300 text-sm">
              Dersi arşivlemek istediğinize emin misiniz? Arşivlenen dersler sadece salt okunur olarak görüntülenebilir.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsArchiveModalOpen(false)} disabled={isProcessingAction} className="text-gray-400 hover:text-foreground">
              İptal
            </Button>
            <Button variant="outline" className="border-yellow-600 text-yellow-500 hover:bg-yellow-600/10" onClick={confirmArchiveCourse} disabled={isProcessingAction}>
              {isProcessingAction ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Evet, Arşivle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteCourseModalOpen} onOpenChange={setIsDeleteCourseModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-500">Dersi Kalıcı Olarak Sil</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-300 text-sm">
              Dersi <strong className="text-red-400">KALICI</strong> olarak silmek istediğinize emin misiniz? 
              Bu derse ait tüm takımlar, sprintler, görevler ve raporlar silinecek. 
              <br/><br/>Bu işlem geri alınamaz!
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsDeleteCourseModalOpen(false)} disabled={isProcessingAction} className="text-gray-400 hover:text-foreground">
              İptal
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCourse} disabled={isProcessingAction}>
              {isProcessingAction ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Evet, Kalıcı Olarak Sil
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteSuccessModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDeleteSuccessModalOpen(false);
          router.push('/dashboard/instructor/courses');
        }
      }}>
        <DialogContent className="sm:max-w-md bg-card border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-emerald-500">Başarılı</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-300">
              Ders başarıyla silindi.
            </p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" className="border-emerald-600 text-emerald-500 hover:bg-emerald-600/10" onClick={() => {
              setIsDeleteSuccessModalOpen(false);
              router.push('/dashboard/instructor/courses');
            }}>
              Derslere Dön
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SprintTemplateModal
        courseId={courseId}
        open={isTemplateModalOpen}
        onOpenChange={setIsTemplateModalOpen}
        onSuccess={() => showToast('Şablon tüm takımlara başarıyla uygulandı', 'success')}
      />
    </div>
  );
}
