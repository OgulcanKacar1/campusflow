# Faz 8: Cloud Storage (Google Drive / Figma) Entegrasyonu

> **Amaç:** Öğrencilerin projelerine ait doküman ve tasarım dosyalarını "Zero-File" (Sunucuda barındırmama) felsefesi ile Kanban görevlerine dış link (Herkese Açık Google Drive veya Figma Linki) olarak bağlayabilmesi.

---

## 1. Veritabanı ve Şema (Database & Schema)
Bu adımda görevler (tasks) tablosuna birden fazla dosya/link ekleyebileceğimiz JSON yapısını kuracağız.

- [x] `supabase/migrations/0046_task_attachments.sql` migration dosyasını oluştur.
- [x] `tasks` tablosuna `attachments` isimli bir `JSONB` kolonu ekle (Varsayılan: `[]`).
- [x] TypeScript tiplerini (`src/types/kanban.ts`) güncelle:
  - `TaskAttachment` tipini oluştur: `{ id: string, url: string, type: 'drive' | 'figma' | 'github' | 'link', title: string, added_by: string, added_at: string }`
  - `KanbanTask` interface'ine `attachments?: TaskAttachment[]` alanını ekle.

## 2. Sunucu İşlemleri (Backend / Server Actions)
Kullanıcıların eklenti ekleyip silebilmesi için veritabanıyla konuşacak fonksiyonları yazacağız.

- [x] `src/app/dashboard/shared/teamTasks.ts` dosyasında `addTaskAttachment(taskId, payload)` fonksiyonunu oluştur.
- [x] Eklenen linkin içindeki kelimelere göre (Örn: `drive.google.com`) type atamasını (`drive`, `figma` vs.) otomatik yapan regex tabanlı bir `detectAttachmentType` yardımcı fonksiyonu yaz.
- [x] `src/app/dashboard/shared/teamTasks.ts` dosyasında `removeTaskAttachment(taskId, attachmentId)` fonksiyonunu oluştur.
- [x] Eklentiyi ekleyen kişiyi loglamak için oturum (Session) verisini kullanan güvenlik kontrollerini ekle.

## 3. Arayüz ve Görselleştirme (Frontend UI)
Kanban görev detay popup'ına (TaskDetailDialog) link yapıştırma ve görüntüleme arayüzünü çizeceğiz.

- [x] `src/app/dashboard/_shared/kanban/TaskDetailDialog.tsx` dosyasını aç.
- [x] "Geliştirici Notu" bölümünün hemen altına "Eklentiler ve Bağlantılar" (Attachments) isimli yeni bir bölüm ekle.
- [x] Yeni link eklemek için bir `<Input>` ve yanına "Ekle" (veya + ikonu) butonu koy.
- [x] URL'i yapıştıran kişinin "Bağlantıya sahip herkes görebilir" yetkisini verdiğini hatırlatan küçük bir not (info) banner'ı ekle.
- [x] Eklenen bağlantıları listelemek için `AttachmentList` isimli minik bir alt bileşen yaz.
  - Eğer type `drive` ise Google Drive ikonu, `figma` ise Figma ikonu gösterilsin.
  - Her bir satırın sonuna linki silmek için ufak bir "Çöp Kutusu" (Trash) butonu ekle.

## 4. Test ve Doğrulama (QA)
- [x] Sisteme örnek bir Google Drive Public linki ekle, arayüzde doğru ikonla listelendiğini gör.
- [x] Linke tıklandığında yeni sekmede (`_blank`) açıldığından emin ol.
- [x] Sadece linki ekleyen kişinin (veya hocanın/liderin) çöp kutusuna tıklayarak linki silebildiğini doğrula.
- [x] Yapay Zeka'nın okuyabileceği test dosyası formatında olduğundan emin ol.
