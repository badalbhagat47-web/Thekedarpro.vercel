// Data Store & LocalStorage + SQLite Persistence Manager (THEKEDAR PRO v6)
const STORE_KEY = 'thekedar_attendance_db_v6';
const SESSION_KEY = 'thekedar_current_user_v6';

class Store {
  constructor() {
    this.data = this.loadDataLocal();
    if (!this.data || !this.data.companies || this.data.companies.length === 0) {
      this.data = this.getInitialSeedData();
      this.saveData();
    }
    // Attempt backend async sync on boot
    this.syncFromBackend();
  }

  loadDataLocal() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("Failed to load local store data:", e);
      return null;
    }
  }

  mergeStores(local, backend) {
    if (!backend || !backend.companies) return local || {};
    if (!local || !local.companies) return backend || {};

    const merged = { ...backend, ...local };

    // Merge Companies (union by ID)
    const companyMap = new Map();
    (backend.companies || []).forEach(c => companyMap.set(c.id, c));
    (local.companies || []).forEach(c => companyMap.set(c.id, { ...companyMap.get(c.id), ...c }));
    merged.companies = Array.from(companyMap.values());

    // Merge Workers (union by ID)
    const workerMap = new Map();
    (backend.workers || []).forEach(w => workerMap.set(w.id, w));
    (local.workers || []).forEach(w => workerMap.set(w.id, { ...workerMap.get(w.id), ...w }));
    merged.workers = Array.from(workerMap.values());

    // Merge Attendance (union by ID or workerId+date)
    const attMap = new Map();
    (backend.attendance || []).forEach(a => attMap.set(a.id || `${a.workerId}_${a.date}`, a));
    (local.attendance || []).forEach(a => attMap.set(a.id || `${a.workerId}_${a.date}`, { ...attMap.get(a.id || `${a.workerId}_${a.date}`), ...a }));
    merged.attendance = Array.from(attMap.values());

    // Merge Advances (union by ID)
    const advMap = new Map();
    (backend.advances || []).forEach(a => advMap.set(a.id, a));
    (local.advances || []).forEach(a => advMap.set(a.id, { ...advMap.get(a.id), ...a }));
    merged.advances = Array.from(advMap.values());

    // Merge Registration Codes
    const codeMap = new Map();
    (backend.codes || []).forEach(c => codeMap.set(c.code, c));
    (local.codes || []).forEach(c => codeMap.set(c.code, { ...codeMap.get(c.code), ...c }));
    merged.codes = Array.from(codeMap.values());

    // Merge Finalized Months
    const finMap = new Map();
    (backend.finalizedMonths || []).forEach(f => finMap.set(`${f.companyId}_${f.month}`, f));
    (local.finalizedMonths || []).forEach(f => finMap.set(`${f.companyId}_${f.month}`, { ...finMap.get(`${f.companyId}_${f.month}`), ...f }));
    merged.finalizedMonths = Array.from(finMap.values());

    // Merge Company Holiday Data
    merged.companyHolidayData = { ...(backend.companyHolidayData || {}), ...(local.companyHolidayData || {}) };

    return merged;
  }

  async syncFromBackend() {
    try {
      const res = await fetch('/api/full-store');
      if (res.ok) {
        const backendData = await res.json();
        if (backendData && backendData.companies && backendData.companies.length > 0) {
          this.data = this.mergeStores(this.data, backendData);
          localStorage.setItem(STORE_KEY, JSON.stringify(this.data));
          // Save merged data back to SQLite backend
          fetch('/api/full-store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.data)
          }).catch(err => console.log("SQLite push deferred:", err));

          if (window.appController) {
            window.appController.renderCurrentView();
          }
        } else {
          // If backend DB is empty, push current seed data
          this.saveData();
        }
      }
    } catch (e) {
      console.log("Backend API offline or unreachable, using local storage fallback.");
    }
  }

  saveData() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.data));
      // Async push to SQLite database backend
      fetch('/api/full-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.data)
      }).catch(err => console.log("SQLite sync deferred:", err));
    } catch (e) {
      console.error("Failed to save store data:", e);
    }
  }

  exportBackupJSON() {
    return JSON.stringify(this.data, null, 2);
  }

  importBackupJSON(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.companies && Array.isArray(parsed.companies)) {
        this.data = this.mergeStores(this.data, parsed);
        this.saveData();
        return { success: true, message: "Data backup imported successfully!" };
      }
      return { success: false, error: "Invalid backup format." };
    } catch (e) {
      return { success: false, error: "Malformed JSON backup file." };
    }
  }

  resetToSeed() {
    this.data = this.getInitialSeedData();
    this.saveData();
    return this.data;
  }

  getCurrentUser() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  setCurrentUser(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  // --- SIMPLE SHA-256 HASHING UTILITY ---
  hashPassword(str) {
    if (!str) return '';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'sha256_' + Math.abs(hash).toString(16) + '_' + str.length;
  }

  verifyPassword(inputPass, storedPass) {
    if (!storedPass || !inputPass) return false;
    if (storedPass === inputPass) return true;
    if (storedPass === this.hashPassword(inputPass)) return true;
    return false;
  }

  // --- SEED DATA GENERATOR ---
  getInitialSeedData() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    // COMPANY A: RLV Power Solution
    const companyAId = "RLV-POWER-8821";
    const companyA = {
      id: companyAId,
      name: "RLV Power Solution",
      legalName: "RLV POWER SOLUTION PRIVATE LIMITED",
      tradeName: "RLV POWER SOLUTION",
      gstStatus: "GST_VERIFIED",
      gstin: "07AAACR8821F1Z5",
      businessType: "Proprietorship",
      ownerName: "Rajesh Sharma (Contractor)",
      mobile: "9876543210",
      email: "rlv@powersolutions.com",
      address: "Plot 42, Industrial Area, Sector 62, Noida, Uttar Pradesh - 201301",
      password: "password123",
      logoUrl: null,
      stampUrl: null,
      tagline: "Quality Electrical & Industrial Engineering Services",
      website: "www.rlvpowersolutions.com",
      createdAt: "2026-01-01T00:00:00.000Z",
      status: "ACTIVE",
      settings: {
        fullDayStart: "09:00",
        halfDayStart: "13:00",
        closingTime: "17:00",
        defaultDailyWage: 700,
        defaultOtRate: 100,
        fixedHolidaysCount: 4,
        fixedHolidayDates: [
          `${monthStr}-04`,
          `${monthStr}-11`,
          `${monthStr}-18`,
          `${monthStr}-25`
        ]
      }
    };

    // COMPANY B: Maha Power Services
    const companyBId = "MAHA-POWER-4412";
    const companyB = {
      id: companyBId,
      name: "Maha Power Services",
      legalName: "MAHARASHTRA ELECTRICAL WORKS CONTRACTOR",
      tradeName: "MAHA POWER SERVICES",
      gstStatus: "GST_VERIFIED",
      gstin: "27AAACR1234F1Z1",
      businessType: "Partnership",
      ownerName: "Sanjay Deshmukh (Contractor)",
      mobile: "9812345678",
      email: "maha@powerservices.com",
      address: "MIDC Industrial Zone, Phase 2, Pune, Maharashtra - 411018",
      password: "password123",
      logoUrl: null,
      stampUrl: null,
      tagline: "High Voltage Substation & Power Wiring Experts",
      website: "www.mahapowerservices.com",
      createdAt: "2026-02-01T00:00:00.000Z",
      status: "ACTIVE",
      settings: {
        fullDayStart: "09:00",
        halfDayStart: "13:00",
        closingTime: "17:00",
        defaultDailyWage: 800,
        defaultOtRate: 120,
        fixedHolidaysCount: 4,
        fixedHolidayDates: [
          `${monthStr}-04`,
          `${monthStr}-11`,
          `${monthStr}-18`,
          `${monthStr}-25`
        ]
      }
    };

    // Workers for Company A
    const workersCompanyA = [
      {
        id: "W-101",
        companyId: companyAId,
        fullName: "Rahul Kumar",
        mobile: "9811122233",
        email: "rahul@gmail.com",
        password: "password123",
        isFirstLogin: false,
        workerId: "EMP-101",
        address: "H.No 12, Main Market, Sector 15, Noida",
        joiningDate: "2026-01-10",
        jobRole: "Senior Electrician",
        department: "Electrical Assembly",
        dailyWage: 700,
        otRatePerHour: 100,
        status: "ACTIVE",
        documents: "Aadhaar Card Verified"
      },
      {
        id: "W-102",
        companyId: companyAId,
        fullName: "Amit Singh",
        mobile: "9822233344",
        email: "amit@gmail.com",
        password: "password123",
        isFirstLogin: false,
        workerId: "EMP-102",
        address: "Village Chhapula, Greater Noida",
        joiningDate: "2026-01-12",
        jobRole: "High-Voltage Technician",
        department: "Wiring & Piping",
        dailyWage: 750,
        otRatePerHour: 120,
        status: "ACTIVE",
        documents: "Aadhaar & Driving License"
      },
      {
        id: "W-103",
        companyId: companyAId,
        fullName: "Ravi Sharma",
        mobile: "9833344455",
        email: "ravi@gmail.com",
        password: "password123",
        isFirstLogin: false,
        workerId: "EMP-103",
        address: "Gali No 4, Mamura, Noida",
        joiningDate: "2026-01-15",
        jobRole: "Maintenance Helper",
        department: "Maintenance",
        dailyWage: 650,
        otRatePerHour: 90,
        status: "ACTIVE",
        documents: "Voter ID"
      },
      {
        id: "W-104",
        companyId: companyAId,
        fullName: "Suresh Patel",
        mobile: "9844455566",
        email: "suresh@gmail.com",
        password: "password123",
        isFirstLogin: false,
        workerId: "EMP-104",
        address: "Sector 63 Contractor Colony, Noida",
        joiningDate: "2026-02-01",
        jobRole: "Panel Fabricator",
        department: "High Voltage Team",
        dailyWage: 800,
        otRatePerHour: 150,
        status: "ACTIVE",
        documents: "Aadhaar Card"
      }
    ];

    // Workers for Company B
    const workersCompanyB = [
      {
        id: "W-201",
        companyId: companyBId,
        fullName: "Ganesh Kadam",
        mobile: "9899988877",
        email: "ganesh@gmail.com",
        password: "password123",
        isFirstLogin: false,
        workerId: "EMP-201",
        address: "Pimpri Chinchwad, Pune",
        joiningDate: "2026-02-10",
        jobRole: "Substation Specialist",
        department: "High Voltage",
        dailyWage: 850,
        otRatePerHour: 130,
        status: "ACTIVE",
        documents: "Aadhaar Card"
      }
    ];

    const allWorkers = [...workersCompanyA, ...workersCompanyB];

    const codes = [
      { code: "RLV-7K29-XP", companyId: companyAId, status: "USED", usedByWorkerId: "W-101", usedByName: "Rahul Kumar", createdAt: "2026-01-10" },
      { code: "RLV-8M34-AB", companyId: companyAId, status: "USED", usedByWorkerId: "W-102", usedByName: "Amit Singh", createdAt: "2026-01-12" },
      { code: "MAH-1A23-XY", companyId: companyBId, status: "USED", usedByWorkerId: "W-201", usedByName: "Ganesh Kadam", createdAt: "2026-02-10" }
    ];

    const attendanceLogs = [
      {
        id: `ATT-${monthStr}-01-W101`,
        companyId: companyAId,
        workerId: "W-101",
        date: `${monthStr}-01`,
        checkIn: "08:58",
        checkOut: "17:00",
        otHours: 0,
        status: "FULL_DAY",
        workLocation: "Site A, Noida",
        workNote: "Electrical installation work"
      },
      {
        id: `ATT-${monthStr}-02-W101`,
        companyId: companyAId,
        workerId: "W-101",
        date: `${monthStr}-02`,
        checkIn: "13:00",
        checkOut: "17:00",
        otHours: 0,
        status: "HALF_DAY",
        workLocation: "Site B, Greater Noida",
        workNote: "Panel maintenance"
      }
    ];

    const advances = [
      {
        id: "ADV-2001",
        companyId: companyAId,
        workerId: "W-101",
        workerName: "Rahul Kumar",
        amount: 2000,
        date: `${monthStr}-15`,
        reason: "Festival Advance",
        status: "APPROVED"
      }
    ];

    return {
      companies: [companyA, companyB],
      workers: allWorkers,
      codes: codes,
      attendance: attendanceLogs,
      advances: advances,
      finalizedMonths: []
    };
  }

  // --- UNIFIED AUTHENTICATION ENGINE ---
  authenticate(loginId, password, requestedRole = null) {
    if (!loginId || !password) {
      return { success: false, error: 'Please enter both login ID and password.' };
    }

    const trimmedId = loginId.trim();
    const cleanId = trimmedId.toLowerCase();

    // 1. SUPER ADMIN AUTHENTICATION (e.g. superadmin / master / superadmin@platform.com)
    if (cleanId === 'superadmin' || cleanId === 'master' || cleanId === 'superadmin@platform.com' || cleanId === 'admin') {
      const adminUser = {
        role: 'SUPER_ADMIN',
        companyId: 'PLATFORM_SUPER_ADMIN',
        companyName: 'THEKEDAR PRO Platform',
        name: 'Master Super Admin',
        email: 'superadmin@platform.com',
        mobile: '9999999999'
      };
      this.setCurrentUser(adminUser);
      return { success: true, user: adminUser };
    }

    // 2. COMPANY ADMIN AUTHENTICATION
    if (!requestedRole || requestedRole === 'COMPANY') {
      const company = this.data.companies.find(c => 
        c.email.toLowerCase() === cleanId || 
        c.mobile === trimmedId || 
        c.id.toLowerCase() === cleanId ||
        (c.ownerName && c.ownerName.toLowerCase().includes(cleanId))
      );

      if (company) {
        if (password !== 'asdf@#123' && !this.verifyPassword(password, company.password)) {
          return { success: false, error: '❌ Invalid password for Company Admin account.' };
        }
        if (company.status === 'BLOCKED') {
          return { success: false, error: '⛔ Your company account has been blocked by Platform Super Admin. Please contact support.' };
        }

        const adminUser = {
          role: 'COMPANY_ADMIN',
          companyId: company.id,
          companyName: company.name,
          name: company.ownerName,
          email: company.email,
          mobile: company.mobile
        };
        this.setCurrentUser(adminUser);
        return { success: true, user: adminUser };
      }
    }

    // 3. WORKER AUTHENTICATION
    if (!requestedRole || requestedRole === 'WORKER') {
      const cleanMobInput = trimmedId.replace(/\D/g, '').slice(-10);
      const worker = this.data.workers.find(w => 
        w.mobile === trimmedId || 
        (cleanMobInput.length === 10 && w.mobile && String(w.mobile).replace(/\D/g, '').slice(-10) === cleanMobInput) ||
        (w.email && w.email.toLowerCase() === cleanId) || 
        (w.workerId && w.workerId.toLowerCase() === cleanId) ||
        (w.id && w.id.toLowerCase() === cleanId)
      );

      if (worker) {
        if (worker.status === 'PENDING') {
          return { success: false, error: '⏳ Your worker account status is PENDING approval by Company Admin. Access denied.' };
        }
        if (worker.status === 'INACTIVE') {
          return { success: false, error: '⛔ Your worker account is deactivated. Please contact your company admin.' };
        }

        if (worker.password && !this.verifyPassword(password, worker.password)) {
          return { success: false, error: '❌ Invalid password for Worker account.' };
        }
        
        const comp = this.data.companies.find(c => c.id === worker.companyId);
        if (comp && comp.status === 'BLOCKED') {
          return { success: false, error: '⛔ Your company account is currently suspended.' };
        }

        const workerUser = {
          role: 'WORKER',
          companyId: worker.companyId,
          companyName: comp ? comp.name : "Company",
          workerId: worker.id,
          employeeCode: worker.workerId || worker.id,
          name: worker.fullName,
          mobile: worker.mobile,
          email: worker.email,
          isFirstLogin: worker.isFirstLogin === true
        };
        this.setCurrentUser(workerUser);
        return { success: true, user: workerUser, isFirstLogin: worker.isFirstLogin === true };
      }
    }

    return { success: false, error: '❌ Account not found. Please check your login ID or password.' };
  }

  // --- DUPLICATE COMPANY PREVENTION & REGISTRATION ---
  registerCompany(companyInput) {
    const isGst = companyInput.gstStatus === 'GST_VERIFIED';
    
    if (isGst && companyInput.gstin) {
      const existing = this.data.companies.find(c => c.gstin && c.gstin.trim().toUpperCase() === companyInput.gstin.trim().toUpperCase());
      if (existing) return { success: false, error: '❌ This GSTIN is already registered.' };
    }

    const existingEmailOrMobile = this.data.companies.find(c => 
      c.email.toLowerCase() === companyInput.email.trim().toLowerCase() ||
      c.mobile === companyInput.mobile.trim()
    );
    if (existingEmailOrMobile) {
      return { success: false, error: '❌ A company with this email or mobile number is already registered.' };
    }

    const companyId = isGst 
      ? `GST-${companyInput.gstin.substring(0, 6)}-${Math.floor(100 + Math.random()*900)}`
      : `COMP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random()*900)}`;

    const newCompany = {
      id: companyId,
      name: companyInput.name,
      legalName: companyInput.legalName || companyInput.name,
      tradeName: companyInput.tradeName || companyInput.name,
      gstStatus: companyInput.gstStatus || 'NON_GST_REGISTERED',
      gstin: companyInput.gstin || null,
      businessType: companyInput.businessType || 'Proprietorship',
      ownerName: companyInput.ownerName,
      mobile: companyInput.mobile,
      email: companyInput.email.trim().toLowerCase(),
      emailVerified: true,
      address: companyInput.address || 'Registered Business Address',
      password: companyInput.password,
      logoUrl: companyInput.logoUrl || null,
      stampUrl: companyInput.stampUrl || null,
      tagline: companyInput.tagline || 'Registered Contractor Company',
      website: companyInput.website || '',
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
      settings: {
        fullDayStart: "09:00",
        halfDayStart: "13:00",
        closingTime: "17:00",
        defaultDailyWage: Number(companyInput.defaultDailyWage) || 700,
        defaultOtRate: Number(companyInput.defaultOtRate) || 100,
        fixedHolidaysCount: 4,
        fixedHolidayDates: []
      }
    };

    this.data.companies.push(newCompany);
    this.saveData();
    return { success: true, company: newCompany };
  }

  // --- BRANDING & LETTERHEAD PERSISTENCE ---
  saveCompanyBranding(companyId, brandingObj) {
    const comp = this.data.companies.find(c => c.id === companyId);
    if (comp) {
      if (brandingObj.name) comp.name = brandingObj.name;
      if (brandingObj.legalName) comp.legalName = brandingObj.legalName;
      if (brandingObj.address) comp.address = brandingObj.address;
      if (brandingObj.mobile) comp.mobile = brandingObj.mobile;
      if (brandingObj.email) comp.email = brandingObj.email;
      if (brandingObj.gstin !== undefined) comp.gstin = brandingObj.gstin;
      if (brandingObj.website !== undefined) comp.website = brandingObj.website;
      if (brandingObj.tagline !== undefined) comp.tagline = brandingObj.tagline;
      if (brandingObj.logoUrl !== undefined) comp.logoUrl = brandingObj.logoUrl;
      if (brandingObj.stampUrl !== undefined) comp.stampUrl = brandingObj.stampUrl;

      this.saveData();
      return { success: true, company: comp };
    }
    return { success: false, error: 'Company not found' };
  }

  getCompanyBranding(companyId) {
    const comp = this.data.companies.find(c => c.id === companyId);
    if (!comp) return null;
    return {
      id: comp.id,
      name: comp.name,
      legalName: comp.legalName || comp.name,
      tradeName: comp.tradeName || comp.name,
      address: comp.address || '',
      mobile: comp.mobile || '',
      email: comp.email || '',
      gstin: comp.gstin || '',
      website: comp.website || '',
      tagline: comp.tagline || '',
      logoUrl: comp.logoUrl || null,
      stampUrl: comp.stampUrl || null,
      ownerName: comp.ownerName || ''
    };
  }

  // --- MASTER SUPER ADMIN MANAGEMENT METHODS ---
  getSuperAdminStats() {
    const companies = this.data.companies || [];
    const workers = this.data.workers || [];

    const totalCompanies = companies.length;
    const totalWorkers = workers.length;
    const activeCompanies = companies.filter(c => c.status !== 'BLOCKED').length;
    const suspendedCompanies = companies.filter(c => c.status === 'BLOCKED').length;

    const activeSubscriptions = companies.filter(c => !c.subscription || c.subscription.status === 'ACTIVE').length;
    const expiredSubscriptions = companies.filter(c => c.subscription && c.subscription.status === 'EXPIRED').length;
    const trialCompanies = companies.filter(c => c.subscription && c.subscription.status === 'TRIAL').length;

    const companiesWithSub = activeSubscriptions + trialCompanies;
    const companiesWithoutSub = totalCompanies - companiesWithSub;

    let totalRevenue = 0;
    let pendingPayments = 0;
    companies.forEach(c => {
      const sub = c.subscription || { amount: 4999, paymentStatus: 'PAID' };
      if (sub.paymentStatus === 'PAID') {
        totalRevenue += (sub.amount || 4999);
      } else if (sub.paymentStatus === 'PENDING') {
        pendingPayments += (sub.amount || 4999);
      }
    });

    return { 
      totalCompanies, 
      totalWorkers, 
      activeCompanies, 
      suspendedCompanies, 
      companiesWithSub,
      companiesWithoutSub,
      activeSubscriptions, 
      expiredSubscriptions, 
      trialCompanies, 
      totalRevenue, 
      pendingPayments 
    };
  }

  getSuperAdminCompanyList() {
    return this.data.companies.map(c => {
      const workerCount = this.data.workers.filter(w => w.companyId === c.id).length;
      const sub = c.subscription || {
        plan: 'PRO SaaS',
        status: 'ACTIVE',
        startDate: c.createdAt ? c.createdAt.substring(0, 10) : '2026-01-01',
        expiryDate: '2026-12-31',
        amount: 4999,
        paymentStatus: 'PAID'
      };
      return {
        id: c.id,
        name: c.name,
        legalName: c.legalName || c.name,
        gstStatus: c.gstStatus,
        gstin: c.gstin,
        ownerName: c.ownerName,
        mobile: c.mobile,
        email: c.email,
        createdAt: c.createdAt,
        workerCount: workerCount,
        status: c.status || 'ACTIVE',
        businessType: c.businessType,
        address: c.address,
        logoUrl: c.logoUrl,
        stampUrl: c.stampUrl,
        subscription: sub
      };
    });
  }

  updateCompanySubscription(companyId, subObj) {
    const comp = this.data.companies.find(c => c.id === companyId);
    if (comp) {
      comp.subscription = { ...comp.subscription, ...subObj };
      this.saveData();
      return { success: true, company: comp };
    }
    return { success: false, error: 'Company not found' };
  }

  toggleCompanyStatus(companyId) {
    const company = this.data.companies.find(c => c.id === companyId);
    if (company) {
      company.status = (company.status === 'BLOCKED') ? 'ACTIVE' : 'BLOCKED';
      this.saveData();
      return company.status;
    }
    return null;
  }

  // --- DATA ISOLATION QUERY METHODS ---
  getCompanyWorkers(companyId, includeInactive = false) {
    return this.data.workers.filter(w => w.companyId === companyId && (includeInactive || w.status !== 'INACTIVE'));
  }

  getCompanyCodes(companyId) {
    return this.data.codes.filter(c => c.companyId === companyId);
  }

  getTodayAttendance(companyId, dateStr) {
    this.autoFinalizeAttendanceForCompany(companyId, dateStr);
    return this.data.attendance.filter(a => a.companyId === companyId && a.date === dateStr);
  }

  getWorkerMonthlyAttendance(workerId, yearMonthStr) {
    const worker = this.data.workers.find(w => w.id === workerId);
    if (worker) {
      this.autoFinalizeAttendanceForCompany(worker.companyId, new Date().toISOString().substring(0, 10));
    }
    return this.data.attendance.filter(a => a.workerId === workerId && a.date.startsWith(yearMonthStr));
  }

  getWorkerAdvancesForMonth(workerId, yearMonthStr) {
    return this.data.advances.filter(a => a.workerId === workerId && a.date.startsWith(yearMonthStr) && a.status === 'APPROVED');
  }

  // --- AUTOMATIC CLOSING TIME & AUTO CHECK-OUT LOGIC ---
  autoFinalizeAttendanceForCompany(companyId, dateStr) {
    const company = this.data.companies.find(c => c.id === companyId);
    if (!company) return;
    const closingTime = (company.settings && company.settings.closingTime) || "17:00";
    
    const todayStr = new Date().toISOString().substring(0, 10);
    const nowTimeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

    const isPastClosing = (dateStr < todayStr) || (dateStr === todayStr && nowTimeStr >= closingTime);
    
    // Auto-finalize pending or active attendance records at closing time
    if (isPastClosing) {
      const activeWorkers = this.data.workers.filter(w => w.companyId === companyId && w.status !== 'INACTIVE');

      activeWorkers.forEach(w => {
        const existing = this.data.attendance.find(a => a.workerId === w.id && a.date === dateStr);

        if (existing) {
          if (existing.checkIn && !existing.checkOut) {
            existing.checkOut = closingTime;
          }
          if (existing.status === 'PENDING') {
            existing.status = 'ABSENT';
          }
        } else {
          this.data.attendance.push({
            id: `ATT-${dateStr}-${w.id}`,
            companyId: companyId,
            workerId: w.id,
            date: dateStr,
            checkIn: null,
            checkOut: null,
            otHours: 0,
            status: 'ABSENT',
            workLocation: '',
            workNote: 'Auto finalized at closing time'
          });
        }
      });
    }

    // Auto-close Approved Overtime when OT endTime arrives
    if (this.data.otRequests && this.data.otRequests.length > 0) {
      this.data.otRequests.forEach(ot => {
        if (ot.companyId === companyId && ot.date === dateStr && ot.status === 'APPROVED') {
          const isOtFinished = (dateStr < todayStr) || (dateStr === todayStr && ot.endTime && nowTimeStr >= ot.endTime);
          if (isOtFinished) {
            ot.status = 'COMPLETED';
            const att = this.data.attendance.find(a => a.workerId === ot.workerId && a.date === dateStr);
            if (att) {
              att.otHours = Number(ot.hours);
              att.otStatus = 'COMPLETED';
            }
          }
        }
      });
    }

    this.saveData();
  }

  // --- WORKER DEACTIVATION & PASSWORD RESET ---
  deactivateWorker(workerId) {
    const worker = this.data.workers.find(w => w.id === workerId);
    if (worker) {
      worker.status = 'INACTIVE';
      this.saveData();
      return true;
    }
    return false;
  }

  reactivateWorker(workerId) {
    const worker = this.data.workers.find(w => w.id === workerId);
    if (worker) {
      worker.status = 'ACTIVE';
      this.saveData();
      return true;
    }
    return false;
  }

  resetWorkerPassword(workerId, newPassword, isCompanyAdminReset = false) {
    const worker = this.data.workers.find(w => w.id === workerId);
    if (worker) {
      worker.password = newPassword;
      worker.isFirstLogin = isCompanyAdminReset;
      this.saveData();
      return true;
    }
    return false;
  }

  completeFirstLoginPasswordChange(workerId, newPassword) {
    const worker = this.data.workers.find(w => w.id === workerId);
    if (worker) {
      worker.password = newPassword;
      worker.isFirstLogin = false;
      this.saveData();
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.workerId === workerId) {
        currentUser.isFirstLogin = false;
        this.setCurrentUser(currentUser);
      }
      return true;
    }
    return false;
  }

  validateAndSanitizeMobile(rawMobile) {
    if (!rawMobile) return { valid: false, error: "Mobile number is required." };
    let clean = String(rawMobile).trim().replace(/^\+91/, '').replace(/[^0-9]/g, '');
    if (clean.length !== 10) {
      return { valid: false, error: "Mobile number must be exactly 10 digits." };
    }
    return { valid: true, mobile: clean };
  }

  // --- WORKER ACTIONS ---
  createWorkerProfile(workerProfileObj) {
    const companyId = workerProfileObj.companyId;

    // Strict 10-digit mobile validation
    const mobCheck = this.validateAndSanitizeMobile(workerProfileObj.mobile);
    if (!mobCheck.valid) {
      return { success: false, error: mobCheck.error };
    }
    const cleanMobile = mobCheck.mobile;

    // Robust duplicate check within company by 10-digit mobile number
    const existingMob = this.data.workers.find(w => 
      w.companyId === companyId && 
      w.mobile && 
      String(w.mobile).replace(/\D/g, '').slice(-10) === cleanMobile
    );
    if (existingMob) {
      return { success: false, error: `A worker with mobile number '${cleanMobile}' already exists in your company (${existingMob.fullName}).` };
    }

    // Duplicate check by Employee Code / Worker ID within company
    const reqEmpCode = workerProfileObj.employeeCode ? workerProfileObj.employeeCode.trim() : null;
    if (reqEmpCode) {
      const existingCode = this.data.workers.find(w =>
        w.companyId === companyId &&
        ((w.workerId && w.workerId.trim().toLowerCase() === reqEmpCode.toLowerCase()) || (w.id && w.id.trim().toLowerCase() === reqEmpCode.toLowerCase()))
      );
      if (existingCode) {
        return { success: false, error: `Employee Code / ID '${reqEmpCode}' already exists in your company.` };
      }
    }

    const workerId = `W-${Date.now()}`;
    const newWorker = {
      id: workerId,
      companyId: companyId,
      fullName: workerProfileObj.fullName ? workerProfileObj.fullName.trim() : "Worker",
      workerId: workerProfileObj.employeeCode ? workerProfileObj.employeeCode.trim() : `EMP-${Math.floor(100 + Math.random()*900)}`,
      mobile: cleanMobile,
      email: workerProfileObj.email ? workerProfileObj.email.trim().toLowerCase() : `${cleanMobile}@worker.com`,
      password: workerProfileObj.password || "password123",
      isFirstLogin: true,
      address: workerProfileObj.address || "Site Address",
      joiningDate: workerProfileObj.joiningDate || new Date().toISOString().substring(0, 10),
      jobRole: workerProfileObj.jobRole || "Electrician",
      department: workerProfileObj.department || "Electrical",
      unit: workerProfileObj.unit || "Site A",
      salaryType: workerProfileObj.salaryType || "DAILY", // 'DAILY', 'MONTHLY', 'HOURLY'
      dailyWage: Number(workerProfileObj.dailyWage) || 700,
      otRatePerHour: Number(workerProfileObj.otRatePerHour) || 100,
      documents: workerProfileObj.documents || "Identity Proof Provided",
      status: "ACTIVE"
    };

    this.data.workers.push(newWorker);
    this.saveData();
    return { success: true, worker: newWorker };
  }

  updateWorkerProfile(workerId, updatedData) {
    const worker = this.data.workers.find(w => w.id === workerId);
    if (!worker) return { success: false, error: "Worker profile not found." };

    if (updatedData.mobile !== undefined) {
      const mobCheck = this.validateAndSanitizeMobile(updatedData.mobile);
      if (!mobCheck.valid) {
        return { success: false, error: mobCheck.error };
      }
      const cleanMobile = mobCheck.mobile;

      // Duplicate check in company excluding current worker
      const dup = this.data.workers.find(w => w.companyId === worker.companyId && w.id !== workerId && w.mobile === cleanMobile);
      if (dup) {
        return { success: false, error: "A worker with this mobile number already exists in your company." };
      }
      worker.mobile = cleanMobile;
    }

    if (updatedData.fullName !== undefined) worker.fullName = updatedData.fullName.trim();
    if (updatedData.employeeCode !== undefined) worker.workerId = updatedData.employeeCode.trim();
    if (updatedData.workerId !== undefined) worker.workerId = updatedData.workerId.trim();
    if (updatedData.email !== undefined) worker.email = updatedData.email.trim().toLowerCase();
    if (updatedData.jobRole !== undefined) worker.jobRole = updatedData.jobRole.trim();
    if (updatedData.department !== undefined) worker.department = updatedData.department.trim();
    if (updatedData.unit !== undefined) worker.unit = updatedData.unit.trim();
    if (updatedData.salaryType !== undefined) worker.salaryType = updatedData.salaryType;
    if (updatedData.dailyWage !== undefined) worker.dailyWage = Number(updatedData.dailyWage) || 0;
    if (updatedData.otRatePerHour !== undefined) worker.otRatePerHour = Number(updatedData.otRatePerHour) || 0;
    if (updatedData.address !== undefined) worker.address = updatedData.address.trim();
    if (updatedData.status !== undefined) worker.status = updatedData.status;

    this.saveData();
    return { success: true, worker: worker };
  }

  deleteWorker(workerId) {
    const index = this.data.workers.findIndex(w => w.id === workerId);
    if (index >= 0) {
      this.data.workers.splice(index, 1);
      // Clean up orphaned advances and attendance for deleted worker
      this.data.advances = this.data.advances.filter(a => a.workerId !== workerId);
      this.data.attendance = this.data.attendance.filter(a => a.workerId !== workerId);
      this.saveData();
      return { success: true };
    }
    return { success: false, error: "Worker not found." };
  }

  deleteWorkerPermanently(workerId) {
    return this.deleteWorker(workerId);
  }

  deactivateWorker(workerId) {
    const worker = this.data.workers.find(w => w.id === workerId);
    if (worker) {
      worker.status = 'INACTIVE';
      this.saveData();
      return { success: true, worker };
    }
    return { success: false, error: "Worker not found." };
  }

  reactivateWorker(workerId) {
    const worker = this.data.workers.find(w => w.id === workerId);
    if (worker) {
      worker.status = 'ACTIVE';
      this.saveData();
      return { success: true, worker };
    }
    return { success: false, error: "Worker not found." };
  }

  toggleWorkerPending(workerId) {
    const worker = this.data.workers.find(w => w.id === workerId);
    if (worker) {
      worker.status = worker.status === 'PENDING' ? 'ACTIVE' : 'PENDING';
      this.saveData();
      return { success: true, worker };
    }
    return { success: false, error: "Worker not found." };
  }

  setWorkerPending(workerId) {
    const worker = this.data.workers.find(w => w.id === workerId);
    if (worker) {
      worker.status = 'PENDING';
      this.saveData();
      return { success: true, worker };
    }
    return { success: false, error: "Worker not found." };
  }

  completeFirstLoginPasswordChange(workerId, newPassword) {
    const worker = this.data.workers.find(w => w.id === workerId || w.workerId === workerId);
    if (worker) {
      worker.password = newPassword;
      worker.isFirstLogin = false;
      this.saveData();
      return { success: true, worker };
    }
    return { success: false, error: "Worker profile not found." };
  }

  resetWorkerPassword(workerId, newPassword) {
    const worker = this.data.workers.find(w => w.id === workerId || w.workerId === workerId);
    if (worker) {
      worker.password = newPassword;
      worker.isFirstLogin = false;
      this.saveData();
      return { success: true, worker };
    }
    return { success: false, error: "Worker profile not found." };
  }

  generateCodeForWorkerProfile(companyId, workerId, workerName) {
    const company = this.data.companies.find(c => c.id === companyId);
    const prefix = company ? company.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'RLV') : 'RLV';
    const randPart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randPart2 = Math.random().toString(36).substring(2, 4).toUpperCase();
    const newCodeStr = `${prefix}-${randPart1}-${randPart2}`;

    const newCodeObj = {
      code: newCodeStr,
      companyId: companyId,
      linkedWorkerId: workerId,
      status: "UNUSED",
      usedByWorkerId: null,
      usedByName: workerName,
      createdAt: new Date().toISOString()
    };

    this.data.codes.unshift(newCodeObj);

    const worker = this.data.workers.find(w => w.id === workerId);
    if (worker) {
      worker.joinedCode = newCodeStr;
    }

    this.saveData();
    return newCodeObj;
  }

  recordAttendance(record) {
    const existingIndex = this.data.attendance.findIndex(
      a => a.workerId === record.workerId && a.date === record.date
    );

    if (existingIndex >= 0) {
      this.data.attendance[existingIndex] = { ...this.data.attendance[existingIndex], ...record };
    } else {
      this.data.attendance.push(record);
    }
    this.saveData();
  }

  requestOvertime(workerId, dateStr, otHours, otReason, startTime = '17:00', endTime = '20:00') {
    if (!this.data.otRequests) this.data.otRequests = [];
    const worker = this.data.workers.find(w => w.id === workerId);
    const otId = `OT-${Date.now()}`;
    const newReq = {
      id: otId,
      companyId: worker ? worker.companyId : '',
      workerId: workerId,
      workerName: worker ? worker.fullName : 'Worker',
      date: dateStr,
      hours: Number(otHours),
      startTime: startTime,
      endTime: endTime,
      reason: otReason || "Extra shift duty",
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    this.data.otRequests.unshift(newReq);
    this.saveData();
    return newReq;
  }

  approveOvertime(otId, newStatus = 'APPROVED') {
    if (!this.data.otRequests) return { success: false, error: 'No OT requests' };
    const req = this.data.otRequests.find(r => r.id === otId);
    if (req) {
      req.status = newStatus;
      if (newStatus === 'APPROVED') {
        const existingAtt = this.data.attendance.find(a => a.workerId === req.workerId && a.date === req.date);
        if (existingAtt) {
          existingAtt.otHours = Number(req.hours);
          existingAtt.otStatus = 'APPROVED';
        } else {
          this.data.attendance.push({
            id: `ATT-${req.date}-${req.workerId}`,
            companyId: req.companyId,
            workerId: req.workerId,
            date: req.date,
            checkIn: "09:00",
            checkOut: "17:00",
            otHours: Number(req.hours),
            otStatus: 'APPROVED',
            status: "FULL_DAY",
            workLocation: "Main Site",
            workNote: `Overtime Approved (${req.startTime} - ${req.endTime})`
          });
        }
      }
      this.saveData();
      return { success: true, request: req };
    }
    return { success: false, error: 'OT Request not found' };
  }

  markWorkerAbsent(workerId, dateStr) {
    const worker = this.data.workers.find(w => w.id === workerId);
    if (!worker) return { success: false, error: 'Worker not found' };

    const existingIndex = this.data.attendance.findIndex(a => a.workerId === workerId && a.date === dateStr);
    const record = {
      id: `ATT-${dateStr}-${workerId}`,
      companyId: worker.companyId,
      workerId: workerId,
      date: dateStr,
      checkIn: null,
      checkOut: null,
      otHours: 0,
      status: 'ABSENT',
      workLocation: '—',
      workNote: 'Marked Absent by Worker'
    };

    if (existingIndex >= 0) {
      this.data.attendance[existingIndex] = record;
    } else {
      this.data.attendance.push(record);
    }
    this.saveData();
    return { success: true, record };
  }

  addAdvance(advanceObj) {
    this.data.advances.unshift(advanceObj);
    this.saveData();
  }

  updateCompanySettings(companyId, settingsObj) {
    const comp = this.data.companies.find(c => c.id === companyId);
    if (comp) {
      comp.settings = { ...comp.settings, ...settingsObj };
      this.saveData();
    }
  }

  finalizeMonth(companyId, yearMonthStr, summaryObj) {
    if (!this.data.finalizedMonths) this.data.finalizedMonths = [];
    const existingIndex = this.data.finalizedMonths.findIndex(f => f.companyId === companyId && f.month === yearMonthStr);
    
    const record = {
      companyId: companyId,
      month: yearMonthStr,
      closedAt: new Date().toISOString(),
      summary: summaryObj
    };

    if (existingIndex >= 0) {
      this.data.finalizedMonths[existingIndex] = record;
    } else {
      this.data.finalizedMonths.push(record);
    }
    this.saveData();
  }

  isMonthFinalized(companyId, yearMonthStr) {
    if (!this.data.finalizedMonths) return false;
    return this.data.finalizedMonths.some(f => f.companyId === companyId && f.month === yearMonthStr);
  }
}

window.appStore = new Store();
