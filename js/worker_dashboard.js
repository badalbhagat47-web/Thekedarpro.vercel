// Worker Self-Service Dashboard Module (Tabbed Navigation & Work Location/Note Support)
const WorkerDashboardModule = {
  currentWorkerTab: 'dashboard',

  setWorkerTab(tabName) {
    this.currentWorkerTab = tabName;
    if (window.appController) window.appController.renderCurrentView();
  },

  renderWorkerDashboardView() {
    const t = (k) => window.i18n.t(k);
    const currentUser = window.appStore.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'WORKER') {
      return `<div class="p-6 text-center font-bold text-rose-600">Access Denied: Worker role required.</div>`;
    }

    const worker = window.appStore.data.workers.find(w => w.id === currentUser.workerId || w.workerId === currentUser.workerId) || window.appStore.data.workers[0];
    const company = window.appStore.data.companies.find(c => c.id === worker.companyId) || window.appStore.data.companies[0];
    const s = company.settings || {};

    const todayStr = new Date().toISOString().substring(0, 10);
    const todayLog = window.appStore.data.attendance.find(a => a.workerId === worker.id && a.date === todayStr);

    const isCheckedIn = todayLog && todayLog.checkIn;
    const isCheckedOut = todayLog && todayLog.checkOut;

    const selectedMonth = window.appController ? window.appController.selectedMonth : new Date().toISOString().substring(0, 7);
    const attLogs = window.appStore.getWorkerMonthlyAttendance(worker.id, selectedMonth);
    const advLogs = window.appStore.getWorkerAdvancesForMonth(worker.id, selectedMonth);
    const sal = window.SalaryEngine.calculateMonthlySalary(worker, company, attLogs, advLogs, selectedMonth);

    const activeTab = this.currentWorkerTab;

    return `
      <div class="max-w-5xl mx-auto space-y-6">
        <!-- Worker Header Banner -->
        <div class="glass-card-dark card-3d p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-slate-800 shadow-xl">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black text-2xl flex items-center justify-center border-2 border-amber-400 shadow-lg">
              ${worker.fullName.substring(0, 1)}
            </div>
            <div>
              <div class="inline-flex items-center gap-1.5 px-3 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-[11px] font-extrabold mb-1">
                <i class="fa-solid fa-building"></i> ${company.name}
              </div>
              <h2 class="text-2xl font-black text-white tracking-wide">${worker.fullName}</h2>
              <p class="text-xs text-slate-400">Emp Code: <strong class="text-slate-200 font-mono">${sal.employeeCode}</strong> | Role: <strong class="text-amber-400">${worker.jobRole || 'Worker'}</strong></p>
            </div>
          </div>

          <div class="bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 rounded-2xl text-xs space-y-1 text-right shadow-inner">
            <div><span class="text-slate-400">Daily Wage:</span> <strong class="text-amber-400 font-extrabold">₹${worker.dailyWage}/day</strong></div>
            <div><span class="text-slate-400">Full Day Shift:</span> <strong class="text-slate-200 font-bold">${window.TimeService ? window.TimeService.format12Hour(s.fullDayStart || '09:00') : '09:00 AM'} - ${window.TimeService ? window.TimeService.format12Hour(s.fullDayEnd || '17:00') : '05:00 PM'}</strong></div>
            <div><span class="text-slate-400">Half Day Shift:</span> <strong class="text-blue-400 font-bold">${window.TimeService ? window.TimeService.format12Hour(s.halfDayStart || '13:00') : '01:00 PM'} - ${window.TimeService ? window.TimeService.format12Hour(s.fullDayEnd || '17:00') : '05:00 PM'}</strong></div>
          </div>
        </div>

        <!-- TAB CONTENT RENDERING -->
        ${activeTab === 'dashboard' ? this.renderTabDashboard(worker, company, todayStr, todayLog, isCheckedIn, isCheckedOut) : ''}
        ${activeTab === 'attendance' ? this.renderTabAttendance(attLogs, sal, selectedMonth) : ''}
        ${activeTab === 'salary' ? this.renderTabSalary(worker, sal, selectedMonth) : ''}
        ${activeTab === 'advances' ? this.renderTabAdvances(advLogs, selectedMonth) : ''}
        ${activeTab === 'profile' ? this.renderTabProfile(worker, company) : ''}
        ${activeTab === 'password' ? this.renderTabPassword(worker) : ''}
      </div>
    `;
  },

  renderTabDashboard(worker, company, todayStr, todayLog, isCheckedIn, isCheckedOut) {
    const t = (k) => window.i18n.t(k);
    const s = company.settings || {};

    const fullDayStart = s.fullDayStart || "09:00";
    const halfDayStart = s.halfDayStart || "13:00";
    const closingTime = s.closingTime || s.fullDayEnd || "17:00";

    const now = new Date();
    const nowTimeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

    const isAfterHalfDay = nowTimeStr >= halfDayStart;
    const isPastClosing = nowTimeStr >= closingTime;

    // Calculate minutes remaining to closing
    let minutesUntilClosing = -1;
    try {
      const [cHour, cMin] = closingTime.split(':').map(Number);
      const closeDate = new Date();
      closeDate.setHours(cHour, cMin, 0, 0);
      const diffMs = closeDate - now;
      if (diffMs > 0 && diffMs <= 10 * 60 * 1000) {
        minutesUntilClosing = Math.ceil(diffMs / 60000);
      }
    } catch (e) {}

    // Get Today's OT Requests for this worker
    const otRequests = (window.appStore.data.otRequests || []).filter(r => r.workerId === worker.id && r.date === todayStr);

    // Get Company Holidays / Announcements
    const holidays = (window.appStore.data.festivalHolidays || []).filter(h => h.companyId === company.id);

    // Check for completed or finishing OT requests today
    const completedOt = otRequests.find(r => r.status === 'COMPLETED' || (r.status === 'APPROVED' && r.endTime && nowTimeStr >= r.endTime));

    return `
      <div class="space-y-6">
        <!-- 10-MINUTE WORKDAY CLOSING NOTIFICATION BANNER -->
        ${minutesUntilClosing > 0 ? `
          <div class="bg-amber-500/20 border-2 border-amber-500 text-amber-900 dark:text-amber-300 p-4 rounded-3xl flex items-center justify-between shadow-xl animate-pulse">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl">
                <i class="fa-solid fa-bell"></i>
              </div>
              <div>
                <h4 class="font-extrabold text-sm uppercase tracking-wide">Workday Closing Warning</h4>
                <p class="text-xs text-slate-700 dark:text-slate-300">Today's official workday completes in <strong>${minutesUntilClosing} minutes</strong> (${window.TimeService ? window.TimeService.format12Hour(closingTime) : closingTime}). Please check out or apply for Overtime.</p>
              </div>
            </div>
            <span class="px-3 py-1 bg-amber-500 text-slate-950 rounded-xl font-mono font-black text-xs">Closing: ${window.TimeService ? window.TimeService.format12Hour(closingTime) : closingTime}</span>
          </div>
        ` : ''}

        <!-- APPROVED OT COMPLETED NOTIFICATION BANNER -->
        ${completedOt ? `
          <div class="bg-blue-500/20 border-2 border-blue-500 text-blue-900 dark:text-blue-300 p-4 rounded-3xl flex items-center justify-between shadow-xl">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center font-black text-xl">
                <i class="fa-solid fa-circle-check"></i>
              </div>
              <div>
                <h4 class="font-extrabold text-sm uppercase tracking-wide">Approved Overtime Completed</h4>
                <p class="text-xs text-slate-700 dark:text-slate-300">Your approved Overtime (${completedOt.hours} hrs, ${completedOt.startTime} - ${completedOt.endTime}) has ended and OT status is automatically closed.</p>
              </div>
            </div>
            <span class="px-3 py-1 bg-blue-600 text-white rounded-xl font-mono font-black text-xs">OT Closed</span>
          </div>
        ` : ''}

        <!-- PUNCH & WORK LOCATION CARD -->
        <div class="glass-card card-3d p-6 rounded-3xl text-center space-y-4 shadow-xl border border-slate-200 dark:border-slate-800">
          <span class="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center justify-center gap-1.5">
            <i class="fa-solid fa-clock text-amber-500"></i> ${t('todayAttendance')} — ${todayStr}
          </span>
          
          <div class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tight" id="liveClockText">
            ${new Date().toLocaleTimeString('en-IN')}
          </div>

          <div class="pt-2 max-w-md mx-auto space-y-3">
            ${!isCheckedIn ? (todayLog && todayLog.status === 'ABSENT' ? `
              <div class="bg-rose-500/10 border-2 border-rose-500/30 p-4 rounded-2xl text-rose-900 dark:text-rose-300 text-sm font-extrabold space-y-1 text-left">
                <p class="text-rose-600 dark:text-rose-400 font-black">❌ TODAY MARKED ABSENT</p>
                <p class="text-xs text-slate-600 dark:text-slate-400">Attendance status was set to ABSENT for ${todayStr}.</p>
              </div>
            ` : (isPastClosing ? `
              <div class="bg-slate-500/10 border-2 border-slate-500/30 p-4 rounded-2xl text-slate-700 dark:text-slate-300 text-sm font-extrabold space-y-1 text-left">
                <p class="text-slate-800 dark:text-slate-200 font-black">🔒 WORKDAY CLOSED (${closingTime})</p>
                <p class="text-xs text-slate-500">Normal check-in for today is closed. Contact company admin if you missed your shift.</p>
              </div>
            ` : `
              <div class="text-left space-y-2 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label class="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Work Location / Site Name *</label>
                  <input type="text" id="punchLocation" placeholder="e.g. Rohini Site B" value="Main Site" class="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl text-xs font-bold text-slate-900 dark:text-white">
                </div>
                <div>
                  <label class="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">Work Note / Task Details</label>
                  <input type="text" id="punchNote" placeholder="e.g. Electrical piping & panel wiring" value="Site duty" class="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
                </div>
              </div>

              ${isAfterHalfDay ? `
                <div class="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-700 dark:text-blue-300 font-extrabold text-center">
                  ⚠️ 1:00 PM Cutoff Passed: Check-in will be marked as HALF DAY
                </div>
                <button onclick="WorkerDashboardModule.workerCheckIn('${worker.id}', 'HALF_DAY')" 
                        class="w-full py-4 btn-3d-indigo text-white font-black text-lg rounded-2xl shadow-xl transition flex items-center justify-center gap-2">
                  <i class="fa-solid fa-user-clock text-2xl"></i> Check-In (Half Day)
                </button>
              ` : `
                <button onclick="WorkerDashboardModule.workerCheckIn('${worker.id}', 'PRESENT')" 
                        class="pulse-checkin w-full py-4 btn-3d-emerald text-white font-black text-lg rounded-2xl shadow-xl transition flex items-center justify-center gap-2">
                  <i class="fa-solid fa-fingerprint text-2xl"></i> ${t('checkIn')} (Full Day)
                </button>
              `}

              <!-- MARK ABSENT TODAY BUTTON -->
              <button onclick="WorkerDashboardModule.markAbsent('${worker.id}')" 
                      class="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold text-xs rounded-xl border border-rose-500/30 transition flex items-center justify-center gap-2">
                <i class="fa-solid fa-user-xmark"></i> Mark Absent Today
              </button>
            `)) : (!isCheckedOut ? `
              <div class="bg-emerald-500/10 border-2 border-emerald-500/30 p-4 rounded-2xl text-emerald-900 dark:text-emerald-300 text-xs font-bold text-left space-y-1">
                <div class="flex justify-between items-center">
                  <span class="px-2.5 py-0.5 bg-emerald-500 text-slate-950 rounded-lg font-black text-[11px]">${todayLog.status || 'FULL DAY'}</span>
                  <span class="font-mono text-slate-500">Check-in: ${todayLog.checkIn}</span>
                </div>
                <p class="text-slate-900 dark:text-white font-black text-sm mt-1">📍 ${todayLog.workLocation || 'Site'}</p>
                <p class="text-slate-600 dark:text-slate-400">${todayLog.workNote || 'Work in progress'}</p>
              </div>
              <button onclick="WorkerDashboardModule.workerCheckOut('${worker.id}')" 
                      class="w-full py-4 btn-3d-indigo text-white font-black text-lg rounded-2xl shadow-xl transition flex items-center justify-center gap-2">
                <i class="fa-solid fa-right-from-bracket text-xl"></i> ${t('checkOut')}
              </button>
            ` : `
              <div class="bg-blue-500/10 border-2 border-blue-500/30 p-4 rounded-2xl text-blue-900 dark:text-blue-300 text-sm font-extrabold space-y-1 text-left">
                <p class="text-emerald-500 font-black">✅ TODAY'S ATTENDANCE COMPLETED (${todayLog.status})</p>
                <p class="text-xs text-slate-600 dark:text-slate-400">In: <span class="font-mono font-bold">${todayLog.checkIn}</span> | Out: <span class="font-mono font-bold">${todayLog.checkOut}</span> ${todayLog.otHours > 0 ? `| Approved OT: <span class="text-amber-500 font-bold">${todayLog.otHours} hrs</span>` : ''}</p>
                <p class="text-xs text-slate-800 dark:text-slate-200">📍 ${todayLog.workLocation || 'Site'}</p>
              </div>
            `)}
          </div>
        </div>

        <!-- OVERTIME (OT) APPLICATION CARD -->
        <div class="glass-card card-3d p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-clock-rotate-left text-amber-500 text-lg"></i>
              <h3 class="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Apply For Overtime (OT)</h3>
            </div>
            <span class="text-xs font-bold text-slate-400">Rate: ₹${worker.otRatePerHour || 100}/hr</span>
          </div>

          <form onsubmit="WorkerDashboardModule.submitOtRequest(event, '${worker.id}')" class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">OT Start Time</label>
              <input type="time" id="otStartTime" value="${closingTime}" required class="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono font-bold text-slate-900 dark:text-white">
            </div>

            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">OT End Time</label>
              <input type="time" id="otEndTime" value="20:00" required class="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono font-bold text-slate-900 dark:text-white">
            </div>

            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Requested Hours</label>
              <input type="number" id="otHours" min="1" max="8" value="3" required class="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-slate-900 dark:text-white">
            </div>

            <div class="flex items-end">
              <button type="submit" class="w-full py-2.5 btn-3d-amber text-slate-950 font-black rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5">
                <i class="fa-solid fa-paper-plane"></i> Submit OT Request
              </button>
            </div>
          </form>

          <!-- TODAY'S OT REQUEST STATUS QUEUE -->
          ${otRequests.length > 0 ? `
            <div class="space-y-2 pt-2">
              <span class="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Today's OT Request Log</span>
              <div class="space-y-2">
                ${otRequests.map(r => `
                  <div class="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span class="font-extrabold text-slate-900 dark:text-white">${r.hours} Hours OT (${r.startTime} - ${r.endTime})</span>
                      <p class="text-[11px] text-slate-500">${r.reason || 'Extra shift'}</p>
                    </div>
                    <div>
                      ${r.status === 'APPROVED' ? `
                        <span class="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 rounded-lg font-black">
                          <i class="fa-solid fa-circle-check"></i> APPROVED (${r.hours} hrs)
                        </span>
                      ` : (r.status === 'REJECTED' ? `
                        <span class="px-2.5 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-600 dark:text-rose-400 rounded-lg font-black">
                          <i class="fa-solid fa-circle-xmark"></i> REJECTED
                        </span>
                      ` : `
                        <span class="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-400 rounded-lg font-black animate-pulse">
                          <i class="fa-solid fa-hourglass-half"></i> PENDING ADMIN APPROVAL
                        </span>
                      `)}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- COMPANY ANNOUNCEMENTS & PAID HOLIDAYS -->
        <div class="glass-card card-3d p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-bullhorn text-amber-500 text-base"></i>
            <h3 class="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Company Paid Holidays & Announcements</h3>
          </div>

          ${holidays.length > 0 ? `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              ${holidays.slice(0, 4).map(h => `
                <div class="p-3.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-black text-sm">
                    <i class="fa-solid fa-cake-candles"></i>
                  </div>
                  <div>
                    <span class="text-xs font-black text-slate-900 dark:text-white block">${h.nameEn || h.name}</span>
                    <span class="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">${h.date} — Paid Holiday</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <p class="text-xs text-slate-400 italic">No upcoming paid holiday notices currently posted by company admin.</p>
          `}
        </div>
      </div>
    `;
  },

  renderTabAttendance(attLogs, sal, selectedMonth) {
    return `
      <div class="glass-card card-3d p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 class="text-lg font-extrabold text-slate-900 dark:text-white brand-font flex items-center gap-2">
              <i class="fa-solid fa-calendar-check text-amber-500"></i> Monthly Attendance Log (${sal.monthYear})
            </h3>
            <p class="text-xs text-slate-500">View daily punch details and calculated wages</p>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-xs font-bold text-slate-500">Month:</label>
            <input type="month" value="${selectedMonth}" onchange="appController.changeMonth(this.value)" 
                   class="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
          </div>
        </div>

        <div class="flex gap-2 text-xs font-bold">
          <span class="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-lg">Full Days: ${sal.fullDaysCount}</span>
          <span class="px-2.5 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-lg">Half Days: ${sal.halfDaysCount}</span>
          <span class="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded-lg">Absent: ${sal.absentDaysCount}</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full custom-table text-left">
            <thead>
              <tr>
                <th>Date</th>
                <th>In Time</th>
                <th>Out Time</th>
                <th>Status</th>
                <th>Daily Wage</th>
                <th>Work Location & Note</th>
              </tr>
            </thead>
            <tbody>
              ${attLogs.length > 0 ? attLogs.map(log => {
                let badge = `<span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-extrabold text-xs">FULL DAY</span>`;
                let wage = `₹${sal.dailyWage}`;
                if (log.status === 'HALF_DAY') {
                  badge = `<span class="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-md font-extrabold text-xs">HALF DAY</span>`;
                  wage = `₹${sal.halfDayWage}`;
                } else if (log.status === 'ABSENT') {
                  badge = `<span class="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-md font-extrabold text-xs">ABSENT</span>`;
                  wage = `₹0`;
                }

                return `
                  <tr>
                    <td class="font-mono text-xs font-bold text-slate-900 dark:text-white">${log.date}</td>
                    <td class="font-mono text-xs text-slate-700 dark:text-slate-300">${log.checkIn || '—'}</td>
                    <td class="font-mono text-xs text-slate-700 dark:text-slate-300">${log.checkOut || '—'}</td>
                    <td>${badge}</td>
                    <td class="font-black text-slate-900 dark:text-white">${wage}</td>
                    <td class="text-xs text-slate-600 dark:text-slate-400 font-semibold">${log.workLocation ? `📍 ${log.workLocation} ${log.workNote ? `(${log.workNote})` : ''}` : '—'}</td>
                  </tr>
                `;
              }).join('') : `<tr><td colspan="6" class="text-xs text-slate-400 text-center py-4">No attendance logs recorded yet for ${sal.monthYear}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderTabSalary(worker, sal, selectedMonth) {
    const t = (k) => window.i18n.t(k);

    return `
      <div class="space-y-6">
        <!-- STATS GRID -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="glass-card p-4 rounded-2xl border-l-4 border-slate-700">
            <span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Daily Wage</span>
            <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">₹${sal.dailyWage}</div>
            <span class="text-[10px] text-blue-600 dark:text-blue-400">Half Day: ₹${sal.halfDayWage}</span>
          </div>

          <div class="glass-card p-4 rounded-2xl border-l-4 border-emerald-500">
            <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Payable Days</span>
            <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">${sal.payableDays} Days</div>
            <span class="text-[10px] text-slate-500 dark:text-slate-400">${sal.companyFixedHolidays} Co. Holidays Paid</span>
          </div>

          <div class="glass-card p-4 rounded-2xl border-l-4 border-blue-500">
            <span class="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Overtime Pay</span>
            <div class="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">₹${sal.totalOtPay}</div>
            <span class="text-[10px] text-slate-500 dark:text-slate-400">${sal.totalOtHoursMonth} OT Hours</span>
          </div>

          <div class="glass-card p-4 rounded-2xl border-l-4 border-purple-500">
            <span class="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Net Salary</span>
            <div class="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">₹${sal.netSalary.toLocaleString('en-IN')}</div>
            <span class="text-[10px] text-rose-600 dark:text-rose-400 font-bold">Advance: -₹${sal.totalAdvancesDeducted}</span>
          </div>
        </div>

        <div class="glass-card p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 class="text-lg font-extrabold text-slate-900 brand-font flex items-center gap-2">
              <i class="fa-solid fa-file-invoice-dollar text-emerald-600"></i> Monthly Salary Slip (${selectedMonth})
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">${sal.formulaExplanation}</p>
          </div>

          <button onclick="WorkerDashboardModule.openWorkerPayslipModal('${worker.id}')" 
                  class="px-5 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black rounded-2xl text-xs shadow-lg transition flex items-center gap-2">
            <i class="fa-solid fa-download"></i> ${t('downloadSalarySlip')}
          </button>
        </div>
      </div>
    `;
  },

  renderTabAdvances(advLogs, selectedMonth) {
    return `
      <div class="glass-card p-6 rounded-3xl shadow-sm space-y-3">
        <h3 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <i class="fa-solid fa-hand-holding-dollar text-purple-600"></i> My Advance Payments (${selectedMonth})
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full custom-table text-left">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount (₹)</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${advLogs.length > 0 ? advLogs.map(a => `
                <tr>
                  <td class="font-mono text-xs text-slate-600">${a.date}</td>
                  <td class="font-black text-purple-700">₹${Number(a.amount).toLocaleString('en-IN')}</td>
                  <td class="text-xs text-slate-700">${a.reason || 'Advance'}</td>
                  <td><span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-bold">DEDUCTED IN SALARY</span></td>
                </tr>
              `).join('') : `<tr><td colspan="4" class="text-xs text-slate-400 text-center py-3">No advances recorded for ${selectedMonth}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderTabProfile(worker, company) {
    return `
      <div class="glass-card card-3d p-6 rounded-3xl max-w-xl mx-auto space-y-6 shadow-xl border border-slate-200 dark:border-slate-800">
        <h3 class="text-lg font-extrabold text-slate-900 dark:text-white brand-font flex items-center gap-2">
          <i class="fa-solid fa-user-gear text-amber-500"></i> Personal Profile Information
        </h3>

        <div class="space-y-3 text-xs">
          <div class="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span class="text-slate-500 font-bold">Full Name</span>
            <span class="font-extrabold text-slate-900 dark:text-white text-sm">${worker.fullName}</span>
          </div>
          <div class="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span class="text-slate-500 font-bold">Company Name</span>
            <span class="font-bold text-amber-600 dark:text-amber-400">${company.name}</span>
          </div>
          <div class="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span class="text-slate-500 font-bold">Employee Code</span>
            <span class="font-mono font-extrabold text-slate-900 dark:text-white px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">${worker.workerId || worker.id}</span>
          </div>
          <div class="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span class="text-slate-500 font-bold">Mobile Number</span>
            <span class="font-mono font-bold text-slate-900 dark:text-white">${worker.mobile}</span>
          </div>
          <div class="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span class="text-slate-500 font-bold">Department / Role</span>
            <span class="font-bold text-slate-900 dark:text-white">${worker.department || 'Electrical'} / ${worker.jobRole || 'Worker'}</span>
          </div>
          <div class="flex justify-between pb-2">
            <span class="text-slate-500 font-bold">Daily Wage Rate</span>
            <span class="font-black text-amber-500 text-sm">₹${worker.dailyWage || 700}/day</span>
          </div>
        </div>

        <div class="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between items-center">
          <span class="text-xs text-slate-500">Security & Credentials</span>
          <button onclick="appController.navigate('worker-password')" class="px-4 py-2.5 btn-3d-amber text-slate-950 font-black rounded-xl text-xs flex items-center gap-2">
            <i class="fa-solid fa-shield-halved"></i> Change Security Password
          </button>
        </div>
      </div>
    `;
  },

  passwordStep: 1,
  otpSession: null,

  renderTabPassword(worker) {
    const isStep2 = this.passwordStep === 2 && this.otpSession && this.otpSession.targetWorkerId === worker.id;

    return `
      <div class="glass-card card-3d p-6 rounded-3xl max-w-xl mx-auto space-y-6 shadow-xl border border-slate-200 dark:border-slate-800">
        <div class="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-xl font-black shadow-lg">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <h3 class="text-lg font-extrabold text-slate-900 dark:text-white">Two-Step Password Security</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">${isStep2 ? 'Step 2 of 2: Verify Security OTP & Enter New Password' : 'Step 1 of 2: Verify Current Password'}</p>
          </div>
        </div>

        <div id="passSecurityMsg" class="hidden p-3.5 rounded-2xl text-xs font-bold"></div>

        ${!isStep2 ? `
          <!-- STEP 1: VERIFY CURRENT PASSWORD -->
          <form onsubmit="WorkerDashboardModule.handleStep1CurrentPassVerify(event, '${worker.id}')" class="space-y-4">
            <div>
              <label class="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                <i class="fa-solid fa-key text-amber-500"></i> Enter Current Password
              </label>
              <div class="relative">
                <input type="password" id="workerCurrentPass" required placeholder="••••••••" 
                       class="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none">
                <button type="button" onclick="togglePasswordVisibility('workerCurrentPass', 'eyeIconWorkerCurrent')" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 focus:outline-none" title="Show/Hide Password">
                  <i id="eyeIconWorkerCurrent" class="fa-solid fa-eye"></i>
                </button>
              </div>
            </div>

            <button type="submit" class="w-full py-3.5 px-6 btn-3d-amber text-slate-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg">
              <i class="fa-solid fa-paper-plane"></i>
              <span>Verify & Generate Security OTP</span>
            </button>
          </form>
        ` : `
          <!-- STEP 2: OTP VERIFICATION & NEW PASSWORD -->
          <div class="p-4 bg-amber-500/10 border-2 border-dashed border-amber-500/40 rounded-2xl space-y-2 text-center">
            <span class="text-xs font-bold text-amber-600 dark:text-amber-400 block uppercase tracking-wider">
              <i class="fa-solid fa-envelope-open-text text-amber-500"></i> Security Verification OTP Code
            </span>
            <div class="text-3xl font-black tracking-widest font-mono text-amber-600 dark:text-amber-400">
              ${this.otpSession.code}
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">
              Enter this demo verification OTP below along with your new password to confirm.
            </p>
          </div>

          <form onsubmit="WorkerDashboardModule.handleStep2SubmitNewPasswordWithOtp(event, '${worker.id}')" class="space-y-4">
            <div>
              <label class="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                <i class="fa-solid fa-lock text-amber-500"></i> New Password
              </label>
              <div class="relative">
                <input type="password" id="workerNewPass" required placeholder="At least 4 characters" 
                       class="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none">
                <button type="button" onclick="togglePasswordVisibility('workerNewPass', 'eyeIconWorkerNew')" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 focus:outline-none" title="Show/Hide Password">
                  <i id="eyeIconWorkerNew" class="fa-solid fa-eye"></i>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                <i class="fa-solid fa-lock text-emerald-500"></i> Confirm New Password
              </label>
              <div class="relative">
                <input type="password" id="workerConfirmPass" required placeholder="Re-enter new password" 
                       class="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none">
                <button type="button" onclick="togglePasswordVisibility('workerConfirmPass', 'eyeIconWorkerConfirm')" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 focus:outline-none" title="Show/Hide Password">
                  <i id="eyeIconWorkerConfirm" class="fa-solid fa-eye"></i>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                <i class="fa-solid fa-shield-cat text-amber-500"></i> Enter 6-Digit OTP Code
              </label>
              <input type="text" id="workerOtpCode" required maxlength="6" placeholder="e.g. ${this.otpSession.code}" 
                     class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-base font-black tracking-widest text-center text-amber-600 dark:text-amber-400 focus:outline-none font-mono">
            </div>

            <div class="flex gap-3">
              <button type="button" onclick="WorkerDashboardModule.cancelPasswordStep()" class="w-1/3 py-3 px-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-2xl">
                Cancel
              </button>
              <button type="submit" class="w-2/3 py-3.5 px-6 btn-3d-emerald text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg">
                <i class="fa-solid fa-circle-check"></i>
                <span>Confirm & Update Password</span>
              </button>
            </div>
          </form>
        `}
      </div>
    `;
  },

  handleStep1CurrentPassVerify(e, workerId) {
    e.preventDefault();
    const currPass = document.getElementById('workerCurrentPass').value;
    const worker = window.appStore.data.workers.find(w => w.id === workerId || w.workerId === workerId);
    if (!worker) {
      this.showPassMsg('❌ Worker profile not found.', 'error');
      return;
    }

    if (worker.password && !window.appStore.verifyPassword(currPass, worker.password)) {
      this.showPassMsg('❌ Incorrect Current Password. Password verification failed.', 'error');
      return;
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpSession = {
      code: otpCode,
      targetWorkerId: workerId,
      expiresAt: Date.now() + 10 * 60 * 1000
    };
    this.passwordStep = 2;
    window.appController.renderCurrentView();
  },

  handleStep2SubmitNewPasswordWithOtp(e, workerId) {
    e.preventDefault();
    const newPass = document.getElementById('workerNewPass').value;
    const confirmPass = document.getElementById('workerConfirmPass').value;
    const otpInput = document.getElementById('workerOtpCode').value.trim();

    if (!newPass || newPass.length < 4) {
      this.showPassMsg('❌ Password must be at least 4 characters long.', 'error');
      return;
    }

    if (newPass !== confirmPass) {
      this.showPassMsg('❌ New Password and Confirm Password do not match.', 'error');
      return;
    }

    if (!this.otpSession || this.otpSession.targetWorkerId !== workerId) {
      this.showPassMsg('❌ Security session expired. Please restart verification.', 'error');
      return;
    }

    if (otpInput !== this.otpSession.code) {
      this.showPassMsg('❌ Incorrect Security OTP Code. Please check the code above.', 'error');
      return;
    }

    const res = window.appStore.resetWorkerPassword(workerId, newPass);
    if (res.success) {
      this.otpSession = null;
      this.passwordStep = 1;
      alert("✅ Password updated successfully! Please use your new password next time you log in.");
      window.appController.renderCurrentView();
    } else {
      this.showPassMsg(res.error || '❌ Failed to update password.', 'error');
    }
  },

  showPassMsg(text, type) {
    const el = document.getElementById('passSecurityMsg');
    if (!el) return;
    el.classList.remove('hidden', 'bg-rose-500/10', 'border-rose-500', 'text-rose-600', 'bg-emerald-500/10', 'border-emerald-500', 'text-emerald-600');
    el.classList.add('border', 'border-2');
    if (type === 'error') {
      el.classList.add('bg-rose-500/10', 'border-rose-500', 'text-rose-600', 'dark:text-rose-400');
    } else {
      el.classList.add('bg-emerald-500/10', 'border-emerald-500', 'text-emerald-600', 'dark:text-emerald-400');
    }
    el.innerText = text;
  },

  cancelPasswordStep() {
    this.passwordStep = 1;
    this.otpSession = null;
    window.appController.renderCurrentView();
  },

  workerCheckIn(workerId, statusOverride) {
    const todayStr = new Date().toISOString().substring(0, 10);
    const worker = window.appStore.data.workers.find(w => w.id === workerId);
    const company = window.appStore.data.companies.find(c => c.id === worker.companyId);
    const s = company ? company.settings : {};
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

    const locationInput = document.getElementById('punchLocation');
    const noteInput = document.getElementById('punchNote');

    const workLocation = locationInput ? locationInput.value : "Site Office";
    const workNote = noteInput ? noteInput.value : "Main Shift";

    // AUTOMATIC FULL DAY VS HALF DAY RULE
    const halfDayStart = s.halfDayStart || "13:00";
    let status = statusOverride || "PRESENT";
    if (!statusOverride && timeStr >= halfDayStart) {
      status = "HALF_DAY";
    }

    window.appStore.recordAttendance({
      id: `ATT-${todayStr}-${workerId}`,
      companyId: worker.companyId,
      workerId: workerId,
      date: todayStr,
      checkIn: timeStr,
      checkOut: null,
      otHours: 0,
      status: status,
      workLocation: workLocation,
      workNote: workNote
    });

    alert(`✅ Checked in at ${timeStr}!\nStatus: ${status === 'HALF_DAY' ? 'HALF DAY (After ' + halfDayStart + ' Cutoff)' : 'FULL DAY'}\nLocation: ${workLocation}`);
    window.appController.renderCurrentView();
  },

  markAbsent(workerId) {
    if (!confirm("Are you sure you want to mark yourself ABSENT for today?")) return;
    const todayStr = new Date().toISOString().substring(0, 10);
    window.appStore.markWorkerAbsent(workerId, todayStr);
    alert("❌ Today marked as ABSENT.");
    window.appController.renderCurrentView();
  },

  submitOtRequest(e, workerId) {
    e.preventDefault();
    const todayStr = new Date().toISOString().substring(0, 10);
    const startTime = document.getElementById('otStartTime').value;
    const endTime = document.getElementById('otEndTime').value;
    const otHours = document.getElementById('otHours').value;

    if (!otHours || Number(otHours) <= 0) {
      alert("⚠️ Please enter valid OT hours.");
      return;
    }

    const req = window.appStore.requestOvertime(workerId, todayStr, otHours, "Worker Applied OT", startTime, endTime);
    alert(`✅ Overtime application submitted!\nHours: ${otHours} hrs (${startTime} - ${endTime})\nStatus: PENDING ADMIN APPROVAL`);
    window.appController.renderCurrentView();
  },

  workerCheckOut(workerId) {
    const todayStr = new Date().toISOString().substring(0, 10);
    const existing = window.appStore.data.attendance.find(a => a.workerId === workerId && a.date === todayStr);
    const worker = window.appStore.data.workers.find(w => w.id === workerId);
    const company = window.appStore.data.companies.find(c => c.id === worker.companyId);
    const s = company ? company.settings : {};

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

    let otHours = 0;
    const otStartTime = s.otStartTime || "17:00";
    const otStartHour = parseInt(otStartTime.split(':')[0], 10);
    const currentHour = now.getHours();

    if (currentHour > otStartHour) {
      otHours = currentHour - otStartHour;
    }

    if (existing) {
      existing.checkOut = timeStr;
      existing.otHours = otHours;
      window.appStore.saveData();
    }

    alert(`Checked out at ${timeStr}.${otHours > 0 ? ` Overtime recorded: ${otHours} hours!` : ''}`);
    window.appController.renderCurrentView();
  },

  openWorkerPayslipModal(workerId, monthOverrideStr) {
    if (!window.appStore || !window.appStore.data) return;
    const workers = window.appStore.data.workers || [];
    const worker = workers.find(w => String(w.id) === String(workerId) || String(w.workerId) === String(workerId));
    if (!worker) {
      alert(window.i18n.t('noWorkersFound') || "Worker not found or inactive.");
      return;
    }
    const company = (window.appStore.data.companies || []).find(c => c.id === worker.companyId) || (window.appStore.data.companies || [])[0];
    
    let selectedMonth = monthOverrideStr;
    if (!selectedMonth) {
      const monthInput = document.getElementById('payslipMonthSelect');
      selectedMonth = monthInput ? monthInput.value : (window.appController ? window.appController.selectedMonth : null);
    }
    if (!selectedMonth) {
      selectedMonth = window.TimeService ? window.TimeService.getCurrentYearMonth() : new Date().toISOString().substring(0, 7);
    }

    const attLogs = window.appStore.getWorkerMonthlyAttendance(worker.id, selectedMonth);
    const advLogs = window.appStore.getWorkerAdvancesForMonth(worker.id, selectedMonth);
    const sal = window.SalaryEngine.calculateMonthlySalary(worker, company, attLogs, advLogs, selectedMonth);

    const modal = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    if (!modal || !content) return;

    const closeTxt = window.i18n.currentLang === 'hi' ? 'बंद करें' : 'Close';

    content.innerHTML = `
      <div class="relative bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full mx-auto max-h-[90vh] overflow-y-auto">
        <button onclick="appController.closeModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl font-bold transition no-print">
          <i class="fa-solid fa-xmark"></i>
        </button>

        ${window.PayslipRenderer.renderPayslip(sal, company, worker)}
      </div>
    `;

    modal.classList.remove('hidden');
  }
};

window.WorkerDashboardModule = WorkerDashboardModule;
