import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sendPasswordResetEmail = async (to, userId) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const resetLink = `http://localhost:3001/reset-password/${userId}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Recuperação de Senha - Gestão de Horários',
      html: `
        <h2>Redefinição de Senha</h2>
        <p>Você solicitou a redefinição da sua senha. Clique no link abaixo:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Se você não solicitou isso, ignore este e-mail.</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`E-mail de recuperação enviado para ${to}`);
    return info;
  } catch (error) {
    console.error('Erro ao enviar e-mail de recuperação de senha:', error);
    throw error;
  }
};

export default sendPasswordResetEmail;
