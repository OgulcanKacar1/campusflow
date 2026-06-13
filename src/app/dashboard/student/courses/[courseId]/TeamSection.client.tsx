'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Users, Loader2, Copy, Check, Plus, LogOut, Shield, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Team } from '@/types/team';
import { studentCreateTeam, studentJoinTeamByInvite, studentLeaveTeam, getStudentTeamsSnapshot, studentTransferLeadership } from '../../actions';

interface TeamSectionProps {
  courseId: string;
  teamMode: 'instructor' | 'random' | 'student';
  minSize: number;
  maxSize: number;
  myTeam: Team | null;
  allTeams: Team[];
  currentUserId: string;
}

export function TeamSection({
  courseId,
  teamMode,
  minSize,
  maxSize,
  myTeam,
  allTeams,
  currentUserId,
}: TeamSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [inviteInput, setInviteInput] = useState('');
  const [teamName, setTeamName] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const teamNameInputRef = useRef<HTMLInputElement | null>(null);
  const [teamNameFocused, setTeamNameFocused] = useState(false);
  const [localTeams, setLocalTeams] = useState(allTeams);
  const [localMyTeam, setLocalMyTeam] = useState(myTeam);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const otherTeams = useMemo(
    () => (localMyTeam ? localTeams.filter((team) => team.id !== localMyTeam.id) : localTeams),
    [localTeams, localMyTeam]
  );
  const getMemberInitial = (name?: string | null, email?: string | null) => {
    const source = (name && name.trim()) || (email && email.trim());
    return source ? source.charAt(0).toUpperCase() : '?';
  };

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  useEffect(() => {
    if (!teamNameFocused || !teamNameInputRef.current) return;
    const input = teamNameInputRef.current;
    input.focus({ preventScroll: true });
    const length = input.value.length;
    try {
      input.setSelectionRange(length, length);
    } catch {
      // Safari might throw for types that don't support selection range; ignore.
    }
  }, [teamNameFocused, teamName]);

  useEffect(() => {
    startTransition(() => {
      setLocalTeams(allTeams);
    });
  }, [allTeams, startTransition]);

  useEffect(() => {
    startTransition(() => {
      setLocalMyTeam(myTeam);
    });
  }, [myTeam, startTransition]);

  const refreshTeams = async () => {
    setIsRefreshing(true);
    try {
      const snapshot = await getStudentTeamsSnapshot(courseId);
      if (snapshot.error) {
        showMessage(snapshot.error, 'error');
      } else if (snapshot.data) {
        setLocalTeams(snapshot.data.teams);
        setLocalMyTeam(snapshot.data.myTeam);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateTeam = () => {
    if (teamName.trim().length < 2) {
      showMessage('Takım adı en az 2 karakter olmalı', 'error');
      return;
    }

    startTransition(async () => {
      const result = await studentCreateTeam(courseId, teamName.trim());
      if (result.error) {
        showMessage(result.error, 'error');
      } else {
        setTeamName('');
        showMessage('Takım oluşturuldu 🎉', 'success');
        await refreshTeams();
      }
    });
  };

  const handleJoinTeam = () => {
    if (!inviteInput.trim()) {
      showMessage('Davet kodu girin', 'error');
      return;
    }
    startTransition(async () => {
      const result = await studentJoinTeamByInvite(inviteInput.trim());
      if (result.error) {
        showMessage(result.error, 'error');
      } else {
        setInviteInput('');
        showMessage('Takıma katıldın! 🎉', 'success');
        await refreshTeams();
      }
    });
  };

  const handleLeaveTeam = () => {
    if (!localMyTeam) return;
    startTransition(async () => {
      const result = await studentLeaveTeam(localMyTeam.id);
      if (result.error) {
        showMessage(result.error, 'error');
      } else {
        showMessage('Takımdan ayrıldın.', 'success');
        await refreshTeams();
      }
    });
  };

  const handleTransferLeadership = (targetStudentId: string) => {
    if (!localMyTeam) return;
    startTransition(async () => {
      const result = await studentTransferLeadership(courseId, localMyTeam.id, targetStudentId);
      if (result.error) {
        showMessage(result.error, 'error');
      } else {
        showMessage('Liderlik devredildi.', 'success');
        await refreshTeams();
      }
    });
  };

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(null), 2000);
  };

  const renderSummaryCard = () => {
    if (localMyTeam) {
      return (
        <Card className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-blue-500/5 border-white/10">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-purple-200/80">
                <Users className="w-4 h-4" />
                Takım Bilgisi
              </div>
              <CardTitle className="text-2xl text-white mt-2">{localMyTeam.name}</CardTitle>
              <p className="text-white/60 text-sm mt-2">
                {teamMode === 'student'
                  ? 'Takım kodunu paylaşabilir ve arkadaşların katılmasına izin verebilirsin.'
                  : 'Bu ekip hocan tarafından atandı. Üyeleri aşağıda görebilirsin.'}
              </p>
            </div>
            {teamMode === 'student' && (
              <Button
                variant="outline"
                className="border-red-500/40 text-red-300 hover:bg-red-500/10"
                onClick={handleLeaveTeam}
                disabled={isBusy}
              >
                {isBusy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
                Takımdan Ayrıl
              </Button>
            )}
          </CardHeader>
          {teamMode === 'student' && localMyTeam.inviteCode && (
            <CardContent className="flex flex-wrap items-center gap-3 bg-black/30 border border-white/10 rounded-xl mx-6 mb-6 px-4 py-3">
              <KeyRound className="w-4 h-4 text-purple-200" />
              <span className="font-mono text-sm tracking-widest text-white">{localMyTeam.inviteCode}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white"
                onClick={() => copyToClipboard(localMyTeam.inviteCode!)}
              >
                {copied === localMyTeam.inviteCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </CardContent>
          )}
        </Card>
      );
    }

    return (
      <Card className="bg-white/[0.02] border-dashed border-white/15">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 text-purple-200/80 text-xs uppercase tracking-widest">
            <Users className="w-4 h-4" />
            Takımlar
          </div>
          <CardTitle className="text-xl text-white">Henüz bir takımın yok</CardTitle>
        </CardHeader>
        <CardContent className="text-white/60 text-sm">
          {teamMode === 'student'
            ? `Takım kurabilir veya davet kodu ile katılabilirsin. Minimum ${minSize}, maksimum ${maxSize} kişi.`
            : 'Hocan seni bir takıma atadığında burada göreceksin.'}
        </CardContent>
      </Card>
    );
  };

  const renderMembersCard = () => {
    if (!localMyTeam) return null;

    const memberCount = localMyTeam.members?.length ?? 0;
    const amILeader = localMyTeam.members?.some((m) => m.studentId === currentUserId && m.role === 'leader');

    return (
      <Card className="relative overflow-hidden border-white/10 bg-white/[0.03]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/12 via-transparent to-blue-500/15" />
        <CardHeader className="relative z-10 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-white text-lg">Takım Üyeleri</CardTitle>
              <p className="mt-1 text-xs text-white/50">
                {memberCount > 0 ? `Toplam ${memberCount} kişi` : 'Henüz üye yok'}
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-widest text-white/50">
              {memberCount}/{maxSize}
            </span>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 space-y-3 pb-5">
          {memberCount > 0 ? (
            localMyTeam.members!.map((member) => {
              const initial = getMemberInitial(member.studentName, member.studentEmail);
              const isLeader = member.role === 'leader';

              return (
                <div
                  key={member.id}
                  className="group flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-3 transition hover:border-purple-400/40 hover:bg-purple-500/10"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/80 to-blue-500/80 text-sm font-semibold text-white">
                      {initial}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-medium text-white">{member.studentName ?? 'Bilinmiyor'}</p>
                      <p className="break-words text-xs text-white/45">{member.studentEmail ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] uppercase tracking-widest ${
                        isLeader
                          ? 'border-purple-400/60 bg-purple-500/20 text-purple-100'
                          : 'border-white/10 bg-white/5 text-white/40'
                      }`}
                    >
                      {isLeader ? <Shield className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                      {isLeader ? 'Lider' : 'Üye'}
                    </span>
                    {amILeader && !isLeader && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[10px] uppercase tracking-wider border border-purple-500/20 text-purple-300 hover:bg-purple-500/20"
                        onClick={() => handleTransferLeadership(member.studentId)}
                        disabled={isPending}
                      >
                        Devret
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-white/40">Bu takımda henüz üye yok.</p>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderOtherTeamsCard = () => {
    const headerSubtitle = 'Davet kodları liderler tarafından özel olarak paylaşılır.';

    return (
      <Card className="relative overflow-hidden border-white/10 bg-white/[0.02]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-blue-500/12 via-transparent to-transparent" />
        <CardHeader className="relative z-10 space-y-2 pb-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-white text-lg">Diğer Takımlar</CardTitle>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] uppercase tracking-widest text-white/40">
              {otherTeams.length}
            </span>
          </div>
          <p className="text-xs text-white/45">{headerSubtitle}</p>
        </CardHeader>
        <CardContent className="relative z-10 space-y-3">
          {otherTeams.length === 0 ? (
            <p className="text-sm text-white/40">Henüz başka takım yok.</p>
          ) : (
            otherTeams.map((team) => {
              const members = team.members ?? [];
              const visibleMembers = members.slice(0, 4);
              const remaining = members.length - visibleMembers.length;

              return (
                <div
                  key={team.id}
                  className="group rounded-xl border border-white/10 bg-black/30 px-3 py-3 transition hover:border-blue-400/40 hover:bg-blue-500/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-medium text-white">{team.name}</p>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white/40">
                        {team.memberCount ?? members.length} üye
                      </span>
                    </div>
                    <span className="text-[11px] uppercase tracking-widest text-white/30">Kod liderde</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {visibleMembers.length > 0 ? (
                      <>
                        {visibleMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1"
                          >
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/80">
                              {getMemberInitial(member.studentName, member.studentEmail)}
                            </div>
                            <span className="text-xs font-medium text-white/80">
                              {member.studentName ?? 'Bilinmiyor'}
                            </span>
                          </div>
                        ))}
                        {remaining > 0 && (
                          <span className="flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                            +{remaining} üye
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-white/40">Bu takımda henüz aktif üye yok.</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    );
  };

  const renderActionCards = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card className="bg-white/[0.02] border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-lg">Takım Kur</CardTitle>
          <p className="text-white/50 text-sm">Takımı kurduğunda davet kodun otomatik oluşur, arkadaşların katılabilir.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/40">Takım Adı</label>
            <Input
              placeholder="Örn: Takım Feniks"
              value={teamName}
              onChange={(e) => {
                const value = e.target.value;
                setTeamName(value);
              }}
              maxLength={40}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
              disabled={isBusy}
              ref={teamNameInputRef}
              onFocus={() => setTeamNameFocused(true)}
              onBlur={() => setTeamNameFocused(false)}
              type="text"
              autoComplete="off"
            />
            <p className="text-[11px] text-white/30">En az 2, en fazla 40 karakter.</p>
          </div>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleCreateTeam}
            disabled={isBusy}
          >
            {isBusy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Takım Oluştur
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white/[0.02] border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-lg">Davet Kodu ile Katıl</CardTitle>
          <p className="text-white/50 text-sm">Arkadaşlarının paylaştığı kodu girerek mevcut bir takıma katıl.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Örn: X9H2LM"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value.toUpperCase())}
              className="bg-white/10 border-white/20 text-white"
              maxLength={12}
            />
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={handleJoinTeam}
              disabled={isBusy}
            >
              Katıl
            </Button>
          </div>
          <p className="text-white/30 text-xs">Kod 6 karakterdir ve büyük harf kullanılmalıdır.</p>
        </CardContent>
      </Card>
    </div>
  );

  const showActionCards = teamMode === 'student' && !localMyTeam;

  const isBusy = isPending || isRefreshing;

  return (
    <div className="flex flex-col gap-6">
      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm backdrop-blur-md ${
            message.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/20 bg-red-500/10 text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {renderSummaryCard()}
      {showActionCards && renderActionCards()}
      {renderMembersCard()}
      {renderOtherTeamsCard()}

      {isBusy && (
        <div className="flex items-center justify-center gap-2 text-white/50 text-sm py-4">
          <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
          <span>Lütfen bekleyin...</span>
        </div>
      )}
    </div>
  );
}
