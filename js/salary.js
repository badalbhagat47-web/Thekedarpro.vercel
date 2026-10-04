// Salary Calculation Engine Module (Enhanced for Full-Day, Half-Day, & Pending Status)
const SalaryEngine = {
  /**
   * Calculates monthly salary details for a worker
   * @param {Object} worker - Worker object with dailyWage, otRatePerHour, etc.
   * @param {Object} company - Company object with settings
   * @param {Array} attendanceList - Attendance logs for the worker in the selected month
   * @param {Array} advancesList - Advances taken by worker in the selected month
   * @param {String} yearMonthStr - Format "YYYY-MM" (e.g. "2026-10")
   */
  calculateMonthlySalary(worker, company, attendanceList, advancesList, yearMonthStr) {
    const [year, month] = yearMonthStr.split('-').map(Number);
    const totalMonthDays = new Date(year, month, 0).getDate();

    const companySettings = (company && company.settings) ? company.settings : {
      fixedHolidaysCount: 4,
      fixedHolidayDates: [],
      holidayWorkBonusRate: 0,
      defaultDailyWage: 700,
      defaultOtRate: 100
    };

    const dailyWage = Number(worker.dailyWage) || companySettings.defaultDailyWage || 700;
    const halfDayWage = dailyWage / 2;
    const otRatePerHour = (worker.otRatePerHour !== undefined && worker.otRatePerHour !== null) 
      ? Number(worker.otRatePerHour) 
      : (companySettings.defaultOtRate || 100);

    const fixedHolidaysSet = new Set(companySettings.fixedHolidayDates || []);

    let fullDaysCount = 0;
    let halfDaysCount = 0;
    let absentDaysCount = 0;
    let pendingDaysCount = 0;
    let companyHolidaysObserved = 0;
    let totalOtHoursMonth = 0;

    const logsByDate = {};
    (attendanceList || []).forEach(log => {
      logsByDate[log.date] = log;
    });

    const todayStr = new Date().toISOString().substring(0, 10);
    const closingTime = companySettings.closingTime || "17:00";
    const nowTimeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const isPastClosing = nowTimeStr >= closingTime;

    for (let day = 1; day <= totalMonthDays; day++) {
      const dayStr = `${yearMonthStr}-${String(day).padStart(2, '0')}`;
      const isCompanyHoliday = fixedHolidaysSet.has(dayStr) || 
        (window.HolidayService && window.HolidayService.isCompanyPaidHoliday(company ? company.id : null, dayStr));
      const log = logsByDate[dayStr];

      if (log && log.otHours) {
        totalOtHoursMonth += Number(log.otHours) || 0;
      }

      if (isCompanyHoliday) {
        if (log && (log.status === 'PRESENT' || log.status === 'FULL_DAY')) {
          fullDaysCount++;
        } else if (log && log.status === 'HALF_DAY') {
          halfDaysCount++;
        } else {
          companyHolidaysObserved++; // PAID Company Holiday
        }
      } else {
        if (log) {
          if (log.status === 'PRESENT' || log.status === 'FULL_DAY') {
            fullDaysCount++;
          } else if (log.status === 'HALF_DAY') {
            halfDaysCount++;
          } else if (log.status === 'ABSENT') {
            absentDaysCount++;
          } else if (log.status === 'PENDING') {
            if (dayStr < todayStr || (dayStr === todayStr && isPastClosing)) {
              absentDaysCount++; // Auto-finalized to ABSENT
            } else {
              pendingDaysCount++;
            }
          }
        } else {
          // No log recorded yet
          if (dayStr < todayStr || (dayStr === todayStr && isPastClosing)) {
            absentDaysCount++;
          } else if (dayStr === todayStr && !isPastClosing) {
            pendingDaysCount++;
          }
          // Future dates in month are not counted as absent yet
        }
      }
    }

    // Salary Component Breakdown
    const fullDaySalary = fullDaysCount * dailyWage;
    const halfDaySalary = halfDaysCount * halfDayWage;
    const holidayPaidSalary = companyHolidaysObserved * dailyWage;
    const baseGrossSalary = fullDaySalary + halfDaySalary + holidayPaidSalary;

    const totalOtPay = totalOtHoursMonth * otRatePerHour;
    const totalGrossSalary = baseGrossSalary + totalOtPay;

    const totalAdvancesDeducted = (advancesList || []).reduce((sum, adv) => sum + (Number(adv.amount) || 0), 0);
    const netSalary = Math.max(0, totalGrossSalary - totalAdvancesDeducted);

    const payableDays = fullDaysCount + (halfDaysCount * 0.5) + companyHolidaysObserved;

    return {
      workerId: worker.id,
      workerName: worker.fullName,
      employeeCode: worker.workerId || worker.id,
      dailyWage: dailyWage,
      halfDayWage: halfDayWage,
      otRatePerHour: otRatePerHour,
      monthYear: yearMonthStr,
      totalMonthDays: totalMonthDays,
      fullDaysCount: fullDaysCount,
      halfDaysCount: halfDaysCount,
      absentDaysCount: absentDaysCount,
      pendingDaysCount: pendingDaysCount,
      companyFixedHolidays: companyHolidaysObserved,
      payableDays: payableDays,
      fullDaySalary: fullDaySalary,
      halfDaySalary: halfDaySalary,
      holidayPaidSalary: holidayPaidSalary,
      baseGrossSalary: baseGrossSalary,
      totalOtHoursMonth: totalOtHoursMonth,
      totalOtPay: totalOtPay,
      totalGrossSalary: totalGrossSalary,
      totalAdvancesDeducted: totalAdvancesDeducted,
      netSalary: netSalary,
      formulaExplanation: `Full Days: ${fullDaysCount} (₹${fullDaySalary}) + Half Days: ${halfDaysCount} (₹${halfDaySalary}) + Paid Holidays: ${companyHolidaysObserved} (₹${holidayPaidSalary}) + OT Pay (₹${totalOtPay}) - Advances (₹${totalAdvancesDeducted}) = ₹${netSalary}.`
    };
  },

  /**
   * Helper method to calculate salary using companyId and workerId directly
   */
  calculateSalaryForWorker(companyId, workerId, yearMonthStr) {
    if (!window.appStore || !window.appStore.data) {
      return { payableDays: 0, netSalary: 0, totalGrossSalary: 0, totalAdvancesDeducted: 0 };
    }
    const store = window.appStore;
    const worker = (store.data.workers || []).find(w => String(w.id) === String(workerId) || String(w.workerId) === String(workerId));
    const company = (store.data.companies || []).find(c => c.id === companyId) || (store.data.companies || [])[0];

    if (!worker) {
      return {
        workerId: workerId,
        workerName: "Unknown Worker",
        employeeCode: workerId,
        dailyWage: 0,
        payableDays: 0,
        netSalary: 0,
        totalGrossSalary: 0,
        totalAdvancesDeducted: 0
      };
    }

    const monthStr = yearMonthStr || (window.TimeService ? window.TimeService.getCurrentYearMonth() : new Date().toISOString().substring(0, 7));
    const attendanceLogs = (store.data.attendance || store.data.attendanceLogs || []).filter(l => 
      (String(l.workerId) === String(worker.id) || String(l.workerId) === String(worker.workerId)) &&
      l.date && l.date.startsWith(monthStr)
    );

    const advancesList = (store.data.advances || []).filter(a => 
      (String(a.workerId) === String(worker.id) || String(a.workerId) === String(worker.workerId)) &&
      a.date && a.date.startsWith(monthStr)
    );

    return this.calculateMonthlySalary(worker, company, attendanceLogs, advancesList, monthStr);
  }
};

window.SalaryEngine = SalaryEngine;
