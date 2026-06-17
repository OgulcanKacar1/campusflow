# CampusFlow — Tez Savunması Soru-Cevap & Hazırlık Planı

> Amaç: jüri "neden böyle yaptın, bunu nereye/nasıl yazdın, neden" diye sorduğunda net, kendinden emin ve teknik cevaplar verebilmek. Cevapları ezberleme — **mantığını** kavra, kendi cümlelerinle anlat.

---

## 0. Açılış Stratejisi

**Altın kurallar:**
- Önce **tek cümlelik net cevap** ver, sonra istenirse detaylandır. Lafı dolandırma.
- Bilmediğin şeyde **"Bu yönü projemde derinlemesine ele almadım, ama mantığı şöyle olurdu…"** de. Asla uydurma.
- Her teknik seçim için **"neden" + "alternatifi neydi" + "neden onu seçmedim"** üçlüsünü hazır tut.
- Sakin konuş, jüriyle göz teması kur, "iyi soru" diyip 2 saniye düşün.

**45 saniyelik açılış özeti (ezberle):**
> "CampusFlow, üniversitelerdeki grup projelerini yöneten çok kiracılı bir web platformudur. Problem şu: projeler dönem sonunda tek bir dosyayla değerlendiriliyor, bu yüzden kimin ne kadar emek verdiği görünmüyor — 'serbest binici' sorunu doğuyor. Ben bu süreci Sprint ve Kanban ile çevik bir akışa dönüştürdüm; öğrencilerin GitHub'daki gerçek katkılarını otomatik topluyorum ve yapay zekâ ile her öğrenci için şeffaf, gerekçeli bir not önerisi üretiyorum. Teknik olarak Next.js, Supabase ve PostgreSQL üzerine, Row Level Security ile güvenli çok kiracılı bir mimari kurdum."

---

## 1. Mutlaka Tanımını Bilmen Gereken Terimler

Jüri "bu ne demek?" diye sorabilir. Her birini **bir cümleyle** açıklayabilmelisin:

| Terim | Kısa tanım |
|---|---|
| **Multi-tenant (çok kiracılı)** | Tek bir uygulama/veritabanının birden çok kurumu (üniversiteyi) birbirinden izole şekilde barındırması. |
| **RLS (Row Level Security)** | PostgreSQL'in satır bazında erişim kuralı; kullanıcı yalnızca yetkili olduğu satırları görebilir. Güvenlik veritabanı katmanında. |
| **SECURITY DEFINER** | Bir veritabanı fonksiyonunun, çağıran kullanıcının değil, fonksiyonu **tanımlayan** kullanıcının yetkisiyle çalışması. |
| **Server Action** | Next.js'te sunucuda çalışan, formdan/istemciden doğrudan çağrılabilen fonksiyon; mutasyonlar (ekleme/güncelleme) için. |
| **Route Handler (API route)** | `/api/...` altındaki HTTP uç noktası; webhook ve yapay zekâ gibi dış/akış işleri için. |
| **Webhook** | Bir olay olduğunda (ör. GitHub'a commit atılınca) dış servisin senin uç noktanı otomatik çağırması. |
| **Middleware** | Her istekten önce çalışan ara katman; oturum yenileme ve rol bazlı yönlendirme yapar. |
| **JWT / Session** | Supabase Auth'un kullanıcı kimliğini taşıyan, çerezde tutulan imzalı token. |
| **Sprint / Backlog / Kanban** | Çevik (agile) yöntemin öğeleri: zaman kutusu, iş listesi, görsel görev panosu. |
| **LLM** | Büyük Dil Modeli (ben Google Gemini kullandım). |

---

## 2. Kategorilere Göre Soru-Cevap

### A) Problem & Motivasyon

**S: Bu projeyi neden yaptın? Hangi gerçek problemi çözüyor?**
> Üniversite grup projeleri dönem sonunda tek bir dosyayla değerlendiriliyor. Bu, bireysel emeği görünmez kılıyor ve "serbest binici" (free-rider) sorununu doğuruyor — bir kişi her şeyi yaparken herkes aynı notu alıyor. Ayrıca öğrenciler sektörde kullanılan çevik takım pratiklerini hiç öğrenmiyor. CampusFlow bu iki boşluğu birden kapatıyor.

**S: Zaten Moodle/Jira/Trello var. Senin farkın ne?**
> Moodle gibi LMS'ler içerik ve dosya teslimi içindir, süreç ve bireysel katkı görünmez. Jira/Trello güçlü çevik araçlardır ama akademik değildir, çok kiracılı değildir ve otomatik değerlendirme yapmaz. CampusFlow bunları birleştirir: **akademik bağlam + çevik süreç + yapay zekâ ile adil değerlendirme**, tek platformda.

### B) Teknoloji Seçimleri ("neden bunu seçtin?")

**S: Neden Next.js? Neden sadece React değil?**
> Next.js bana hem arayüzü (React) hem de sunucu tarafını (Server Actions, API route'ları) tek bir projede veriyor. App Router ile sayfa bazlı render, sunucu tarafı veri çekme ve güvenlik kontrolünü aynı yerde yapabiliyorum. Sadece React olsaydı ayrı bir backend (Node/Express) yazmam gerekirdi; Next.js bu ikisini birleştirerek geliştirmeyi hızlandırdı.

**S: Neden Supabase? Neden kendi backend'ini yazmadın?**
> Supabase bana PostgreSQL veritabanı, kimlik doğrulama (Auth) ve satır bazlı güvenliği (RLS) hazır veriyor. Bir bitirme projesi için sıfırdan auth + yetkilendirme + veritabanı yazmak haftalar alırdı ve daha hatalı olurdu. Supabase ile **güvenliği veritabanı katmanına** taşıyıp asıl problem olan çevik süreç ve yapay zekâya odaklandım. Açık kaynak olması ve standart PostgreSQL kullanması da beni bir firmaya kilitlemiyor.

**S: Neden NoSQL (MongoDB) değil de ilişkisel veritabanı (PostgreSQL)?**
> Verim son derece ilişkisel: kullanıcı → ders → takım → sprint → görev → commit zinciri var. Bu ilişkileri ve bütünlüğü (foreign key, ACID) ilişkisel veritabanı çok daha iyi yönetir. Ayrıca RLS gibi satır bazlı güvenlik NoSQL'de yok. Çok kiracılı ve güvenlik kritik bir sistemde PostgreSQL doğru tercihti.

**S: Neden Google Gemini? Neden OpenAI değil?**
> Vercel'in AI SDK'sı üzerinden sağlayıcı bağımsız çalıştım; bugün Gemini, yarın başka bir model takılabilir. Gemini'yi seçtim çünkü uzun bağlamı iyi yönetiyor ve maliyet/erişim açısından uygundu. Mimari, modeli değiştirmeye açık.

### C) Veritabanı — "nasıl bağladın, nereye yazdın, neden?"

**S: Veritabanını uygulamaya nasıl bağladın?**
> `@supabase/ssr` kütüphanesiyle iki ayrı istemci oluşturdum:
> - `src/lib/supabase/server.ts` → **sunucu** tarafı istemci (Server Component ve Server Action'larda). Çerez tabanlı, her istekte kullanıcının oturumunu okur.
> - `src/lib/supabase/client.ts` → **tarayıcı** tarafı istemci.
> Bağlantı bilgileri (`NEXT_PUBLIC_SUPABASE_URL` ve `ANON_KEY`) `.env.local` dosyasında ortam değişkeni olarak tutuluyor; koda gömülü değil.

**S: Anon key'i frontend'e koymuşsun, bu güvenlik açığı değil mi?**
> Hayır. Anon key zaten herkese açık olacak şekilde tasarlanmıştır. Asıl güvenlik **RLS politikalarında**. Veritabanı, anon key ile gelen her sorguyu RLS kurallarından geçirir; kullanıcı yalnızca kendi yetkisindeki satırları görebilir. Yani anahtar sızsa bile yetkisiz veriye erişilemez. Hassas işlemler için ayrıca `service_role` anahtarı sadece sunucuda kullanılır.

**S: Çok kiracılı yapıyı nasıl kurdun? Bir üniversitenin verisini diğeri göremiyor, bunu nasıl garanti ediyorsun?**
> Her tabloya `organization_id` kolonu ekledim. Sonra RLS politikalarıyla "kullanıcı yalnızca kendi `organization_id`'sine ait satırları görebilir" kuralını yazdım. Kullanıcının kurumunu `get_my_org_id()` adlı `SECURITY DEFINER` fonksiyonuyla buluyorum. Böylece izolasyon **uygulama kodunda değil, veritabanı katmanında** zorunlu kılınıyor — geliştirici bir `WHERE` koşulunu unutsa bile veri sızmaz.

**S: RLS'de yaşadığın bir zorluk oldu mu?** *(harika bir cevap fırsatı)*
> Evet, gerçek bir sorun yaşadım: `course_enrollments → courses → profiles` gibi iç içe RLS kontrolleri birbirini tetikleyince **sonsuz özyineleme (infinite recursion)** hatası aldım. Bunu, ilgili veriyi `SECURITY DEFINER` fonksiyonlarıyla (`get_my_enrolled_courses`, `get_my_role`) çekerek çözdüm — bu fonksiyonlar RLS'yi kontrollü biçimde atlayıp güvenli sonucu döndürüyor. Çakışan eski politikaları da `0013` numaralı migration'da temizledim.

**S: Veritabanı şemasını nasıl yönettin?**
> Tüm şema değişikliklerini sıralı **migration** dosyalarıyla (`supabase/migrations/0001…0017`) tuttum. Her değişiklik versiyonlu ve geri izlenebilir; veritabanını sıfırdan aynı şekilde kurabilirim. 15'ten fazla tablo var: organizations, profiles, courses, teams, sprints, tasks, ai_analyses, grade_suggestions, calendar_events vb.

### D) Kimlik Doğrulama & Güvenlik

**S: Giriş/kayıt sistemini nasıl kurdun?**
> Supabase Auth ile e-posta/şifre tabanlı. `src/app/auth/actions.ts` içinde `login`, `register`, `logout` **Server Action**'ları var. Kayıtta iki kısıt koydum: (1) sadece `.edu.tr` uzantılı e-postalar, (2) e-posta domain'inin `organization_domains` tablosunda kayıtlı bir üniversiteye ait olması. Böylece rastgele kişiler sisteme giremiyor ve doğru kuruma yerleştiriliyor.

**S: Rol kontrolünü nerede yapıyorsun? İstemcide mi?**
> Hayır, istemciye güvenmiyorum. Rol kontrolü iki katmanda: (1) `middleware.ts` her istekte oturumu yeniler ve rolü okuyup yanlış panele gitmeye çalışan kullanıcıyı kendi paneline yönlendirir; (2) asıl güvenlik yine **RLS** — veritabanı, rolü `get_my_role()` ile kontrol ediyor. İstemcideki yönlendirme sadece kullanıcı deneyimi için; veriyi koruyan veritabanı.

### E) Çevik Süreç — Kanban / Sprint

**S: Kanban panosunu nasıl yaptın?**
> Sürükle-bırak için `@hello-pangea/dnd` kütüphanesini kullandım. Görevler `tasks` tablosunda; durumu (Yapılacak/Yapılıyor/Tamamlandı) bir kolon. Kullanıcı kartı sürükleyince Server Action ile görevin durumu güncelleniyor. Sprint'ler `sprints` tablosunda, görevler sprint'lere bağlı. Kanban iş mantığının kritik kısımları için Vitest ile birim testleri de yazdım.

### F) GitHub Entegrasyonu

**S: GitHub entegrasyonunu nasıl kurdun? "Sıfır-dosya" derken ne demek istiyorsun?**
> OAuth ile öğrenci/takım deposunu bağlıyorum. Sonra GitHub'a bir **webhook** tanımlıyorum: depoya commit atıldığında GitHub benim `/api/webhooks/github` uç noktamı otomatik çağırıyor. Ben de gelen olayı işleyip ilgili görevle eşleştiriyor ve `integration_events` tablosuna kaydediyorum. "Sıfır-dosya" şu demek: öğrenci ekstra bir rapor/dosya yüklemiyor; sistem zaten yaptığı **gerçek işi** (commit'leri) dinliyor. Bu yüzden veri manipüle edilemez ve gerçek katkıyı yansıtır.

**S: Webhook'u neden API route'a yazdın da Server Action'a değil?**
> Webhook **dışarıdan gelen bir HTTP çağrısıdır** — GitHub'ın çağırabilmesi için sabit, herkese açık bir URL'ye ihtiyaç var. Server Action'lar uygulama içinden çağrılır, dış servise URL vermez. Bu yüzden webhook ve yapay zekâ uç noktalarını `Route Handler` olarak, kullanıcı mutasyonlarını ise `Server Action` olarak yazdım.

### G) Yapay Zekâ & Not Önerisi (EN KRİTİK BÖLÜM — çok soru gelir)

**S: Yapay zekâ not vermeyi nasıl yapıyor? Notu AI mı veriyor?**
> Çok önemli ayrım: AI **not vermez, öneri sunar**. Sistem takımın commit ve görev katkı verisini toplayıp Gemini'ye gönderiyor; model bunları analiz edip her öğrenci için bir özet, güçlü yönler, gelişim alanları ve **gerekçeli bir not önerisi** üretiyor. Nihai kararı her zaman **eğitmen** veriyor. Yani insan döngüde (human-in-the-loop). AI yalnızca eğitmene veriye dayalı, şeffaf bir başlangıç noktası sağlıyor.

**S: AI'ya nasıl güveniyorsun? Yanlış/halüsinasyon yaparsa?**
> Tam da bu yüzden AI'yı **karar verici değil, öneri motoru** olarak konumlandırdım. Çıktı gerekçeli ve şeffaf; eğitmen kabul/ret/değiştir yapabiliyor. Ayrıca AI'ya keyfî değil, **somut veri** (commit sayısı/içeriği, görev katkısı) veriyorum — yani "kim çalıştı" sorusuna sübjektif anket yerine objektif izlerle yaklaşıyorum. Halüsinasyon riskini, modelin yalnızca verilen veriyi yorumlamasını isteyerek ve sonucu insana onaylatarak sınırlıyorum.

**S: AI çıktısını nereye kaydediyorsun?**
> Analiz sonuçlarını `ai_analyses`, not önerilerini `grade_suggestions` tablosuna yazıyorum. Böylece sonuç tekrar üretilebilir, denetlenebilir ve eğitmen sonradan tekrar görebilir. Analizi `/api/ai/analyze-sprint` ve `/api/ai/analyze-final` route'larında, Vercel AI SDK ile yapıyorum.

**S: Bu etik mi? Öğrenciyi makineye mi not verdiriyorsun?**
> Etik kaygıyı tasarımın merkezine koydum. Mevcut sistemdeki akran değerlendirmesi manipülasyona açık ve sübjektif. Ben objektif veriyle, şeffaf gerekçeyle ve **son sözü insana bırakarak** aslında değerlendirmeyi daha adil hale getiriyorum. AI burada öğretmenin yükünü azaltan ve önyargıyı düşüren bir asistan.

### H) Performans, Test, Ölçeklenebilirlik

**S: Sistemin performansını/ölçeklenebilirliğini nasıl sağladın?**
> Veri erişimi PostgreSQL'in indeksleri üzerinden; ağır işler (AI analizi, webhook) ana istek akışından ayrı uç noktalarda. Çok kiracılı tasarım yatay büyümeye uygun — yeni üniversite eklemek sadece veri eklemek, kod değişikliği değil. Supabase yönetilen altyapı olduğu için ölçeklenebilirliğin önemli kısmı orada hazır.

**S: Test yazdın mı?**
> Evet, kritik iş mantığı (özellikle Kanban/sprint kuralları) için **Vitest** ile birim testleri yazdım (`__tests__` klasörü). Ayrıca her rol için elle senaryo testleri yaptım.

**S: En çok zorlandığın kısım neydi?**
> İki şey: (1) RLS sonsuz özyineleme sorunu — çok kiracılı güvenliği doğru kurmak; (2) GitHub webhook'larını görevlerle güvenilir biçimde eşleştirmek. İkisini de gerçek mühendislik kararlarıyla çözdüm; bu süreç bana en çok şeyi öğretti.

---

## 3. Zor / Keskin Sorular (panik yapma, hazır ol)

**S: Bu zaten yapılmış bir şey değil mi, yeniliği ne?**
> Parçalar ayrı ayrı var (LMS, Jira, AI), ama **akademik bağlamda, çok kiracılı, GitHub katkısını otomatik dinleyip AI ile adil not öneren bütünleşik bir sistem** yoktu. Yeniliğim entegrasyon ve "sıfır-dosya" değerlendirme yaklaşımında.

**S: Tek başına mı yaptın? Şu kısmı gerçekten sen mi yazdın?**
> Evet. (Sonra somut bir teknik detay ver: "Örneğin RLS özyineleme hatasını şöyle çözdüm…" — kodun mantığını anlatarak sahipliğini kanıtla.)

**S: Yarın 1000 üniversite kullansa çöker mi?**
> Mimari buna hazır: izolasyon `organization_id` + RLS ile veri katmanında; uygulama durumsuz (stateless) Server Component'ler. Darboğaz olursa AI analizini kuyruğa alma ve önbellekleme eklenebilir — gelecek çalışmalarımda var.

**S: Güvenlik açığı bırakmış olabilir misin?**
> Güvenliği tek bir yere değil, katmanlara yaydım: kayıt domain kısıtı, middleware rol kontrolü ve en önemlisi veritabanında RLS. Tek bir kod hatası tüm sistemi açmıyor çünkü asıl koruma veritabanında.

**S: Neden mobil uygulama yok?**
> Kapsamı bilinçli olarak web'le sınırladım ki çekirdek değeri (çevik süreç + AI değerlendirme) sağlam olsun. Mobil, gelecek çalışmalarımın Faz I'i.

---

## 4. Demo & Sunum Taktikleri

- **Demoyu önceden hazırla:** dolu bir ders, takım, sprint, birkaç görev, en az 1 commit ve **önceden üretilmiş bir AI raporu** hazır olsun. Canlı AI analizi uzun sürerse hazır raporu göster.
- İki oturum aç (eğitmen + öğrenci) ki geçişler hızlı olsun.
- İnternet/Supabase'in çalıştığını sunumdan önce test et. **B planı:** demo videon ve ekran görüntülerin hazır olsun.
- Bir şey çökerse panikleme: "Bunu ekran görüntüsü/video üzerinden göstereyim" de, akışı bozma.

---

## 5. Son Gün Checklist

- [ ] 45 saniyelik açılış özetini yüksek sesle 3 kez tekrarla.
- [ ] Terimler tablosundaki her kavramı bir cümleyle anlatabildiğinden emin ol.
- [ ] "Veritabanını nasıl bağladın / multi-tenant / RLS / AI not vermiyor öneriyor" — bu 4 cevabı ezbere bil; en çok bunlar sorulur.
- [ ] Demo verisi + yedek video/ekran görüntüleri hazır.
- [ ] Sunum dosyası (.pptx) + poster + tez yedeği USB ve bulutta.
- [ ] Her teknik seçim için "neden + alternatifi + neden o değil" üçlüsünü hatırla.

> **Unutma:** Jüri seni yakalamaya değil, projeni gerçekten anlayıp anlamadığını görmeye çalışır. Mantığını bildiğin sürece detayları akıcı anlatırsın. Başarılar! 🎯
