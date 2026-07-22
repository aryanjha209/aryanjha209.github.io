import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timezone
from dotenv import load_dotenv

def get_utc_now():
    return datetime.now(timezone.utc)

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DATABASE_URL = os.environ.get("DATABASE_URL")
JSON_DB_PATH = os.path.join(os.path.dirname(__file__), "database.json")

pg_conn = None

def get_pg_connection():
    global pg_conn
    if not DATABASE_URL:
        return None
    try:
        if pg_conn is not None:
            try:
                if pg_conn.closed == 0:
                    return pg_conn
            except Exception:
                pass
            pg_conn = None
        pg_conn = psycopg2.connect(DATABASE_URL)
        return pg_conn
    except Exception as e:
        print(f"PostgreSQL connection failed: {e}")
        pg_conn = None
        return None

def execute_query(query, params=None, fetch=None, commit=True):
    conn = get_pg_connection()
    if conn is None:
        return None
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params or ())
            result = None
            if fetch == "all":
                result = cur.fetchall()
            elif fetch == "one":
                result = cur.fetchone()
            if commit:
                conn.commit()
            return result
    except Exception as e:
        print(f"PostgreSQL query execution error: {e}")
        try:
            conn.rollback()
        except Exception:
            pass
        return None

def read_json_db():
    if not os.path.exists(JSON_DB_PATH):
        return {
            "visits": [], "subscribers": [], "messages": [], 
            "bookings": [], "testimonials": [], "projects": [], "lenses": [],
            "posters": []
        }
    try:
        with open(JSON_DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading JSON database: {e}")
        return {
            "visits": [], "subscribers": [], "messages": [], 
            "bookings": [], "testimonials": [], "projects": [], "lenses": [],
            "posters": []
        }

def write_json_db(data):
    try:
        with open(JSON_DB_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error writing JSON database: {e}")

# Ensure local file has structural defaults
if not os.path.exists(JSON_DB_PATH):
    write_json_db({
        "visits": [], "subscribers": [], "messages": [], 
        "bookings": [], "testimonials": [], "projects": [], "lenses": [],
        "posters": []
    })

def serialize_doc(doc):
    if not doc:
        return None
    # Duplicate 'id' to '_id' for frontend/dashboard backward compatibility
    if "id" in doc:
        doc["_id"] = str(doc["id"])
        doc["id"] = str(doc["id"])
    for k, v in doc.items():
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
    return doc

def serialize_docs(docs):
    return [serialize_doc(dict(doc)) for doc in docs]

# database table initialization and auto-seeding
def init_db():
    conn = get_pg_connection()
    if conn is None:
        print("PostgreSQL connection not available. Skipping table initialization.")
        return
    try:
        with conn.cursor() as cur:
            # Create visits
            cur.execute("""
                CREATE TABLE IF NOT EXISTS visits (
                    id SERIAL PRIMARY KEY,
                    ip VARCHAR(45) UNIQUE,
                    count INTEGER DEFAULT 1,
                    last_visit TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    user_agent TEXT
                )
            """)
            # Create subscribers
            cur.execute("""
                CREATE TABLE IF NOT EXISTS subscribers (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE,
                    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # Create messages
            cur.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255),
                    email VARCHAR(255),
                    message TEXT,
                    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # Create bookings
            cur.execute("""
                CREATE TABLE IF NOT EXISTS bookings (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255),
                    email VARCHAR(255),
                    date VARCHAR(50),
                    time VARCHAR(50),
                    topic VARCHAR(255),
                    notes TEXT,
                    date_booked TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # Create testimonials
            cur.execute("""
                CREATE TABLE IF NOT EXISTS testimonials (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255),
                    role VARCHAR(255),
                    quote TEXT,
                    avatar TEXT,
                    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # Create projects
            cur.execute("""
                CREATE TABLE IF NOT EXISTS projects (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255),
                    description TEXT,
                    image_url TEXT,
                    tags TEXT,
                    demo_url TEXT,
                    github_url TEXT,
                    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # Create lenses
            cur.execute("""
                CREATE TABLE IF NOT EXISTS lenses (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255),
                    description TEXT,
                    lens_url TEXT,
                    snapcode_url TEXT,
                    views VARCHAR(100),
                    active_ad_bar BOOLEAN DEFAULT FALSE,
                    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # Create posters
            cur.execute("""
                CREATE TABLE IF NOT EXISTS posters (
                    id SERIAL PRIMARY KEY,
                    image_url TEXT,
                    redirect_url TEXT,
                    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            print("PostgreSQL tables checked/created successfully.")
            
            # Auto-seed tables from database.json if empty
            auto_seed_db(cur, conn)
    except Exception as e:
        print(f"Error initializing PostgreSQL database: {e}")

def auto_seed_db(cur, conn):
    local_data = read_json_db()
    
    # 1. Projects
    cur.execute("SELECT COUNT(*) FROM projects")
    if cur.fetchone()[0] == 0:
        items = local_data.get("projects") or []
        for p in items:
            cur.execute("""
                INSERT INTO projects (name, description, image_url, tags, demo_url, github_url, date)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (p.get("name"), p.get("description"), p.get("imageUrl"), p.get("tags"), p.get("demoUrl"), p.get("githubUrl"), get_utc_now()))
        print(f"Seeded {len(items)} projects to PostgreSQL.")
        
    # 2. Lenses
    cur.execute("SELECT COUNT(*) FROM lenses")
    if cur.fetchone()[0] == 0:
        items = local_data.get("lenses") or []
        for l in items:
            cur.execute("""
                INSERT INTO lenses (name, description, lens_url, snapcode_url, views, active_ad_bar, date)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (l.get("name"), l.get("description"), l.get("lensUrl"), l.get("snapcodeUrl"), l.get("views"), l.get("activeAdBar", False), get_utc_now()))
        print(f"Seeded {len(items)} lenses to PostgreSQL.")
        
    # 3. Testimonials
    cur.execute("SELECT COUNT(*) FROM testimonials")
    if cur.fetchone()[0] == 0:
        items = local_data.get("testimonials") or []
        for t in items:
            cur.execute("""
                INSERT INTO testimonials (name, role, quote, avatar, date)
                VALUES (%s, %s, %s, %s, %s)
            """, (t.get("name"), t.get("role") or t.get("org"), t.get("quote") or t.get("comment"), t.get("avatar"), get_utc_now()))
        print(f"Seeded {len(items)} testimonials to PostgreSQL.")

    # 4. Subscribers
    cur.execute("SELECT COUNT(*) FROM subscribers")
    if cur.fetchone()[0] == 0:
        items = local_data.get("subscribers") or []
        for s in items:
            cur.execute("""
                INSERT INTO subscribers (email, date)
                VALUES (%s, %s)
                ON CONFLICT (email) DO NOTHING
            """, (s.get("email"), get_utc_now()))
        print(f"Seeded {len(items)} subscribers to PostgreSQL.")

    # 5. Messages
    cur.execute("SELECT COUNT(*) FROM messages")
    if cur.fetchone()[0] == 0:
        items = local_data.get("messages") or []
        for m in items:
            cur.execute("""
                INSERT INTO messages (name, email, message, date)
                VALUES (%s, %s, %s, %s)
            """, (m.get("name"), m.get("email"), m.get("message"), get_utc_now()))
        print(f"Seeded {len(items)} messages to PostgreSQL.")

    # 6. Bookings
    cur.execute("SELECT COUNT(*) FROM bookings")
    if cur.fetchone()[0] == 0:
        items = local_data.get("bookings") or []
        for b in items:
            cur.execute("""
                INSERT INTO bookings (name, email, date, time, topic, notes, date_booked)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (b.get("name"), b.get("email"), b.get("date"), b.get("time"), b.get("topic"), b.get("notes"), get_utc_now()))
        print(f"Seeded {len(items)} bookings to PostgreSQL.")
        
    conn.commit()

# Trigger schema initialization on load if possible
init_db()

# DB operations
def track_visit(ip, user_agent):
    conn = get_pg_connection()
    if conn is not None:
        try:
            execute_query("""
                INSERT INTO visits (ip, count, last_visit, user_agent)
                VALUES (%s, 1, %s, %s)
                ON CONFLICT (ip)
                DO UPDATE SET count = visits.count + 1, last_visit = EXCLUDED.last_visit, user_agent = EXCLUDED.user_agent
            """, (ip, get_utc_now(), user_agent))
        except Exception as e:
            print(f"PostgreSQL track_visit error: {e}")
    else:
        data = read_json_db()
        found = False
        for v in data["visits"]:
            if v["ip"] == ip:
                v["count"] = v.get("count", 1) + 1
                v["lastVisit"] = get_utc_now().isoformat()
                v["userAgent"] = user_agent
                found = True
                break
        if not found:
            data["visits"].append({
                "ip": ip,
                "count": 1,
                "lastVisit": get_utc_now().isoformat(),
                "userAgent": user_agent
            })
        write_json_db(data)

def add_subscriber(email):
    conn = get_pg_connection()
    if conn is not None:
        try:
            row = execute_query("SELECT email FROM subscribers WHERE email = %s", (email,), fetch="one")
            if row:
                return {"success": True, "message": "Already subscribed!"}
            execute_query("INSERT INTO subscribers (email, date) VALUES (%s, %s)", (email, get_utc_now()))
            return {"success": True, "message": "Subscribed successfully!"}
        except Exception as e:
            print(f"PostgreSQL add_subscriber error: {e}")
            return {"success": False, "message": str(e)}
    else:
        data = read_json_db()
        for s in data["subscribers"]:
            if s["email"] == email:
                return {"success": True, "message": "Already subscribed!"}
        data["subscribers"].append({
            "_id": str(int(get_utc_now().timestamp() * 1000)),
            "email": email,
            "date": get_utc_now().isoformat()
        })
        write_json_db(data)
        return {"success": True, "message": "Subscribed successfully!"}

def save_message(name, email, message):
    conn = get_pg_connection()
    if conn is not None:
        try:
            execute_query("INSERT INTO messages (name, email, message, date) VALUES (%s, %s, %s, %s)",
                          (name, email, message, get_utc_now()))
        except Exception as e:
            print(f"PostgreSQL save_message error: {e}")
    else:
        data = read_json_db()
        data["messages"].append({
            "_id": str(int(get_utc_now().timestamp() * 1000)),
            "name": name,
            "email": email,
            "message": message,
            "date": get_utc_now().isoformat()
        })
        write_json_db(data)

def book_call(booking_data):
    conn = get_pg_connection()
    if conn is not None:
        try:
            execute_query("""
                INSERT INTO bookings (name, email, date, time, topic, notes, date_booked)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (booking_data.get("name"), booking_data.get("email"), booking_data.get("date"),
                  booking_data.get("time"), booking_data.get("topic"), booking_data.get("notes"), get_utc_now()))
        except Exception as e:
            print(f"PostgreSQL book_call error: {e}")
    else:
        data = read_json_db()
        mapped = {
            "_id": str(int(get_utc_now().timestamp() * 1000)),
            "name": booking_data.get("name"),
            "email": booking_data.get("email"),
            "date": booking_data.get("date"),
            "time": booking_data.get("time"),
            "topic": booking_data.get("topic"),
            "notes": booking_data.get("notes"),
            "dateBooked": get_utc_now().isoformat()
        }
        data["bookings"].append(mapped)
        write_json_db(data)

def get_testimonials():
    conn = get_pg_connection()
    if conn is not None:
        try:
            rows = execute_query("SELECT id, name, role, quote, avatar, date FROM testimonials ORDER BY date DESC", fetch="all")
            return serialize_docs(rows or [])
        except Exception as e:
            print(f"PostgreSQL get_testimonials error: {e}")
            return []
    else:
        data = read_json_db()
        return sorted(data.get("testimonials", []), key=lambda x: x.get("date", ""), reverse=True)

def add_testimonial(name, org, comment, avatar):
    conn = get_pg_connection()
    if conn is not None:
        try:
            row = execute_query("""
                INSERT INTO testimonials (name, role, quote, avatar, date)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, name, role, quote, avatar, date
            """, (name, org, comment, avatar, get_utc_now()), fetch="one")
            return serialize_doc(row)
        except Exception as e:
            print(f"PostgreSQL add_testimonial error: {e}")
            raise e
    else:
        data = read_json_db()
        doc = {
            "_id": str(int(get_utc_now().timestamp() * 1000)),
            "name": name,
            "role": org,
            "quote": comment,
            "avatar": avatar,
            "date": get_utc_now().isoformat()
        }
        data["testimonials"].append(doc)
        write_json_db(data)
        return doc

def get_stats_data():
    conn = get_pg_connection()
    if conn is not None:
        try:
            visits = execute_query("SELECT id, ip, count, last_visit as \"lastVisit\", user_agent as \"userAgent\" FROM visits", fetch="all") or []
            subscribers = execute_query("SELECT id, email, date FROM subscribers", fetch="all") or []
            messages = execute_query("SELECT id, name, email, message, date FROM messages", fetch="all") or []
            bookings = execute_query("SELECT id, name, email, date, time, topic, notes, date_booked as \"dateBooked\" FROM bookings", fetch="all") or []
            testimonials = execute_query("SELECT id, name, role, quote, avatar, date FROM testimonials", fetch="all") or []
            return {
                "visits": serialize_docs(visits),
                "subscribers": serialize_docs(subscribers),
                "messages": serialize_docs(messages),
                "bookings": serialize_docs(bookings),
                "testimonials": serialize_docs(testimonials)
            }
        except Exception as e:
            print(f"PostgreSQL get_stats_data error: {e}")
            return {"visits": [], "subscribers": [], "messages": [], "bookings": [], "testimonials": []}
    else:
        data = read_json_db()
        return {
            "visits": data.get("visits", []),
            "subscribers": data.get("subscribers", []),
            "messages": data.get("messages", []),
            "bookings": data.get("bookings", []),
            "testimonials": data.get("testimonials", [])
        }

def get_projects():
    conn = get_pg_connection()
    if conn is not None:
        try:
            rows = execute_query("SELECT id, name, description, image_url as \"imageUrl\", tags, demo_url as \"demoUrl\", github_url as \"githubUrl\", date FROM projects ORDER BY date DESC", fetch="all")
            return serialize_docs(rows or [])
        except Exception as e:
            print(f"PostgreSQL get_projects error: {e}")
            return []
    else:
        data = read_json_db()
        return data.get("projects", [])

def save_project(project_data):
    proj_id = project_data.get("id")
    name = project_data.get("name")
    desc = project_data.get("description")
    img = project_data.get("imageUrl")
    tags = project_data.get("tags")
    demo = project_data.get("demoUrl")
    github = project_data.get("githubUrl")
    
    conn = get_pg_connection()
    if conn is not None:
        try:
            if proj_id:
                execute_query("""
                    UPDATE projects
                    SET name=%s, description=%s, image_url=%s, tags=%s, demo_url=%s, github_url=%s
                    WHERE id=%s
                """, (name, desc, img, tags, demo, github, int(proj_id)))
            else:
                execute_query("""
                    INSERT INTO projects (name, description, image_url, tags, demo_url, github_url, date)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (name, desc, img, tags, demo, github, get_utc_now()))
        except Exception as e:
            print(f"PostgreSQL save_project error: {e}")
    else:
        data = read_json_db()
        mapped_data = {
            "name": name,
            "description": desc,
            "imageUrl": img,
            "tags": tags,
            "demoUrl": demo,
            "githubUrl": github
        }
        if proj_id:
            for p in data["projects"]:
                if p["_id"] == proj_id:
                    p.update(mapped_data)
                    break
        else:
            mapped_data["_id"] = str(int(get_utc_now().timestamp() * 1000))
            mapped_data["date"] = get_utc_now().isoformat()
            data["projects"].append(mapped_data)
        write_json_db(data)

def delete_project(project_id):
    conn = get_pg_connection()
    if conn is not None:
        try:
            execute_query("DELETE FROM projects WHERE id=%s", (int(project_id),))
        except Exception as e:
            print(f"PostgreSQL delete_project error: {e}")
    else:
        data = read_json_db()
        data["projects"] = [p for p in data["projects"] if p["_id"] != project_id]
        write_json_db(data)

def get_lenses():
    conn = get_pg_connection()
    if conn is not None:
        try:
            rows = execute_query("SELECT id, name, description, lens_url as \"lensUrl\", snapcode_url as \"snapcodeUrl\", views, active_ad_bar as \"activeAdBar\", date FROM lenses ORDER BY date DESC", fetch="all")
            return serialize_docs(rows or [])
        except Exception as e:
            print(f"PostgreSQL get_lenses error: {e}")
            return []
    else:
        data = read_json_db()
        return data.get("lenses", [])

def save_lens(lens_data):
    lens_id = lens_data.get("id")
    name = lens_data.get("name")
    desc = lens_data.get("description")
    url = lens_data.get("lensUrl")
    snapcode = lens_data.get("snapcodeUrl")
    views = lens_data.get("views")
    active_ad = lens_data.get("activeAdBar") == True or lens_data.get("activeAdBar") == 'true'
    
    conn = get_pg_connection()
    if conn is not None:
        try:
            if active_ad:
                execute_query("UPDATE lenses SET active_ad_bar = FALSE")
            if lens_id:
                execute_query("""
                    UPDATE lenses
                    SET name=%s, description=%s, lens_url=%s, snapcode_url=%s, views=%s, active_ad_bar=%s
                    WHERE id=%s
                """, (name, desc, url, snapcode, views, active_ad, int(lens_id)))
            else:
                execute_query("""
                    INSERT INTO lenses (name, description, lens_url, snapcode_url, views, active_ad_bar, date)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (name, desc, url, snapcode, views, active_ad, get_utc_now()))
        except Exception as e:
            print(f"PostgreSQL save_lens error: {e}")
    else:
        data = read_json_db()
        mapped_data = {
            "name": name,
            "description": desc,
            "lensUrl": url,
            "snapcodeUrl": snapcode,
            "views": views,
            "activeAdBar": active_ad
        }
        if active_ad:
            for l in data["lenses"]:
                l["activeAdBar"] = False
        if lens_id:
            for l in data["lenses"]:
                if l["_id"] == lens_id:
                    l.update(mapped_data)
                    break
        else:
            mapped_data["_id"] = str(int(get_utc_now().timestamp() * 1000))
            mapped_data["date"] = get_utc_now().isoformat()
            data["lenses"].append(mapped_data)
        write_json_db(data)

def delete_lens(lens_id):
    conn = get_pg_connection()
    if conn is not None:
        try:
            execute_query("DELETE FROM lenses WHERE id=%s", (int(lens_id),))
        except Exception as e:
            print(f"PostgreSQL delete_lens error: {e}")
    else:
        data = read_json_db()
        data["lenses"] = [l for l in data["lenses"] if l["_id"] != lens_id]
        write_json_db(data)

def get_active_ad_lens():
    conn = get_pg_connection()
    if conn is not None:
        try:
            row = execute_query("SELECT id, name, description, lens_url as \"lensUrl\", snapcode_url as \"snapcodeUrl\", views, active_ad_bar as \"activeAdBar\", date FROM lenses WHERE active_ad_bar = TRUE LIMIT 1", fetch="one")
            return serialize_doc(row)
        except Exception as e:
            print(f"PostgreSQL get_active_ad_lens error: {e}")
            return None
    else:
        data = read_json_db()
        for l in data["lenses"]:
            if l.get("activeAdBar") is True:
                return l
        return None

def delete_testimonial(testimonial_id):
    conn = get_pg_connection()
    if conn is not None:
        try:
            execute_query("DELETE FROM testimonials WHERE id=%s", (int(testimonial_id),))
            return True
        except Exception as e:
            print(f"PostgreSQL delete_testimonial error: {e}")
            return False
    else:
        data = read_json_db()
        data["testimonials"] = [t for t in data.get("testimonials", []) if t.get("_id") != testimonial_id]
        write_json_db(data)
        return True

def delete_message(message_id):
    conn = get_pg_connection()
    if conn is not None:
        try:
            execute_query("DELETE FROM messages WHERE id=%s", (int(message_id),))
            return True
        except Exception as e:
            print(f"PostgreSQL delete_message error: {e}")
            return False
    else:
        data = read_json_db()
        data["messages"] = [m for m in data.get("messages", []) if m.get("_id") != message_id]
        write_json_db(data)
        return True

def delete_booking(booking_id):
    conn = get_pg_connection()
    if conn is not None:
        try:
            execute_query("DELETE FROM bookings WHERE id=%s", (int(booking_id),))
            return True
        except Exception as e:
            print(f"PostgreSQL delete_booking error: {e}")
            return False
    else:
        data = read_json_db()
        data["bookings"] = [b for b in data.get("bookings", []) if b.get("_id") != booking_id]
        write_json_db(data)
        return True

def delete_subscriber(sub_id_or_email):
    conn = get_pg_connection()
    if conn is not None:
        try:
            try:
                sid = int(sub_id_or_email)
                execute_query("DELETE FROM subscribers WHERE id=%s", (sid,))
            except ValueError:
                execute_query("DELETE FROM subscribers WHERE email=%s", (sub_id_or_email,))
            return True
        except Exception as e:
            print(f"PostgreSQL delete_subscriber error: {e}")
            return False
    else:
        data = read_json_db()
        data["subscribers"] = [s for s in data.get("subscribers", []) if s.get("_id") != sub_id_or_email and s.get("email") != sub_id_or_email]
        write_json_db(data)
        return True

def get_posters():
    conn = get_pg_connection()
    if conn is not None:
        try:
            rows = execute_query("SELECT id, image_url as \"imageUrl\", redirect_url as \"redirectUrl\", date FROM posters ORDER BY id DESC", fetch="all")
            return serialize_docs(rows)
        except Exception as e:
            print(f"PostgreSQL get_posters error: {e}")
            return []
    else:
        data = read_json_db()
        return data.get("posters", [])

def save_poster(img_url, redirect_url, poster_id=None):
    conn = get_pg_connection()
    if conn is not None:
        try:
            if poster_id:
                execute_query("UPDATE posters SET image_url=%s, redirect_url=%s WHERE id=%s", (img_url, redirect_url, int(poster_id)))
            else:
                execute_query("INSERT INTO posters (image_url, redirect_url, date) VALUES (%s, %s, %s)", (img_url, redirect_url, get_utc_now()))
        except Exception as e:
            print(f"PostgreSQL save_poster error: {e}")
    else:
        data = read_json_db()
        if "posters" not in data:
            data["posters"] = []
            
        mapped_data = {
            "imageUrl": img_url,
            "redirectUrl": redirect_url
        }
        
        if poster_id:
            for p in data["posters"]:
                if p.get("_id") == poster_id:
                    p.update(mapped_data)
                    break
        else:
            mapped_data["_id"] = str(int(get_utc_now().timestamp() * 1000))
            mapped_data["date"] = get_utc_now().isoformat()
            data["posters"].append(mapped_data)
        write_json_db(data)

def delete_poster(poster_id):
    conn = get_pg_connection()
    if conn is not None:
        try:
            execute_query("DELETE FROM posters WHERE id=%s", (int(poster_id),))
        except Exception as e:
            print(f"PostgreSQL delete_poster error: {e}")
    else:
        data = read_json_db()
        data["posters"] = [p for p in data.get("posters", []) if p.get("_id") != poster_id]
        write_json_db(data)
