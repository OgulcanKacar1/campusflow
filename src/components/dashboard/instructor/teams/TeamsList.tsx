'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ExternalLink, Copy, Check, Trash2, UserPlus } from 'lucide-react';
import type { Team, TeamMember } from '@/types/team';

interface TeamsListProps {
  teams: Team[];
  teamMode: string;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  onAddMember: (team: Team) => void;
  onCopyInviteCode: (code: string) => void;
}

export function TeamsList({
  teams,
  teamMode,
  onEdit,
  onDelete,
  onAddMember,
  onCopyInviteCode,
}: TeamsListProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
    <div className="grid gap-4">
      {teams.map((team) => (
        <Card key={team.id} className="bg-[#0f1523] border-gray-800">
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
                    <Badge
                      key={member.id}
                      variant="secondary"
                      className="bg-[#1a1f2e] text-gray-300 border-gray-700"
                    >
                      {member.studentName || 'İsimsiz'}
                      {member.role === 'leader' && (
                        <span className="ml-1 text-yellow-400">★</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
