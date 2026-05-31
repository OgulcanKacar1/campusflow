'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Users, UserPlus, Shuffle } from 'lucide-react';
import type { TeamMode, SprintMode, TeamSettings } from '@/types/team';

interface TeamModeSettingsProps {
  courseId: string;
  initialSettings: TeamSettings;
  onSave: (settings: TeamSettings) => Promise<{ error?: string }>;
  existingTeamCount?: number;
}

const MODE_OPTIONS: { value: TeamMode; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'instructor',
    label: 'Hoca Manuel',
    icon: <UserPlus className="w-4 h-4" />,
    description: 'Hoca takımları oluşturur ve öğrencileri tek tek ekler',
  },
  {
    value: 'random',
    label: 'Rastgele',
    icon: <Shuffle className="w-4 h-4" />,
    description: 'Sistem öğrencileri rastgele gruplara böler',
  },
  {
    value: 'student',
    label: 'Öğrenci Liderliğinde',
    icon: <Users className="w-4 h-4" />,
    description: 'Öğrenciler kendi takımlarını kurar, davet koduyla arkadaşlarını ekler',
  },
];

export function TeamModeSettings({
  courseId,
  initialSettings,
  onSave,
  existingTeamCount = 0,
}: TeamModeSettingsProps) {
  const [settings, setSettings] = useState<TeamSettings>(initialSettings);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Initial settings değişince state'i güncelle
  useEffect(() => {
    setSettings(initialSettings);
    setIsDirty(false);
  }, [initialSettings]);

  const handleModeChange = (value: TeamMode) => {
    // Mod değişikliği varsa ve mevcut takım varsa onay iste
    if (value !== settings.teamMode && existingTeamCount > 0) {
      setShowConfirmModal(true);
    }
    setSettings((prev) => ({ ...prev, teamMode: value }));
    setIsDirty(true);
  };

  const handleMinSizeChange = (value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) return;
    setSettings((prev) => ({ ...prev, teamMinSize: num }));
    setIsDirty(true);
  };

  const handleMaxSizeChange = (value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) return;
    setSettings((prev) => ({ ...prev, teamMaxSize: num }));
    setIsDirty(true);
  };

  const handleSprintModeChange = (value: SprintMode) => {
    setSettings((prev) => ({ ...prev, sprintMode: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    // Validasyon
    if (settings.teamMinSize > settings.teamMaxSize) {
      setError('Minimum üye sayısı maksimumdan büyük olamaz');
      return;
    }

    setIsSaving(true);
    setError(null);

    const result = await onSave(settings);

    if (result.error) {
      setError(result.error);
    } else {
      setIsDirty(false);
    }

    setIsSaving(false);
  };

  return (
    <Card className="bg-[#0f1523] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white text-lg">Takım Ayarları</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Takım Modu */}
        <div className="space-y-2">
          <Label className="text-gray-300">Takım Oluşturma Modu</Label>
          <Select
            value={settings.teamMode}
            onValueChange={(v) => handleModeChange(v as TeamMode)}
          >
            <SelectTrigger className="bg-[#1a1f2e] border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1f2e] border-gray-700">
              {MODE_OPTIONS.map((mode) => (
                <SelectItem
                  key={mode.value}
                  value={mode.value}
                  className="text-white focus:bg-[#2a3142] focus:text-white"
                >
                  <div className="flex items-center gap-2">
                    {mode.icon}
                    <span>{mode.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">
            {MODE_OPTIONS.find((m) => m.value === settings.teamMode)?.description}
          </p>
        </div>

        {/* Üye Sayısı Limitleri */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Min. Üye</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={settings.teamMinSize}
              onChange={(e) => handleMinSizeChange(e.target.value)}
              className="bg-[#1a1f2e] border-gray-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Max. Üye</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={settings.teamMaxSize}
              onChange={(e) => handleMaxSizeChange(e.target.value)}
              className="bg-[#1a1f2e] border-gray-700 text-white"
            />
          </div>
        </div>

        {/* Sprint Modu */}
        <div className="space-y-2">
          <Label className="text-gray-300">Sprint Oluşturma Yetkisi</Label>
          <Select
            value={settings.sprintMode}
            onValueChange={(v) => handleSprintModeChange(v as SprintMode)}
          >
            <SelectTrigger className="bg-[#1a1f2e] border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1f2e] border-gray-700">
              <SelectItem
                value="instructor"
                className="text-white focus:bg-[#2a3142] focus:text-white"
              >
                Sadece Hoca
              </SelectItem>
              <SelectItem
                value="team"
                className="text-white focus:bg-[#2a3142] focus:text-white"
              >
                Takım Üyeleri
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Hata Mesajı */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Kaydet Butonu */}
        <Button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            'Ayarları Kaydet'
          )}
        </Button>

        {/* Mod Değişikliği Uyarı Modal'ı */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#0f1523] border border-gray-800 rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-white mb-2">Mod Değişikliği Uyarısı</h3>
              <p className="text-gray-400 text-sm mb-4">
                Bu derste {existingTeamCount} adet mevcut takım var. Mod değişikliği mevcut
                takımları etkilemez, ancak yeni takımlar seçilen moda göre oluşturulacak.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                  className="border-gray-700 text-gray-300"
                >
                  İptal
                </Button>
                <Button
                  onClick={() => setShowConfirmModal(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Anladım, Devam Et
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
