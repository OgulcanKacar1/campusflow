'use client';

import { useEffect, useState, useTransition } from 'react';
import { TeamModeSettings } from './TeamModeSettings';
import { TeamsList } from './TeamsList';
import { CreateTeamButton } from './CreateTeamButton';
import { RandomTeamsButton } from './RandomTeamsButton';
import { EditTeamModal } from './EditTeamModal';
import { DeleteTeamDialog } from './DeleteTeamDialog';
import { AddMemberModal } from './AddMemberModal';
import { RemoveMemberDialog } from './RemoveMemberDialog';
import {
  updateCourseTeamSettings,
  removeTeamMember,
  moveTeamMember,
  getTeamsByCourse,
  regenerateTeamInviteCode,
} from '@/app/dashboard/instructor/teams/actions';
import type { Team, TeamSettings, TeamMember } from '@/types/team';
import { Loader2 } from 'lucide-react';

interface TeamsPageClientProps {
  courseId: string;
  courseName: string;
  initialSettings: TeamSettings;
  initialTeams: Team[];
}

export function TeamsPageClient({
  courseId,
  courseName,
  initialSettings,
  initialTeams,
}: TeamsPageClientProps) {
  const [settings, setSettings] = useState<TeamSettings>(initialSettings);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isRefreshing, startTransition] = useTransition();

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

  useEffect(() => {
    if (!banner) return;
    const timeout = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(timeout);
  }, [banner]);

  const pushBanner = (type: 'success' | 'error', message: string) => {
    setBanner({ type, message });
  };

  const refreshTeams = () => {
    startTransition(() => {
      getTeamsByCourse(courseId).then((result) => {
        if (result.error) {
          pushBanner('error', result.error);
        } else if (result.data) {
          setTeams(result.data);
        }
      });
    });
  };

  const handleMutationSuccess = (message: string) => {
    pushBanner('success', message);
    refreshTeams();
  };

  const handleMutationError = (message: string) => {
    pushBanner('error', message);
  };

  const handleSaveSettings = async (newSettings: TeamSettings) => {
    const result = await updateCourseTeamSettings(courseId, newSettings);
    if (!result.error) {
      setSettings(newSettings);
      pushBanner('success', 'Takım ayarları güncellendi');
      refreshTeams();
    }
    if (result.error) {
      handleMutationError(result.error);
    }
    return result;
  };

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

  const handleRemoveMemberConfirm = async () => {
    if (!removeMemberTeam || !removeMember) return;
    
    const result = await removeTeamMember({ 
      teamId: removeMemberTeam.id, 
      studentId: removeMember.studentId 
    });
    
    if (result.error) {
      handleMutationError('Üye çıkarılırken hata: ' + result.error);
      return;
    }

    setIsRemoveMemberOpen(false);
    setRemoveMemberTeam(null);
    setRemoveMember(null);
    handleMutationSuccess('Üye çıkarıldı');
  };

  const handleRegenerateInviteCode = async (team: Team) => {
    const result = await regenerateTeamInviteCode(team.id);
    if (result.error || !result.data) {
      handleMutationError(result.error ?? 'Davet kodu yenilenemedi');
      return;
    }

    setTeams((prev) =>
      prev.map((item) =>
        item.id === team.id ? { ...item, inviteCode: result.data!.inviteCode } : item
      )
    );
    pushBanner('success', 'Davet kodu yenilendi');
  };

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      pushBanner('success', 'Davet kodu kopyalandı');
    });
  };

  const handleMoveMember = async (studentId: string, fromTeamId: string, toTeamId: string) => {
    const result = await moveTeamMember(studentId, fromTeamId, toTeamId);
    if (result.error) {
      handleMutationError('Üye taşınamadı: ' + result.error);
      return;
    }
    handleMutationSuccess('Üye taşındı');
  };

  return (
    <div className="min-h-screen bg-[#060b18]">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#0a0f1e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{courseName}</h1>
              <p className="text-gray-400 mt-1">Takım Yönetimi</p>
            </div>
            <div className="flex items-center gap-3">
              {settings.teamMode === 'instructor' && (
                <CreateTeamButton
                  courseId={courseId}
                  onSuccess={() => handleMutationSuccess('Takım oluşturuldu')}
                />
              )}
              {settings.teamMode === 'random' && (
                <RandomTeamsButton
                  courseId={courseId}
                  defaultTeamSize={settings.teamMaxSize}
                  minTeamSize={settings.teamMinSize}
                  maxTeamSize={settings.teamMaxSize}
                  onSuccess={() => handleMutationSuccess('Rastgele takımlar oluşturuldu')}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sol Kolon - Ayarlar */}
          <div className="lg:col-span-1">
            <TeamModeSettings
              courseId={courseId}
              initialSettings={settings}
              onSave={handleSaveSettings}
              existingTeamCount={teams.length}
            />
          </div>

          {/* Sağ Kolon - Takım Listesi */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Takımlar ({teams.length})
              </h2>
              {isRefreshing && <Loader2 className="h-4 w-4 animate-spin text-white/60" />}
            </div>

            <TeamsList
              teams={teams}
              teamMode={settings.teamMode}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMemberClick}
              onCopyInviteCode={handleCopyInviteCode}
              onRegenerateInviteCode={handleRegenerateInviteCode}
              onMoveMember={handleMoveMember}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditTeamModal
        team={editTeam}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={() => handleMutationSuccess('Takım güncellendi')}
      />

      <DeleteTeamDialog
        team={deleteTeam}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onSuccess={() => handleMutationSuccess('Takım silindi')}
      />

      <AddMemberModal
        team={addMemberTeam}
        courseId={courseId}
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
        onSuccess={() => handleMutationSuccess('Üye listesi güncellendi')}
      />

      <RemoveMemberDialog
        team={removeMemberTeam}
        member={removeMember}
        open={isRemoveMemberOpen}
        onOpenChange={setIsRemoveMemberOpen}
        onConfirm={handleRemoveMemberConfirm}
      />
      {banner && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[min(90vw,400px)] -translate-x-1/2">
          <div
            className={`rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-md ${
              banner.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-red-500/40 bg-red-500/10 text-red-200'
            }`}
          >
            {banner.message}
          </div>
        </div>
      )}
    </div>
  );
}
