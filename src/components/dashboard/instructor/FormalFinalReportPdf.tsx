import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Türkçe karakter desteği için font kaydediyoruz
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf', fontWeight: 'normal', fontStyle: 'italic' }
  ]
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Roboto', fontSize: 11, color: '#333' },
  header: { borderBottomWidth: 2, borderBottomColor: '#000', borderBottomStyle: 'solid', paddingBottom: 10, marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
  subtitle: { fontSize: 10, color: '#555', marginBottom: 3 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#ccc', borderBottomStyle: 'solid', paddingBottom: 3, marginBottom: 10 },
  text: { lineHeight: 1.5, textAlign: 'justify' },
  scoreBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  scoreLabel: { fontSize: 12, fontWeight: 'bold', marginRight: 5 },
  scoreValue: { fontSize: 16, fontWeight: 'bold', padding: 4, borderWidth: 1, borderColor: '#000', borderStyle: 'solid', borderRadius: 2 },
  studentBox: { padding: 10, borderWidth: 1, borderColor: '#ddd', borderStyle: 'solid', borderRadius: 4, marginBottom: 10 },
  studentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  studentName: { fontSize: 12, fontWeight: 'bold' },
  studentScore: { fontSize: 12, fontWeight: 'bold', padding: 3, backgroundColor: '#f0f0f0', borderRadius: 2 },
  list: { paddingLeft: 10, marginTop: 5 },
  listItem: { marginBottom: 4, flexDirection: 'row' },
  bullet: { width: 10 },
  footer: { marginTop: 30, borderTopWidth: 2, borderTopColor: '#000', borderTopStyle: 'solid', paddingTop: 10, textAlign: 'center' },
  disclaimer: { fontSize: 8, fontStyle: 'italic', color: '#666', lineHeight: 1.4 }
});

interface Props {
  report: {
    overallScore: number;
    executiveSummary: string;
    technicalEvaluation: string;
    strengths: string[];
    weaknesses: string[];
    studentPerformances: { studentId: string; name: string; score: number; feedback: string }[];
  };
  courseCode?: string;
  teamName?: string;
}

export const FormalFinalReportDocument = ({ report, courseCode, teamName }: Props) => {
  const today = new Date().toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <Page style={styles.page} size="A4">
        <View style={styles.header}>
          <Text style={styles.title}>Yapay Zeka Destekli Dönem Sonu Raporu</Text>
          <Text style={styles.subtitle}>
            {courseCode ? `Ders: ${courseCode} | ` : ''}
            {teamName ? `Takım: ${teamName}` : ''}
          </Text>
          <Text style={styles.subtitle}>Tarih: {today}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Genel Değerlendirme Özeti</Text>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Final Takım Notu:</Text>
            <Text style={styles.scoreValue}>{report.overallScore}/100</Text>
          </View>
          <Text style={styles.text}>{report.executiveSummary}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Teknik Değerlendirme</Text>
          <Text style={styles.text}>{report.technicalEvaluation}</Text>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>3. Güçlü Yönler ve Gelişim Alanları</Text>
          
          <Text style={{ fontWeight: 'bold', marginBottom: 5, marginTop: 5 }}>Güçlü Yönler:</Text>
          <View style={styles.list}>
            {report.strengths?.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.text}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={{ fontWeight: 'bold', marginBottom: 5, marginTop: 10 }}>Gelişim Alanları:</Text>
          <View style={styles.list}>
            {report.weaknesses?.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.text}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Öğrenci Final Notları ve Bireysel Geri Bildirimler</Text>
          {report.studentPerformances?.map((student, idx) => (
            <View key={idx} style={styles.studentBox} wrap={false}>
              <View style={styles.studentHeader}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentScore}>Önerilen Not: {student.score}/100</Text>
              </View>
              <Text style={styles.text}>{student.feedback}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} wrap={false}>
          <Text style={styles.disclaimer}>
            Yasal Uyarı: Bu belge CampusFlow sistemine entegre Yapay Zeka tarafından oluşturulmuş dönem sonu analiz raporudur. 
            Burada yer alan performans puanları ve özetler tüm dönem boyunca sisteme girilen (Görevler, Git Commitleri, Dökümanlar, Toplantılar) verilere dayalı tahminlerden oluşur. 
            Nihai bir akademik not teşkil etmez, karar tamamen dersin eğitmenine aittir.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
