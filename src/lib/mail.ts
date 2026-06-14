import nodemailer from 'nodemailer';

interface SendEmailProps {
  to: string | string[];
  subject: string;
  html: string;
}

// Nodemailer transporter oluştur
// process.env.GMAIL_USER ve process.env.GMAIL_APP_PASSWORD ortam değişkenlerinden çekilir.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail({ to, subject, html }: SendEmailProps) {
  // Eğer ortam değişkenleri girilmemişse sistemi patlatmadan simüle et (console'a yaz)
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('GMAIL_USER veya GMAIL_APP_PASSWORD bulunamadı. E-posta gönderimi simüle edildi:', { to, subject });
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"CampusFlow" <${process.env.GMAIL_USER}>`, // Gönderen olarak senin Gmail'in görünür
      to,
      subject,
      html,
    });

    return { success: true, data: info };
  } catch (error) {
    console.error('E-posta gönderme hatası (Nodemailer):', error);
    return { success: false, error };
  }
}
