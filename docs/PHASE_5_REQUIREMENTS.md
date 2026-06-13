# Phase 5: Notlandırma ve Değerlendirme (Grade Suggestions) - Gereksinim Analizi

Bu doküman, CampusFlow'un 5. aşaması olan "Öğrenci Değerlendirme ve Notlandırma" modülünün iş kurallarını (business logic) netleştirmek için hazırlanmıştır. Geliştirmeye başlamadan önce aşağıdaki senaryoların netleşmesi gerekmektedir.

Lütfen aşağıdaki soruları inceleyip takımınızın/akademik sürecinizin ihtiyaçlarına göre yanıtlayın.

---

## 1. Değerlendirme Sıklığı ve Kapsamı
Şu anki veritabanı yapısında her öğrencinin ders/takım başına tek bir `effort_score` (efor skoru) alabileceği bir yapı var.
- **Soru 1.A:** Hoca öğrencileri **her sprint bitiminde ayrı ayrı** mı notlandıracak, yoksa **dönem sonunda tek bir defa** mı değerlendirecek?
- **Soru 1.B:** Eğer her sprint için ayrı not verilecekse, dönem sonu notu bu sprint notlarının ortalaması mı olacak, yoksa son bir nihai değerlendirme daha yapılacak mı?

## 2. Efor Skoru (Effort Score) Formülü
Sistem, öğrencinin yaptığı görevlere bakarak otomatik bir efor puanı hesaplayacak.
- **Soru 2.A (Ağırlıklar):** Görev öncelikleri (Düşük, Orta, Yüksek, Kritik) için 1, 2, 3 ve 4 puanlık doğrusal bir katsayı uygun mudur?
- **Soru 2.B (Çoklu Atama):** Eğer bir göreve 3 öğrenci birden atanmışsa ve görev tamamlanmışsa, bu görevin puanı 3'e mi bölünmeli (eşit dağılım), yoksa 3 öğrenciye de görevin tam puanı mı verilmeli?
- **Soru 2.C (Zamanlama):** Zamanında teslim edilen görevlere "Zamanında Teslim Bonusu" (+10 puan) vermeyi planlıyoruz. Peki, sprint süresi bittikten sonra teslim edilen (geciken) görevler için sistem ceza puanı (Örn: %50 kesinti) uygulasın mı?

## 3. Akran Değerlendirmesi (Peer Review)
Kurumsal veya akademik çevik (agile) süreçlerde takım üyelerinin birbirini değerlendirmesi sıklıkla istenir.
- **Soru 3.A:** Öğrencilerin takım arkadaşlarını (Örn: 1-5 yıldız arası veya gizli yorumlarla) değerlendirebileceği bir "Akran Değerlendirmesi" modülü bu faza dahil edilecek mi? Yoksa notlandırma sadece Sistem + Hoca ekseninde mi kalacak?

## 4. Nihai Not ve Görünürlük
Hoca sistemin veya AI'ın önerdiği efor skorunu görecek ve kendi nihai notunu verecek.
- **Soru 4.A:** Nihai not 0-100 arası sayısal bir değer mi olmalı, yoksa harf notu (AA, BA vb.) sistemi mi kullanılacak?
- **Soru 4.B (Görünürlük):** Hoca bir öğrencinin notunu girip kaydettiğinde, öğrenci bunu anında görebilsin mi? Yoksa hocanın tüm takımı değerlendirdikten sonra "Notları Öğrencilere Aç (Publish)" diyeceği manuel bir buton mu yapalım?

## 5. AI (Yapay Zeka) Asistanının Rolü
Planda OpenAI entegrasyonu (GPT-4o-mini) geçiyor.
- **Soru 5.A:** Yapay zeka sadece istatistiklere (metriklere) bakıp "Ahmet görevlerin %80'ini vaktinde yapmış, başarılı" gibi bir **metin özeti** mi sunsun? Yoksa görevlerin "Geliştirici Notları (Developer Notes)" ve başlıklarını da okuyup, kodun/görevin *zorluğu* hakkında da inisiyatif alarak doğrudan bir puan düşürsün/yükseltsin mi?
