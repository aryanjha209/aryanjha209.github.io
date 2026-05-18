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
app.post('/api/contact', (req, res) => {
    console.log('Received contact form request:', req.body);
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
        console.log('Missing form fields');
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

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

    console.log('Attempting to send mail...');
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Nodemailer Error:', error);
            return res.status(500).json({ success: false, message: 'Internal Server Error. ' + error.message });
        }
        console.log('Email sent successfully:', info.response);
        res.status(200).json({ success: true, message: 'Message sent successfully!' });
    });
});

// AI Chat Route using Pollinations AI
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ success: false, message: 'Message is required' });
    }

    try {
        // We prompt the AI to act as Aryan's assistant
        const prompt = `You are an AI assistant for Aryan Kumar's portfolio website. Answer the user's question concisely. User says: ${message}`;
        const url = `https://text.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
        
        // Use native fetch (available in Node 18+)
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch from Pollinations API');
        }
        
        const reply = await response.text();
        res.status(200).json({ success: true, reply });
    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ success: false, message: 'Error communicating with AI service.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
