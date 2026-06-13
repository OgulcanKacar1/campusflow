# Faz 9: Yapay Zeka ile Sprint Analizi (AI Analytics)

> **Amaç:** Öğrencilerin sprint boyunca yaptığı görevleri, ekledikleri doküman bağlantılarını (Drive/Figma) ve GitHub kod commitlerini harmanlayarak, eğitmene "Hangi öğrenci ne kadar katkı sağladı?" sorusunun cevabını veren otomatik ve akıllı bir özet rapor sunmak.

---

## Kararlar & Yapılandırma
1. **Model:** **Google Gemini 1.5 Flash / Pro (Vercel AI SDK üzerinden).** Maliyet açısından ücretsiz/çok ucuz olması, hızının yüksek olması ve büyük bağlam (context) pencerelerini desteklemesi nedeniyle seçilmiştir.
2. **Kalıcılık:** Üretilen raporlar her defasında baştan oluşturulmayacak, veritabanına (**ai_sprint_reports**) kaydedilecektir. Böylece hem maliyetten tasarruf edilecek hem de sayfa yenilendiğinde rapor anında açılacaktır.
3. **Tetikleme Mekanizması:** Eğitmen, "Sprint Yönetimi" ekranında veya doğrudan Kanban Panosu başlığında yer alan **"AI Analizi Çıkar"** butonuna manuel basarak tetikleyecektir. Bu sayede dönem sonu genel bir rapor da aynı mantıkla istenildiği zaman tetiklenebilir.
4. **Veri Kapsamı:** AI'a şu bilgiler beslenecektir:
   - Görev başlığı, detayı ve durumu.
   - Görevin kime atandığı.
   - Göreve eklenen Drive/Figma linklerinin başlıkları ve türleri (AI doğrudan linkin içine girip PDF okuyamaz, ancak meta verileri analiz eder).
   - Öğrencinin GitHub üzerinden attığı commitlerin mesajları, satır ekleme/silme istatistikleri ve tarihleri.
   - *(Not: Takım içi özel mesajlaşmalar projeye dahil edilmemiştir, gizlilik ihlali yapılmayacaktır.)*

---

## 1. Veritabanı ve Şema (Database & Schema)
Öncelikle AI raporlarını kalıcı olarak saklayacağımız yapıyı kurmalıyız.

- [ ] `supabase/migrations/0047_ai_sprint_reports.sql` migration dosyasını oluştur.
  - Sütunlar: `id` (UUID), `team_id` (UUID), `sprint_id` (UUID), `report_content` (JSONB - AI'ın ürettiği yapılandırılmış veri), `created_at` (Timestamp).
- [ ] TypeScript tiplerini (`src/types/kanban.ts` veya yeni bir `ai.ts`) güncelle:
  - `AiSprintReport` arayüzünü oluştur.

## 2. Yapay Zeka Entegrasyonu (Backend & AI SDK)
Vercel AI SDK paketlerini kurup Gemini entegrasyonunu yapacağız.

- [ ] Gerekli paketlerin kurulumu: `npm install ai @ai-sdk/google`
- [ ] `.env.local` dosyasına `GOOGLE_GENERATIVE_AI_API_KEY` eklenmesi (Local testler için ayarlanacak).
- [ ] `src/app/api/ai/analyze-sprint/route.ts` API Endpoint'inin oluşturulması.
  - Bu API, veritabanından sprint'teki tüm görevleri, GitHub commitlerini ve bağlantıları (attachments) çekecek.
  - Sistematik bir prompt oluşturulacak. Örnek: *"Sen bir yazılım eğitmenisin. Aşağıdaki JSON verisi Takım 2'nin Sprint 1 verisidir. Kimin ne kadar efor sarf ettiğini, kaliteyi ve iş dağılımını analiz et."*
  - Vercel AI SDK `generateObject` fonksiyonu ile JSON formatında garantili bir rapor çıktısı alınacak.
  - Üretilen rapor veritabanına `ai_sprint_reports` tablosuna kaydedilecek.

## 3. Kullanıcı Arayüzü (Frontend UI)
Eğitmen için şık ve fütüristik bir raporlama ekranı çizeceğiz.

- [ ] `InstructorKanbanClient.tsx` içine "Sprint AI Analizi" butonu (Sparkles/Yıldız ikonu ile) eklenecek.
- [ ] Tıklandığında açılacak olan `AiReportDialog.tsx` bileşeninin oluşturulması.
  - Bileşen açıldığında önce veritabanında bu sprint için rapor var mı diye bakacak.
  - Yoksa API'ye istek atacak ve loading (skeleton) durumunda "AI Verileri İnceliyor...", "Commitler Okunuyor..." gibi havalı yükleme metinleri gösterecek.
  - Rapor geldiğinde: 
    - **Genel Özet:** Sprintin başarı durumu.
    - **Öğrenci Katkıları:** İlerleme çubukları (progress bar) veya radar grafikleriyle her öğrencinin eforu.
    - **Tavsiyeler:** AI'ın takıma veya eğitmene tavsiyeleri (Örn: "Tolga daha çok kod yazarken, Oğulcan sadece tasarım linkleri eklemiş, kodlamaya daha çok katılmalı").

## 4. Test ve Doğrulama (QA)
- [ ] Test takımına örnek görevler, Drive linkleri ve GitHub commitleri girilmesi.
- [ ] Eğitmen olarak butona basılması ve JSON raporunun hatasız bir şekilde UI'da görselleştirilmesinin doğrulanması.
- [ ] Sayfa yenilendiğinde tekrar API'ye gitmek yerine doğrudan Supabase üzerinden anında okunabilmesi.
