# 🏗️ THEKEDAR PRO - Contractor Attendance & Payroll SaaS Platform

**THEKEDAR PRO** is a production-grade SaaS application designed for labor contractors, site managers, and construction companies to manage worker attendance, daily/hourly wages, overtime, advances, festival holidays, and automated A4 salary slip PDF generation.

---

## ✨ Features
- **100% Bilingual Support**: Instant switching between Hindi (हिंदी) and English.
- **Server-Authoritative IST Time Engine**: Synchronized check-in cutoffs, auto-checkouts, and 10-minute shift closing notifications.
- **Visual 3D Design System**: Light and Dark mode high-contrast glassmorphism interface.
- **Complete Attendance Workflow**: Full Day, Half Day, Absent, Overtime tracking, and manual OT requests.
- **Advances & Salary Slips**: Grant advances, calculate net salaries, and generate A4 PDF salary slips.
- **Custom Domain Ready**: Compatible with Vercel, Render, Railway, Docker, and Cloudflare Tunnels (`https://thekedarpro.com`).

---

## 📁 Repository Structure
```
.
├── index.html            # Main SPA HTML interface
├── css/
│   └── custom.css        # 3D Design System & Theme CSS
├── js/
│   ├── app.js            # App controller & Router
│   ├── auth.js           # Authentication & tab switcher
│   ├── store.js          # Unified LocalStorage + SQLite persistence
│   ├── company_admin.js  # Company Admin Dashboard
│   ├── worker_dashboard.js# Worker Self-Service Portal
│   ├── time_service.js   # Time calculation engine
│   ├── payslip.js        # Salary slip PDF generator
│   └── i18n.js           # Bilingual translation mapping
├── server.py             # Python HTTP & SQLite Backend Server
├── vercel.json           # Vercel deployment configuration
├── api/
│   └── index.py          # Vercel Serverless Function Handler
├── Dockerfile            # Container deployment definition
├── Procfile              # Render/Heroku Web process entrypoint
└── render.yaml           # Render blueprint configuration
```

---

## 🚀 Quick Start (Local Running)

Run the Python server locally:

```bash
python server.py
```
Open `http://localhost:8000` in your web browser.

---

## ⚡ Deployment to Vercel

1. Push this entire repository to GitHub.
2. Log in to [Vercel](https://vercel.com/) and click **Add New -> Project**.
3. Import your GitHub repository.
4. Click **Deploy**. Vercel will automatically build and publish your project on your custom domain (`https://thekedarpro.com`) with free SSL certificates.

---

## 🔒 License
Proprietary SaaS Application - Created for Contractor & Attendance Management.
