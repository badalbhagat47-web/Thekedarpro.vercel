#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys
import json
import sqlite3
import hashlib
from urllib.parse import parse_qs, urlparse

PORT = int(os.environ.get("PORT", 8000))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.environ.get("DB_DIR", DIRECTORY)
if not os.path.exists(DB_DIR):
    os.makedirs(DB_DIR, exist_ok=True)
DB_FILE = os.path.join(DB_DIR, "attendance_v6.db")

class ThreadedHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True

def run_server():
    port = PORT
    max_attempts = 10
    for attempt in range(max_attempts):
        try:
            with ThreadedHTTPServer(("", port), Handler) as httpd:
                print(f"Serving Contractor Attendance App at http://0.0.0.0:{port} (DB: {DB_FILE})")
                sys.stdout.flush()
                httpd.serve_forever()
                break
        except OSError as e:
            if attempt < max_attempts - 1:
                port += 1
            else:
                print(f"Error starting server: {e}")
                sys.exit(1)



def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS app_state (
            key TEXT PRIMARY KEY,
            val TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def get_db_state():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT val FROM app_state WHERE key = 'store_data'")
    row = cursor.fetchone()
    conn.close()
    if row and row[0]:
        try:
            return json.loads(row[0])
        except Exception:
            return None
    return None

def set_db_state(data_dict):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    json_str = json.dumps(data_dict)
    cursor.execute("""
        INSERT INTO app_state (key, val, updated_at)
        VALUES ('store_data', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET val=excluded.val, updated_at=CURRENT_TIMESTAMP
    """, (json_str,))
    conn.commit()
    conn.close()

init_db()

def validate_mobile_str(mobile_raw):
    if not mobile_raw:
        return False, "Mobile number is required."
    clean = str(mobile_raw).strip().replace(" ", "").replace("-", "")
    if clean.startswith("+91"):
        clean = clean[3:]
    if len(clean) != 10 or not clean.isdigit():
        return False, "Mobile number must be exactly 10 digits."
    return True, clean

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/full-store':
            self.send_json_response(get_db_state() or {})
            return
        elif parsed.path == '/api/time':
            import datetime
            ist_tz = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
            now_ist = datetime.datetime.now(ist_tz)
            now_utc = datetime.datetime.now(datetime.timezone.utc)
            
            resp_data = {
                "success": True,
                "iso_utc": now_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "date_ist": now_ist.strftime("%Y-%m-%d"),
                "time_ist": now_ist.strftime("%H:%M:%S"),
                "time_24_ist": now_ist.strftime("%H:%M"),
                "year_month": now_ist.strftime("%Y-%m-%d")[:7],
                "timestamp_ms": int(now_ist.timestamp() * 1000)
            }
            self.send_json_response(resp_data)
            return
        elif parsed.path == '/api/health':
            self.send_json_response({"status": "ok", "db": "sqlite3", "file": DB_FILE})
            return
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b'{}'
        
        try:
            payload = json.loads(post_data.decode('utf-8'))
        except Exception:
            payload = {}

        if parsed.path == '/api/full-store':
            if payload and 'companies' in payload:
                # Sanitize and validate worker mobile numbers in backend payload
                workers = payload.get('workers', [])
                for w in workers:
                    if 'mobile' in w and w['mobile']:
                        valid, clean_mob = validate_mobile_str(w['mobile'])
                        if valid:
                            w['mobile'] = clean_mob
                set_db_state(payload)
                self.send_json_response({"success": True, "message": "Data persisted to SQLite database."})
            else:
                self.send_json_response({"success": False, "error": "Invalid store payload."}, status=400)
            return

        elif parsed.path == '/api/auth/register-company':
            current_data = get_db_state() or {}
            companies = current_data.get('companies', [])
            
            email = payload.get('email', '').strip().lower()
            mobile = payload.get('mobile', '').strip()
            gstin = payload.get('gstin', '').strip().upper() if payload.get('gstin') else None

            # Check duplicates
            for c in companies:
                if c.get('email', '').lower() == email:
                    self.send_json_response({"success": False, "error": "❌ A company with this email address is already registered."}, status=400)
                    return
                if c.get('mobile') == mobile:
                    self.send_json_response({"success": False, "error": "❌ A company with this mobile number is already registered."}, status=400)
                    return
                if gstin and c.get('gstin') and c.get('gstin').upper() == gstin:
                    self.send_json_response({"success": False, "error": "❌ This GSTIN is already registered."}, status=400)
                    return

            company_id = f"COMP-{hashlib.sha256(email.encode()).hexdigest()[:6].upper()}-{mobile[-4:]}"
            new_comp = {
                "id": company_id,
                "name": payload.get('name'),
                "legalName": payload.get('legalName') or payload.get('name'),
                "gstStatus": payload.get('gstStatus') or ('GST_VERIFIED' if gstin else 'NON_GST_REGISTERED'),
                "gstin": gstin,
                "businessType": payload.get('businessType') or 'Proprietorship',
                "ownerName": payload.get('ownerName'),
                "mobile": mobile,
                "email": email,
                "address": payload.get('address') or 'Registered Business Address',
                "password": payload.get('password'),
                "logoUrl": payload.get('logoUrl', None),
                "stampUrl": payload.get('stampUrl', None),
                "tagline": payload.get('tagline', None),
                "website": payload.get('website', None),
                "createdAt": payload.get('createdAt') or "2026-10-04T00:00:00.000Z",
                "status": "ACTIVE",
                "settings": {
                    "fullDayStart": "09:00",
                    "halfDayStart": "13:00",
                    "closingTime": "17:00",
                    "defaultDailyWage": int(payload.get('defaultDailyWage', 700)),
                    "defaultOtRate": int(payload.get('defaultOtRate', 100)),
                    "fixedHolidaysCount": 4,
                    "fixedHolidayDates": []
                }
            }

            companies.append(new_comp)
            current_data['companies'] = companies
            set_db_state(current_data)
            self.send_json_response({"success": True, "company": new_comp})
            return

        self.send_json_response({"error": "Endpoint not found"}, status=404)

    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.end_headers()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

if __name__ == "__main__":
    run_server()
