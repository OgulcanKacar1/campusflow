# V3: UI/UX Tasarım ve Mimari Revizyonu

Bu doküman, CampusFlow'un V3 versiyonunda yapılacak olan köklü arayüz (UI) ve deneyim (UX) iyileştirmelerini tanımlar. Sistemin mevcut jenerik renklerinden kurtulup, modüler ve kurumsal bir "Koyu Tema" kimliğine geçişini sağlayacaktır.

## 1. Tasarım Kararları Özeti
- **Tema Modu:** Sadece Koyu Tema (Dark Mode).
- **Arka Plan Hissiyatı:** Simsiyah (Pitch Black - `#000000`). Kartlar ve modallar için çok hafif derinlik katan tonlar (`#0a0a0a`, `#111111`).
- **Renk Zenginliği:** Proje sadece siyah ve turuncudan ibaret olmayacak. Muted (soluk gri), Accent (vurgu), Secondary (ikincil), Success (yeşil), Destructive (kırmızı) ve Warning (sarı) renkleri uyumlu tonlarda palete dahil edilecek.
- **Ana Vurgu Rengi (Primary):** Kiremit Turuncu (Volcanic Terracotta - Örn: `#ea580c` tonları).
- **Cam Efekti (Glassmorphism):** Genel kullanımdan kaldırıldı. Sadece çok özel durumlarda (bildirim, dropdown vb.) uygulanacak.
- **Köşe Yumuşaklığı (Border Radius):** Hafif yumuşatılmış, modern standart (`rounded-md` 6px veya `rounded-lg` 8px).
- **Tipografi:** Okunabilirliği yüksek sistem fontları (Inter, sistem varsayılanları).

## 2. SOLID Renk Mimarisi (CSS Variables)
Tailwind CSS yapısı, tamamen CSS Değişkenleri üzerinden çalışacak şekilde yeniden yapılandırılacak. `globals.css` içinde tüm semantic (anlamsal) renkler tanımlanacak:
- `background` ve `foreground`
- `card` ve `popover`
- `primary`, `secondary`, `accent` ve `muted`
- `border`, `input`, `ring`
- Durum renkleri: `success`, `destructive`, `warning`

## 3. Uygulama Adımları (Execution Plan)
- [x] **1. Mimari Kurulum:** `globals.css` ve `tailwind.config.ts` dosyalarının yeni HSL variable mimarisine göre güncellenmesi. (Kiremit Turuncu ve Simsiyah Tema entegre edildi).
- [x] **2. Core Bileşen Güncellemesi:** Tüm UI bileşenlerinin (Button, Card, Input, Dialog, Select vb.) yeni anlamsal değişkenlerle ve border-radius ayarlarıyla uyumlu hale getirilmesi.
- [x] **3. Hardcoded Renk Temizliği (Öğrenci Paneli):** Öğrenci sayfalarındaki `bg-slate-900`, `text-blue-500` gibi sabit renklerin temizlenip `bg-background`, `text-primary` gibi değişkenlere bağlanması.
- [x] **4. Hardcoded Renk Temizliği (Eğitmen Paneli):** Eğitmen sayfaları ve Kanban board üzerindeki sabit renklerin silinmesi.
- [x] **5. Layout Optimizasyonu:** Sidebar, Header ve sayfa iskeletinin siyah zemin ve turuncu vurgu dinamiklerine göre optimize edilmesi.
- [x] **6. Son Kontroller ve Test:** Tema geçişinin tüm sistemde zıtlık (contrast) oranlarına ve görsel bütünlüğe uyduğunun doğrulanması.

## 4. Doğrulama (Verification)
- Yeni tema renkleri sisteme eklendiğinde tüm ekranların sorunsuz bir şekilde bu paletten beslendiği test edilecek.
- Tema değişikliği tek noktadan yapılabilecek esnekliğe ulaşmış olacak.
