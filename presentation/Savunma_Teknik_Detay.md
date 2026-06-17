# CampusFlow — Derinlemesine Teknik Soru-Cevap

> Bu dosya, jürinin "tam olarak nasıl yaptın, hangi değişkeni baz aldın, nereye yazdın" gibi **kod düzeyinde** sorularına hazırlık içindir. Cevaplar senin gerçek kodundan çıkarıldı; tablo ve dosya adlarını bilmen seni çok güçlü gösterir.

---

## 1. SUPABASE VERİTABANI BAĞLANTISI (kod düzeyinde)

### S: Supabase'deki veritabanı projene tam olarak nasıl bağlanıyor?
> `@supabase/ssr` kütüphanesini kullanıyorum. Doğrudan SQL bağlantı dizesi (connection string) yönetmiyorum; Supabase, PostgreSQL'in önüne **PostgREST** koyuyor, yani `supabase-js` benim sorgularımı arka planda **HTTPS/REST** çağrılarına çeviriyor. Bağlantı için iki şey yetiyor: proje **URL'si** ve **anon key**. İkisi de `.env.local` içinde ortam değişkeni (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

### S: Neden üç farklı yerde istemci oluşturdun?
> Üç çalışma bağlamı var, her biri çerezi farklı okur:
> - **`src/lib/supabase/server.ts`** → `createServerClient`. Server Component ve Server Action'larda. `next/headers`'tan `cookies()` ile kullanıcının oturum çerezini okur.
> - **`src/lib/supabase/client.ts`** → `createBrowserClient`. Tarayıcıda çalışan bileşenlerde.
> - **`src/lib/supabase/middleware.ts`** → `updateSession`. Her istekte oturumu **yeniler** ve çerezi tazeler.

### S: Bağlantı kullanıcıyı nasıl tanıyor? (kritik)
> Çerez tabanlı. Kullanıcı giriş yapınca Supabase Auth, imzalı bir oturum token'ını (JWT) **çereze** koyuyor. `server.ts`'teki istemci her sorguda bu çerezi okuyup isteğe ekliyor. Böylece veritabanına giden her sorgu "bu kullanıcı adına" gidiyor ve **RLS politikaları** o kullanıcının kimliğine göre devreye giriyor. Yani bağlantı anonim değil, her zaman bir kullanıcı kimliğini taşıyor.

### S: `getUser()` mü `getSession()` mü kullandın, neden?
> Sunucuda **`getUser()`**. Fark şu: `getSession()` sadece çerezdeki veriyi okur (sahte olabilir), `getUser()` ise token'ı **Supabase'e doğrulatır**. Güvenlik kontrolü yaptığım için (middleware'de rol kontrolü) doğrulanmış kullanıcı şart.

### S: `anon key` ile `service_role key` farkı nedir, ikisini de kullandın mı?
> - **anon key:** Herkese açık olabilir, çünkü **RLS'e tabidir** — yalnızca yetkili satırları görür. Normal kullanıcı işlemlerinde bunu kullanıyorum.
> - **service_role key:** RLS'i **atlar**, tam yetkilidir. Yalnızca **sunucuda** ve çok özel durumlarda kullanılır (örn. sprint analizinde admin istemci `createClient as createAdminClient` ile içe aktarılıyor). Bu anahtar asla istemciye gitmez.

### S: Oturum (session) nasıl ayakta kalıyor / yenileniyor?
> `middleware.ts` her HTTP isteğinde `updateSession` çalıştırıyor; bu, token'ın süresi dolmadan tazelenmesini ve çerezin güncellenmesini sağlıyor. Aynı middleware giriş yapmamış kullanıcıyı `/login`'e, yanlış panele girmeye çalışan kullanıcıyı kendi paneline yönlendiriyor.

### S: Sorgular nerede yazılıyor — ham SQL mi?
> Çoğunlukla `supabase.from('tablo').select(...).eq(...)` zincir API'siyle (sorgu oluşturucu). Karmaşık ve RLS'in özyinelemeye girdiği yerlerde ise PostgreSQL içinde **`SECURITY DEFINER` RPC fonksiyonları** yazıp `supabase.rpc('fonksiyon_adi')` ile çağırıyorum (örn. `get_my_role`, `get_my_org_id`, `get_my_enrolled_courses`).

---

## 2. YAPAY ZEKÂ NOT DEĞERLENDİRMESİ — HANGİ DEĞİŞKENLER? (kod düzeyinde)

> Kod: `src/app/api/ai/analyze-sprint/route.ts` (sprint bazlı) ve `analyze-final/route.ts` (dönem sonu). Model: **`gemini-2.5-flash`**, Vercel **AI SDK**'sının `generateObject` fonksiyonu + **Zod** şeması ile.

### S: Yapay zekâ notu hangi değişkenleri baz alıyor?
> Modele şu **somut verileri** toplayıp gönderiyorum:
>
> **Sprint analizinde (`analyze-sprint`):**
> 1. **Görevler** (`tasks`): başlık, açıklama, durum, **öncelik**, ekler.
> 2. **Görev atamaları** (`task_members`): hangi öğrenci hangi göreve atanmış → bireysel sorumluluk.
> 3. **Takım üyeleri** (`team_members`, aktif olanlar): ad, e-posta.
> 4. **GitHub olayları** (`task_github_events`): commit hash, **commit mesajı**, yazar adı, tarih.
> 5. **GERÇEK COMMIT DIFF'LERİ:** GitHub API'den, saklı `access_token` ile her commit'in **gerçek kod değişikliğini** (diff) çekiyorum (2500 karakterle sınırlı). Yani AI sadece "kaç commit atıldı"ya değil, **kodda ne değiştiğine** de bakıyor.
> 6. **Toplantılar** (`meetings`): başlık, zaman, toplantı notları.
>
> **Dönem sonu analizinde (`analyze-final`):**
> 1. **Takım/proje bilgisi:** ad, proje adı, açıklama, repo URL.
> 2. **Sprint'ler:** hedef, durum, **toplam vs tamamlanan görev sayısı** + her sprintin **geçmiş AI raporu** (kümülatif sentez).
> 3. **Tüm görevler:** durum, **story point (puan)**, atanan kişi.
> 4. **Görev atamaları** → kişi bazlı katkı dağılımı.

### S: Yani AI gerçekten kodu mu okuyor, yoksa sadece görev sayısını mı sayıyor?
> Gerçekten kodu okuyor. Sprint analizinde commit'in SHA'sıyla GitHub API'sine gidip **diff'i (eklenen/silinen satırları)** çekiyorum ve modele veriyorum. Bu yüzden değerlendirme "10 commit attı" gibi yüzeysel değil; "şu commit'te şu mantığı yazdı" düzeyinde. Bu, "sıfır-dosya" yaklaşımının özü: öğrencinin **gerçek işini** baz alıyorum.

### S: AI'nın çıktısının formatını nasıl garanti ediyorsun? Serbest metin verirse?
> `generateObject` + **Zod şeması** kullanıyorum. Modelden serbest yazı değil, şu yapıda **doğrulanmış JSON** alıyorum:
> `overallScore`, `executiveSummary`, `technicalEvaluation`, `strengths[]`, `weaknesses[]`, `studentPerformances[]{ studentId, name, score (0-100), feedback }`.
> Şemaya uymayan çıktı reddedilir; böylece arayüz her zaman tutarlı veri alır.

### S: Bireysel notu nasıl ayrıştırıyorsun? Takıma değil kişiye nasıl puan veriyor?
> İki bağ üzerinden: (1) `task_members` ile her görev belirli öğrencilere atanmış; (2) commit'lerin `author_name` alanı kimin yazdığını söylüyor. Modele "her öğrencinin aldığı görevleri, tamamlananları ve commit katkılarını dikkate alarak 0-100 arası **hakkaniyetli** bir not ver" diyorum. Çıktıda her öğrenci için ayrı `score` ve gerekçeli `feedback` geliyor.

### S: Notu kim veriyor — AI mı? (etik)
> AI **öneri** üretiyor, **karar eğitmenin**. Çıktı `ai_sprint_reports` / `ai_final_reports` tablolarına kaydediliyor ve eğitmene gösteriliyor; eğitmen kabul/değiştir yapabiliyor. İnsan döngüde.

### S: API anahtarını nerede tutuyorsun, istemciye sızar mı?
> `GOOGLE_GENERATIVE_AI_API_KEY` ortam değişkeninde, **yalnızca sunucuda** (route handler içinde). İstemciye gönderilmiyor. Yoksa kod "API Key bulunamadı" hatası dönüyor.

### S: Yetkisiz biri (öğrenci) bu raporu üretebilir mi?
> Hayır. Route'un başında `teams → courses.instructor_id === user.id` kontrolü var; **sadece dersin eğitmeni** çağırabiliyor, aksi halde **403**. Ayrıca dönem sonu raporu prompt'unda "öğrenciler bunu göremez" notu da var.

### S: Aynı sprinti iki kez analiz edersen tekrar para/token harcar mı?
> Hayır, **önbellekleme** var: `ai_sprint_reports`'ta o sprint için rapor zaten varsa, modeli tekrar çağırmadan kayıtlı raporu döndürüyorum (`maybeSingle` kontrolü). Final raporda ise `upsert ... onConflict: 'team_id'` ile güncelliyorum.

### S: Çok fazla veri/commit olursa? Token sınırı?
> İki önlem: (1) her commit diff'ini **2500 karakterle kırpıyorum**; (2) Gemini ücretsiz kotası dolarsa gelen **429** hatasını yakalayıp kullanıcıya "30 sn bekleyip tekrar deneyin" mesajı veriyorum.

### S: Neden `gemini-2.5-flash`? Pro değil?
> "Flash" sürümü hız ve maliyet açısından optimize; yapılandırılmış analiz görevi için yeterli ve ücretsiz kota dostu. AI SDK sağlayıcı bağımsız olduğu için modeli tek satırda Pro'ya ya da başka sağlayıcıya çevirebilirim.

### S: Bu değerlendirmenin zayıf noktası ne? (dürüst ol — jüri bunu sever)
> En büyük varsayım: **katkı = görev + commit izi**. Çok düşünen ama az commit atan ya da dokümantasyon/tasarım yapan bir öğrenci eksik değerlendirilebilir. Bu yüzden sistemi **karar verici değil, eğitmene öneri** olarak tasarladım; nihai yargı insanda. Ayrıca commit yazar eşleşmesi (GitHub kullanıcısı ↔ öğrenci) doğru kurulmazsa katkı yanlış kişiye yazılabilir — bunu repo bağlama adımında ele alıyorum.

---

## 3. DİĞER DERİN TEKNİK SORULAR

### S: Neden bazı işleri Server Action, bazılarını API route yaptın?
> - **Server Action** (`actions.ts` dosyaları): uygulama içinden çağrılan **mutasyonlar** (ders oluştur, görev güncelle). Ayrı URL gerektirmez, form/istemci doğrudan çağırır.
> - **Route Handler** (`/api/...`): **dışarıdan** erişilen veya **akış/uzun süren** işler. Webhook'un sabit bir public URL'ye ihtiyacı var (GitHub çağıracak); AI analizi de uzun sürdüğü ve harici API çağırdığı için route handler.

### S: GitHub webhook'unu kötü niyetli biri sahte istekle tetikleyebilir mi?
> Webhook uç noktası middleware'de halka açık bırakıldı (`/api/webhooks` muaf), çünkü GitHub'ın erişmesi gerekiyor. Üretimde doğrulama için GitHub'ın gönderdiği **imza (HMAC) başlığı** secret ile doğrulanmalı — bu benim güvenlik sıkılaştırma adımlarımdan biri.

### S: RLS sonsuz özyineleme (infinite recursion) tam olarak nasıl oluştu ve nasıl çözdün?
> `course_enrollments` politikası `courses`'a, `courses` politikası tekrar `course_enrollments`'a bakınca PostgreSQL politikayı değerlendirmek için politikayı tekrar çağırıyordu → sonsuz döngü. Çözüm: bu veriyi politika zincirine sokmadan, **`SECURITY DEFINER`** bir fonksiyonla (`get_my_enrolled_courses`) çekmek. Bu fonksiyon tanımlayanın yetkisiyle çalıştığı için RLS'i kontrollü atlıyor. Çakışan eski politikaları `0013_fix_infinite_recursion.sql` migration'ında DROP ettim.

### S: Katılım kodu (join code) akışı nasıl çalışıyor?
> Öğrenci 6 haneli kodu girer → `get_course_by_join_code(kod)` adlı `SECURITY DEFINER` RPC ders ID'sini bulur (RLS'i güvenli atlayarak) → `course_enrollments`'a kayıt eklenir (buna izin veren INSERT politikası `0017`'de).

### S: Şifreleri nerede, nasıl saklıyorsun?
> Şifreleri ben saklamıyorum. **Supabase Auth** yönetiyor; şifreler Supabase tarafında **hash'lenmiş** olarak tutuluyor (bcrypt). Ben sadece `signInWithPassword` / `signUp` çağırıyorum. Bu, kendi başıma şifre güvenliği yazmaktan çok daha güvenli.

### S: Test ettin mi, nasıl?
> Kritik iş mantığı (Kanban/sprint kuralları) için **Vitest** birim testleri (`__tests__` klasörü). Ek olarak dört rolün her biri için elle senaryo testleri yaptım.

---

## Hızlı Ezber Kartı (en çok sorulan 3 derin soru)

| Soru | 1 cümlelik öz |
|---|---|
| Supabase nasıl bağlanıyor? | `@supabase/ssr` ile, URL+anon key `.env`'den; çerezdeki JWT her sorguya kullanıcı kimliğini taşır, RLS devreye girer. |
| AI hangi değişkenleri baz alıyor? | Görev atamaları + durum + story point, sprint tamamlanma oranı, toplantı notları ve **GitHub commit diff'leri (gerçek kod)**. |
| Notu AI mı veriyor? | Hayır — `gemini-2.5-flash` Zod şemasıyla 0-100 **öneri** üretir, `ai_*_reports`'a yazılır, **kararı eğitmen** verir. |
