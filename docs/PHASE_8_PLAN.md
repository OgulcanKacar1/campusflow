# Faz 8: Cloud Storage (Google Drive / Figma) Entegrasyonu

Bu döküman, görevlere (tasks) dış bağlantı (Drive, Figma vb.) eklenebilmesi için gerekli veritabanı, sunucu ve arayüz güncellemelerini içerir.

## 1. Veritabanı (Database)
- `supabase/migrations/0046_task_attachments.sql` oluşturulacak.
- `tasks` tablosuna `attachments` isimli bir `JSONB` kolonu eklenecek (Varsayılan değer: `[]`).
- Veri formatı: `[{ id: string, url: string, type: 'drive'|'figma'|'github'|'link', title: string, added_by: string, added_at: string }]`

## 2. Backend (Server Actions)
- `src/app/dashboard/shared/teamTasks.ts` dosyasına şu fonksiyonlar eklenecek:
  - `addTaskAttachment(taskId: string, url: string)`: URL'i Regex ile analiz edip (Drive/Figma) json objesi olarak veritabanına ekler.
  - `removeTaskAttachment(taskId: string, attachmentId: string)`: İlgili id'ye sahip eklentiyi json array'den siler.

## 3. Frontend (UI & Bileşenler)
- `src/app/dashboard/_shared/kanban/TaskDetailDialog.tsx` güncellenecek.
- "Geliştirici Notu" altına **"Eklentiler & Dosyalar"** bölümü konulacak.
- URL yapıştırmak için bir Input alanı ve "Ekle" butonu konulacak.
- Eklenen linklerin şık butonlar (İlgili platform ikonlarıyla) halinde listelenmesi sağlanacak.
