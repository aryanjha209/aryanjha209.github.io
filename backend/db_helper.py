import os
import json
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

MONGODB_URI = os.environ.get("MONGODB_URI")
MONGODB_DB_NAME = os.environ.get("MONGODB_DB_NAME", "portfolio")
JSON_DB_PATH = os.path.join(os.path.dirname(__file__), "database.json")

db = None
mongo_client = None

if MONGODB_URI:
    try:
        mongo_client = MongoClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=5000,  # fail fast if DNS/network issue
            connectTimeoutMS=5000,
            socketTimeoutMS=10000,
        )
        mongo_client.admin.command('ping')
        try:
            db = mongo_client.get_database()
        except Exception:
            db = mongo_client[MONGODB_DB_NAME]
        print("Connected to MongoDB successfully.")
    except Exception as e:
        print(f"MongoDB connection failed: {e}. Falling back to local JSON database.")
        if mongo_client:
            try:
                mongo_client.close()
            except Exception:
                pass
        mongo_client = None
        db = None
else:
    print("MONGODB_URI not found. Using local JSON database (database.json).")

def read_json_db():
    if not os.path.exists(JSON_DB_PATH):
        return {
            "visits": [], "subscribers": [], "messages": [], 
            "bookings": [], "testimonials": [], "projects": [], "lenses": []
        }
    try:
        with open(JSON_DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading JSON database: {e}")
        return {
            "visits": [], "subscribers": [], "messages": [], 
            "bookings": [], "testimonials": [], "projects": [], "lenses": []
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
        "bookings": [], "testimonials": [], "projects": [], "lenses": []
    })

def serialize_doc(doc):
    if not doc:
        return None
    doc["_id"] = str(doc["_id"])
    for k, v in doc.items():
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
    return doc

def serialize_docs(docs):
    return [serialize_doc(doc) for doc in docs]

def to_object_id(id_str):
    if not id_str:
        return None
    try:
        return ObjectId(id_str)
    except Exception:
        return id_str

# Exported helper methods
def track_visit(ip, user_agent):
    if db is not None:
        try:
            db.visits.update_one(
                {"ip": ip},
                {
                    "$inc": {"count": 1},
                    "$set": {"lastVisit": datetime.utcnow(), "userAgent": user_agent}
                },
                upsert=True
            )
        except Exception as e:
            print(f"MongoDB track_visit error: {e}")
    else:
        data = read_json_db()
        found = False
        for v in data["visits"]:
            if v["ip"] == ip:
                v["count"] = v.get("count", 0) + 1
                v["lastVisit"] = datetime.utcnow().isoformat()
                v["userAgent"] = user_agent
                found = True
                break
        if not found:
            data["visits"].append({
                "ip": ip,
                "count": 1,
                "lastVisit": datetime.utcnow().isoformat(),
                "userAgent": user_agent
            })
        write_json_db(data)

def add_subscriber(email):
    if db is not None:
        try:
            sub = db.subscribers.find_one({"email": email})
            if sub:
                return {"success": True, "message": "Already subscribed!"}
            db.subscribers.insert_one({
                "email": email,
                "date": datetime.utcnow()
            })
            return {"success": True, "message": "Subscribed successfully!"}
        except Exception as e:
            print(f"MongoDB add_subscriber error: {e}")
            return {"success": False, "message": str(e)}
    else:
        data = read_json_db()
        for s in data["subscribers"]:
            if s["email"] == email:
                return {"success": True, "message": "Already subscribed!"}
        data["subscribers"].append({
            "_id": str(int(datetime.utcnow().timestamp() * 1000)),
            "email": email,
            "date": datetime.utcnow().isoformat()
        })
        write_json_db(data)
        return {"success": True, "message": "Subscribed successfully!"}

def save_message(name, email, message):
    if db is not None:
        try:
            db.messages.insert_one({
                "name": name,
                "email": email,
                "message": message,
                "date": datetime.utcnow()
            })
        except Exception as e:
            print(f"MongoDB save_message error: {e}")
    else:
        data = read_json_db()
        data["messages"].append({
            "_id": str(int(datetime.utcnow().timestamp() * 1000)),
            "name": name,
            "email": email,
            "message": message,
            "date": datetime.utcnow().isoformat()
        })
        write_json_db(data)

def book_call(booking_data):
    # Map incoming properties
    mapped_data = {
        "name": booking_data.get("name"),
        "email": booking_data.get("email"),
        "date": booking_data.get("date"),
        "time": booking_data.get("time"),
        "topic": booking_data.get("topic"),
        "notes": booking_data.get("notes"),
    }
    if db is not None:
        try:
            mapped_data["dateBooked"] = datetime.utcnow()
            db.bookings.insert_one(mapped_data)
        except Exception as e:
            print(f"MongoDB book_call error: {e}")
    else:
        data = read_json_db()
        mapped_data["_id"] = str(int(datetime.utcnow().timestamp() * 1000))
        mapped_data["dateBooked"] = datetime.utcnow().isoformat()
        data["bookings"].append(mapped_data)
        write_json_db(data)

def get_testimonials():
    if db is not None:
        try:
            docs = list(db.testimonials.find({}).sort("date", -1))
            return serialize_docs(docs)
        except Exception as e:
            print(f"MongoDB get_testimonials error: {e}")
            return []
    else:
        data = read_json_db()
        testimonials = data.get("testimonials", [])
        return sorted(testimonials, key=lambda x: x.get("date", ""), reverse=True)

def add_testimonial(name, org, comment, avatar):
    # Node version mapped comment to quote, org to role, and testimonial to quote
    testimonial_doc = {
        "name": name,
        "role": org, # frontend maps org to role
        "quote": comment, # frontend maps comment to quote
        "avatar": avatar,
    }
    if db is not None:
        try:
            testimonial_doc["date"] = datetime.utcnow()
            result = db.testimonials.insert_one(testimonial_doc)
            testimonial_doc["_id"] = result.inserted_id
            return serialize_doc(testimonial_doc)
        except Exception as e:
            print(f"MongoDB add_testimonial error: {e}")
            raise e
    else:
        data = read_json_db()
        testimonial_doc["_id"] = str(int(datetime.utcnow().timestamp() * 1000))
        testimonial_doc["date"] = datetime.utcnow().isoformat()
        data["testimonials"].append(testimonial_doc)
        write_json_db(data)
        return testimonial_doc

def get_stats_data():
    if db is not None:
        try:
            visits = list(db.visits.find({}))
            subscribers = list(db.subscribers.find({}))
            messages = list(db.messages.find({}))
            bookings = list(db.bookings.find({}))
            testimonials = list(db.testimonials.find({}))
            return {
                "visits": serialize_docs(visits),
                "subscribers": serialize_docs(subscribers),
                "messages": serialize_docs(messages),
                "bookings": serialize_docs(bookings),
                "testimonials": serialize_docs(testimonials)
            }
        except Exception as e:
            print(f"MongoDB get_stats_data error: {e}")
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
    if db is not None:
        try:
            docs = list(db.projects.find({}).sort("date", -1))
            return serialize_docs(docs)
        except Exception as e:
            print(f"MongoDB get_projects error: {e}")
            return []
    else:
        data = read_json_db()
        return data.get("projects", [])

def save_project(project_data):
    proj_id = project_data.get("id")
    mapped_data = {
        "name": project_data.get("name"),
        "description": project_data.get("description"),
        "imageUrl": project_data.get("imageUrl"),
        "tags": project_data.get("tags"),
        "demoUrl": project_data.get("demoUrl"),
        "githubUrl": project_data.get("githubUrl")
    }
    if db is not None:
        try:
            if proj_id:
                db.projects.update_one({"_id": to_object_id(proj_id)}, {"$set": mapped_data})
            else:
                mapped_data["date"] = datetime.utcnow()
                db.projects.insert_one(mapped_data)
        except Exception as e:
            print(f"MongoDB save_project error: {e}")
    else:
        data = read_json_db()
        if proj_id:
            for p in data["projects"]:
                if p["_id"] == proj_id:
                    p.update(mapped_data)
                    break
        else:
            mapped_data["_id"] = str(int(datetime.utcnow().timestamp() * 1000))
            mapped_data["date"] = datetime.utcnow().isoformat()
            data["projects"].append(mapped_data)
        write_json_db(data)

def delete_project(project_id):
    if db is not None:
        try:
            db.projects.delete_one({"_id": to_object_id(project_id)})
        except Exception as e:
            print(f"MongoDB delete_project error: {e}")
    else:
        data = read_json_db()
        data["projects"] = [p for p in data["projects"] if p["_id"] != project_id]
        write_json_db(data)

def get_lenses():
    if db is not None:
        try:
            docs = list(db.lenses.find({}).sort("date", -1))
            return serialize_docs(docs)
        except Exception as e:
            print(f"MongoDB get_lenses error: {e}")
            return []
    else:
        data = read_json_db()
        return data.get("lenses", [])

def save_lens(lens_data):
    lens_id = lens_data.get("id")
    active_ad = lens_data.get("activeAdBar", False)
    mapped_data = {
        "name": lens_data.get("name"),
        "description": lens_data.get("description"),
        "lensUrl": lens_data.get("lensUrl"),
        "snapcodeUrl": lens_data.get("snapcodeUrl"),
        "views": lens_data.get("views"),
        "activeAdBar": active_ad
    }
    if db is not None:
        try:
            if active_ad:
                db.lenses.update_many({}, {"$set": {"activeAdBar": False}})
            if lens_id:
                db.lenses.update_one({"_id": to_object_id(lens_id)}, {"$set": mapped_data})
            else:
                mapped_data["date"] = datetime.utcnow()
                db.lenses.insert_one(mapped_data)
        except Exception as e:
            print(f"MongoDB save_lens error: {e}")
    else:
        data = read_json_db()
        if active_ad:
            for l in data["lenses"]:
                l["activeAdBar"] = False
        if lens_id:
            for l in data["lenses"]:
                if l["_id"] == lens_id:
                    l.update(mapped_data)
                    break
        else:
            mapped_data["_id"] = str(int(datetime.utcnow().timestamp() * 1000))
            mapped_data["date"] = datetime.utcnow().isoformat()
            data["lenses"].append(mapped_data)
        write_json_db(data)

def delete_lens(lens_id):
    if db is not None:
        try:
            db.lenses.delete_one({"_id": to_object_id(lens_id)})
        except Exception as e:
            print(f"MongoDB delete_lens error: {e}")
    else:
        data = read_json_db()
        data["lenses"] = [l for l in data["lenses"] if l["_id"] != lens_id]
        write_json_db(data)

def get_active_ad_lens():
    if db is not None:
        try:
            doc = db.lenses.find_one({"activeAdBar": True})
            return serialize_doc(doc)
        except Exception as e:
            print(f"MongoDB get_active_ad_lens error: {e}")
            return None
    else:
        data = read_json_db()
        for l in data["lenses"]:
            if l.get("activeAdBar") is True:
                return l
        return None

def delete_testimonial(testimonial_id):
    if db is not None:
        try:
            db.testimonials.delete_one({"_id": to_object_id(testimonial_id)})
            return True
        except Exception as e:
            print(f"MongoDB delete_testimonial error: {e}")
            return False
    else:
        data = read_json_db()
        data["testimonials"] = [t for t in data.get("testimonials", []) if t.get("_id") != testimonial_id]
        write_json_db(data)
        return True

def delete_message(message_id):
    if db is not None:
        try:
            db.messages.delete_one({"_id": to_object_id(message_id)})
            return True
        except Exception as e:
            print(f"MongoDB delete_message error: {e}")
            return False
    else:
        data = read_json_db()
        data["messages"] = [m for m in data.get("messages", []) if m.get("_id") != message_id]
        write_json_db(data)
        return True

def delete_booking(booking_id):
    if db is not None:
        try:
            db.bookings.delete_one({"_id": to_object_id(booking_id)})
            return True
        except Exception as e:
            print(f"MongoDB delete_booking error: {e}")
            return False
    else:
        data = read_json_db()
        data["bookings"] = [b for b in data.get("bookings", []) if b.get("_id") != booking_id]
        write_json_db(data)
        return True

def delete_subscriber(sub_id_or_email):
    if db is not None:
        try:
            try:
                oid = ObjectId(sub_id_or_email)
                db.subscribers.delete_one({"_id": oid})
            except Exception:
                db.subscribers.delete_one({"email": sub_id_or_email})
            return True
        except Exception as e:
            print(f"MongoDB delete_subscriber error: {e}")
            return False
    else:
        data = read_json_db()
        data["subscribers"] = [s for s in data.get("subscribers", []) if s.get("_id") != sub_id_or_email and s.get("email") != sub_id_or_email]
        write_json_db(data)
        return True
