import os
import sys
import html
import smtplib
from urllib.parse import urlparse
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, redirect
from flask_cors import CORS
from dotenv import load_dotenv

# Add parent directory to path to import db_helper
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))
import db_helper

app = Flask(__name__)
CORS(app, origins=[
    "https://aryanjha209.github.io",   # GitHub Pages
    "https://aryanjha.me",             # Vercel custom domain
    "https://www.aryanjha.me",         # Vercel www
    "http://localhost:5000",           # Local dev
    "http://127.0.0.1:5000",          # Local dev
])

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend")

REDIRECTS = {
    'about': '/#about',
    'contact': '/#contact',
    'book': '/#book',
    'call': '/#call',
    'services': '/#services',
    'projects': '/#projects',
    'skills': '/#skills',
    'testimonials': '/#testimonials',
    'faq': '/#faq',
    'hire': '/#hire',
    'portfolio': '/#portfolio',
    'process': '/#process',
    'estimator': '/#estimator',
    'snap-lenses': '/#snap-lenses'
}

def escape_html(s):
    if s is None:
        return ''
    return html.escape(str(s))

def truncate(s, length):
    if s is None:
        return ''
    string = str(s)
    return string[:length] + '...' if len(string) > length else string

def format_date(date_str):
    if not date_str:
        return 'N/A'
    try:
        clean_str = date_str.replace('Z', '')
        if '.' in clean_str:
            clean_str = clean_str.split('.')[0]
        dt = datetime.strptime(clean_str, '%Y-%m-%dT%H:%M:%S')
        return dt.strftime('%m/%d/%Y, %I:%M:%S %p')
    except Exception:
        return str(date_str)

def is_http_url(value):
    if not value or not isinstance(value, str):
        return False
    parsed = urlparse(value.strip())
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)

def send_smtp_email(to_email, subject, html_content):
    email_user = os.environ.get("EMAIL_USER")
    email_pass = os.environ.get("EMAIL_PASS")
    
    if not email_user or not email_pass:
        print("SMTP credentials missing. Skipping email sending.")
        return False
        
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"Aryan Jha Portfolio <{email_user}>"
        msg['To'] = to_email
        
        part = MIMEText(html_content, 'html')
        msg.attach(part)
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(email_user, email_pass)
        server.sendmail(email_user, [to_email], msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

# Route definitions
@app.route('/api/visit', methods=['POST'])
def track_visit_api():
    try:
        # Get client IP (support proxy headers)
        ip = (request.headers.get('x-forwarded-for') or request.remote_addr or '127.0.0.1').split(',')[0].strip()
        user_agent = request.headers.get('user-agent') or 'Unknown'
        db_helper.track_visit(ip, user_agent)
        return jsonify({"success": True, "message": "Visit tracked successfully"}), 200
    except Exception as e:
        print(f"Visit tracking error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/subscribe', methods=['POST'])
def subscribe_api():
    try:
        req_data = request.get_json() or {}
        email = req_data.get("email")
        if not email or "@" not in email:
            return jsonify({"success": False, "message": "Please provide a valid email address."}), 400
            
        result = db_helper.add_subscriber(email)
        
        # Send "Thanks" Mail
        admin_email = os.environ.get("ADMIN_EMAIL") or "aryankjhaa@gmail.com"
        email_user = os.environ.get("EMAIL_USER")
        if email_user:
            mail_subject = "Thanks for subscribing! ⚡ Aryan Jha"
            mail_body = f"""
            <div style="font-family: 'Outfit', -apple-system, BlinkMacSystemFont, Arial, sans-serif; max-width: 550px; margin: 20px auto; background-color: #020215; border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(168, 85, 247, 0.05); color: #ffffff;">
                <div style="background: linear-gradient(135deg, #6b21a8 0%, #a855f7 100%); padding: 35px 20px; text-align: center;">
                    <span style="font-size: 40px; display: inline-block; filter: drop-shadow(0 0 10px rgba(255,255,255,0.3));">⚡</span>
                    <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Aryan Jha</h1>
                </div>
                <div style="padding: 40px 30px; text-align: center;">
                    <h2 style="font-size: 22px; font-weight: 800; margin-top: 0; margin-bottom: 15px; color: #ffffff;">You're on the list!</h2>
                    <p style="font-size: 15px; line-height: 1.6; color: #94a3b8; margin-bottom: 25px;">
                        Thank you for subscribing to my newsletter. You will receive exclusive updates about new AI solutions, PWA web apps, and Snapchat AR magic!
                    </p>
                    <div style="background-color: rgba(168, 85, 247, 0.1); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.2); padding: 8px 18px; border-radius: 50px; font-size: 13px; font-weight: 700; display: inline-block; letter-spacing: 1px;">
                        STATUS: SUBSCRIBED ⚡
                    </div>
                </div>
                <div style="background-color: #080721; padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); font-size: 12px; color: #64748b;">
                    <p style="margin: 0 0 8px 0;">This email was sent from Aryan Jha's digital system.</p>
                    <p style="margin: 0;">© 2026 Aryan Jha. All rights reserved.</p>
                </div>
            </div>
            """
            # Run email sending in background safely
            send_smtp_email(email.strip(), mail_subject, mail_body)

            admin_subject = f"New Newsletter Subscriber: {email.strip()}"
            admin_body = f"""
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 20px auto; color: #111827;">
                <h2 style="margin-bottom: 8px;">New newsletter subscriber</h2>
                <p><strong>Email:</strong> <a href="mailto:{escape_html(email.strip())}">{escape_html(email.strip())}</a></p>
                <p><strong>Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            """
            send_smtp_email(admin_email, admin_subject, admin_body)
            
        return jsonify(result), 200
    except Exception as e:
        print(f"Subscription error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/send-email', methods=['POST'])
def send_email_api():
    try:
        req_data = request.get_json() or {}
        name = req_data.get("name")
        email = req_data.get("email")
        message = req_data.get("message")
        
        if not name or not email or not message:
            return jsonify({"success": False, "message": "Please provide name, email, and message."}), 400
            
        db_helper.save_message(name, email, message)
        
        admin_email = os.environ.get("ADMIN_EMAIL") or "aryankjhaa@gmail.com"
        email_user = os.environ.get("EMAIL_USER")
        if email_user:
            mail_subject = f"New Portfolio Message from {name}"
            mail_body = f"""
            <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 20px auto; background-color: #020215; border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 20px; overflow: hidden; color: #ffffff; box-shadow: 0 10px 30px rgba(0, 212, 255, 0.05);">
                <div style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 30px 20px; text-align: center;">
                    <h2 style="margin: 0; color: #ffffff; font-weight: 800; font-size: 24px;">New Contact Message</h2>
                </div>
                <div style="padding: 30px 25px;">
                    <p style="margin-top:0;"><strong>Sender Name:</strong> {name}</p>
                    <p><strong>Sender Email:</strong> <a href="mailto:{email}" style="color:#06b6d4;">{email}</a></p>
                    <p><strong>Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                    <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 20px 0;">
                    <p style="white-space: pre-wrap; line-height: 1.6; color: #cbd5e1; background: rgba(255,255,255,0.02); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">{message}</p>
                </div>
            </div>
            """
            send_smtp_email(admin_email, mail_subject, mail_body)

            client_subject = "Thanks for reaching out to Aryan Jha"
            client_body = f"""
            <div style="font-family: 'Outfit', Arial, sans-serif; max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #d1fae5; border-radius: 16px; overflow: hidden; color: #111827;">
                <div style="background: linear-gradient(135deg, #18a63d 0%, #39ff14 100%); padding: 28px 20px; text-align: center;">
                    <h2 style="margin: 0; color: #06270b; font-size: 24px;">Thank you, {escape_html(name)}!</h2>
                </div>
                <div style="padding: 28px 24px;">
                    <p style="line-height: 1.6;">I received your message and will reply as soon as possible, usually within 24 hours.</p>
                    <p style="line-height: 1.6; margin-bottom: 8px;"><strong>Your message:</strong></p>
                    <div style="white-space: pre-wrap; line-height: 1.6; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px;">{escape_html(message)}</div>
                </div>
                <div style="background-color: #f9fafb; padding: 16px 24px; font-size: 12px; color: #6b7280;">
                    Aryan Jha Portfolio
                </div>
            </div>
            """
            send_smtp_email(email.strip(), client_subject, client_body)
            
        return jsonify({"success": True, "message": "Message sent successfully!"}), 200
    except Exception as e:
        print(f"Contact endpoint error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/book-call', methods=['POST'])
def book_call_api():
    try:
        req_data = request.get_json() or {}
        name = req_data.get("name")
        email = req_data.get("email")
        date = req_data.get("date")
        time = req_data.get("time")
        topic = req_data.get("topic")
        notes = req_data.get("notes") or 'None'
        
        if not name or not email or not date or not time or not topic:
            return jsonify({"success": False, "message": "Please provide name, email, date, time, and topic."}), 400
            
        db_helper.book_call({
            "name": name, "email": email, "date": date, 
            "time": time, "topic": topic, "notes": notes
        })
        
        admin_email = os.environ.get("ADMIN_EMAIL") or "aryankjhaa@gmail.com"
        email_user = os.environ.get("EMAIL_USER")
        if email_user:
            # Send email to admin
            admin_subject = f"New Call Scheduled: {name}"
            admin_body = f"""
            <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 20px auto; background-color: #020215; border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 20px; overflow: hidden; color: #ffffff;">
                <div style="background: linear-gradient(135deg, #6b21a8 0%, #a855f7 100%); padding: 30px 20px; text-align: center;">
                    <h2 style="margin: 0; color: #ffffff; font-weight: 800; font-size: 24px;">New Call Scheduled</h2>
                </div>
                <div style="padding: 30px 25px;">
                    <p><strong>Name:</strong> {name}</p>
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Date & Time:</strong> {date} at {time}</p>
                    <p><strong>Topic:</strong> {topic}</p>
                    <p><strong>Notes:</strong> {notes}</p>
                </div>
            </div>
            """
            
            # Send email to client
            client_subject = "Confirmed: Call with Aryan Jha"
            client_body = f"""
            <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 20px auto; background-color: #020215; border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 20px; overflow: hidden; color: #ffffff; text-align: center;">
                <div style="background: linear-gradient(135deg, #6b21a8 0%, #a855f7 100%); padding: 35px 20px;">
                    <span style="font-size: 45px;">📅</span>
                    <h2 style="margin: 10px 0 0 0; color: #ffffff; font-weight: 800; font-size: 24px;">Call Confirmed!</h2>
                </div>
                <div style="padding: 40px 30px;">
                    <h3 style="margin-top: 0; font-size: 20px; color: #ffffff;">Hi {name},</h3>
                    <p style="color: #cbd5e1; line-height: 1.6; font-size: 15px;">Your virtual meeting with me has been successfully scheduled. I look forward to talking with you!</p>
                    
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 25px auto; max-width: 400px; text-align: left;">
                        <p style="margin: 0 0 8px 0; color: #94a3b8;"><strong>Topic:</strong> {topic}</p>
                        <p style="margin: 0 0 8px 0; color: #94a3b8;"><strong>Date:</strong> {date}</p>
                        <p style="margin: 0; color: #94a3b8;"><strong>Time:</strong> {time}</p>
                    </div>
                </div>
                <div style="background-color: #080721; padding: 20px; font-size: 12px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05);">
                    <p style="margin: 0;">© 2026 Aryan Jha. All rights reserved.</p>
                </div>
            </div>
            """
            send_smtp_email(admin_email, admin_subject, admin_body)
            send_smtp_email(email.strip(), client_subject, client_body)
            
        return jsonify({"success": True, "message": "Call scheduled successfully!"}), 200
    except Exception as e:
        print(f"Call booking endpoint error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/testimonials', methods=['GET', 'POST'])
def testimonials_api():
    if request.method == 'GET':
        try:
            testimonials = db_helper.get_testimonials()
            return jsonify({"success": True, "testimonials": testimonials}), 200
        except Exception as e:
            print(f"Get testimonials error: {e}")
            return jsonify({"success": False, "message": str(e)}), 500
    else:
        try:
            req_data = request.get_json() or {}
            name = req_data.get("name")
            org = req_data.get("org")
            comment = req_data.get("comment")
            avatar = req_data.get("avatar")
            
            if not name or not org or not comment:
                return jsonify({"success": False, "message": "Name, organization, and comment are required."}), 400
                
            testimonial = db_helper.add_testimonial(name, org, comment, avatar)
            return jsonify({"success": True, "message": "Testimonial submitted successfully!", "testimonial": testimonial}), 200
        except Exception as e:
            print(f"Post testimonial error: {e}")
            return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/projects', methods=['GET', 'POST'])
def projects_api():
    if request.method == 'GET':
        try:
            projects = db_helper.get_projects()
            return jsonify({"success": True, "projects": projects}), 200
        except Exception as e:
            print(f"Get projects error: {e}")
            return jsonify({"success": False, "message": str(e)}), 500
    else:
        try:
            req_data = request.get_json() or {}
            image_url = req_data.get("imageUrl")
            if not is_http_url(image_url):
                return jsonify({"success": False, "message": "Project cover image must be a valid image URL."}), 400
            db_helper.save_project(req_data)
            return jsonify({"success": True, "message": "Project saved successfully!"}), 200
        except Exception as e:
            print(f"Save project error: {e}")
            return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/projects/<project_id>', methods=['DELETE'])
def delete_project_api(project_id):
    try:
        db_helper.delete_project(project_id)
        return jsonify({"success": True, "message": "Project deleted successfully!"}), 200
    except Exception as e:
        print(f"Delete project error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/lenses', methods=['GET', 'POST'])
def lenses_api():
    if request.method == 'GET':
        try:
            lenses = db_helper.get_lenses()
            return jsonify({"success": True, "lenses": lenses}), 200
        except Exception as e:
            print(f"Get lenses error: {e}")
            return jsonify({"success": False, "message": str(e)}), 500
    else:
        try:
            req_data = request.get_json() or {}
            snapcode_url = req_data.get("snapcodeUrl")
            if not is_http_url(snapcode_url):
                return jsonify({"success": False, "message": "Snapcode image must be a valid image URL."}), 400
            db_helper.save_lens(req_data)
            return jsonify({"success": True, "message": "Lens saved successfully!"}), 200
        except Exception as e:
            print(f"Save lens error: {e}")
            return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/lenses/<lens_id>', methods=['DELETE'])
def delete_lens_api(lens_id):
    try:
        db_helper.delete_lens(lens_id)
        return jsonify({"success": True, "message": "Lens deleted successfully!"}), 200
    except Exception as e:
        print(f"Delete lens error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/lenses/active-ad', methods=['GET'])
def active_ad_lens_api():
    try:
        lens = db_helper.get_active_ad_lens()
        return jsonify({"success": True, "lens": lens}), 200
    except Exception as e:
        print(f"Get active lens error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/testimonials/<testimonial_id>', methods=['DELETE'])
def delete_testimonial_api(testimonial_id):
    try:
        success = db_helper.delete_testimonial(testimonial_id)
        if success:
            return jsonify({"success": True, "message": "Testimonial deleted successfully!"}), 200
        else:
            return jsonify({"success": False, "message": "Failed to delete testimonial"}), 500
    except Exception as e:
        print(f"Delete testimonial error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/messages/<message_id>', methods=['DELETE'])
def delete_message_api(message_id):
    try:
        success = db_helper.delete_message(message_id)
        if success:
            return jsonify({"success": True, "message": "Message deleted successfully!"}), 200
        else:
            return jsonify({"success": False, "message": "Failed to delete message"}), 500
    except Exception as e:
        print(f"Delete message error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/bookings/<booking_id>', methods=['DELETE'])
def delete_booking_api(booking_id):
    try:
        success = db_helper.delete_booking(booking_id)
        if success:
            return jsonify({"success": True, "message": "Booking deleted successfully!"}), 200
        else:
            return jsonify({"success": False, "message": "Failed to delete booking"}), 500
    except Exception as e:
        print(f"Delete booking error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/subscribers/<email_or_id>', methods=['DELETE'])
def delete_subscriber_api(email_or_id):
    try:
        success = db_helper.delete_subscriber(email_or_id)
        if success:
            return jsonify({"success": True, "message": "Subscriber deleted successfully!"}), 200
        else:
            return jsonify({"success": False, "message": "Failed to delete subscriber"}), 500
    except Exception as e:
        print(f"Delete subscriber error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/admin/auth', methods=['POST'])
def admin_auth():
    try:
        req_data = request.get_json() or {}
        password = req_data.get("password")
        admin_password = os.environ.get("ADMIN_PASSWORD") or "admin123"
        if password == admin_password:
            return jsonify({"success": True, "message": "Authenticated successfully!"}), 200
        else:
            return jsonify({"success": False, "message": "Incorrect Password!"}), 401
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def stats_json_api():
    try:
        stats = db_helper.get_stats_data()
        
        visits = stats.get("visits", [])
        total_visits = sum(v.get("count", 1) for v in visits)
        unique_ips = list(set(v.get("ip") for v in visits if v.get("ip")))
        
        stats["totalVisits"] = total_visits
        stats["uniqueIPs"] = unique_ips
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# HTML Visual Analytics Dashboard
@app.route('/stats')
def stats_html_dashboard():
    stats = db_helper.get_stats_data()
    visits = stats.get("visits", [])
    subscribers = stats.get("subscribers", [])
    messages = stats.get("messages", [])
    bookings = stats.get("bookings", [])
    testimonials = stats.get("testimonials", [])
    
    total_visits = sum(v.get("count", 1) for v in visits)
    unique_ips = list(set(v.get("ip") for v in visits if v.get("ip")))
    
    sorted_visits = sorted(visits, key=lambda x: x.get("lastVisit", ""), reverse=True)
    sorted_subscribers = sorted(subscribers, key=lambda x: x.get("date", ""), reverse=True)
    sorted_messages = sorted(messages, key=lambda x: x.get("date", ""), reverse=True)
    sorted_bookings = sorted(bookings, key=lambda x: x.get("dateBooked", ""), reverse=True)
    sorted_testimonials = sorted(testimonials, key=lambda x: x.get("date", ""), reverse=True)
    
    # Render subscriber rows
    subscriber_rows = ''
    if not sorted_subscribers:
        subscriber_rows = '<tr><td colspan="2" class="empty-state"><i class="fas fa-envelope-open"></i><p>No subscribers yet.</p></td></tr>'
    else:
        for s in sorted_subscribers:
            date_str = format_date(s.get("date"))
            subscriber_rows += f"""
            <tr>
                <td><strong>{escape_html(s.get("email"))}</strong></td>
                <td>{date_str}</td>
            </tr>
            """
            
    # Render visitor rows
    visitor_rows = ''
    if not sorted_visits:
        visitor_rows = '<tr><td colspan="4" class="empty-state"><i class="fas fa-users-slash"></i><p>No visits logged yet.</p></td></tr>'
    else:
        for v in sorted_visits:
            date_str = format_date(v.get("lastVisit"))
            visitor_rows += f"""
            <tr>
                <td><code>{escape_html(v.get("ip"))}</code></td>
                <td><span class="badge badge-cyan">{v.get("count", 1)}</span></td>
                <td>{date_str}</td>
                <td title="{escape_html(v.get("userAgent"))}">{escape_html(truncate(v.get("userAgent"), 40))}</td>
            </tr>
            """
            
    # Render message rows
    message_rows = ''
    if not sorted_messages:
        message_rows = '<tr><td colspan="3" class="empty-state"><i class="fas fa-comment-slash"></i><p>No messages received yet.</p></td></tr>'
    else:
        for m in sorted_messages:
            date_str = format_date(m.get("date"))
            message_rows += f"""
            <tr>
                <td><strong>{escape_html(m.get("name"))}</strong><br><small style="color:#64748b;">{escape_html(m.get("email"))}</small></td>
                <td>{date_str}</td>
                <td style="max-width: 250px; white-space: pre-wrap; font-size:0.85rem; color:#cbd5e1;">{escape_html(m.get("message"))}</td>
            </tr>
            """
            
    # Render booking rows
    booking_rows = ''
    if not sorted_bookings:
        booking_rows = '<tr><td colspan="5" class="empty-state"><i class="far fa-calendar-times"></i><p>No scheduled calls yet.</p></td></tr>'
    else:
        for b in sorted_bookings:
            booking_rows += f"""
            <tr>
                <td><strong>{escape_html(b.get("name"))}</strong><br><small style="color:#64748b;">{escape_html(b.get("email"))}</small></td>
                <td><span class="badge badge-purple">{escape_html(b.get("date"))}</span></td>
                <td><code>{escape_html(b.get("time"))}</code></td>
                <td><strong>{escape_html(b.get("topic"))}</strong></td>
                <td style="max-width: 150px; font-size:0.85rem; color:#cbd5e1;">{escape_html(b.get("notes") or 'None')}</td>
            </tr>
            """
            
    # Render testimonial rows
    testimonial_rows = ''
    if not sorted_testimonials:
        testimonial_rows = '<tr><td colspan="4" class="empty-state"><i class="fas fa-quote-left"></i><p>No submitted testimonials yet.</p></td></tr>'
    else:
        for t in sorted_testimonials:
            date_str = format_date(t.get("date")) if t.get("date") else 'N/A'
            avatar = t.get("avatar")
            has_base64 = avatar and avatar.startswith('data:image/')
            if has_base64:
                avatar_html = f'<img src="{escape_html(avatar)}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; vertical-align: middle; margin-right: 8px;">'
            else:
                avatar_html = f'<span style="width: 24px; height: 24px; border-radius: 50%; background: #a855f7; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; margin-right: 8px; color: #ffffff; vertical-align: middle;">{escape_html(avatar)}</span>'
                
            testimonial_rows += f"""
            <tr>
                <td>{avatar_html}<strong>{escape_html(t.get("name"))}</strong></td>
                <td>{escape_html(t.get("role"))}</td>
                <td>{date_str}</td>
                <td style="max-width: 250px; font-size:0.85rem; color:#cbd5e1; white-space: pre-wrap;">{escape_html(t.get("quote"))}</td>
            </tr>
            """

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portfolio - Analytics Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {{
            --primary: #a855f7;
            --primary-glow: rgba(168, 85, 247, 0.15);
            --cyan: #06b6d4;
            --cyan-glow: rgba(6, 182, 212, 0.15);
            --bg: #020215;
            --card-bg: rgba(8, 7, 33, 0.85);
            --text: #ffffff;
            --text-dim: #94a3b8;
            --border: rgba(255, 255, 255, 0.05);
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: 'Outfit', sans-serif; }}
        body {{ background: var(--bg); color: var(--text); padding: 2rem 1rem; line-height: 1.5; min-height: 100vh; }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        
        /* Header */
        .header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; border-bottom: 1px solid var(--border); padding-bottom: 1.5rem; }}
        .header h1 {{ font-size: 2rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; }}
        .header h1 i {{ color: var(--primary); text-shadow: 0 0 15px rgba(168, 85, 247, 0.4); }}
        .refresh-btn {{ background: rgba(255,255,255,0.02); border: 1px solid var(--border); color: #ffffff; padding: 0.6rem 1.2rem; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.45rem; transition: all 0.2s ease; }}
        .refresh-btn:hover {{ background: rgba(168, 85, 247, 0.1); border-color: var(--primary); }}

        /* Stats Grid cards */
        .stats-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }}
        .card {{ background: var(--card-bg); border: 1px solid var(--border); border-radius: 20px; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 30px rgba(0,0,0,0.2); backdrop-filter: blur(10px); }}
        .card-icon {{ width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }}
        .icon-cyan {{ background: var(--cyan-glow); color: var(--cyan); }}
        .icon-purple {{ background: var(--primary-glow); color: var(--primary); }}
        .card-info h3 {{ font-size: 1.6rem; font-weight: 800; }}
        .card-info p {{ font-size: 0.8rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }}

        /* Tables Grid */
        .tables-grid {{ display: flex; flex-direction: column; gap: 2.5rem; }}
        .table-container {{ background: var(--card-bg); border: 1px solid var(--border); border-radius: 24px; padding: 1.75rem; box-shadow: 0 4px 30px rgba(0,0,0,0.2); backdrop-filter: blur(10px); }}
        .table-header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }}
        .table-header h2 {{ font-size: 1.15rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; color: #ffffff; }}
        .table-header h2 i {{ color: var(--primary); }}
        .badge {{ font-size: 0.72rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 50px; letter-spacing: 0.5px; text-transform: uppercase; }}
        .badge-cyan {{ background: var(--cyan-glow); color: var(--cyan); border: 1px solid rgba(6,182,212,0.15); }}
        .badge-purple {{ background: var(--primary-glow); color: var(--primary); border: 1px solid rgba(168,85,247,0.15); }}

        /* Base Table */
        .table-wrapper {{ overflow-x: auto; }}
        table {{ width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }}
        th {{ color: var(--text-dim); font-weight: 600; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 1px; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); }}
        td {{ padding: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.02); color: #cbd5e1; }}
        tr:last-child td {{ border-bottom: none; }}
        tr:hover td {{ background: rgba(255, 255, 255, 0.01); }}

        /* Empty states */
        .empty-state {{ text-align: center; padding: 3rem 0 !important; color: var(--text-dim); }}
        .empty-state i {{ font-size: 2rem; margin-bottom: 0.75rem; opacity: 0.3; color: var(--primary); }}
        .empty-state p {{ font-size: 0.85rem; }}
        
        code {{ background: rgba(255,255,255,0.05); padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; font-size: 0.8rem; color: var(--cyan); }}
        small {{ font-size: 0.75rem; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-chart-line"></i> Aryan Jha &bull; Visual Analytics</h1>
            <button class="refresh-btn" onclick="window.location.reload()"><i class="fas fa-sync-alt"></i> Refresh Stats</button>
        </div>

        <div class="stats-grid">
            <div class="card">
                <div class="card-icon icon-cyan"><i class="fas fa-eye"></i></div>
                <div class="card-info">
                    <h3>{total_visits}</h3>
                    <p>Total Hits</p>
                </div>
            </div>
            <div class="card">
                <div class="card-icon icon-cyan"><i class="fas fa-users"></i></div>
                <div class="card-info">
                    <h3>{len(unique_ips)}</h3>
                    <p>Unique Guests</p>
                </div>
            </div>
            <div class="card">
                <div class="card-icon icon-purple"><i class="fas fa-bell"></i></div>
                <div class="card-info">
                    <h3>{len(sorted_subscribers)}</h3>
                    <p>Subscribers</p>
                </div>
            </div>
            <div class="card">
                <div class="card-icon icon-purple"><i class="fas fa-envelope"></i></div>
                <div class="card-info">
                    <h3>{len(sorted_messages)}</h3>
                    <p>Messages</p>
                </div>
            </div>
            <div class="card">
                <div class="card-icon icon-purple"><i class="fas fa-calendar-check"></i></div>
                <div class="card-info">
                    <h3>{len(sorted_bookings)}</h3>
                    <p>Booked Calls</p>
                </div>
            </div>
            <div class="card">
                <div class="card-icon icon-purple"><i class="fas fa-quote-left"></i></div>
                <div class="card-info">
                    <h3>{len(sorted_testimonials)}</h3>
                    <p>Testimonials</p>
                </div>
            </div>
        </div>

        <div class="tables-grid">
            <!-- Booked Calls -->
            <div class="table-container">
                <div class="table-header">
                    <h2><i class="fas fa-calendar-alt"></i> Scheduled Call Appointments</h2>
                    <span class="badge badge-purple">{len(sorted_bookings)} Bookings</span>
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
                            {booking_rows}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Submitted Testimonials -->
            <div class="table-container">
                <div class="table-header">
                    <h2><i class="fas fa-quote-left"></i> Client Submitted Testimonials</h2>
                    <span class="badge badge-purple">{len(sorted_testimonials)} Reviews</span>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Client / Avatar</th>
                                <th>Organization / Title</th>
                                <th>Submitted Date</th>
                                <th>Testimonial Comment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {testimonial_rows}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Recent Visitors & Subscribers side by side -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                <div class="table-container">
                    <div class="table-header">
                        <h2><i class="fas fa-history"></i> Recent Visitors</h2>
                        <span class="badge badge-cyan">{len(sorted_visits)} Active IPs</span>
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
                                {visitor_rows}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="table-container">
                    <div class="table-header">
                        <h2><i class="fas fa-envelope"></i> Newsletter Subscriptions</h2>
                        <span class="badge badge-purple">{len(sorted_subscribers)} Emails</span>
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
                                {subscriber_rows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>"""
    return html_content, 200

# Local static serving & redirects
@app.route('/')
def serve_index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/admin')
def serve_admin():
    return send_from_directory(os.path.join(FRONTEND_DIR, 'admin'), 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if path in REDIRECTS:
        return redirect(REDIRECTS[path])
        
    # Check in root frontend directory
    if os.path.exists(os.path.join(FRONTEND_DIR, path)):
        return send_from_directory(FRONTEND_DIR, path)
        
    # Admin subpath resources fallback
    if path.startswith('admin/'):
        sub_path = path[6:]
        if os.path.exists(os.path.join(FRONTEND_DIR, 'admin', sub_path)):
            return send_from_directory(os.path.join(FRONTEND_DIR, 'admin'), sub_path)
            
    # Fallback to SPA index.html
    return send_from_directory(FRONTEND_DIR, 'index.html')

if __name__ == "__main__":
    app.run(port=5000, debug=True)
