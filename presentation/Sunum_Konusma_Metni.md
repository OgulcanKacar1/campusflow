# CampusFlow — Ekran Ekran Tam Konuşma Metni (Canlı Demo)

> Bu metin, sunumun başından sonuna kadar **kesintisiz konuşacağın** sözleri içerir.
> `[ ]` = ne yapacağın. Düz metin = söyleyeceklerin. Doğal konuş; birebir okuma, akışı takip et.
> Toplam ~12-15 dk. Her ekranda 2-4 saniye dur ki jüri ekranı görsün.

---

# BÖLÜM A — GİRİŞ KONUŞMASI (ekran yok / kapak slaytı)

[ Kapak açık dururken: ]

> Merhaba, hepinize hoş geldiniz diyorum. Ben Oğulcan Kacar. Işık Üniversitesi Yönetim Bilişim Sistemleri bölümü öğrencisiyim ve bugün bitirme projem olan **CampusFlow**'u sizlere sunacağım. Danışmanım Sayın Dr. Şahin Aydın.

> CampusFlow'u tek bir cümleyle tanımlamak istersem: üniversitelerdeki grup projelerini, fikirden teslime — yani **koddan nota** — tek ve adil bir akışta yöneten, yapay zekâ destekli, çevik bir akademik proje yönetim platformudur.

> Sunumumda önce çözmeye çalıştığım problemi anlatacağım. Ardından sistemi **canlı olarak**, dört farklı kullanıcı rolüyle baştan sona göstereceğim. En sonunda da bunu hangi teknolojilerle, neden o şekilde geliştirdiğimi özetleyeceğim.

---

# BÖLÜM B — PROBLEM (ekran yok / kapak)

> İzninizle önce şu soruyu soralım: üniversitede bir grup projesi nasıl değerlendirilir? Bugün çoğunlukla şöyle oluyor: öğrenciler bütün dönem çalışıyor, ama değerlendirme dönemin sonunda yüklenen **tek bir dosya** üzerinden yapılıyor. Ve genellikle tüm ekip aynı notu alıyor.

> Bunun iki ciddi sonucu var. Birincisi: ekip içinde kimin gerçekten ne kadar emek verdiği **görünmüyor**. Bir öğrenci işin tamamını yaparken, hiç katkı vermeyen biri de aynı notu alabiliyor. Literatürde buna **"serbest binici" — yani free-rider — problemi** deniyor. Bu hem adaletsiz hem de motivasyonu kırıyor.

> İkinci sorun: öğrenciler, bütün yazılım sektörünün üzerine kurulu olduğu **çevik takım çalışması** disiplinlerini — sprint planlaması, görev yönetimi, sürüm kontrolü gibi — hiç deneyimlemeden mezun oluyor.

> Peki mevcut araçlar bunu çözmüyor mu? Tam olarak çözmüyor. Moodle gibi öğrenme yönetim sistemleri içerik ve dosya teslimi için tasarlanmış, süreç görünmüyor. Jira veya Trello gibi araçlar çok güçlü ama akademik değil, çok kiracılı değil ve otomatik bir değerlendirme yapmıyor. İşte CampusFlow, bu iki dünyayı birleştiriyor: **akademik yapı + çevik süreç + yapay zekâ ile adil değerlendirme.**

> Şimdi sistemin nasıl çalıştığını canlı olarak göstereyim.

---

# BÖLÜM C — CANLI DEMO

## C1 — ANA SAYFA (Landing)
[ Ana sayfayı aç, yavaşça aşağı kaydır. ]

> Karşınızda CampusFlow'un giriş sayfası. Gördüğünüz gibi tamamen koyu temalı, sade ve modern bir arayüz tasarladım; marka rengim olan kiremit turuncusunu vurgu olarak kullandım.

> Sayfayı biraz aşağı kaydırıyorum; burada platformun ne yaptığını, temel özelliklerini ve akışını tanıtan bölümler var. Şimdi sisteme giriş yapalım.

## C2 — GİRİŞ EKRANI (Login)
[ Giriş ekranını aç. ]

> Bu giriş ve kayıt ekranı. Kimlik doğrulamayı baştan güvenli kurguladım: sisteme yalnızca **.edu.tr uzantılı** üniversite e-postalarıyla kayıt olunabiliyor. Ayrıca e-postanın ait olduğu alan adının, sistemde tanımlı bir üniversiteye karşılık gelmesi gerekiyor; yoksa kayıt kabul edilmiyor. Yani rastgele kişiler giremiyor ve herkes otomatik olarak doğru kuruma yerleşiyor.

[ Giriş yap. ]

> Şimdi giriş yapıyorum. Burada önemli bir tasarım var: sistem **dört farklı rol** tanıyor ve giriş yapan kullanıcı, rolüne göre **otomatik olarak** kendi paneline yönlendiriliyor. Bu yönlendirmeyi, her istekte çalışan bir ara katman — middleware — yapıyor. Şimdi en üst yetkiden başlayarak rolleri tek tek gezeceğiz.

## C3 — SÜPER ADMİN: Genel Bakış
[ Süper admin dashboard. ]

> Bu, süper admin paneli — sistemdeki en üst yetki. CampusFlow **çok kiracılı**, yani tek bir platform birden fazla üniversiteyi barındırıyor. Süper admin de bütün bu üniversiteleri tek merkezden yönetiyor.

> Bu genel bakış ekranındaki kartlar ve grafikler; sistemdeki toplam üniversite, kullanıcı ve ders sayısını anlık olarak özetliyor. Yani platformun tamamına kuşbakışı bir kontrol sağlıyor.

## C4 — SÜPER ADMİN: Üniversiteler
[ Organizations / Üniversiteler sayfası. ]

> Burası üniversiteler sayfası. Süper admin buradan yeni bir üniversite ekliyor, mevcutları düzenliyor. Her üniversite sisteme eklendiğinde, o kuruma ait kullanıcılar ve dersler tamamen kendi alanında, diğer kurumlardan **izole** şekilde tutuluyor.

## C5 — SÜPER ADMİN: Tüm Kullanıcılar
[ Users sayfası. ]

> Bu ekranda da sistemdeki tüm kullanıcılar görülüyor. Süper admin buradan bir kullanıcının rolünü değiştirebiliyor; örneğin bir kişiyi okul admini olarak atayabiliyor. Rol atamasının neden önemli olduğunu birazdan göreceğiz, çünkü her rol farklı şeyleri görme ve yapma yetkisine sahip.

## C6 — OKUL ADMİNİ: Genel Bakış
[ Okul admini hesabına geç, dashboard. ]

> Şimdi bir alt seviyeye, okul adminine geçiyorum. Her üniversitenin kendi okul admini var. Süper adminden farkı şu: okul admini **yalnızca kendi kurumunu** yönetebiliyor — başka bir üniversitenin tek bir verisini bile göremiyor.

> Bu izolasyon projemin en kritik güvenlik özelliği. Nasıl sağladığımı teknik bölümde detaylıca anlatacağım ama şimdiden söyleyeyim: bunu uygulama koduyla değil, doğrudan **veritabanı seviyesinde** zorunlu kıldım.

## C7 — OKUL ADMİNİ: Dersler ve Kullanıcılar
[ Admin → Dersler, sonra Kullanıcı yönetimi. ]

> Bu ekranda okul admini, kendi okulundaki **tüm dersleri** görüyor. Yan taraftaki kullanıcı yönetiminden de okulun öğretim üyelerini ve öğrencilerini yönetiyor; örneğin bir öğretim üyesinin hesabını onaylıyor ya da askıya alıyor. Yani okul admini, kurumun operasyonel yöneticisi.

## C8 — EĞİTMEN: Genel Bakış (sistemin kalbi)
[ Eğitmen hesabına geç, dashboard. ]

> Ve şimdi platformun kalbine geliyoruz: eğitmen paneli. Asıl değerin üretildiği yer burası.

> Eğitmen bu genel bakış ekranında aktif derslerini, toplam öğrenci sayısını ve takımlarının durumunu tek bakışta görüyor. Şimdi bir dersin yaşam döngüsünü baştan sona göstereyim.

## C9 — EĞİTMEN: Ders Oluşturma ve Katılım Kodu
[ Derslerim → ders oluştur / mevcut dersi aç, katılım kodunu göster. ]

> Eğitmen önce dersini oluşturuyor: ders kodu, adı, dönem ve şube bilgisiyle. Ders oluşturulduğu anda sistem otomatik olarak **6 haneli benzersiz bir katılım kodu** üretiyor. Öğrenciler derse işte bu kodla katılıyor — birazdan öğrenci tarafında bunu canlı göreceğiz.

> Tek tek eklemek yerine, eğitmen bir **CSV dosyasıyla** öğrencileri toplu olarak da kaydedebiliyor. Yani 40 kişilik bir sınıfı saniyeler içinde sisteme alabiliyor.

## C10 — EĞİTMEN: Takım Yönetimi
[ Ders detayına gir, takımları göster. ]

> Ders içine girdiğimde takımları görüyorum. Eğitmen burada takımları oluşturuyor ve öğrencileri bu takımlara atıyor. Her takımın kendi projesi, kendi çalışma alanı ve birazdan göreceğimiz kendi Kanban panosu oluyor.

## C11 — EĞİTMEN: Kanban Panosu
[ Bir takımın Kanban panosunu aç. ]

> İşte projenin çevik tarafının kalbi: Kanban panosu. Görevler üç sütunda yönetiliyor: "Yapılacak", "Yapılıyor" ve "Tamamlandı". Görevler kişilere atanıyor ve sürükle-bırak ile sütunlar arasında taşınıyor.

> Burada öğrenciler tam olarak profesyonel bir yazılım ekibi gibi çalışıyor. Bu sürükle-bırak etkileşimini özel bir kütüphaneyle gerçekleştirdim ve kartın durumu değiştiğinde değişiklik anında sunucuya kaydediliyor.

## C12 — EĞİTMEN: Sprint Yönetimi
[ Sprint'leri / sprint oluşturmayı göster. ]

> Görevler tek başına değil, **sprint**'ler içinde organize ediliyor. Sprint, çevik yöntemde belirli bir zaman dilimini ve hedefini ifade eder. Eğitmen burada sprint açıyor, hedefini belirliyor, görevleri o sprint'e bağlıyor. Böylece proje, dönem boyunca ölçülebilir adımlara bölünmüş oluyor.

## C13 — EĞİTMEN: Görev Detayı ve GitHub
[ Bir göreve tıkla, detayını ve GitHub bağlantısını göster. ]

> Bir görevin detayına girdiğimde açıklamasını, kime atandığını ve — en önemlisi — o görevle ilişkili **GitHub aktivitelerini** görüyorum. Takımlar GitHub depolarını sisteme bağlıyor ve depoya bir commit atıldığında, GitHub bir **webhook** aracılığıyla benim sistemimi otomatik olarak haberdar ediyor. Ben de bu commit'i ilgili görevle eşleştiriyorum.

> Buna "sıfır-dosya" yaklaşımı diyorum: öğrenci değerlendirilmek için ekstra bir rapor ya da dosya yüklemiyor; sistem zaten yapılan **gerçek işi** dinliyor. Bu yüzden bu veri manipüle edilemez, gerçek katkıyı yansıtır.

## C14 — EĞİTMEN: Takvim
[ Takvim sayfasını aç, bir toplantı göster/oluştur. ]

> Eğitmenin bir de takvimi var. Toplantılar, sprint tarihleri ve teslim günleri burada planlanıyor. Bir toplantı oluşturduğumda ilgili takıma bildirim gidiyor. Yani süreç sadece kodla değil, iletişim ve planlamayla da bütünleşik.

## C15 — EĞİTMEN: Yapay Zekâ Raporu ⭐ (zirve — yavaşla)
[ Raporlar ekranına gel, önceden üretilmiş AI raporunu aç. ]

> Ve geldik projenin en özgün kısmına: yapay zekâ destekli değerlendirme. Eğitmen bir takım için rapor oluşturduğunda neler oluyor, adım adım anlatayım.

> Sistem o takımın **gerçek katkı verisini** topluyor: kim hangi göreve atanmış, görevler tamamlanmış mı, sprint hedeflerine ne kadar ulaşılmış, ve GitHub'a kim ne zaman commit atmış.

> Burada çok kritik bir detay var: sistem sadece "kaç commit atıldı" diye saymıyor. GitHub'ın API'sine giderek her commit'in **gerçek kod değişikliğini, yani diff'ini** çekiyor ve bunu yapay zekâya veriyor. Yani model, koddaki gerçek katkıyı görerek değerlendirme yapıyor — yüzeysel bir sayım değil.

> Bütün bu veriyi Google'ın Gemini modeline gönderiyorum ve karşılığında şunları alıyorum: takımın genel değerlendirmesi, güçlü yönleri, gelişime açık yönleri ve — en önemlisi — **her öğrenci için ayrı ayrı, gerekçeli bir not önerisi.** Gördüğünüz gibi her öğrencinin yanında bir puan ve o puanın neden verildiğini açıklayan bir geri bildirim var.

[ PDF dışa aktarmayı göster. ]

> Eğitmen bu raporu tek tıkla **PDF olarak** dışa aktarabiliyor; arşivlenebilir, resmi bir belge oluyor.

> Burada altını özellikle çizmek istediğim nokta şu — ve bu sorulacak en önemli soru: **yapay zekâ not vermiyor, yalnızca öneri sunuyor.** Nihai kararı her zaman eğitmen veriyor. Yapay zekâ burada, eğitmenin yükünü azaltan ve sübjektif akran anketlerinin yerine **objektif veriye dayalı, şeffaf** bir başlangıç noktası sunan bir asistan. İnsan her zaman kararın merkezinde.

## C16 — ÖĞRENCİ: Genel Bakış ve Derse Katılma
[ Öğrenci hesabına geç, dashboard, sonra katılım koduyla katılma. ]

> Şimdi madalyonun diğer yüzüne, öğrenci tarafına geçiyorum. Öğrenci deneyimini olabildiğince sade tuttum.

> Öğrenci panele girdiğinde kişisel bir karşılama ve istatistiklerini görüyor. Bir derse katılmak için, eğitmeninden aldığı **6 haneli katılım kodunu** giriyor ve derse anında ekleniyor. Az önce eğitmen tarafında üretilen kodun karşılığı tam olarak burası.

## C17 — ÖĞRENCİ: Derslerim ve Ders Detayı
[ Derslerim → bir derse gir → takım ve proje detayı. ]

> Öğrenci, kayıtlı olduğu tüm dersleri kart görünümünde görüyor. Bir derse girdiğinde takımını, takım arkadaşlarını ve projenin detaylarını görüntülüyor. Yani kendi sorumluluğunun ve ekibinin net bir resmine sahip oluyor.

## C18 — ÖĞRENCİ: Kanban ve Çalışma
[ Öğrencinin Kanban panosunu aç. ]

> Öğrencinin çalışmasının merkezinde yine Kanban panosu var. Öğrenci kendi görevlerini buradan yönetiyor: bir göreve başladığında "Yapılıyor"a, bitirdiğinde "Tamamlandı"ya sürüklüyor. Aktif sprint üzerinden de dönem hedeflerini adım adım takip ediyor.

> Ve hatırlayalım: öğrenci burada işini yaptıkça, GitHub'a commit attıkça, sistem bu gerçek katkıyı arka planda topluyor. Yani öğrenci ekstra hiçbir şey yapmadan, sadece işini yaparak değerlendirilmiş oluyor.

## C19 — ÖĞRENCİ: Takvim ve Bildirimler
[ Takvimi / bildirimleri kısaca göster. ]

> Son olarak öğrencinin de takvimi ve bildirimleri var; toplantıları, yaklaşan teslimleri buradan takip ediyor ve hiçbir gelişmeyi kaçırmıyor. Demo kısmı burada tamamlanıyor.

---

# BÖLÜM D — TEKNİK MİMARİ (kapanışa giriş)
[ Kapağa / mimari slaytına dön. ]

> Sistemi gördüğümüze göre, kısaca bunu **nasıl** ve **neden** o şekilde geliştirdiğime değineyim.

> Önyüz ve sunucu tarafı için **Next.js** ve **React** kullandım. Bunu seçtim çünkü tek bir projede hem kullanıcı arayüzünü hem de sunucu mantığını birlikte yazabiliyorum; ayrı bir backend kurmama gerek kalmadı.

> Veritabanı ve kimlik doğrulama için **Supabase** ve onun altındaki **PostgreSQL**'i kullandım. İlişkisel bir veritabanı seçtim çünkü verim son derece ilişkisel: kullanıcı, ders, takım, sprint, görev ve commit birbirine bağlı.

> Çok kiracılı izolasyonu nasıl sağladığımı sormuştum: her tabloya bir `organization_id` ekledim ve PostgreSQL'in **Row Level Security** özelliğiyle, "her kullanıcı yalnızca kendi kurumunun satırlarını görebilir" kuralını **doğrudan veritabanı katmanında** zorunlu kıldım. Bunun önemi şu: güvenlik uygulama koduna bırakılmadı. Bir geliştirici kodda bir filtreyi unutsa bile, veritabanı yetkisiz veriyi asla döndürmüyor.

> Yapay zekâ tarafında Google Gemini modelini, sağlayıcı bağımsız bir arayüz üzerinden kullandım ve modelin çıktısının her zaman aynı yapıda gelmesi için **şema doğrulaması** uyguladım. Böylece arayüz her seferinde tutarlı, güvenilir bir sonuç alıyor.

> Geliştirme sürecini de tezimin konusuyla tutarlı yürüttüm: çevik yöntemle, sürümlenmiş veritabanı göçleriyle ve kritik iş mantığı için yazdığım birim testleriyle.

---

# BÖLÜM E — SONUÇ VE KAPANIŞ

> Toparlarsam: CampusFlow, üniversite grup projelerini geleneksel dosya tesliminden kurtaran; öğrencilere gerçek çevik takım çalışması yetkinliği kazandıran; ve en önemlisi, değerlendirmeyi sübjektiflikten çıkarıp **veriye dayalı, şeffaf ve adil** hale getiren bütünleşik bir platformdur. "Serbest binici" sorununa, somut katkıyı görünür kılarak doğrudan bir çözüm sunuyor.

> Gelecek çalışmalarım arasında bir mobil uygulama, kod kalitesini de değerlendiren daha derin bir yapay zekâ analizi ve mevcut öğrenme yönetim sistemleriyle entegrasyon yer alıyor.

> Beni dinlediğiniz için çok teşekkür ederim. Sorularınızı memnuniyetle yanıtlamak isterim.

---

# EK — KRİZ ANI CÜMLELERİ
- Demo donarsa: "Bu kısmı, hazırladığım ekran görüntüsü üzerinden göstereyim." (akışı bozma)
- AI canlı gecikirse: "Süreyi almaması için bu raporu önceden üretmiştim, onu gösteriyorum."
- Bilmediğin soru: "Bu yönü bu kapsamda ele almadım; ancak yaklaşımım şöyle olurdu…" (asla uydurma)
- İnternet giderse: demo videosuna geç.
