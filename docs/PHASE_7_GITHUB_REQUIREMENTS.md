# Phase 7: GitHub Entegrasyonu ve Webhook Otomasyonu - Gereksinim Analizi ve Kararlar

Bu doküman, CampusFlow'un 7. aşaması olan "GitHub Entegrasyonu" modülünün iş kurallarını (business logic) netleştirmek için hazırlanmıştır. Aşağıdaki kararlar kullanıcı geri bildirimleri doğrultusunda **kesinleştirilmiştir**.

---

## 1. Görev Takibi ve Kısa ID'ler (Short IDs)
- **KARAR:** Jira/Trello standartlarında kısa görev isimleri (Örn: `T-1`, `T-2`) kullanılacaktır.
- **KARAR:** Öğrenci kodunu kaydederken `git commit -m "Login hatası çözüldü (T-1)"` yazdığında, sistemin bu mesajı okuyup T-1 numaralı göreve kodu otomatik eklemesi mantığı **onaylanmıştır**.

## 2. GitHub Yetkilendirmesi (Authentication)
- **KARAR:** Sistemi daha kurumsal bir yapıya oturtmak adına **GitHub OAuth App** kurulması onaylanmıştır. Hoca/öğrenci "GitHub ile Bağlan" butonuna tıklayarak doğrudan uygulamaya yetki verecektir. Geliştirici ortamında `.env.local` dosyasına `GITHUB_CLIENT_ID` ve `GITHUB_CLIENT_SECRET` eklenecektir.

## 3. Localhost ve Webhook (Bildirim) Engeli
- **KARAR:** Geliştirme (localhost) aşamasında GitHub'dan gelen anlık Webhook bildirimlerini test edebilmek için sistemi internete açan `ngrok` (veya benzeri bir tünel) kullanılması **onaylanmıştır**.

## 4. Otomatik Durum Güncellemeleri (Kanban Otomasyonu)
- **KARAR:** Şu otomasyon kuralları geçerli olacaktır:
  - Öğrenci içinde `(T-1)` geçen bir **Pull Request (PR)** açarsa: Görev otomatik olarak `"Review" (İncelemede)` sütununa geçer.
  - Hoca veya lider o PR'ı onaylayıp **Merge (Birleştirme)** yaparsa: Görev otomatik olarak `"Done" (Tamamlandı)` sütununa geçer.
- **KARAR (Önemli):** Sadece commit atıldığında (PR açılmadan) görev **sütun değiştirmeyecektir**. Geliştiricilerin yarım kalan (WIP) kodları da commit atabilmesi için, normal commitler sadece AI raporlaması amacıyla arka planda loglanıp görevin detay sayfasına eklenecektir. Görevin statü (durum) değiştirmesi sadece PR operasyonlarına bağlanmıştır.
