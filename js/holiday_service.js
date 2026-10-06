// Festival & Company Holiday Management System (Multi-Tenant, 15-Day Notification Engine)
const HolidayService = {
  // Authentic Indian Public Festivals Calendar
  indianFestivals: [
    { id: "fest-republic", nameEn: "Republic Day", nameHi: "गणतंत्र दिवस", date: "2026-01-26", defaultHoliday: true },
    { id: "fest-holi", nameEn: "Holi", nameHi: "होली", date: "2026-03-04", defaultHoliday: true },
    { id: "fest-goodfriday", nameEn: "Good Friday", nameHi: "गुड फ्राइडे", date: "2026-04-03", defaultHoliday: false },
    { id: "fest-eid-fitr", nameEn: "Eid-ul-Fitr", nameHi: "ईद-उल-फ़ित्र", date: "2026-03-20", defaultHoliday: true },
    { id: "fest-indep", nameEn: "Independence Day", nameHi: "स्वतंत्रता दिवस", date: "2026-08-15", defaultHoliday: true },
    { id: "fest-raksha", nameEn: "Raksha Bandhan", nameHi: "रक्षाबंधन", date: "2026-08-28", defaultHoliday: false },
    { id: "fest-janmashtami", nameEn: "Janmashtami", nameHi: "जन्माष्टमी", date: "2026-09-04", defaultHoliday: false },
    { id: "fest-gandhi", nameEn: "Gandhi Jayanti", nameHi: "गांधी जयंती", date: "2026-10-02", defaultHoliday: true },
    { id: "fest-dussehra", nameEn: "Dussehra (Vijayadashami)", nameHi: "दशहरा (विजयादशमी)", date: "2026-10-20", defaultHoliday: true },
    { id: "fest-diwali", nameEn: "Diwali (Deepawali)", nameHi: "दीपावली (दिवाली)", date: "2026-11-08", defaultHoliday: true },
    { id: "fest-chhath", nameEn: "Chhath Puja", nameHi: "छठ पूजा", date: "2026-11-14", defaultHoliday: false },
    { id: "fest-christmas", nameEn: "Christmas Day", nameHi: "क्रिसमस दिवस", date: "2026-12-25", defaultHoliday: true }
  ],

  /**
   * Get all company holiday records for a company ID
   */
  getCompanyHolidayData(companyId) {
    if (!window.appStore || !window.appStore.data) return { decisions: {}, customHolidays: [] };
    if (!window.appStore.data.companyHolidayData) window.appStore.data.companyHolidayData = {};
    if (!window.appStore.data.companyHolidayData[companyId]) {
      window.appStore.data.companyHolidayData[companyId] = {
        decisions: {}, // date -> { festivalId, nameEn, nameHi, decision: 'APPROVED' | 'REJECTED', decidedAt }
        customHolidays: [] // Array of { id, nameEn, nameHi, date, isPaid }
      };
    }
    return window.appStore.data.companyHolidayData[companyId];
  },

  /**
   * Checks upcoming festivals and generates 15-day advance notifications for Company Admin
   */
  check15DayFestivalNotifications(companyId) {
    const todayStr = window.TimeService ? window.TimeService.getTodayStr() : new Date().toISOString().substring(0, 10);
    const companyData = this.getCompanyHolidayData(companyId);
    const notifications = [];

    this.indianFestivals.forEach(fest => {
      const daysDiff = window.TimeService ? window.TimeService.getDaysDiff(fest.date, todayStr) : Math.round((new Date(fest.date) - new Date(todayStr)) / 86400000);
      
      // Notify admin 15 days before festival (or if festival is in future within 15 days and not decided yet)
      if (daysDiff >= 0 && daysDiff <= 15) {
        const existingDecision = companyData.decisions[fest.date];
        notifications.push({
          festivalId: fest.id,
          nameEn: fest.nameEn,
          nameHi: fest.nameHi,
          date: fest.date,
          daysRemaining: daysDiff,
          decision: existingDecision ? existingDecision.decision : 'PENDING'
        });
      }
    });

    return notifications;
  },

  /**
   * Company Admin decides whether a festival is an approved Company Holiday or Normal Working Day
   */
  setCompanyFestivalDecision(companyId, festivalId, dateStr, decision) {
    const companyData = this.getCompanyHolidayData(companyId);
    const fest = this.indianFestivals.find(f => f.id === festivalId || f.date === dateStr) || { nameEn: "Company Holiday", nameHi: "कंपनी अवकाश" };
    
    companyData.decisions[dateStr] = {
      festivalId: festivalId,
      nameEn: fest.nameEn,
      nameHi: fest.nameHi,
      decision: decision, // 'APPROVED' (Paid Holiday) or 'REJECTED' (Normal Working Day)
      decidedAt: window.TimeService ? window.TimeService.getTodayStr() : new Date().toISOString().substring(0, 10)
    };

    // If APPROVED, also sync date into company fixedHolidayDates for Salary Engine & Attendance
    const company = window.appStore.data.companies.find(c => c.id === companyId);
    if (company) {
      if (!company.settings) company.settings = {};
      if (!company.settings.fixedHolidayDates) company.settings.fixedHolidayDates = [];
      
      if (decision === 'APPROVED') {
        if (!company.settings.fixedHolidayDates.includes(dateStr)) {
          company.settings.fixedHolidayDates.push(dateStr);
        }
        // Send notification to active workers of this company
        this.broadcastWorkerHolidayNotification(companyId, fest.nameEn, fest.nameHi, dateStr);
      } else {
        // Remove from fixedHolidayDates if rejected
        company.settings.fixedHolidayDates = company.settings.fixedHolidayDates.filter(d => d !== dateStr);
      }
    }

    window.appStore.saveData();
  },

  /**
   * Broadcasts holiday notification to active workers of a company
   */
  broadcastWorkerHolidayNotification(companyId, nameEn, nameHi, dateStr) {
    if (!window.appStore.data.workerNotifications) {
      window.appStore.data.workerNotifications = [];
    }

    const notifId = `NOTIF-${companyId}-${dateStr}`;
    // Prevent duplicate worker notifications
    if (window.appStore.data.workerNotifications.some(n => n.id === notifId)) return;

    window.appStore.data.workerNotifications.push({
      id: notifId,
      companyId: companyId,
      date: dateStr,
      titleEn: `Company Holiday: ${nameEn}`,
      titleHi: `कंपनी अवकाश: ${nameHi}`,
      messageEn: `${nameEn} on ${dateStr} has been declared a paid company holiday. The company will remain closed.`,
      messageHi: `${dateStr} को ${nameHi} के अवसर पर कंपनी द्वारा सवेतन अवकाश (Paid Holiday) घोषित किया गया है।`,
      createdAt: window.TimeService ? window.TimeService.getTodayStr() : new Date().toISOString().substring(0, 10)
    });

    window.appStore.saveData();
  },

  /**
   * Check if a specific date is an approved paid company holiday for a company
   */
  isCompanyPaidHoliday(companyId, dateStr) {
    const company = window.appStore.data.companies.find(c => c.id === companyId);
    if (!company) return false;
    const fixedDates = (company.settings && company.settings.fixedHolidayDates) ? company.settings.fixedHolidayDates : [];
    if (fixedDates.includes(dateStr)) return true;

    const companyData = this.getCompanyHolidayData(companyId);
    if (companyData.decisions[dateStr] && companyData.decisions[dateStr].decision === 'APPROVED') return true;

    // Check company announcements for Paid Holiday entries
    const announcements = window.appStore.getCompanyAnnouncements ? window.appStore.getCompanyAnnouncements(companyId) : [];
    if (announcements.some(a => a.type === 'PAID_HOLIDAY' && a.date === dateStr)) return true;

    return false;
  },

  /**
   * Add custom holiday by Company Admin
   */
  addCustomHoliday(companyId, nameEn, nameHi, dateStr) {
    const companyData = this.getCompanyHolidayData(companyId);
    const newHol = {
      id: `CUST-HOL-${Date.now()}`,
      nameEn: nameEn,
      nameHi: nameHi || nameEn,
      date: dateStr,
      isPaid: true
    };
    companyData.customHolidays.push(newHol);

    // Auto-approve custom holiday
    this.setCompanyFestivalDecision(companyId, newHol.id, dateStr, 'APPROVED');
  },

  /**
   * Remove custom holiday
   */
  removeCustomHoliday(companyId, holId, dateStr) {
    const companyData = this.getCompanyHolidayData(companyId);
    companyData.customHolidays = companyData.customHolidays.filter(h => h.id !== holId);
    delete companyData.decisions[dateStr];

    const company = window.appStore.data.companies.find(c => c.id === companyId);
    if (company && company.settings && company.settings.fixedHolidayDates) {
      company.settings.fixedHolidayDates = company.settings.fixedHolidayDates.filter(d => d !== dateStr);
    }
    window.appStore.saveData();
  }
};

window.HolidayService = HolidayService;
