from http.server import BaseHTTPRequestHandler
import json
import datetime
import os
import sqlite3
import hashlib
import ssl
import smtplib
import urllib.request
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from urllib.parse import parse_qs, urlparse

# Define persistent DB file path suitable for both local development and Vercel serverless environment
DB_DIR = os.environ.get("DB_DIR")
if not DB_DIR:
    curr_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    try:
        test_file = os.path.join(curr_dir, ".write_test")
        with open(test_file, "w") as f:
            f.write("test")
        os.remove(test_file)
        DB_DIR = curr_dir
    except Exception:
        DB_DIR = "/tmp"

if not os.path.exists(DB_DIR):
    try:
        os.makedirs(DB_DIR, exist_ok=True)
    except Exception:
        DB_DIR = "/tmp"

DB_FILE = os.path.join(DB_DIR, "attendance_v6.db")

import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

OTP_SECRET = os.environ.get("OTP_SECRET", "THEKEDAR_SECURE_OTP_SECRET_KEY_2026")

def init_db():
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS app_state (
                key TEXT PRIMARY KEY,
                val TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS otp_verifications (
                email TEXT PRIMARY KEY,
                otp_hash TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                resend_available_at TIMESTAMP NOT NULL,
                verified INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()
    except Exception as e:
        print("DB init warning:", e)

def send_real_email_otp(to_email, otp_code):
    gmail_user = os.environ.get("GMAIL_USER") or os.environ.get("SMTP_USER") or os.environ.get("EMAIL_USER") or os.environ.get("MAIL_USERNAME")
    gmail_pass = os.environ.get("GMAIL_APP_PASSWORD") or os.environ.get("SMTP_PASS") or os.environ.get("EMAIL_PASS") or os.environ.get("MAIL_PASSWORD")

    if not gmail_user or not gmail_pass:
        print(f"[SMTP ERROR] Missing email credentials (GMAIL_USER / GMAIL_APP_PASSWORD) on server.")
        return False, "Email service is not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in server environment variables."

    # Clean user and password (remove spaces from 16-character App Password)
    smtp_user = gmail_user.strip()
    smtp_pass = gmail_pass.replace(" ", "").strip()
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com").strip()
    smtp_from = os.environ.get("SMTP_FROM", smtp_user).strip()

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"🔒 {otp_code} is your THEKEDAR Verification Code"
    msg['From'] = f"THEKEDAR Verification <{smtp_from}>"
    msg['To'] = to_email

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #38bdf8; margin: 0; font-size: 24px;">THEKEDAR PRO</h1>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Contractor & Workforce Management</p>
        </div>
        <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; text-align: center;">
            <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 12px;">Your Email Verification Code:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #f59e0b; margin: 15px 0;">{otp_code}</div>
            <p style="font-size: 12px; color: #94a3b8;">This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
        </div>
        <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 20px;">If you did not request this code, please ignore this email.</p>
    </div>
    """
    msg.attach(MIMEText(html_body, 'html'))

    # METHOD 0: Check for HTTP Email APIs (Resend / Brevo / SendGrid) which use HTTPS (Port 443) and never get blocked on Vercel
    resend_key = os.environ.get("RESEND_API_KEY")
    brevo_key = os.environ.get("BREVO_API_KEY") or os.environ.get("SENDINBLUE_API_KEY")

    if resend_key:
        try:
            req_data = json.dumps({
                "from": os.environ.get("EMAIL_FROM", "THEKEDAR PRO <onboarding@resend.dev>"),
                "to": [to_email],
                "subject": f"🔒 {otp_code} is your THEKEDAR Verification Code",
                "html": html_body
            }).encode('utf-8')
            req = urllib.request.Request("https://api.resend.com/emails", data=req_data, headers={
                "Authorization": f"Bearer {resend_key.strip()}",
                "Content-Type": "application/json"
            }, method="POST")
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status in (200, 201):
                    print(f"[HTTP API SUCCESS] Real Email OTP dispatched via Resend API to {to_email}")
                    return True, "SENT"
        except Exception as er:
            print(f"[HTTP Resend API Warning]: {er}")

    if brevo_key:
        try:
            req_data = json.dumps({
                "sender": {"name": "THEKEDAR PRO", "email": gmail_user or "no-reply@thekedarpro.com"},
                "to": [{"email": to_email}],
                "subject": f"🔒 {otp_code} is your THEKEDAR Verification Code",
                "htmlContent": html_body
            }).encode('utf-8')
            req = urllib.request.Request("https://api.brevo.com/v3/smtp/email", data=req_data, headers={
                "api-key": brevo_key.strip(),
                "Content-Type": "application/json",
                "Accept": "application/json"
            }, method="POST")
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status in (200, 201):
                    print(f"[HTTP API SUCCESS] Real Email OTP dispatched via Brevo API to {to_email}")
                    return True, "SENT"
        except Exception as eb:
            print(f"[HTTP Brevo API Warning]: {eb}")

    # Create SSL contexts (standard + cloud unverified fallback)
    context_std = ssl.create_default_context()
    context_unv = ssl._create_unverified_context()

    # Method 1: Try Port 587 STARTTLS (Standard)
    try:
        with smtplib.SMTP(smtp_host, 587, timeout=12) as server:
            server.ehlo()
            server.starttls(context=context_std)
            server.ehlo()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, [to_email], msg.as_string())
        print(f"[SMTP SUCCESS] Real Email OTP dispatched via 587 STARTTLS to {to_email}")
        return True, "SENT"
    except Exception as e1:
        print(f"[SMTP STARTTLS 587 Warning]: {e1}. Trying SSL 465...")

    # Method 2: Try Port 465 SSL (Standard)
    try:
        with smtplib.SMTP_SSL(smtp_host, 465, context=context_std, timeout=12) as server:
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, [to_email], msg.as_string())
        print(f"[SMTP SUCCESS] Real Email OTP dispatched via SSL 465 to {to_email}")
        return True, "SENT"
    except Exception as e2:
        print(f"[SMTP SSL 465 Warning]: {e2}. Trying 587 with unverified context...")

    # Method 3: Try Port 587 with Unverified Context (Cloud Serverless Container Fix)
    try:
        with smtplib.SMTP(smtp_host, 587, timeout=12) as server:
            server.ehlo()
            server.starttls(context=context_unv)
            server.ehlo()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, [to_email], msg.as_string())
        print(f"[SMTP SUCCESS] Real Email OTP dispatched via 587 unverified context to {to_email}")
        return True, "SENT"
    except Exception as e3:
        print(f"[SMTP Method 3 Error]: {e3}")
        err_detail = str(e3) or str(e2) or str(e1)
        return False, f"Gmail SMTP connection error: {err_detail}. Please verify GMAIL_USER & 16-digit GMAIL_APP_PASSWORD (and ensure 2-Step Verification is ON in Google Account)."

def get_db_state():
    try:
        init_db()
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT val FROM app_state WHERE key = 'store_data'")
        row = cursor.fetchone()
        conn.close()
        if row and row[0]:
            return json.loads(row[0])
    except Exception as e:
        print("Error reading DB state:", e)
    return None

def set_db_state(data_dict):
    try:
        init_db()
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
        return True
    except Exception as e:
        print("Error saving DB state:", e)
        return False

def validate_mobile_str(mobile_raw):
    if not mobile_raw:
        return False, "Please enter a valid phone number."
    s = str(mobile_raw).strip()
    # Check valid international characters: optional leading +, then digits, spaces, hyphens
    has_plus = s.startswith('+')
    clean = (s[1:] if has_plus else s).replace(" ", "").replace("-", "")
    
    if not clean.isdigit() or len(clean) < 7 or len(clean) > 15:
        return False, "Please enter a valid phone number."
    
    formatted = ("+" if has_plus else "") + clean
    return True, formatted

class handler(BaseHTTPRequestHandler):
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/health':
            state = get_db_state()
            has_companies = bool(state and isinstance(state, dict) and state.get('companies'))
            self.send_json({
                "status": "ok",
                "platform": "vercel",
                "db": "sqlite3",
                "file": DB_FILE,
                "has_persisted_data": has_companies
            })
            return
        elif path == '/api/time':
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
            self.send_json(resp_data)
            return
        elif path == '/api/full-store':
            db_state = get_db_state()
            self.send_json(db_state or {})
            return

        self.send_json({"error": "Endpoint not found"}, status=404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b'{}'
        
        try:
            payload = json.loads(post_data.decode('utf-8'))
        except Exception:
            payload = {}

        if path == '/api/full-store':
            if payload and 'companies' in payload:
                workers = payload.get('workers', [])
                for w in workers:
                    if 'mobile' in w and w['mobile']:
                        valid, clean_mob = validate_mobile_str(w['mobile'])
                        if valid:
                            w['mobile'] = clean_mob
                success = set_db_state(payload)
                self.send_json({
                    "success": success, 
                    "message": "Data persisted to SQLite database." if success else "Failed to persist data."
                })
            else:
                self.send_json({"success": False, "error": "Invalid store payload."}, status=400)
            return

        elif path == '/api/otp/send':
            email = payload.get('email', '').strip().lower()
            if not email or '@' not in email or '.' not in email:
                self.send_json({"success": False, "error": "Please enter a valid email address."}, status=400)
                return

            init_db()
            now_dt = datetime.datetime.utcnow()
            now_ts = int(now_dt.timestamp())

            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("SELECT resend_available_at, verified FROM otp_verifications WHERE email = ?", (email,))
            row = cursor.fetchone()

            if row:
                resend_at = int(row[0]) if str(row[0]).isdigit() else 0
                if now_ts < resend_at:
                    cooldown = resend_at - now_ts
                    conn.close()
                    self.send_json({
                        "success": False, 
                        "error": f"Please wait {cooldown} seconds before requesting a new OTP.",
                        "cooldown": cooldown
                    }, status=429)
                    return

            # Generate 6-digit OTP
            otp_code = f"{random.randint(100000, 999999)}"
            otp_hash = hashlib.sha256(f"{email}:{otp_code}:{OTP_SECRET}".encode('utf-8')).hexdigest()

            # 10 minutes expiry (600s), 60s cooldown
            expires_at = now_ts + 600
            resend_available_at = now_ts + 60

            cursor.execute("""
                INSERT INTO otp_verifications (email, otp_hash, expires_at, resend_available_at, verified, created_at)
                VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
                ON CONFLICT(email) DO UPDATE SET
                    otp_hash = excluded.otp_hash,
                    expires_at = excluded.expires_at,
                    resend_available_at = excluded.resend_available_at,
                    verified = 0,
                    created_at = CURRENT_TIMESTAMP
            """, (email, otp_hash, expires_at, resend_available_at))
            conn.commit()
            conn.close()

            # Dispatch Email via Gmail SMTP
            sent_ok, msg_res = send_real_email_otp(email, otp_code)

            if not sent_ok:
                self.send_json({
                    "success": False,
                    "error": msg_res
                }, status=400)
                return

            self.send_json({
                "success": True,
                "message": f"6-digit verification code sent to {email}. Valid for 10 minutes.",
                "cooldown": 60
            })
            return

        elif path == '/api/otp/verify':
            email = payload.get('email', '').strip().lower()
            otp = payload.get('otp', '').strip()

            if not email or not otp:
                self.send_json({"success": False, "error": "Email address and OTP code are required."}, status=400)
                return

            init_db()
            now_ts = int(datetime.datetime.utcnow().timestamp())

            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("SELECT otp_hash, expires_at, verified FROM otp_verifications WHERE email = ?", (email,))
            row = cursor.fetchone()

            if not row:
                conn.close()
                self.send_json({"success": False, "error": "No OTP requested for this email address. Please click Send OTP."}, status=400)
                return

            stored_hash, expires_at_val, is_verified = row[0], int(row[1]), int(row[2])

            if is_verified == 1:
                conn.close()
                self.send_json({"success": True, "message": "✓ Email address is already verified!", "emailVerified": True})
                return

            if now_ts > expires_at_val:
                conn.close()
                self.send_json({"success": False, "error": "OTP expired, resend OTP"}, status=400)
                return

            input_hash = hashlib.sha256(f"{email}:{otp}:{OTP_SECRET}".encode('utf-8')).hexdigest()

            if input_hash != stored_hash:
                conn.close()
                self.send_json({"success": False, "error": "Galat OTP. Please check and try again."}, status=400)
                return

            # OTP Correct: Mark as verified
            cursor.execute("UPDATE otp_verifications SET verified = 1 WHERE email = ?", (email,))
            conn.commit()
            conn.close()

            self.send_json({
                "success": True,
                "message": "✓ Email verified successfully!",
                "emailVerified": True
            })
            return

        elif path == '/api/otp/status':
            email = payload.get('email', '').strip().lower()
            if not email:
                self.send_json({"verified": False})
                return

            init_db()
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("SELECT verified FROM otp_verifications WHERE email = ?", (email,))
            row = cursor.fetchone()
            conn.close()

            verified = bool(row and row[0] == 1)
            self.send_json({"success": True, "email": email, "verified": verified})
            return

        elif path == '/api/whatsapp/verify-number':
            mobile_raw = payload.get('mobile', '')
            valid_fmt, clean_mob = validate_mobile_str(mobile_raw)

            if not valid_fmt:
                self.send_json({"success": False, "whatsappVerified": False, "error": clean_mob}, status=400)
                return

            # Check duplicate numbers in existing companies
            current_data = get_db_state() or {}
            companies = current_data.get('companies', [])
            for c in companies:
                if c.get('mobile') == clean_mob:
                    self.send_json({"success": False, "whatsappVerified": False, "error": "This phone number cannot be used. Please check the number and try again."}, status=400)
                    return

            # Read WhatsApp Provider / Meta Cloud API credentials from environment variables
            wa_token = os.environ.get("WHATSAPP_ACCESS_TOKEN") or os.environ.get("META_WHATSAPP_TOKEN") or os.environ.get("WHATSAPP_API_KEY")
            wa_phone_id = os.environ.get("WHATSAPP_PHONE_NUMBER_ID") or os.environ.get("META_PHONE_ID")

            if not wa_token or not wa_phone_id:
                # Security Requirement: Do NOT fake validation results when provider is not configured.
                self.send_json({
                    "success": False,
                    "whatsappVerified": False,
                    "code": "PROVIDER_NOT_CONFIGURED",
                    "error": "Wrong number or try again"
                }, status=501)
                return

            # Background Lookup via official Meta WhatsApp Graph API contacts endpoint
            try:
                url = f"https://graph.facebook.com/v17.0/{wa_phone_id.strip()}/contacts"
                body_data = json.dumps({
                    "blocking": "wait",
                    "contacts": [f"+91{clean_mob}"]
                }).encode('utf-8')

                req = urllib.request.Request(url, data=body_data, headers={
                    "Authorization": f"Bearer {wa_token.strip()}",
                    "Content-Type": "application/json"
                }, method="POST")

                with urllib.request.urlopen(req, timeout=10) as resp:
                    res_json = json.loads(resp.read().decode('utf-8'))
                    contacts = res_json.get('contacts', [])
                    if contacts and len(contacts) > 0 and contacts[0].get('status') == 'valid':
                        self.send_json({
                            "success": True,
                            "whatsappVerified": True,
                            "mobile": clean_mob,
                            "message": "✓ WhatsApp number verified"
                        })
                        return
                    else:
                        self.send_json({
                            "success": False,
                            "whatsappVerified": False,
                            "mobile": clean_mob,
                            "error": "Wrong number or try again"
                        }, status=400)
                        return
            except Exception as ex:
                print(f"[WhatsApp API Exception]: {ex}")
                self.send_json({
                    "success": False,
                    "whatsappVerified": False,
                    "error": "Please try again"
                }, status=502)
                return

        elif path == '/api/auth/register-company':
            current_data = get_db_state() or {}
            companies = current_data.get('companies', [])
            
            email = payload.get('email', '').strip().lower()
            mobile_raw = payload.get('mobile', '').strip()
            
            valid_fmt, mobile = validate_mobile_str(mobile_raw)
            if not valid_fmt:
                self.send_json({"success": False, "error": f"❌ {mobile}"}, status=400)
                return

            raw_gstin = payload.get('gstin', '')
            gstin = raw_gstin.strip().upper() if raw_gstin and str(raw_gstin).strip() else None
            gst_type = payload.get('gstStatus') or ('GST_VERIFIED' if gstin else 'NON_GST_REGISTERED')

            # Check duplicates
            for c in companies:
                if c.get('email', '').lower() == email:
                    self.send_json({"success": False, "error": "❌ This email address cannot be used. Please check the address and try again."}, status=400)
                    return
                if c.get('mobile') == mobile:
                    self.send_json({"success": False, "error": "❌ This phone number cannot be used. Please check the number and try again."}, status=400)
                    return
                if gstin and c.get('gstin') and c.get('gstin').upper() == gstin:
                    self.send_json({"success": False, "error": "❌ This GSTIN is already registered."}, status=400)
                    return

            company_id = f"GST-{gstin[:6]}-{mobile[-4:]}" if gstin else f"COMP-{hashlib.sha256(email.encode()).hexdigest()[:6].upper()}-{mobile[-4:]}"
            new_comp = {
                "id": company_id,
                "name": payload.get('name'),
                "legalName": payload.get('legalName') or payload.get('name'),
                "gstStatus": gst_type,
                "gstin": gstin,
                "businessType": payload.get('businessType') or 'Proprietorship',
                "ownerName": payload.get('ownerName'),
                "mobile": mobile,
                "email": email,
                "emailVerified": True,
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
            self.send_json({"success": True, "company": new_comp})
            return

        elif path == '/api/admin/delete-company':
            current_data = get_db_state() or {}
            target_id = payload.get('companyId', '').strip()
            if not target_id:
                self.send_json({"success": False, "error": "Company ID is required"}, status=400)
                return

            companies = current_data.get('companies', [])
            updated_comps = [c for c in companies if c.get('id') != target_id]

            workers = current_data.get('workers', [])
            updated_workers = [w for w in workers if w.get('companyId') != target_id]

            current_data['companies'] = updated_comps
            current_data['workers'] = updated_workers
            set_db_state(current_data)

            self.send_json({"success": True, "message": f"Company {target_id} permanently deleted"})
            return

        self.send_json({"error": "Endpoint not found"}, status=404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.end_headers()


