'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Users, ExternalLink, Copy, Check, Trash2, UserPlus, Mail, UserX } from 'lucide-react';
import type { Team, TeamMember } from '@/types/team';

interface TeamsListProps {
  teams: Team[];
  teamMode: string;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  onAddMember: (team: Team) => void;
  onRemoveMember?: (team: Team, member: TeamMember) => void;
  onCopyInviteCode: (code: string) => void;
  onMoveMember?: (memberId: string, fromTeamId: string, toTeamId: string) => void;
}

export function TeamsList({
  teams,
  teamMode,
  onEdit,
  onDelete,
  onAddMember,
  onRemoveMember,
  onCopyInviteCode,
  onMoveMember,
}: TeamsListProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<{ member: TeamMember; team: Team } | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    onCopyInviteCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (teams.length === 0) {
    return (
      <Card className="bg-[#0f1523] border-gray-800">
        <CardContent className="py-12 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Henüz takım oluşturulmadı</p>
          <p className="text-sm text-gray-500 mt-1">
            {teamMode === 'student'
              ? 'Öğrenciler takım oluşturmayı bekliyor'
              : 'Yukarıdaki butonlardan takım oluşturabilirsiniz'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {teams.map((team) => (
        <Card 
          key={team.id} 
          className="bg-[#0f1523] border-gray-800 transition-all"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('border-blue-500', 'border-2');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('border-blue-500', 'border-2');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-blue-500', 'border-2');
            const data = e.dataTransfer.getData('application/json');
            if (data && onMoveMember) {
              const { studentId, fromTeamId } = JSON.parse(data);
              if (fromTeamId !== team.id) {
                onMoveMember(studentId, fromTeamId, team.id);
              }
            }
          }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  {team.name}
                  {team.status === 'inactive' && (
                    <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                      Pasif
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {team.memberCount || team.members?.length || 0} üye
                  </span>
                  {team.repoUrl && (
                    <a
                      href={team.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Repo
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddMember(team)}
                  className="text-gray-400 hover:text-white"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(team)}
                  className="text-gray-400 hover:text-white"
                >
                  Düzenle
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(team)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Davet Kodu (Student modunda) */}
            {teamMode === 'student' && team.inviteCode && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-gray-500">Davet Kodu:</span>
                <code className="px-2 py-1 bg-[#1a1f2e] rounded text-sm font-mono text-blue-400">
                  {team.inviteCode}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyCode(team.inviteCode!)}
                  className="h-6 px-2 text-gray-400 hover:text-white"
                >
                  {copiedCode === team.inviteCode ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
          </CardHeader>

          {/* Üye Listesi */}
          {team.members && team.members.length > 0 && (
            <CardContent className="pt-0">
              <div className="border-t border-gray-800 pt-3">
                <p className="text-sm text-gray-500 mb-2">Üyeler</p>
                <div className="flex flex-wrap gap-2">
                  {team.members.map((member) => (
                    <button
                      key={member.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({
                          studentId: member.studentId,
                          fromTeamId: team.id
                        }));
                      }}
                      onClick={() => setSelectedMember({ member, team })}
                      className="group inline-flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-xl bg-[#161b22] hover:bg-[#1e2535] border border-gray-700/50 hover:border-blue-500/50 transition-all duration-200 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md"
                      title="Başka takıma sürükle"
                    >
                      {/* Avatar Circle */}
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-semibold text-blue-300 group-hover:scale-105 transition-transform">
                        {member.studentName?.charAt(0).toUpperCase() || '?'}
                      </div>
                      
                      {/* Name */}
                      <span className="text-sm font-medium text-gray-200 group-hover:text-white">
                        {member.studentName || 'İsimsiz'}
                      </span>
                      
                      {/* Leader Badge */}
                      {member.role === 'leader' && (
                        <span className="flex items-center gap-0.5 text-amber-400 text-xs">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                          Lider
                        </span>
                      )}
                      
                      {/* Drag Indicator */}
                      <svg className="w-3.5 h-3.5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {/* Üye Detay Modal'ı */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="sm:max-w-sm bg-[#0f1523] border-gray-800 text-white">
          <DialogHeader>
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20">
                <Mail className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-white">
                  {selectedMember?.member.studentName || 'İsimsiz'}
                </DialogTitle>
                <DialogDescription className="mt-1 text-gray-400 text-sm">
                  {selectedMember?.member.studentEmail}
                </DialogDescription>
                <p className="mt-2 text-xs text-gray-500">
                  Rol: {selectedMember?.member.role === 'leader' ? 'Takım Lideri ★' : 'Üye'}
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-white/5"
              onClick={() => {
                // İleride özel mesaj özelliği
                alert('Özel mesaj özelliği yakında geliyor!');
              }}
            >
              <Mail className="w-4 h-4 mr-2" />
              Mesaj Gönder
            </Button>
            {onRemoveMember && selectedMember && (
              <Button
                variant="outline"
                className="border-red-700 text-red-400 hover:bg-red-500/10"
                onClick={() => {
                  onRemoveMember(selectedMember.team, selectedMember.member);
                  setSelectedMember(null);
                }}
              >
                <UserX className="w-4 h-4 mr-2" />
                Takımdan Çıkar
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
