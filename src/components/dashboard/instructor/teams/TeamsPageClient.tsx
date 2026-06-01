'use client';

import { useState } from 'react';
import { TeamModeSettings } from './TeamModeSettings';
import { TeamsList } from './TeamsList';
import { CreateTeamButton } from './CreateTeamButton';
import { RandomTeamsButton } from './RandomTeamsButton';
import { EditTeamModal } from './EditTeamModal';
import { DeleteTeamDialog } from './DeleteTeamDialog';
import { AddMemberModal } from './AddMemberModal';
import { RemoveMemberDialog } from './RemoveMemberDialog';
import { updateCourseTeamSettings, removeTeamMember } from '@/app/dashboard/instructor/teams/actions';
import type { Team, TeamSettings, TeamMember } from '@/types/team';

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

  const handleSaveSettings = async (newSettings: TeamSettings) => {
    const result = await updateCourseTeamSettings(courseId, newSettings);
    if (!result.error) {
      setSettings(newSettings);
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
      alert('Üye çıkarılırken hata: ' + result.error);
    } else {
      setIsRemoveMemberOpen(false);
      setRemoveMemberTeam(null);
      setRemoveMember(null);
      // Listeyi yenile
      window.location.reload();
    }
  };

  const handleSuccess = () => {
    // Sayfayı yenile — server component yeniden render edilir
    window.location.reload();
  };

  const handleCopyInviteCode = (code: string) => {
    // Code copied to clipboard
    console.log('Davet kodu kopyalandı:', code);
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
                <CreateTeamButton courseId={courseId} />
              )}
              {settings.teamMode === 'random' && (
                <RandomTeamsButton
                  courseId={courseId}
                  teamSize={settings.teamMaxSize}
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
            </div>

            <TeamsList
              teams={teams}
              teamMode={settings.teamMode}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMemberClick}
              onCopyInviteCode={handleCopyInviteCode}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditTeamModal
        team={editTeam}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={handleSuccess}
      />

      <DeleteTeamDialog
        team={deleteTeam}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onSuccess={handleSuccess}
      />

      <AddMemberModal
        team={addMemberTeam}
        courseId={courseId}
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
        onSuccess={handleSuccess}
      />

      <RemoveMemberDialog
        team={removeMemberTeam}
        member={removeMember}
        open={isRemoveMemberOpen}
        onOpenChange={setIsRemoveMemberOpen}
        onConfirm={handleRemoveMemberConfirm}
      />
    </div>
  );
}
