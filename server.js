const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verification of transporter
transporter.verify((error, success) => {
    if (error) {
        console.log('Error connecting to email service:', error);
    } else {
        console.log('Server is ready to send emails');
    }
});

// Contact Route
app.post('/api/contact', (value, res) => {
    const { name, email, subject, message } = value.body;

    const mailOptions = {
        from: `"${name}" <${email}>`,
        to: process.env.EMAIL_USER, // Send to yourself
        subject: `Portfolio Contact: ${subject}`,
        text: `You have a new message from your portfolio:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #6366f1; border-radius: 10px;">
                <h2 style="color: #6366f1;">New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <hr style="border: 0; border-top: 1px solid #334155;">
                <p style="white-space: pre-wrap;">${message}</p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ success: false, message: 'Failed to send message.' });
        }
        console.log('Email sent: ' + info.response);
        res.status(200).json({ success: true, message: 'Message sent successfully!' });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
