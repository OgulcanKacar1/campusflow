# Phase 12 Planı: Otomatik GitHub Webhook Kurulumu (GitHub V2)

Bu fazın amacı, öğrencilerin CampusFlow sistemini GitHub repolarıyla eşleştirirken manuel olarak Ngrok veya Vercel linki kopyalayıp GitHub ayarlarına girmesini engellemektir. Sistem, OAuth yetkisini kullanarak bu işlemi tek tıkla arka planda yapacaktır.

## 1. Mevcut Durum Analizi
- **OAuth Yetkisi:** `src/app/api/github/auth/route.ts` dosyasında `scope=repo,admin:repo_hook` yetkileri zaten isteniyor. Bu yetki webhook kurmak için yeterlidir.
- **Token Saklama:** `github_connections` tablosunda `access_token` ve henüz boş olan bir `webhook_id` sütunumuz mevcut.
- **Repo URL:** `teams` tablosunda `repo_url` sütununu Phase 11'de aktif ettik.

## 2. Geliştirilecek Modüller

### A. Backend (API Endpoint)
**Dosya:** `src/app/api/github/webhook/setup/route.ts` (POST)
- Öğrencinin takım lideri olup olmadığını doğrulayacak.
- Veritabanından takımın `repo_url` bilgisini alıp `owner/repo` şeklinde ayrıştıracak (Örn: `OgulcanKacar1/CampusFlow-Projesi`).
- `github_connections` tablosundan `access_token`'ı alacak.
- GitHub API (`POST /repos/{owner}/{repo}/hooks`) kullanarak Webhook kurulum isteği atacak.
- Dönen webhook ID'sini `github_connections` tablosundaki `webhook_id` sütununa kaydedecek.

### B. Frontend (UI Entegrasyonu)
**Dosya:** `src/app/dashboard/student/courses/[courseId]/ProjectDetailsTab.client.tsx`
- "Proje Bilgileri" sekmesinin altına "GitHub Entegrasyonu" adında yeni bir bölüm eklenecek.
- Veritabanında `webhook_id` varsa "✅ Webhook Aktif" yazacak, yoksa "🚀 Otomatik Webhook Kur" butonu çıkacak.
- **Localhost Sorunu Çözümü:** Kullanıcı geliştirme (development) ortamındaysa, webhook adresinin internete açık olması gerektiği için UI'da küçük bir "Ngrok Linki" inputu gösterilecek. Prodüksiyonda (Canlı ortamda) sistem otomatik olarak kendi domainini (`window.location.origin`) kullanacak.

## 3. Test Senaryosu
1. Öğrenci "Otomatik Webhook Kur" butonuna basar.
2. API, GitHub'a istek atar ve webhook kurulur.
3. Öğrenci GitHub repouna gidip `Settings -> Webhooks` sekmesine baktığında CampusFlow webhook'unun kendiliğinden eklendiğini görür.
