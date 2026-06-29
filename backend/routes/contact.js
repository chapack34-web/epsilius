const router = require('express').Router();
const nodemailer = require('nodemailer');

router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Completá todos los campos' });

    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"EPSILIUS Contacto" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `[EPSILIUS] ${subject || 'Nuevo mensaje'} - de ${name}`,
      html: `
        <h2>Nuevo mensaje desde EPSILIUS</h2>
        <p><b>Nombre:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Asunto:</b> ${subject}</p>
        <hr>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    });

    res.json({ ok: true, message: 'Mensaje enviado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar el mensaje. Revisá la config de email en .env' });
  }
});

module.exports = router;
