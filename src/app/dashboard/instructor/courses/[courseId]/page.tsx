'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Users, Settings, Loader2, CheckCircle } from 'lucide-react';
import { getCourseById, updateCourse, getCourseStudents } from '../../actions';
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
      showToast('Öğrenci başka takıma taşındı', 'success');
      void loadTeams();
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
    <div className="min-h-screen bg-[#0a0f1e] p-6 md:p-8">
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
        <DashboardBreadcrumb items={[
          { label: 'Derslerim', href: '/dashboard/instructor/courses' },
          { label: course?.name || 'Yükleniyor...' }
        ]} />

        {/* Header */}
        <div className="mb-2">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-[#0f1523] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Öğrenci</p>
                  <p className="text-2xl font-bold text-white">
                    {studentsLoading ? '…' : students.length || course?.studentCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#0f1523] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Takım</p>
                  <p className="text-2xl font-bold text-white">
                    {teamsLoading ? '…' : teams.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#0f1523] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Katılım Kodu</p>
                  <p className="text-lg font-mono font-semibold text-purple-400">
                    {course?.joinCode || '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="teams" className="w-full">
          <TabsList className="mb-8 bg-[#0a0f1e] border border-gray-800/50 p-1.5 rounded-xl h-auto">
            <TabsTrigger 
              value="teams" 
              className="relative px-6 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-blue-500/10 data-[state=active]:bg-white/20">
                  <Users className="w-4 h-4" />
                </div>
                <span>Takımlar</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="students" 
              className="relative px-6 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-blue-500/10 data-[state=active]:bg-white/20">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span>Öğrenciler</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="relative px-6 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-blue-500/10 data-[state=active]:bg-white/20">
                  <Settings className="w-4 h-4" />
                </div>
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
                      <CreateTeamButton courseId={courseId} />
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
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
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
            <Card className="bg-[#0f1523] border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Kayıtlı Öğrenciler</CardTitle>
                  <p className="text-gray-400 text-sm mt-1">Derse kayıtlı tüm öğrenciler</p>
                </div>
                <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  <Users className="w-4 h-4 mr-2" />
                  Toplu İşlem
                </Button>
              </CardHeader>
              <CardContent>
                {studentsLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : students.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Henüz kayıtlı öğrenci yok</p>
                ) : (
                  <div className="rounded-lg border border-gray-800 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-[#161b22]">
                        <tr>
                          <th className="text-left p-3 text-gray-400 font-medium">Öğrenci</th>
                          <th className="text-left p-3 text-gray-400 font-medium">Email</th>
                          <th className="text-left p-3 text-gray-400 font-medium">Takım</th>
                          <th className="text-left p-3 text-gray-400 font-medium">Katılım Tarihi</th>
                          <th className="text-right p-3 text-gray-400 font-medium">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {students.map((student) => (
                          <tr key={student.id} className="hover:bg-[#161b22]/50">
                            <td className="p-3 text-white font-medium">{student.name}</td>
                            <td className="p-3 text-gray-400">{student.email}</td>
                            <td className="p-3">
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                                {student.team}
                              </Badge>
                            </td>
                            <td className="p-3 text-gray-400">{student.date}</td>
                            <td className="p-3 text-right">
                              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                Çıkar
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Genel Ayarlar */}
              <Card className="bg-[#0f1523] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Genel Ayarlar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Ders Adı</label>
                    <input 
                      type="text" 
                      value={courseForm?.name ?? ''}
                      onChange={(e) => setCourseForm(prev => ({...prev, name: e.target.value}))}
                      className="w-full bg-[#161b22] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Ders Kodu</label>
                      <input 
                        type="text" 
                        value={courseForm?.code ?? ''}
                        onChange={(e) => setCourseForm(prev => ({...prev, code: e.target.value}))}
                        className="w-full bg-[#161b22] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Şube</label>
                      <input 
                        type="text" 
                        value={courseForm?.section ?? ''}
                        onChange={(e) => setCourseForm(prev => ({...prev, section: e.target.value}))}
                        className="w-full bg-[#161b22] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button onClick={handleSaveCourse} variant="outline" size="sm" className="border-emerald-600 text-emerald-500 hover:bg-emerald-600/10">
                      Kaydet
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Takım Ayarları */}
              <Card className="bg-[#0f1523] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Takım Ayarları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Takım Oluşturma Modu</label>
                    <select 
                      value={teamMode ?? 'instructor'}
                      onChange={(e) => setTeamMode(e.target.value as 'instructor' | 'random' | 'student')}
                      className="w-full bg-[#161b22] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="instructor">Eğitmen Oluşturur (Manuel)</option>
                      <option value="random">Rastgele Dağıtım</option>
                      <option value="student">Öğrenci Seçimi</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Min. Takım Boyutu</label>
                      <input 
                        type="number" 
                        value={teamSettings?.minSize ?? 3}
                        onChange={(e) => setTeamSettings(prev => ({...prev, minSize: parseInt(e.target.value) || 1}))}
                        className="w-full bg-[#161b22] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Max. Takım Boyutu</label>
                      <input 
                        type="number" 
                        value={teamSettings?.maxSize ?? 5}
                        onChange={(e) => setTeamSettings(prev => ({...prev, maxSize: parseInt(e.target.value) || 1}))}
                        className="w-full bg-[#161b22] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button onClick={handleSaveTeamSettings} variant="outline" size="sm" className="border-emerald-600 text-emerald-500 hover:bg-emerald-600/10">
                      Kaydet
                    </Button>
                  </div>
                </CardContent>
              </Card>



              {/* Tehlikeli Bölge */}
              <Card className="bg-[#0f1523] border-red-900/50">
                <CardHeader>
                  <CardTitle className="text-red-400">Tehlikeli Bölge</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Dersi Arşivle</p>
                      <p className="text-sm text-gray-400">Dersi arşive taşı, öğrenciler erişemez</p>
                    </div>
                    <Button variant="outline" className="border-yellow-600 text-yellow-500 hover:bg-yellow-600/10">
                      Arşivle
                    </Button>
                  </div>
                  <div className="border-t border-gray-800 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-400 font-medium">Dersi Sil</p>
                        <p className="text-sm text-gray-400">Bu işlem geri alınamaz</p>
                      </div>
                      <Button variant="outline" className="border-red-600 text-red-500 hover:bg-red-600/10">
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

      <SprintTemplateModal
        courseId={courseId}
        open={isTemplateModalOpen}
        onOpenChange={setIsTemplateModalOpen}
        onSuccess={() => showToast('Şablon tüm takımlara başarıyla uygulandı', 'success')}
      />
    </div>
  );
}
