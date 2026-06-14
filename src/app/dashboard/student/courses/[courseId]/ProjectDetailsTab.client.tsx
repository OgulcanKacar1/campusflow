'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save, FileText, Link as LinkIcon, FolderKanban } from 'lucide-react';
import { studentUpdateProjectDetails } from '../../actions';
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


  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
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
      <Card className="bg-white/[0.02] border-white/10">
        <CardHeader>
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <FolderKanban className="w-5 h-5" />
            <CardTitle className="text-xl text-white">Proje Bilgileri</CardTitle>
          </div>
          <CardDescription className="text-white/50">
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
            <label className="text-sm font-medium text-white/70 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Proje Adı
            </label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Örn: E-Ticaret Uygulaması"
              disabled={!amILeader || isPending}
              className="bg-black/20 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> Repository Linki (Opsiyonel)
            </label>
            <Input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/kullanici/repo"
              disabled={!amILeader || isPending}
              className="bg-black/20 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Proje Açıklaması
            </label>
            {amILeader ? (
              <div className="min-h-[200px] border rounded-md border-white/10 overflow-hidden">
                <MarkdownEditor
                  content={projectDesc}
                  onChange={setProjectDesc}
                  placeholder="Projenin amacı, kullanılacak teknolojiler ve hedefleri..."
                />
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-black/20 border border-white/10 min-h-[100px] text-white/70 whitespace-pre-wrap">
                {projectDesc || <span className="italic text-white/40">Henüz açıklama girilmemiş.</span>}
              </div>
            )}
          </div>


          {amILeader && (
            <div className="pt-4 flex justify-end border-t border-white/5">
              <Button onClick={handleSave} disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Değişiklikleri Kaydet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
