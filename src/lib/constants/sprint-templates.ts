export interface SprintTemplateItem {
  name: string;
  durationInDays: number;
}

export interface SprintTemplate {
  id: string;
  title: string;
  description: string;
  sprints: SprintTemplateItem[];
}

export const ACADEMIC_SPRINT_TEMPLATES: SprintTemplate[] = [
  {
    id: 'software_engineering',
    title: 'Yazılım Mühendisliği Projesi',
    description: 'Yazılım geliştirme yaşam döngüsüne (SDLC) uygun temel akademik proje şablonu.',
    sprints: [
      { name: 'Faz 1: Gereksinim Analizi ve Planlama', durationInDays: 14 },
      { name: 'Faz 2: Sistem Tasarımı ve Mimari', durationInDays: 14 },
      { name: 'Faz 3: Temel Geliştirme (MVP)', durationInDays: 21 },
      { name: 'Faz 4: Test, Hata Giderme ve Sunum Hazırlığı', durationInDays: 14 },
    ],
  },
  {
    id: 'research_project',
    title: 'Araştırma Projesi (Tez/Makale)',
    description: 'Literatür taramasından makale yazımına kadar akademik araştırma süreçleri.',
    sprints: [
      { name: 'Aşama 1: Literatür Taraması ve Konu Belirleme', durationInDays: 14 },
      { name: 'Aşama 2: Veri Toplama ve Metodoloji', durationInDays: 21 },
      { name: 'Aşama 3: Veri Analizi ve Bulgular', durationInDays: 14 },
      { name: 'Aşama 4: Raporlama ve Revizyon', durationInDays: 14 },
    ],
  },
  {
    id: 'capstone_project',
    title: 'Bitirme Projesi (Capstone)',
    description: 'Dönemlik bitirme projeleri için hızlandırılmış tam döngü.',
    sprints: [
      { name: 'Proje Önerisi ve Literatür', durationInDays: 14 },
      { name: 'Geliştirme / Uygulama', durationInDays: 28 },
      { name: 'Rapor Yazımı ve Poster Hazırlığı', durationInDays: 14 },
    ],
  }
];
