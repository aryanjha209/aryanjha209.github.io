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
                from: `"Coming Soon" <${process.env.EMAIL_USER}>`,
                to: email.trim(),
                subject: "You're on the list! ⚡ Coming Soon",
                html: `
                <div style="font-family: 'Outfit', -apple-system, BlinkMacSystemFont, Arial, sans-serif; max-width: 550px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #4EBF15 0%, #3a8f10 100%); padding: 35px 20px; text-align: center;">
                        <span style="font-size: 40px; display: inline-block; filter: drop-shadow(0 0 10px rgba(255,255,255,0.3));">⚡</span>
                        <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Coming Soon</h1>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px 30px; text-align: center; color: #0f172a;">
                        <h2 style="font-size: 22px; font-weight: 800; margin-top: 0; margin-bottom: 15px;">You're on the list!</h2>
                        <p style="font-size: 15px; line-height: 1.6; color: #64748b; margin-bottom: 25px;">
                            Thank you for subscribing to get notified of our launch. We are working hard to build a minimalist developer environment and utility suite styled in clean white and parrot green.
                        </p>
                        
                        <div style="background-color: #F2FDF0; color: #3a8f10; border: 1px solid rgba(78, 191, 21, 0.2); padding: 8px 18px; border-radius: 50px; font-size: 13px; font-weight: 700; display: inline-block; letter-spacing: 1px;">
                            STATUS: SUBSCRIBED ⚡
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                        <p style="margin: 0;">© 2026. All rights reserved.</p>
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
        } else {
            console.warn("Skipping 'Thanks' mail: EMAIL_USER or EMAIL_PASS environment variables are not configured.");
        }

        res.status(200).json({ success: true, message: 'Thank you! We will notify you when we launch.' });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Stats Visual Dashboard HTML
app.get('/stats', (req, res) => {
    const db = loadDb();
    
    const sortedVisits = [...(db.visits || [])].sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
    const sortedSubscribers = [...(db.subscribers || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

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
                    <td><span class="badge">${v.count}</span></td>
                    <td>${dateStr}</td>
                    <td title="${escapeHtml(v.userAgent)}">${escapeHtml(truncate(v.userAgent, 50))}</td>
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
        <title>Coming Soon - Analytics Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            :root {
                --primary: #4EBF15;
                --primary-dark: #3a8f10;
                --primary-glow: rgba(78, 191, 21, 0.1);
                --bg: #f8fafc;
                --card-bg: #ffffff;
                --text: #0f172a;
                --text-dim: #64748b;
                --border: #e2e8f0;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Outfit', sans-serif; }
            body { background-color: var(--bg); color: var(--text); line-height: 1.5; padding: 2rem 1rem; }
            .container { max-width: 1200px; margin: 0 auto; }
            
            header { 
                display: flex; 
                flex-direction: column;
                gap: 0.5rem;
                margin-bottom: 2rem; 
                border-bottom: 2px solid var(--border); 
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
            h1 span { color: var(--primary); }
            
            .refresh-btn {
                background: white;
                border: 1px solid var(--border);
                padding: 0.5rem 1rem;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                transition: all 0.2s ease;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }
            .refresh-btn:hover {
                border-color: var(--primary);
                color: var(--primary);
            }
            
            .badge { background-color: var(--primary-glow); color: var(--primary-dark); padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.8rem; font-weight: 700; border: 1px solid rgba(78,191,21,0.2); }
            
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
            .card { background: var(--card-bg); border-radius: 16px; padding: 1.5rem; border: 1px solid var(--border); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); display: flex; align-items: center; gap: 1.25rem; }
            .card-icon { background: var(--primary-glow); color: var(--primary); width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; border: 1px solid rgba(78,191,21,0.15); }
            .card-info h3 { font-size: 2.2rem; font-weight: 800; line-height: 1.1; margin-bottom: 0.2rem; }
            .card-info p { color: var(--text-dim); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

            .tables-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; }
            @media(min-width: 992px) {
                .tables-grid { grid-template-columns: 3fr 2fr; }
            }
            .table-container { background: var(--card-bg); border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); overflow: hidden; }
            .table-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: #fafafa; }
            .table-header h2 { font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
            .table-header h2 i { color: var(--primary); }
            
            .table-wrapper { overflow-x: auto; max-height: 500px; }
            table { width: 100%; border-collapse: collapse; text-align: left; }
            th { background: #f8fafc; color: var(--text-dim); font-weight: 700; font-size: 0.8rem; text-transform: uppercase; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); letter-spacing: 0.5px; }
            td { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); font-size: 0.95rem; }
            tr:last-child td { border-bottom: none; }
            tr:hover { background: #fafdf9; }
            
            .empty-state { padding: 4rem 2rem; text-align: center; color: var(--text-dim); }
            .empty-state i { font-size: 2.5rem; margin-bottom: 0.75rem; color: #cbd5e1; }
            .empty-state p { font-weight: 500; font-size: 0.95rem; }
            
            code { font-family: monospace; font-size: 0.9rem; background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <div>
                    <h1>Coming Soon <span>Analytics</span></h1>
                    <p style="color: var(--text-dim); font-size: 0.95rem;">Real-time visitor logs and subscriptions</p>
                </div>
                <button class="refresh-btn" onclick="window.location.reload()"><i class="fas fa-sync-alt"></i> Refresh</button>
            </header>

            <div class="stats-grid">
                <div class="card">
                    <div class="card-icon"><i class="fas fa-eye"></i></div>
                    <div class="card-info">
                        <h3>${db.totalVisits || 0}</h3>
                        <p>Total Hits</p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-icon"><i class="fas fa-users"></i></div>
                    <div class="card-info">
                        <h3>${(db.uniqueIPs || []).length}</h3>
                        <p>Unique Visitors</p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-icon"><i class="fas fa-bell"></i></div>
                    <div class="card-info">
                        <h3>${(db.subscribers || []).length}</h3>
                        <p>Subscribers</p>
                    </div>
                </div>
            </div>

            <div class="tables-grid">
                <div class="table-container">
                    <div class="table-header">
                        <h2><i class="fas fa-history"></i> Recent Visitors</h2>
                        <span class="badge">${sortedVisits.length} Unique IPs</span>
                    </div>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>IP Address</th>
                                    <th>Hits</th>
                                    <th>Last Visit</th>
                                    <th>User Agent</th>
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
                        <h2><i class="fas fa-envelope"></i> Notifications List</h2>
                        <span class="badge">${sortedSubscribers.length} Emails</span>
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
    </body>
    </html>
    `;
    res.status(200).send(html);
});

// JSON API endpoint for stats just in case
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

// Redirect all other calls to stats or home
app.get('*', (req, res) => {
    res.redirect('/stats');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
