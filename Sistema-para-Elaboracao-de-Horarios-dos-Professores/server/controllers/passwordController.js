import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import db from "../models/index.js";
import dotenv from 'dotenv';
dotenv.config()


const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export const PasswordController = {
    async forgotPassword(req, res) {
        const { email } = req.body;
        console.log("Email recebido:", email);

        try {
            const user = await db.User.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ message: "E-mail não encontrado." });
            }

            const expires = Date.now() + 3600000;
            const encodedEmail = encodeURIComponent(
                Buffer.from(email).toString("base64")
            );
            const passwordResetLink = `http://localhost:3000/resetPassword/${encodedEmail}/${expires}`;

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: "SisGeha - Redefinição de Senha",
                html: `
        <p>Olá, ${user.username || "Usuário"},</p>
        <p>Você solicitou a redefinição de sua senha no Sistema de Gerênciamento de Horários Acadêmicos (SisGeha). Clique no link abaixo para criar uma nova senha. Este link é válido por 1 hora:</p>
        <p><a href="${passwordResetLink}">Redefinir Senha</a></p>
        <p>Se você não solicitou essa alteração, por favor, ignore este e-mail ou entre em contato com o suporte do SisGeha.</p>
        <p>Atenciosamente,<br>Equipe SisGeha</p>
      `,
            };

            await transporter.sendMail(mailOptions);
            return res
                .status(200)
                .json({ message: "E-mail de recuperação enviado com sucesso!" });
        } catch (error) {
            console.error("Erro no forgotPassword:", error);
            return res
                .status(500)
                .json({ message: "Erro ao solicitar recuperação de senha!" });
        }
    },

    async resetPassword(req, res) {
        try {
            const { encodedEmail, expires } = req.body;
            if (!encodedEmail) {
                return res.status(400).json({ error: "E-mail não fornecido na URL." });
            }
            const email = Buffer.from(encodedEmail, "base64").toString("utf-8");
            if (!email) {
                return res.status(400).json({ error: "E-mail inválido." });
            }

            if (Date.now() > parseInt(expires)) {
                return res.status(400).json({ error: "Link de redefinição expirado." });
            }

            const { password } = req.body;
            if (!password) {
                return res
                    .status(400)
                    .json({ error: "Nova senha é obrigatória." });
            }

            const user = await db.User.findOne({
                where: {
                    email: email,
                },
            });

            if (!user) {
                return res.status(404).json({ error: "Usuário não encontrado." });
            }

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            await user.update({
                password: hashedPassword,
            });

            return res.status(200).json({ message: "Senha atualizada com sucesso!" });
        } catch (error) {
            console.error("Erro ao redefinir senha:", error);
            return res.status(500).json({ error: "Erro interno no servidor." });
        }
    }
}

