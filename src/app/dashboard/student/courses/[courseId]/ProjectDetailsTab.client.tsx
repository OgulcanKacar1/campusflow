'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save, FileText, Link as LinkIcon, FolderKanban, GitBranch, KeyRound, CheckCircle2 } from 'lucide-react';
import { studentUpdateProjectDetails, generateGithubWebhook, getGithubWebhookStatus } from '../../actions';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import type { Team } from '@/types/team';

interface ProjectDetailsTabProps {
  myTeam: Team;
  amILeader: boolean;
}

export function ProjectDetailsTab({ myTeam, amILeader }: ProjectDetailsTabProps) {
  const [isPending, startTransition] = useTransition();
  const [projectName, setProjectName] = useState(myTeam.projectName || '');
  const [projectDesc, setProjectDesc] = useState(myTeam.projectDescription || '');
  const [repoUrl, setRepoUrl] = useState(myTeam.repoUrl || '');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [githubToken, setGithubToken] = useState('');
  const [webhookId, setWebhookId] = useState<string | null>(null);
  const [isGithubPending, startGithubTransition] = useTransition();

  useEffect(() => {
    getGithubWebhookStatus(myTeam.id).then(res => {
      if (res.webhookId) setWebhookId(res.webhookId);
    });
  }, [myTeam.id]);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleGenerateWebhook = () => {
    if (!amILeader || !repoUrl || !githubToken) {
      showMessage('Repository linki ve GitHub Token gereklidir.', 'error');
      return;
    }
    
    startGithubTransition(async () => {
      const result = await generateGithubWebhook(myTeam.id, repoUrl, githubToken);
      if (result.error) {
        showMessage(result.error, 'error');
      } else if (result.webhookId) {
        setWebhookId(result.webhookId);
        showMessage('GitHub Webhook bağlantısı oluşturuldu!', 'success');
      }
    });
  };

  const handleSave = () => {
    if (!amILeader) return;
    
    startTransition(async () => {
      const result = await studentUpdateProjectDetails(
        myTeam.id,
        projectName.trim() || null,
        projectDesc.trim() || null,
        repoUrl.trim() || null
      );
      
      if (result.error) {
        showMessage(result.error, 'error');
      } else {
        showMessage('Proje detayları güncellendi.', 'success');
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/60 backdrop-blur-xl border-border/40 shadow-xl shadow-black/20">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-primary/10 rounded-lg ring-1 ring-primary/20">
              <FolderKanban className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-xl text-foreground font-bold drop-shadow-sm">Proje Bilgileri</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            {amILeader 
              ? 'Proje ismini, açıklamasını ve GitHub/GitLab linkini buradan güncelleyebilirsiniz.' 
              : 'Proje detaylarını takım lideriniz güncelleyebilir.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <div className={`p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
              {message.text}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
              <FileText className="w-3.5 h-3.5 text-primary/70" /> Proje Adı
            </label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Örn: E-Ticaret Uygulaması"
              disabled={!amILeader || isPending}
              className="bg-background/40 border-border/50 text-foreground focus-visible:ring-primary/40 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
              <LinkIcon className="w-3.5 h-3.5 text-primary/70" /> Repository Linki (Opsiyonel)
            </label>
            <Input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/kullanici/repo"
              disabled={!amILeader || isPending}
              className="bg-background/40 border-border/50 text-foreground focus-visible:ring-primary/40 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
              <FileText className="w-3.5 h-3.5 text-primary/70" /> Proje Açıklaması
            </label>
            {amILeader ? (
              <div className="min-h-[200px] border border-border/50 rounded-xl overflow-hidden bg-background/40 focus-within:ring-1 focus-within:ring-primary/40 transition-all">
                <MarkdownEditor
                  value={projectDesc}
                  onChange={setProjectDesc}
                  placeholder="Projenin amacı, kullanılacak teknolojiler ve hedefleri..."
                />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-background/40 border border-border/50 min-h-[100px] text-muted-foreground whitespace-pre-wrap">
                {projectDesc || <span className="italic opacity-60">Henüz açıklama girilmemiş.</span>}
              </div>
            )}
          </div>


          {amILeader && (
            <div className="pt-6 flex justify-end border-t border-border/40 mt-4">
              <Button onClick={handleSave} disabled={isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all">
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Değişiklikleri Kaydet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GitHub Integration Card */}
      <Card className="bg-card/60 backdrop-blur-xl border-border/40 shadow-xl shadow-black/20">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-foreground/10 rounded-lg ring-1 ring-border/50">
              <GitBranch className="w-5 h-5 text-foreground" />
            </div>
            <CardTitle className="text-xl text-foreground font-bold drop-shadow-sm">GitHub Entegrasyonu</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            GitHub deponuzdaki (repository) aktiviteleri panoya senkronize etmek için Webhook bağlantısı kurun.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {webhookId ? (
            <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-5 h-5" />
                Webhook Aktif!
              </div>
              <p className="text-sm text-emerald-400/80">GitHub deponuzun Settings {'>'} Webhooks bölümüne gidip aşağıdaki Payload URL'ini ekleyin.</p>
              
              <div className="space-y-1.5 mt-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/60">Payload URL</label>
                <div className="bg-background/80 px-3 py-2 rounded-lg font-mono text-xs text-foreground border border-emerald-500/20 select-all overflow-hidden break-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/github?id=${webhookId}` : `https://campusflow.app/api/webhooks/github?id=${webhookId}`}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/60">Content Type</label>
                <div className="bg-background/80 px-3 py-2 rounded-lg font-mono text-xs text-foreground border border-emerald-500/20">
                  application/json
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                  <KeyRound className="w-3.5 h-3.5 text-foreground/70" /> Personal Access Token (PAT)
                </label>
                <Input
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  disabled={!amILeader || isGithubPending || !repoUrl}
                  className="bg-background/40 border-border/50 text-foreground focus-visible:ring-foreground/40 transition-all font-mono"
                />
                {!repoUrl && <p className="text-xs text-orange-400 mt-1">Önce yukarıdaki "Repository Linki" alanını doldurup kaydedin.</p>}
                <p className="text-xs text-muted-foreground mt-1">GitHub Settings {'>'} Developer Settings {'>'} Personal Access Tokens bölümünden "repo" yetkili bir token oluşturun.</p>
              </div>

              {amILeader && (
                <div className="pt-2 flex justify-end">
                  <Button onClick={handleGenerateWebhook} disabled={isGithubPending || !githubToken || !repoUrl} variant="outline" className="border-border/50 hover:bg-foreground/10 transition-all">
                    {isGithubPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GitBranch className="w-4 h-4 mr-2" />}
                    Webhook Bağlantısı Kur
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
