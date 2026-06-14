# CampusFlow V2 Güncelleme ve İyileştirme Planı

Bu doküman, sistemin UAT aşamasında alınan notlar sonucunda yapılacak olan güncellemelerin detaylarını içerir.

## 1. Admin Paneli (Eğitmen Yönetimi)
- [x] Okul admini ekranında (Kullanıcılar) eğitmenlerin hesaplarını askıya almak (suspend) veya aktif etmek için buton/toggle eklenecektir.
- [x] Askıya alınan eğitmenlerin sisteme girişi tamamen engellenecektir (Giriş katmanında çözüldü).

## 2. Eğitmen Paneli (Öğrenci Yönetimi ve Toplu İşlemler)
- [x] **Manuel Ekleme:** Eğitmenin öğrenci sekmesinden CSV haricinde öğrenci numarası/email ile tek tek öğrenci ekleyebileceği bir form eklenecektir.
- [x] **Öğrenci Çıkarma:** Eklenen öğrenciyi dersten çıkarma butonu aktif edilecek, çıkarılan öğrencinin takımla ilişiği otomatik kesilecektir.
- [x] **Toplu Seçim:** "Toplu İşlem" butonu ile seçili öğrencileri dersten çıkarma fonksiyonu eklenecektir.
- [x] Dersten çıkarılan öğrencilerin ilgili takımlardan da (task_members vb.) temizlendiğinden emin olunacaktır.

## 3. Takım Yönetimi (UI State)
- [x] Eğitmen veya öğrenci manuel takım oluşturduğunda, sayfanın F5 atılmadan yenilenmesi (router.refresh() veya state update) sağlanacaktır.

## 4. Sprint & Kanban Kuralları
- [x] **AI Rapor Butonu:** Sadece sprint durumu "Tamamlandı" (completed) ise aktif olacaktır.
- [x] **Sprint Tamamlama Yetkisi:** Takım liderleri veya eğitmenler aktif sprinti tamamlayabilecektir.
- [x] **Tek Aktif Sprint:** Bir sprint başlatılırken sistemde başka "aktif" sprint varsa engellenecek ve önce eskisinin kapatılması istenecektir.
- [x] **Salt Okunur Mod:** Tamamlanan sprintler tamamen salt okunur (read-only) olacak; görev ekleme, silme veya sürükleme işlemleri yapılamayacaktır.

## 5. Kritik Uç Durumlar (Edge Cases)
- [x] **Ders Silme İşlemi:** Eğitmenin bir dersi silmesi durumunda, o derse ait tüm takımların, sprintlerin, görevlerin ve raporların veritabanından tamamen (hard-delete) silinmesi sağlanacaktır.
- [x] **Ders Arşivleme İşlemi:** Dönem sonu için ders arşivleme özelliği eklenecektir. Arşivlenmiş derslerde öğrenciler/eğitmen değişiklik yapamayacak (salt okunur), ders "Arşivlenen Dersler" sekmesinde listelenecektir.

## 6. Öğrenci Paneli Temizliği
- [x] Öğrencinin "Derslerim -> Proje Bilgileri" sekmesinde yer alan eski ve kullanılmayan "GitHub Bağlantısı" butonu/arayüzü tamamen kaldırılacaktır (Zaten yeni sistemde takım kartından bağlanıyor).
