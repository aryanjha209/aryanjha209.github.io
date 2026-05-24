const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Database Helper
const dbPath = path.join(__dirname, 'backend', 'data', 'analytics.json');

function loadDb() {
    try {
        if (fs.existsSync(dbPath)) {
            const data = fs.readFileSync(dbPath, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Error reading database:", e);
    }
    return { totalVisits: 0, uniqueIPs: [], subscribers: [], visits: [] };
}

function saveDb(data) {
    try {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error("Error saving database:", e);
        return false;
    }
}

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Track Visit Endpoint
app.post('/api/visit', (req, res) => {
    try {
        const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const timestamp = new Date().toISOString();

        const db = loadDb();
        db.totalVisits = (db.totalVisits || 0) + 1;

        if (!db.uniqueIPs) db.uniqueIPs = [];
        if (!db.uniqueIPs.includes(ip)) {
            db.uniqueIPs.push(ip);
        }

        if (!db.visits) db.visits = [];
        let existingVisit = db.visits.find(v => v.ip === ip);
        if (existingVisit) {
            existingVisit.count = (existingVisit.count || 1) + 1;
            existingVisit.lastVisit = timestamp;
            existingVisit.userAgent = userAgent;
        } else {
            db.visits.push({
                ip,
                firstVisit: timestamp,
                lastVisit: timestamp,
                userAgent,
                count: 1
            });
        }
        
        saveDb(db);
        res.status(200).json({ success: true, message: 'Visit tracked successfully' });
    } catch (error) {
        console.error('Visit tracking error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Subscribe Endpoint with "Thanks" Email Sender
app.post('/api/subscribe', (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
        }

        const db = loadDb();
        if (!db.subscribers) db.subscribers = [];

        const normalizedEmail = email.trim().toLowerCase();
        const existing = db.subscribers.find(s => s.email.toLowerCase() === normalizedEmail);
        
        if (existing) {
            return res.status(200).json({ success: true, message: 'You are already subscribed!' });
        }

        // Save subscriber to JSON DB
        db.subscribers.push({
            email: email.trim(),
            date: new Date().toISOString()
        });
        saveDb(db);

        // Attempt to send "Thanks" Mail asynchronously
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const mailOptions = {
                from: `"Aryan Jha Portfolio" <${process.env.EMAIL_USER}>`,
                to: email.trim(),
                subject: "Thanks for subscribing! ⚡ Aryan Jha",
                html: `
                <div style="font-family: 'Outfit', -apple-system, BlinkMacSystemFont, Arial, sans-serif; max-width: 550px; margin: 20px auto; background-color: #020215; border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(168, 85, 247, 0.05); color: #ffffff;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #6b21a8 0%, #a855f7 100%); padding: 35px 20px; text-align: center;">
                        <span style="font-size: 40px; display: inline-block; filter: drop-shadow(0 0 10px rgba(255,255,255,0.3));">⚡</span>
                        <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Aryan Jha</h1>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px 30px; text-align: center;">
                        <h2 style="font-size: 22px; font-weight: 800; margin-top: 0; margin-bottom: 15px; color: #ffffff;">You're on the list!</h2>
                        <p style="font-size: 15px; line-height: 1.6; color: #94a3b8; margin-bottom: 25px;">
                            Thank you for subscribing to my newsletter. You will receive exclusive updates about new AI solutions, PWA web apps, and Snapchat AR magic!
                        </p>
                        
                        <div style="background-color: rgba(168, 85, 247, 0.1); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.2); padding: 8px 18px; border-radius: 50px; font-size: 13px; font-weight: 700; display: inline-block; letter-spacing: 1px;">
                            STATUS: SUBSCRIBED ⚡
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background-color: #080721; padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); font-size: 12px; color: #64748b;">
                        <p style="margin: 0;">© 2026 Aryan Jha. All rights reserved.</p>
                    </div>
                </div>
                `
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error("Nodemailer subscription email error:", err);
                } else {
                    console.log("Subscription email sent successfully:", info.response);
                }
            });
        }

        res.status(200).json({ success: true, message: 'Thank you for subscribing!' });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Contact Form Endpoint (/api/send-email)
app.post('/api/send-email', (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Please provide name, email, and message.' });
        }

        const db = loadDb();
        if (!db.messages) db.messages = [];

        const newMessage = {
            name: name.trim(),
            email: email.trim(),
            message: message.trim(),
            date: new Date().toISOString()
        };

        db.messages.push(newMessage);
        saveDb(db);

        // Nodemailer Delivery
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const mailOptions = {
                from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
                to: process.env.ADMIN_EMAIL || 'aryankjhaa@gmail.com',
                subject: `New Portfolio Message from ${name}`,
                html: `
                <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 20px auto; background-color: #020215; border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 20px; overflow: hidden; color: #ffffff; box-shadow: 0 10px 30px rgba(0, 212, 255, 0.05);">
                    <div style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 30px 20px; text-align: center;">
                        <h2 style="margin: 0; color: #ffffff; font-weight: 800; font-size: 24px;">New Contact Message</h2>
                    </div>
                    <div style="padding: 30px 25px;">
                        <p style="margin-top:0;"><strong>Sender Name:</strong> ${name}</p>
                        <p><strong>Sender Email:</strong> <a href="mailto:${email}" style="color:#06b6d4;">${email}</a></p>
                        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                        <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 20px 0;">
                        <p style="white-space: pre-wrap; line-height: 1.6; color: #cbd5e1; background: rgba(255,255,255,0.02); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">${message}</p>
                    </div>
                </div>
                `
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) console.error("Email sending error:", err);
            });
        }

        res.status(200).json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Contact endpoint error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Book a Call Endpoint (/api/book-call)
app.post('/api/book-call', (req, res) => {
    try {
        const { name, email, date, time, topic, notes } = req.body;
        if (!name || !email || !date || !time || !topic) {
            return res.status(400).json({ success: false, message: 'Please provide name, email, date, time, and topic.' });
        }

        const db = loadDb();
        if (!db.bookings) db.bookings = [];

        const newBooking = {
            name: name.trim(),
            email: email.trim(),
            date,
            time,
            topic,
            notes: notes ? notes.trim() : '',
            dateBooked: new Date().toISOString()
        };

        db.bookings.push(newBooking);
        saveDb(db);

        // Nodemailer notification to Client and Admin
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            // Send email to admin
            const adminMail = {
                from: `"Portfolio Bookings" <${process.env.EMAIL_USER}>`,
                to: process.env.ADMIN_EMAIL || 'aryankjhaa@gmail.com',
                subject: `New Call Scheduled: ${name}`,
                html: `
                <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 20px auto; background-color: #020215; border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 20px; overflow: hidden; color: #ffffff;">
                    <div style="background: linear-gradient(135deg, #6b21a8 0%, #a855f7 100%); padding: 30px 20px; text-align: center;">
                        <h2 style="margin: 0; color: #ffffff; font-weight: 800; font-size: 24px;">New Call Scheduled</h2>
                    </div>
                    <div style="padding: 30px 25px;">
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Date & Time:</strong> ${date} at ${time}</p>
                        <p><strong>Topic:</strong> ${topic}</p>
                        <p><strong>Notes:</strong> ${notes || 'None'}</p>
                    </div>
                </div>
                `
            };

            // Send confirmation to Client
            const clientMail = {
                from: `"Aryan Jha" <${process.env.EMAIL_USER}>`,
                to: email.trim(),
                subject: `Confirmed: Call with Aryan Jha`,
                html: `
                <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 20px auto; background-color: #020215; border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 20px; overflow: hidden; color: #ffffff; text-align: center;">
                    <div style="background: linear-gradient(135deg, #6b21a8 0%, #a855f7 100%); padding: 35px 20px;">
                        <span style="font-size: 45px;">📅</span>
                        <h2 style="margin: 10px 0 0 0; color: #ffffff; font-weight: 800; font-size: 24px;">Call Confirmed!</h2>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h3 style="margin-top: 0; font-size: 20px; color: #ffffff;">Hi ${name},</h3>
                        <p style="color: #cbd5e1; line-height: 1.6; font-size: 15px;">Your virtual meeting with me has been successfully scheduled. I look forward to talking with you!</p>
                        
                        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 25px auto; max-width: 400px; text-align: left;">
                            <p style="margin: 0 0 8px 0; color: #94a3b8;"><strong>Topic:</strong> ${topic}</p>
                            <p style="margin: 0 0 8px 0; color: #94a3b8;"><strong>Date:</strong> ${date}</p>
                            <p style="margin: 0; color: #94a3b8;"><strong>Time:</strong> ${time}</p>
                        </div>
                    </div>
                    <div style="background-color: #080721; padding: 20px; font-size: 12px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05);">
                        <p style="margin: 0;">© 2026 Aryan Jha. All rights reserved.</p>
                    </div>
                </div>
                `
            };

            transporter.sendMail(adminMail, () => {});
            transporter.sendMail(clientMail, () => {});
        }

        res.status(200).json({ success: true, message: 'Call scheduled successfully!' });
    } catch (error) {
        console.error('Call booking endpoint error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Stats Visual Dashboard HTML (Redesigned with Premium Dark Theme)
app.get('/stats', (req, res) => {
    const db = loadDb();
    
    const sortedVisits = [...(db.visits || [])].sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
    const sortedSubscribers = [...(db.subscribers || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    const sortedMessages = [...(db.messages || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    const sortedBookings = [...(db.bookings || [])].sort((a, b) => new Date(b.dateBooked) - new Date(a.dateBooked));

    let subscriberRows = '';
    if (sortedSubscribers.length === 0) {
        subscriberRows = `<tr><td colspan="2" class="empty-state"><i class="fas fa-envelope-open"></i><p>No subscribers yet.</p></td></tr>`;
    } else {
        sortedSubscribers.forEach(s => {
            const dateStr = new Date(s.date).toLocaleString('en-US', { hour12: true });
            subscriberRows += `
                <tr>
                    <td><strong>${escapeHtml(s.email)}</strong></td>
                    <td>${dateStr}</td>
                </tr>
            `;
        });
    }

    let visitorRows = '';
    if (sortedVisits.length === 0) {
        visitorRows = `<tr><td colspan="4" class="empty-state"><i class="fas fa-users-slash"></i><p>No visits logged yet.</p></td></tr>`;
    } else {
        sortedVisits.forEach(v => {
            const dateStr = new Date(v.lastVisit).toLocaleString('en-US', { hour12: true });
            visitorRows += `
                <tr>
                    <td><code>${escapeHtml(v.ip)}</code></td>
                    <td><span class="badge badge-cyan">${v.count}</span></td>
                    <td>${dateStr}</td>
                    <td title="${escapeHtml(v.userAgent)}">${escapeHtml(truncate(v.userAgent, 40))}</td>
                </tr>
            `;
        });
    }

    let messageRows = '';
    if (sortedMessages.length === 0) {
        messageRows = `<tr><td colspan="4" class="empty-state"><i class="fas fa-comment-slash"></i><p>No messages received yet.</p></td></tr>`;
    } else {
        sortedMessages.forEach(m => {
            const dateStr = new Date(m.date).toLocaleString('en-US', { hour12: true });
            messageRows += `
                <tr>
                    <td><strong>${escapeHtml(m.name)}</strong><br><small style="color:#64748b;">${escapeHtml(m.email)}</small></td>
                    <td>${dateStr}</td>
                    <td style="max-width: 250px; white-space: pre-wrap; font-size:0.85rem; color:#cbd5e1;">${escapeHtml(m.message)}</td>
                </tr>
            `;
        });
    }

    let bookingRows = '';
    if (sortedBookings.length === 0) {
        bookingRows = `<tr><td colspan="5" class="empty-state"><i class="far fa-calendar-times"></i><p>No scheduled calls yet.</p></td></tr>`;
    } else {
        sortedBookings.forEach(b => {
            const dateStr = new Date(b.dateBooked).toLocaleString('en-US', { hour12: true });
            bookingRows += `
                <tr>
                    <td><strong>${escapeHtml(b.name)}</strong><br><small style="color:#64748b;">${escapeHtml(b.email)}</small></td>
                    <td><span class="badge badge-purple">${escapeHtml(b.date)}</span></td>
                    <td><code>${escapeHtml(b.time)}</code></td>
                    <td><strong>${escapeHtml(b.topic)}</strong></td>
                    <td style="max-width: 150px; font-size:0.85rem; color:#cbd5e1;">${escapeHtml(b.notes || 'None')}</td>
                </tr>
            `;
        });
    }

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Portfolio - Analytics Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            :root {
                --primary: #a855f7;
                --primary-glow: rgba(168, 85, 247, 0.15);
                --cyan: #06b6d4;
                --cyan-glow: rgba(6, 182, 212, 0.15);
                --bg: #020215;
                --card-bg: rgba(8, 7, 33, 0.85);
                --text: #ffffff;
                --text-dim: #94a3b8;
                --border: rgba(255, 255, 255, 0.05);
            }
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Outfit', sans-serif; }
            body { background-color: var(--bg); color: var(--text); line-height: 1.5; padding: 2rem 1rem; }
            .container { max-width: 1300px; margin: 0 auto; }
            
            header { 
                display: flex; 
                flex-direction: column;
                gap: 0.5rem;
                margin-bottom: 2.5rem; 
                border-bottom: 1px solid var(--border); 
                padding-bottom: 1.5rem; 
            }
            @media(min-width: 768px) {
                header {
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                }
            }
            h1 { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.5px; }
            h1 span { background: linear-gradient(135deg, var(--primary) 0%, var(--cyan) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            
            .refresh-btn {
                background: var(--card-bg);
                border: 1px solid var(--border);
                color: #fff;
                padding: 0.6rem 1.2rem;
                border-radius: 50px;
                cursor: pointer;
                font-weight: 600;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                transition: all 0.2s ease;
            }
            .refresh-btn:hover {
                border-color: var(--cyan);
                box-shadow: 0 0 15px var(--cyan-glow);
            }
            
            .badge { padding: 0.25rem 0.6rem; border-radius: 50px; font-size: 0.75rem; font-weight: 700; border: 1px solid transparent; }
            .badge-cyan { background: var(--cyan-glow); color: #22d3ee; border-color: rgba(6, 182, 212, 0.2); }
            .badge-purple { background: var(--primary-glow); color: #c084fc; border-color: rgba(168, 85, 247, 0.2); }
            
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
            .card { background: var(--card-bg); border-radius: 20px; padding: 1.5rem; border: 1px solid var(--border); display: flex; align-items: center; gap: 1.25rem; }
            .card-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; border: 1px solid rgba(255,255,255,0.05); }
            .icon-cyan { background: var(--cyan-glow); color: var(--cyan); }
            .icon-purple { background: var(--primary-glow); color: var(--primary); }
            .card-info h3 { font-size: 2rem; font-weight: 800; line-height: 1.1; margin-bottom: 0.1rem; }
            .card-info p { color: var(--text-dim); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

            .tables-grid { display: grid; grid-template-columns: 1fr; gap: 2.5rem; }
            .table-container { background: var(--card-bg); border-radius: 20px; border: 1px solid var(--border); overflow: hidden; }
            .table-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); }
            .table-header h2 { font-size: 1.15rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
            .table-header h2 i { color: var(--cyan); }
            
            .table-wrapper { overflow-x: auto; max-height: 400px; }
            table { width: 100%; border-collapse: collapse; text-align: left; }
            th { background: rgba(0,0,0,0.2); color: var(--text-dim); font-weight: 700; font-size: 0.75rem; text-transform: uppercase; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); letter-spacing: 0.5px; }
            td { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
            tr:last-child td { border-bottom: none; }
            tr:hover { background: rgba(255, 255, 255, 0.01); }
            
            .empty-state { padding: 3rem 2rem; text-align: center; color: var(--text-dim); }
            .empty-state i { font-size: 2.2rem; margin-bottom: 0.5rem; color: rgba(255,255,255,0.1); }
            .empty-state p { font-weight: 500; font-size: 0.9rem; }
            
            code { font-family: monospace; font-size: 0.85rem; background: rgba(255,255,255,0.05); padding: 0.2rem 0.4rem; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <div>
                    <h1>Portfolio <span>Analytics</span></h1>
                    <p style="color: var(--text-dim); font-size: 0.95rem;">Real-time visitors, contacts, and calendar bookings</p>
                </div>
                <button class="refresh-btn" onclick="window.location.reload()"><i class="fas fa-sync-alt"></i> Refresh</button>
            </header>

            <div class="stats-grid">
                <div class="card">
                    <div class="card-icon icon-cyan"><i class="fas fa-eye"></i></div>
                    <div class="card-info">
                        <h3>${db.totalVisits || 0}</h3>
                        <p>Total Hits</p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-icon icon-cyan"><i class="fas fa-users"></i></div>
                    <div class="card-info">
                        <h3>${(db.uniqueIPs || []).length}</h3>
                        <p>Unique Guests</p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-icon icon-purple"><i class="fas fa-bell"></i></div>
                    <div class="card-info">
                        <h3>${(db.subscribers || []).length}</h3>
                        <p>Subscribers</p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-icon icon-purple"><i class="fas fa-envelope"></i></div>
                    <div class="card-info">
                        <h3>${(db.messages || []).length}</h3>
                        <p>Messages</p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-icon icon-purple"><i class="fas fa-calendar-check"></i></div>
                    <div class="card-info">
                        <h3>${(db.bookings || []).length}</h3>
                        <p>Booked Calls</p>
                    </div>
                </div>
            </div>

            <div class="tables-grid">
                <!-- Booked Calls -->
                <div class="table-container">
                    <div class="table-header">
                        <h2><i class="fas fa-calendar-alt"></i> Scheduled Call Appointments</h2>
                        <span class="badge badge-purple">${sortedBookings.length} Bookings</span>
                    </div>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Client</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Topic</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${bookingRows}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Messages -->
                <div class="table-container">
                    <div class="table-header">
                        <h2><i class="fas fa-comments"></i> Contact Form Messages</h2>
                        <span class="badge badge-cyan">${sortedMessages.length} Messages</span>
                    </div>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Sender</th>
                                    <th>Date Received</th>
                                    <th>Message Context</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${messageRows}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Recent Visitors & Subscribers side by side -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                    <div class="table-container">
                        <div class="table-header">
                            <h2><i class="fas fa-history"></i> Recent Visitors</h2>
                            <span class="badge badge-cyan">${sortedVisits.length} Active IPs</span>
                        </div>
                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>IP Address</th>
                                        <th>Hits</th>
                                        <th>Last Visit</th>
                                        <th>Client Browser</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${visitorRows}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="table-container">
                        <div class="table-header">
                            <h2><i class="fas fa-envelope"></i> Newsletter Subscriptions</h2>
                            <span class="badge badge-purple">${sortedSubscribers.length} Emails</span>
                        </div>
                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Email Address</th>
                                        <th>Date Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${subscriberRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
    res.status(200).send(html);
});

// JSON API endpoint for stats
app.get('/api/stats', (req, res) => {
    res.status(200).json(loadDb());
});

// Helper validation & string escaping
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function truncate(str, len) {
    if (typeof str !== 'string') return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
}

// Redirect all other calls to stats or portfolio index
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
