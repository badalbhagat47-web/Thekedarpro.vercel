// Company Admin Dashboard & Management Module (Enhanced Attendance Timings & Deactivation)
const CompanyAdminModule = {
  renderDashboardView() {
    const t = (k) => window.i18n.t(k);
    const currentUser = window.appStore.getCurrentUser();
    const companyId = currentUser ? currentUser.companyId : "RLV-POWER-8821";
    const company = window.appStore.data.companies.find(c => c.id === companyId) || window.appStore.data.companies[0];
    const s = company.settings || {};
    
    // Active workers only for live attendance roster
    const activeWorkers = window.appStore.getCompanyWorkers(companyId, false);

    const todayStr = new Date().toISOString().substring(0, 10);
    const attendanceToday = window.appStore.getTodayAttendance(companyId, todayStr);

    const nowTimeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const closingTime = s.closingTime || "17:00";
    const isPastClosing = nowTimeStr >= closingTime;

    let fullDayCount = 0;
    let halfDayCount = 0;
    let pendingCount = 0;
    let absentCount = 0;
    let checkedOutCount = 0;
    const attendanceMap = {};

    attendanceToday.forEach(a => {
      attendanceMap[a.workerId] = a;
    });

    activeWorkers.forEach(w => {
      const a = attendanceMap[w.id];
      if (a) {
        if (a.status === 'PRESENT' || a.status === 'FULL_DAY') fullDayCount++;
        else if (a.status === 'HALF_DAY') halfDayCount++;
        else if (a.status === 'ABSENT') absentCount++;
        else if (a.status === 'PENDING') {
          if (isPastClosing) absentCount++;
          else pendingCount++;
        }
        if (a.checkOut) checkedOutCount++;
      } else {
        if (isPastClosing) absentCount++;
        else pendingCount++;
      }
    });

    return `
      <div class="space-y-6">
        <!-- Company Admin Header Banner -->
        <div class="glass-card-dark p-6 rounded-3xl relative overflow-hidden shadow-xl border border-slate-800">
          <div class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold mb-2">
                <i class="fa-solid fa-building"></i> ${company.name} (ID: <span class="font-mono">${company.id}</span>)
              </div>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-white brand-font tracking-wide">
                ${t('contractorDashboard')} - TODAY (${todayStr})
              </h2>
              <div class="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-300">
                <span class="bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 font-mono"><i class="fa-solid fa-clock text-amber-400"></i> Full Day: <b>${window.TimeService ? window.TimeService.format12Hour(s.fullDayStart || '09:00') : '09:00 AM'} to ${window.TimeService ? window.TimeService.format12Hour(s.fullDayEnd || '17:00') : '05:00 PM'}</b></span>
                <span class="bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 font-mono"><i class="fa-solid fa-clock text-blue-400"></i> Half Day: <b>${window.TimeService ? window.TimeService.format12Hour(s.halfDayStart || '13:00') : '01:00 PM'} to ${window.TimeService ? window.TimeService.format12Hour(s.fullDayEnd || '17:00') : '05:00 PM'}</b></span>
                <span class="bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 font-mono"><i class="fa-solid fa-bell text-rose-400"></i> Closing: <b>${window.TimeService ? window.TimeService.format12Hour(closingTime) : '05:00 PM'}</b></span>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button onclick="appController.navigate('payslips')" 
                      class="btn-3d-amber px-4 py-2.5 text-slate-950 font-black rounded-xl text-xs shadow-md flex items-center gap-2">
                <i class="fa-solid fa-file-invoice-dollar text-sm"></i> ${t('salarySlips')}
              </button>
              <button onclick="appController.openCreateProfileModal()" 
                      class="btn-3d-emerald px-4 py-2.5 text-white font-black rounded-xl text-xs shadow-md flex items-center gap-2">
                <i class="fa-solid fa-user-plus text-sm"></i> ${t('addWorkerProfile')}
              </button>
            </div>
          </div>
        </div>

        <!-- STATS GRID INCLUDING PENDING -->
        <div class="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-slate-700">
            <span class="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Active Workers</span>
            <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">${activeWorkers.length}</div>
          </div>
          <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-emerald-500">
            <span class="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Full Day</span>
            <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">${fullDayCount}</div>
          </div>
          <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-blue-500">
            <span class="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Half Day</span>
            <div class="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">${halfDayCount}</div>
          </div>
          <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-amber-500">
            <span class="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending</span>
            <div class="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">${pendingCount}</div>
          </div>
          <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-rose-500">
            <span class="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Absent</span>
            <div class="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">${absentCount}</div>
          </div>
          <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-indigo-500">
            <span class="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Checked Out</span>
            <div class="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">${checkedOutCount}</div>
          </div>
        </div>

        <!-- OVERTIME (OT) APPROVAL QUEUE CARD -->
        ${(() => {
          const otReqs = (window.appStore.data.otRequests || []).filter(r => r.companyId === company.id && r.date === todayStr);
          if (otReqs.length === 0) return '';
          return `
            <div class="glass-card card-3d p-6 rounded-3xl shadow-md border-l-4 border-amber-500 space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="fa-solid fa-clock-rotate-left text-amber-500 text-lg"></i>
                  <h3 class="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Worker Overtime (OT) Approval Queue (${otReqs.length})</h3>
                </div>
                <span class="text-xs font-bold text-amber-600 dark:text-amber-400">Review & Approve Extra Shift Hours</span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${otReqs.map(r => `
                  <div class="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span class="font-extrabold text-slate-900 dark:text-white block text-sm">${r.workerName}</span>
                      <p class="text-slate-500 font-medium">${r.hours} Hours OT (${r.startTime} - ${r.endTime})</p>
                      <p class="text-[11px] text-slate-400 italic">${r.reason || 'Extra shift duty'}</p>
                    </div>

                    <div class="flex items-center gap-2">
                      ${r.status === 'PENDING' ? `
                        <button onclick="CompanyAdminModule.approveOtRequest('${r.id}', 'APPROVED')"
                                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow transition">
                          Approve
                        </button>
                        <button onclick="CompanyAdminModule.approveOtRequest('${r.id}', 'REJECTED')"
                                class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow transition">
                          Reject
                        </button>
                      ` : `
                        <span class="px-3 py-1 rounded-xl font-black text-xs ${r.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}">
                          ${r.status}
                        </span>
                      `}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        })()}

        <!-- DAILY ATTENDANCE TIMELINE TABLE -->
        <div class="glass-card card-3d rounded-3xl p-6 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 class="text-lg font-extrabold text-slate-900 dark:text-white brand-font flex items-center gap-2">
                <i class="fa-solid fa-users text-amber-500"></i> ${t('liveAttendanceRoster')}
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">Shows Check-In/Out times, calculated daily salary, work site location, and notes.</p>
            </div>
            <button onclick="appController.openCreateProfileModal()" class="btn-3d-amber px-3.5 py-1.5 text-slate-950 text-xs font-black rounded-xl">${t('addWorkerProfile')}</button>
          </div>

          <div class="overflow-x-auto w-full border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table class="w-full custom-table text-left border-collapse min-w-[1050px]">
              <thead>
                <tr class="text-[11px] font-black uppercase text-slate-500 bg-slate-100/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 tracking-wider">
                  <th class="py-3 px-3 min-w-[160px] whitespace-nowrap">Worker Name</th>
                  <th class="py-3 px-3 min-w-[100px] whitespace-nowrap">Check In</th>
                  <th class="py-3 px-3 min-w-[100px] whitespace-nowrap">Check Out</th>
                  <th class="py-3 px-3 min-w-[120px] whitespace-nowrap">Attendance</th>
                  <th class="py-3 px-3 min-w-[110px] whitespace-nowrap">Worker Status</th>
                  <th class="py-3 px-3 min-w-[110px] whitespace-nowrap">Today Salary</th>
                  <th class="py-3 px-3 min-w-[150px] whitespace-nowrap">Work Location / Note</th>
                  <th class="py-3 px-3 min-w-[180px] text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                ${activeWorkers.map(w => {
                  const log = attendanceMap[w.id];
                  let status = 'PENDING';
                  let checkInTime = '—';
                  let checkOutTime = '—';
                  let salaryText = '—';
                  let locationText = '—';

                  if (log) {
                    checkInTime = log.checkIn || '—';
                    checkOutTime = log.checkOut || '—';
                    status = log.status || 'PRESENT';
                    locationText = log.workLocation ? `📍 ${log.workLocation} ${log.workNote ? `(${log.workNote})` : ''}` : '—';
                  }

                  if (status === 'PENDING' && isPastClosing) {
                    status = 'ABSENT';
                  }

                  let statusBadge = '';
                  if (status === 'PRESENT' || status === 'FULL_DAY') {
                    statusBadge = `<span class="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1">FULL DAY</span>`;
                    salaryText = `₹${w.dailyWage}`;
                  } else if (status === 'HALF_DAY') {
                    statusBadge = `<span class="px-2.5 py-1 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1">HALF DAY</span>`;
                    salaryText = `₹${w.dailyWage / 2}`;
                  } else if (status === 'PENDING') {
                    statusBadge = `<span class="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1">PENDING</span>`;
                    salaryText = `—`;
                  } else {
                    statusBadge = `<span class="px-2.5 py-1 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1">ABSENT</span>`;
                    salaryText = `₹0`;
                  }

                  return `
                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition">
                      <td class="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div class="font-extrabold hover:text-amber-500 cursor-pointer" onclick="appController.navigate('worker-profile', '${w.id}')">${w.fullName}</div>
                        <div class="text-[10px] text-slate-400 font-medium tracking-tight">${w.jobRole || 'Worker'} (${w.workerId})</div>
                      </td>
                      <td class="py-3 px-3 font-mono text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">${checkInTime}</td>
                      <td class="py-3 px-3 font-mono text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">${checkOutTime}</td>
                      <td class="py-3 px-3 whitespace-nowrap">${statusBadge}</td>
                      <td class="py-3 px-3 whitespace-nowrap">
                        ${w.status === 'PENDING' ? `
                          <span class="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm"><i class="fa-solid fa-clock-rotate-left text-amber-500"></i> PENDING</span>
                        ` : w.status === 'INACTIVE' ? `
                          <span class="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm"><i class="fa-solid fa-circle-minus text-slate-400"></i> INACTIVE</span>
                        ` : `
                          <span class="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm"><i class="fa-solid fa-circle-check text-emerald-500"></i> ACTIVE</span>
                        `}
                      </td>
                      <td class="py-3 px-3 font-black text-slate-900 dark:text-white text-xs whitespace-nowrap">${salaryText}</td>
                      <td class="py-3 px-3 text-xs text-slate-600 dark:text-slate-400 font-semibold whitespace-nowrap">${locationText}</td>
                      <td class="py-3 px-3 text-right whitespace-nowrap">
                        <div class="inline-flex items-center gap-1.5">
                          <button onclick="CompanyAdminModule.cycleAttendanceStatus('${w.id}')" title="Cycle Attendance Status" class="px-2 py-1 bg-amber-100 dark:bg-amber-950 hover:bg-amber-200 text-amber-900 dark:text-amber-300 rounded-lg text-[11px] font-extrabold mr-1">Mark</button>
                          <button onclick="CompanyAdminModule.openWorkerPayslip('${w.id}')" title="${t('viewSalarySlip')}" class="p-1.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg hover:scale-105 transition"><i class="fa-solid fa-file-invoice-dollar text-xs"></i></button>
                          <button onclick="appController.navigate('worker-profile', '${w.id}')" title="View Profile" class="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:scale-105 transition"><i class="fa-solid fa-eye text-xs"></i></button>
                          <button onclick="CompanyAdminModule.openEditWorkerModal('${w.id}')" title="Edit Profile" class="p-1.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg hover:scale-105 transition"><i class="fa-solid fa-pen-to-square text-xs"></i></button>
                          ${w.status === 'PENDING' ? `
                            <button onclick="CompanyAdminModule.toggleWorkerPending('${w.id}')" title="Set Status to ACTIVE (Allow Access)" class="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg hover:scale-105 transition"><i class="fa-solid fa-user-check text-xs"></i></button>
                          ` : w.status === 'INACTIVE' ? `
                            <button onclick="CompanyAdminModule.reactivateWorker('${w.id}')" title="Reactivate Worker" class="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg hover:scale-105 transition"><i class="fa-solid fa-user-check text-xs"></i></button>
                          ` : `
                            <button onclick="CompanyAdminModule.toggleWorkerPending('${w.id}')" title="Set Status to PENDING (Restrict Access)" class="p-1.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg hover:scale-105 transition"><i class="fa-solid fa-user-clock text-xs"></i></button>
                          `}
                          <button onclick="CompanyAdminModule.confirmDeleteWorker('${w.id}')" title="Delete Permanently" class="p-1.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-lg hover:scale-105 transition"><i class="fa-solid fa-trash-can text-xs"></i></button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- PROFESSIONAL ANALYTICS & INSIGHTS SECTION -->
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-black text-slate-900 dark:text-white brand-font flex items-center gap-2">
              <i class="fa-solid fa-chart-line text-amber-500"></i> Analytics & Insights Summary
            </h3>
            <span class="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
              <i class="fa-solid fa-circle-check text-emerald-500"></i> Live Data Sync
            </span>
          </div>

          <!-- 1. SUMMARY SALARY & ADVANCE METRIC CARDS -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-emerald-500 shadow-sm space-y-1">
              <span class="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Total Gross Salary</span>
              <div class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white" id="analyticsTotalGross">₹0</div>
              <span class="text-[10px] text-slate-400 font-semibold block">Gross Payable (${window.appController ? window.appController.selectedMonth : ''})</span>
            </div>

            <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-rose-500 shadow-sm space-y-1">
              <span class="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider">Total Advances</span>
              <div class="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400" id="analyticsTotalAdvances">₹0</div>
              <span class="text-[10px] text-slate-400 font-semibold block">Advances Granted</span>
            </div>

            <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-purple-500 shadow-sm space-y-1">
              <span class="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">Total Deductions</span>
              <div class="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400" id="analyticsTotalDeductions">₹0</div>
              <span class="text-[10px] text-slate-400 font-semibold block">Advance Deducted</span>
            </div>

            <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-amber-500 shadow-sm space-y-1">
              <span class="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Net Salary Payable</span>
              <div class="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400" id="analyticsTotalNet">₹0</div>
              <span class="text-[10px] text-slate-400 font-semibold block">Final Net Pay</span>
            </div>
          </div>

          <!-- 6 CORE CHARTS GRID -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Chart 1: Today's Attendance Breakdown -->
            <div class="glass-card card-3d p-5 rounded-3xl space-y-3">
              <div class="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 class="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <i class="fa-solid fa-chart-pie text-emerald-500"></i> Attendance Overview
                </h4>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full">Today</span>
              </div>
              <div class="relative h-52 flex items-center justify-center">
                <canvas id="attendanceOverviewChart"></canvas>
              </div>
            </div>

            <!-- Chart 2: Monthly Financial Payroll Summary -->
            <div class="glass-card card-3d p-5 rounded-3xl space-y-3">
              <div class="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 class="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <i class="fa-solid fa-chart-column text-amber-500"></i> Monthly Financials (₹)
                </h4>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-full font-mono">${window.appController ? window.appController.selectedMonth : new Date().toISOString().substring(0, 7)}</span>
              </div>
              <div class="relative h-52 flex items-center justify-center">
                <canvas id="payrollOverviewChart"></canvas>
              </div>
            </div>

            <!-- Chart 3: Workforce Status Overview -->
            <div class="glass-card card-3d p-5 rounded-3xl space-y-3">
              <div class="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 class="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <i class="fa-solid fa-users-gear text-indigo-500"></i> Workforce Roster Status
                </h4>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full">All Workers</span>
              </div>
              <div class="relative h-52 flex items-center justify-center">
                <canvas id="workforceStatusChart"></canvas>
              </div>
            </div>

            <!-- Chart 4: Monthly Salary Trend (Line Chart) -->
            <div class="glass-card card-3d p-5 rounded-3xl space-y-3">
              <div class="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 class="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <i class="fa-solid fa-arrow-trend-up text-purple-500"></i> Monthly Salary Trend
                </h4>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-full">6 Months</span>
              </div>
              <div class="relative h-52 flex items-center justify-center">
                <canvas id="salaryTrendChart"></canvas>
              </div>
            </div>

            <!-- Chart 5: Daily Attendance Performance Trend (Line Chart) -->
            <div class="glass-card card-3d p-5 rounded-3xl space-y-3">
              <div class="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 class="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <i class="fa-solid fa-calendar-days text-blue-500"></i> Attendance Performance Trend
                </h4>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full">Month Days</span>
              </div>
              <div class="relative h-52 flex items-center justify-center">
                <canvas id="attendanceTrendChart"></canvas>
              </div>
            </div>

            <!-- Chart 6: Department-wise Worker Distribution -->
            <div class="glass-card card-3d p-5 rounded-3xl space-y-3">
              <div class="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                <h4 class="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <i class="fa-solid fa-sitemap text-teal-500"></i> Department Workers
                </h4>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-full">Departments</span>
              </div>
              <div class="relative h-52 flex items-center justify-center">
                <canvas id="departmentDistributionChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  initDashboardCharts() {
    if (typeof Chart === 'undefined') return;

    if (!this._charts) this._charts = {};
    if (this._charts.attendance) { try { this._charts.attendance.destroy(); } catch(e){} }
    if (this._charts.payroll) { try { this._charts.payroll.destroy(); } catch(e){} }
    if (this._charts.workforce) { try { this._charts.workforce.destroy(); } catch(e){} }
    if (this._charts.salaryTrend) { try { this._charts.salaryTrend.destroy(); } catch(e){} }
    if (this._charts.attendanceTrend) { try { this._charts.attendanceTrend.destroy(); } catch(e){} }
    if (this._charts.department) { try { this._charts.department.destroy(); } catch(e){} }

    const currentUser = window.appStore.getCurrentUser();
    const companyId = currentUser ? currentUser.companyId : "RLV-POWER-8821";
    const company = window.appStore.data.companies.find(c => c.id === companyId) || window.appStore.data.companies[0];
    const isHi = window.i18n.currentLang === 'hi';

    // 1. ATTENDANCE DATA TODAY
    const activeWorkers = window.appStore.getCompanyWorkers(companyId, false);
    const todayStr = new Date().toISOString().substring(0, 10);
    const attendanceToday = window.appStore.getTodayAttendance(companyId, todayStr);

    const nowTimeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const closingTime = (company.settings && company.settings.closingTime) || "17:00";
    const isPastClosing = nowTimeStr >= closingTime;

    let fullDayCount = 0, halfDayCount = 0, pendingCount = 0, absentCount = 0, checkedOutCount = 0;
    const attendanceMap = {};
    attendanceToday.forEach(a => { attendanceMap[a.workerId] = a; });

    activeWorkers.forEach(w => {
      const a = attendanceMap[w.id];
      if (a) {
        if (a.status === 'PRESENT' || a.status === 'FULL_DAY') fullDayCount++;
        else if (a.status === 'HALF_DAY') halfDayCount++;
        else if (a.status === 'ABSENT') absentCount++;
        else if (a.status === 'PENDING') {
          if (isPastClosing) absentCount++; else pendingCount++;
        }
        if (a.checkOut) checkedOutCount++;
      } else {
        if (isPastClosing) absentCount++; else pendingCount++;
      }
    });

    // Render Chart 1: Attendance Breakdown
    const attCtx = document.getElementById('attendanceOverviewChart');
    if (attCtx) {
      this._charts.attendance = new Chart(attCtx, {
        type: 'doughnut',
        data: {
          labels: isHi 
            ? ['पूरा दिन (Full Day)', 'आधा दिन (Half Day)', 'लंबित (Pending)', 'अनुपस्थित (Absent)', 'चेक आउट (Checked Out)']
            : ['Full Day', 'Half Day', 'Pending', 'Absent', 'Checked Out'],
          datasets: [{
            data: [fullDayCount, halfDayCount, pendingCount, absentCount, checkedOutCount],
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6366f1'],
            borderWidth: 2,
            borderColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 10,
                font: { size: 10, weight: 'bold' },
                color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#334155'
              }
            }
          }
        }
      });
    }

    // 2. MONTHLY FINANCIAL PAYROLL DATA & CARDS
    const selectedMonth = window.appController ? window.appController.selectedMonth : new Date().toISOString().substring(0, 7);
    let totalGross = 0, totalAdvances = 0, totalNet = 0;

    activeWorkers.forEach(w => {
      const attLogs = window.appStore.getWorkerMonthlyAttendance(w.id, selectedMonth);
      const advLogs = window.appStore.getWorkerAdvancesForMonth(w.id, selectedMonth);
      const sal = window.SalaryEngine.calculateMonthlySalary(w, company, attLogs, advLogs, selectedMonth);
      totalGross += sal.totalGrossSalary || 0;
      totalAdvances += sal.totalAdvancesDeducted || 0;
      totalNet += sal.netSalary || 0;
    });

    // Update Summary Metric Cards
    const elGross = document.getElementById('analyticsTotalGross');
    const elAdv = document.getElementById('analyticsTotalAdvances');
    const elDed = document.getElementById('analyticsTotalDeductions');
    const elNet = document.getElementById('analyticsTotalNet');
    if (elGross) elGross.innerText = '₹' + totalGross.toLocaleString('en-IN');
    if (elAdv) elAdv.innerText = '₹' + totalAdvances.toLocaleString('en-IN');
    if (elDed) elDed.innerText = '₹' + totalAdvances.toLocaleString('en-IN');
    if (elNet) elNet.innerText = '₹' + totalNet.toLocaleString('en-IN');

    const payCtx = document.getElementById('payrollOverviewChart');
    if (payCtx) {
      this._charts.payroll = new Chart(payCtx, {
        type: 'bar',
        data: {
          labels: isHi 
            ? ['सकल वेतन', 'अग्रिम कटौती', 'शुद्ध देय']
            : ['Gross Salary', 'Advances', 'Net Payable'],
          datasets: [{
            label: isHi ? 'राशि (₹)' : 'Amount (₹)',
            data: [totalGross, totalAdvances, totalNet],
            backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                font: { size: 10, weight: 'bold' },
                color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#334155'
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                font: { size: 10, weight: 'bold' },
                color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#334155',
                callback: (v) => '₹' + v.toLocaleString('en-IN')
              }
            }
          }
        }
      });
    }

    // 3. WORKFORCE STATUS DATA
    const allWorkers = window.appStore.data.workers.filter(w => w.companyId === companyId);
    const activeCount = allWorkers.filter(w => w.status === 'ACTIVE' || !w.status).length;
    const pendingStatusCount = allWorkers.filter(w => w.status === 'PENDING').length;
    const inactiveCount = allWorkers.filter(w => w.status === 'INACTIVE').length;

    const wfCtx = document.getElementById('workforceStatusChart');
    if (wfCtx) {
      this._charts.workforce = new Chart(wfCtx, {
        type: 'pie',
        data: {
          labels: isHi 
            ? ['सक्रिय (Active)', 'लंबित (Pending)', 'निष्क्रिय (Inactive)']
            : ['Active', 'Pending Approval', 'Inactive'],
          datasets: [{
            data: [activeCount, pendingStatusCount, inactiveCount],
            backgroundColor: ['#10b981', '#f59e0b', '#64748b'],
            borderWidth: 2,
            borderColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 10,
                font: { size: 10, weight: 'bold' },
                color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#334155'
              }
            }
          }
        }
      });
    }

    // 4. MONTHLY SALARY TREND (LAST 6 MONTHS)
    const monthLabels = [];
    const trendGross = [];
    const trendNet = [];
    const currDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currDate.getFullYear(), currDate.getMonth() - i, 1);
      const mStr = d.toISOString().substring(0, 7);
      monthLabels.push(mStr);

      let mGross = 0, mNet = 0;
      activeWorkers.forEach(w => {
        const att = window.appStore.getWorkerMonthlyAttendance(w.id, mStr);
        const adv = window.appStore.getWorkerAdvancesForMonth(w.id, mStr);
        const sal = window.SalaryEngine.calculateMonthlySalary(w, company, att, adv, mStr);
        mGross += sal.totalGrossSalary || 0;
        mNet += sal.netSalary || 0;
      });
      trendGross.push(mGross);
      trendNet.push(mNet);
    }

    const stCtx = document.getElementById('salaryTrendChart');
    if (stCtx) {
      this._charts.salaryTrend = new Chart(stCtx, {
        type: 'line',
        data: {
          labels: monthLabels,
          datasets: [
            {
              label: isHi ? 'सकल वेतन (Gross)' : 'Gross Salary',
              data: trendGross,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.3
            },
            {
              label: isHi ? 'शुद्ध देय (Net)' : 'Net Payable',
              data: trendNet,
              borderColor: '#f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              fill: true,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 10,
                font: { size: 10, weight: 'bold' },
                color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#334155'
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 9, weight: 'bold' }, color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#334155' }
            },
            y: {
              beginAtZero: true,
              ticks: { font: { size: 9, weight: 'bold' }, color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#334155', callback: (v) => '₹' + v }
            }
          }
        }
      });
    }

    // 5. DAILY ATTENDANCE PERFORMANCE TREND (CURRENT MONTH)
    const yearMonth = selectedMonth;
    const daysInMonth = new Date(parseInt(yearMonth.split('-')[0]), parseInt(yearMonth.split('-')[1]), 0).getDate();
    const dayLabels = [];
    const dailyPresentCounts = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${yearMonth}-${day < 10 ? '0' + day : day}`;
      dayLabels.push(`${day}`);
      let count = 0;
      window.appStore.data.attendance.forEach(a => {
        if (a.companyId === companyId && a.date === dStr && (a.status === 'PRESENT' || a.status === 'FULL_DAY' || a.status === 'HALF_DAY')) {
          count++;
        }
      });
      dailyPresentCounts.push(count);
    }

    const atCtx = document.getElementById('attendanceTrendChart');
    if (atCtx) {
      this._charts.attendanceTrend = new Chart(atCtx, {
        type: 'line',
        data: {
          labels: dayLabels,
          datasets: [{
            label: isHi ? 'उपस्थित मजदूर' : 'Present Workers',
            data: dailyPresentCounts,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            fill: true,
            tension: 0.2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 10,
                font: { size: 10, weight: 'bold' },
                color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#334155'
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 9, weight: 'bold' }, color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#334155' }
            },
            y: {
              beginAtZero: true,
              ticks: { precision: 0, font: { size: 9, weight: 'bold' }, color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#334155' }
            }
          }
        }
      });
    }

    // 6. DEPARTMENT-WISE WORKER DISTRIBUTION (BAR CHART)
    const deptMap = {};
    activeWorkers.forEach(w => {
      const dName = w.department || (isHi ? 'सामान्य' : 'General');
      deptMap[dName] = (deptMap[dName] || 0) + 1;
    });

    const deptLabels = Object.keys(deptMap);
    const deptCounts = Object.values(deptMap);

    const deptCtx = document.getElementById('departmentDistributionChart');
    if (deptCtx) {
      this._charts.department = new Chart(deptCtx, {
        type: 'bar',
        data: {
          labels: deptLabels.length > 0 ? deptLabels : [isHi ? 'सामान्य' : 'General'],
          datasets: [{
            label: isHi ? 'कर्मचारी संख्या' : 'Worker Count',
            data: deptCounts.length > 0 ? deptCounts : [activeWorkers.length],
            backgroundColor: ['#14b8a6', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 10, weight: 'bold' }, color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#334155' }
            },
            y: {
              beginAtZero: true,
              ticks: { precision: 0, font: { size: 10, weight: 'bold' }, color: document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#334155' }
            }
          }
        }
      });
    }
  },

  cycleAttendanceStatus(workerId) {
    const currentUser = window.appStore.getCurrentUser();
    const companyId = currentUser ? currentUser.companyId : "RLV-POWER-8821";
    const todayStr = new Date().toISOString().substring(0, 10);
    const existing = window.appStore.data.attendance.find(a => a.workerId === workerId && a.date === todayStr);

    if (!existing) {
      // Record Full Day
      window.appStore.recordAttendance({
        id: `ATT-${todayStr}-${workerId}`,
        companyId: companyId,
        workerId: workerId,
        date: todayStr,
        checkIn: "09:00",
        checkOut: "17:00",
        status: "PRESENT",
        workLocation: "Rohini Site Office",
        workNote: "Full day shift"
      });
    } else if (existing.status === "PRESENT" || existing.status === "FULL_DAY") {
      // Switch to Half Day
      existing.status = "HALF_DAY";
      existing.checkIn = "13:00";
      existing.checkOut = "17:00";
    } else if (existing.status === "HALF_DAY") {
      // Switch to Absent
      existing.status = "ABSENT";
      existing.checkIn = null;
      existing.checkOut = null;
    } else {
      // Reset back to Full Day
      existing.status = "PRESENT";
      existing.checkIn = "09:00";
      existing.checkOut = "17:00";
    }
    window.appStore.saveData();
    window.appController.renderCurrentView();
  },

  renderWorkersRosterView() {
    const t = (k) => window.i18n.t(k);
    const currentUser = window.appStore.getCurrentUser();
    const companyId = currentUser ? currentUser.companyId : "RLV-POWER-8821";
    const company = window.appStore.data.companies.find(c => c.id === companyId) || window.appStore.data.companies[0];
    const workers = window.appStore.getCompanyWorkers(companyId, true);
    const selectedMonth = window.appController.selectedMonth;

    const searchTerm = (this.workerSearchQuery || '').toLowerCase().trim();
    const filteredWorkers = workers.filter(w => 
      !searchTerm || 
      (w.fullName && w.fullName.toLowerCase().includes(searchTerm)) || 
      (w.workerId && w.workerId.toLowerCase().includes(searchTerm)) || 
      (w.mobile && w.mobile.includes(searchTerm)) ||
      (w.department && w.department.toLowerCase().includes(searchTerm))
    );

    const activeWorkers = filteredWorkers.filter(w => w.status !== 'INACTIVE');
    const inactiveWorkers = filteredWorkers.filter(w => w.status === 'INACTIVE');

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 class="text-2xl font-black text-slate-900 dark:text-white brand-font tracking-wide">${t('workersRoster')}</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">Manage active employees, departments, site units, and access credentials.</p>
          </div>
          <button onclick="appController.openCreateProfileModal()" class="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black rounded-xl text-xs shadow-lg flex items-center gap-2">
            <i class="fa-solid fa-user-plus"></i> ${t('addWorkerProfile')}
          </button>
        </div>

        <!-- SEARCH BAR -->
        <div class="glass-card dark:glass-card-dark p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div class="relative">
            <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-slate-400 text-xs"></i>
            <input type="text" id="workerSearchInput" value="${this.workerSearchQuery || ''}" oninput="CompanyAdminModule.handleWorkerSearch(this.value)" 
                   placeholder="Search worker by name, employee code, mobile number, department..." 
                   class="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none">
          </div>
        </div>

        <!-- ACTIVE WORKERS TAB -->
        <div class="glass-card dark:glass-card-dark p-6 rounded-3xl shadow-sm space-y-4 border border-slate-200 dark:border-slate-800">
          <div class="flex justify-between items-center">
            <h3 class="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <i class="fa-solid fa-user-check text-emerald-600"></i> ${t('activeWorkers')} (${activeWorkers.length})
            </h3>
          </div>

          <div class="overflow-x-auto w-full border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table class="w-full custom-table text-left border-collapse min-w-[950px]">
              <thead>
                <tr class="text-[11px] font-black uppercase text-slate-500 bg-slate-100/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 tracking-wider">
                  <th class="py-3 px-3 min-w-[110px] whitespace-nowrap">Employee Code</th>
                  <th class="py-3 px-3 min-w-[160px] whitespace-nowrap">Name</th>
                  <th class="py-3 px-3 min-w-[130px] whitespace-nowrap">Mobile Number</th>
                  <th class="py-3 px-3 min-w-[130px] whitespace-nowrap">Department</th>
                  <th class="py-3 px-3 min-w-[90px] whitespace-nowrap">Unit</th>
                  <th class="py-3 px-3 min-w-[110px] whitespace-nowrap">Salary Type</th>
                  <th class="py-3 px-3 min-w-[110px] whitespace-nowrap">Total Balance</th>
                  <th class="py-3 px-3 min-w-[110px] whitespace-nowrap">Status</th>
                  <th class="py-3 px-3 min-w-[150px] text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                ${activeWorkers.length > 0 ? activeWorkers.map(w => {
                  const attLogs = window.appStore.getWorkerMonthlyAttendance(w.id, selectedMonth);
                  const advLogs = window.appStore.getWorkerAdvancesForMonth(w.id, selectedMonth);
                  const sal = window.SalaryEngine.calculateMonthlySalary(w, company, attLogs, advLogs, selectedMonth);
                  const netBal = sal.netSalary;

                  let salaryTypePill = '<span class="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-md font-extrabold text-[10px] whitespace-nowrap">Per Day</span>';
                  if (w.salaryType === 'MONTHLY') {
                    salaryTypePill = '<span class="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 rounded-md font-extrabold text-[10px] whitespace-nowrap">Per Month</span>';
                  } else if (w.salaryType === 'HOURLY') {
                    salaryTypePill = '<span class="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-md font-extrabold text-[10px] whitespace-nowrap">Per Hour</span>';
                  }

                  return `
                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition">
                      <td class="py-3 px-3 font-mono font-black text-amber-600 dark:text-amber-400 whitespace-nowrap">${w.workerId || w.id}</td>
                      <td class="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div class="font-extrabold hover:text-amber-500 cursor-pointer" onclick="appController.navigate('worker-profile', '${w.id}')">${w.fullName}</div>
                        <div class="text-[10px] text-slate-400 font-medium tracking-tight">${w.jobRole || 'Worker'}</div>
                      </td>
                      <td class="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">${w.mobile}</td>
                      <td class="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">${w.department || 'Electrical'}</td>
                      <td class="py-3 px-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">${w.unit || 'Site A'}</td>
                      <td class="py-3 px-3 whitespace-nowrap">${salaryTypePill}</td>
                      <td class="py-3 px-3 font-extrabold whitespace-nowrap ${netBal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}">₹${netBal.toLocaleString('en-IN')}</td>
                      <td class="py-3 px-3 whitespace-nowrap">
                        ${w.status === 'PENDING' ? `
                          <span class="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm"><i class="fa-solid fa-clock-rotate-left text-amber-500"></i> PENDING</span>
                        ` : w.status === 'INACTIVE' ? `
                          <span class="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm"><i class="fa-solid fa-circle-minus text-slate-400"></i> INACTIVE</span>
                        ` : `
                          <span class="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm"><i class="fa-solid fa-circle-check text-emerald-500"></i> ACTIVE</span>
                        `}
                      </td>
                      <td class="py-3 px-3 text-right whitespace-nowrap">
                        <div class="inline-flex items-center gap-1.5">
                          <button onclick="appController.navigate('worker-profile', '${w.id}')" title="View Profile" class="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:scale-105 transition"><i class="fa-solid fa-eye text-xs"></i></button>
                          <button onclick="CompanyAdminModule.openEditWorkerModal('${w.id}')" title="Edit Profile" class="p-1.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg hover:scale-105 transition"><i class="fa-solid fa-pen-to-square text-xs"></i></button>
                          ${w.status === 'PENDING' ? `
                            <button onclick="CompanyAdminModule.toggleWorkerPending('${w.id}')" title="Set Status to ACTIVE (Allow Access)" class="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg hover:scale-105 transition"><i class="fa-solid fa-user-check text-xs"></i></button>
                          ` : w.status === 'INACTIVE' ? `
                            <button onclick="CompanyAdminModule.reactivateWorker('${w.id}')" title="Reactivate Worker" class="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg hover:scale-105 transition"><i class="fa-solid fa-user-check text-xs"></i></button>
                          ` : `
                            <button onclick="CompanyAdminModule.toggleWorkerPending('${w.id}')" title="Set Status to PENDING (Restrict Access)" class="p-1.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg hover:scale-105 transition"><i class="fa-solid fa-user-clock text-xs"></i></button>
                          `}
                          <button onclick="CompanyAdminModule.confirmDeleteWorker('${w.id}')" title="Delete Permanently" class="p-1.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-lg hover:scale-105 transition"><i class="fa-solid fa-trash-can text-xs"></i></button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('') : `
                  <tr>
                    <td colspan="9" class="text-center py-6 text-slate-400 text-xs font-semibold">No active workers matching "${this.workerSearchQuery || ''}" found.</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

        <!-- FORMER / INACTIVE WORKERS TAB -->
        ${inactiveWorkers.length > 0 ? `
          <div class="glass-card dark:glass-card-dark p-6 rounded-3xl shadow-sm space-y-4 border-l-4 border-slate-500">
            <h3 class="text-base font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <i class="fa-solid fa-user-slash text-slate-500"></i> ${t('inactiveWorkers')} (${inactiveWorkers.length})
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Deactivated workers cannot mark attendance, but historical records remain fully preserved.</p>
            <div class="overflow-x-auto">
              <table class="w-full custom-table text-left">
                <thead>
                  <tr>
                    <th>Worker Name</th>
                    <th>Employee ID</th>
                    <th>Mobile</th>
                    <th>Daily Wage</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${inactiveWorkers.map(w => `
                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                      <td class="font-bold text-slate-900 dark:text-slate-200">${w.fullName} (${w.jobRole || 'Worker'})</td>
                      <td class="font-mono text-xs text-slate-800 dark:text-slate-300 font-bold">${w.workerId || w.id}</td>
                      <td class="text-xs font-mono text-slate-800 dark:text-slate-300 font-bold">${w.mobile}</td>
                      <td class="font-semibold text-slate-800 dark:text-slate-300">₹${w.dailyWage}/day</td>
                      <td><span class="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold">INACTIVE</span></td>
                      <td class="space-x-1">
                        <button onclick="CompanyAdminModule.reactivateWorker('${w.id}')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold">${t('reactivateWorker')}</button>
                        <button onclick="CompanyAdminModule.confirmDeleteWorker('${w.id}')" class="px-2.5 py-1 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded-lg text-xs font-bold"><i class="fa-solid fa-trash"></i> ${t('deleteWorker')}</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  handleWorkerSearch(val) {
    this.workerSearchQuery = val;
    window.appController.renderCurrentView();
  },

  openEditWorkerModal(workerId) {
    const worker = window.appStore.data.workers.find(w => w.id === workerId);
    if (!worker) {
      alert("Worker profile not found.");
      return;
    }

    const modal = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');

    content.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-lg mx-auto space-y-4 border border-slate-200 dark:border-slate-800">
        <div class="flex justify-between items-center border-b dark:border-slate-800 pb-3">
          <h3 class="text-xl font-extrabold text-slate-900 dark:text-white brand-font">Edit Worker Profile</h3>
          <button onclick="appController.closeModal()" class="text-slate-400 font-bold text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form onsubmit="CompanyAdminModule.submitEditWorkerForm(event, '${worker.id}')" class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Worker Full Name *</label>
            <input type="text" id="editWorkerName" required value="${worker.fullName}" class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile Number (10 Digits) *</label>
              <input type="text" id="editWorkerMobile" required value="${worker.mobile}" maxlength="10" 
                     oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10)" 
                     placeholder="10 numeric digits" 
                     class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white">
              <p class="text-[10px] text-slate-500 mt-1">Exactly 10 numeric digits</p>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Employee Code / ID *</label>
              <input type="text" id="editWorkerEmpCode" required value="${worker.workerId || worker.id}" class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
              <input type="text" id="editWorkerDept" value="${worker.department || 'Electrical'}" class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Unit / Site</label>
              <input type="text" id="editWorkerUnit" value="${worker.unit || 'Site A'}" class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Salary Type</label>
              <select id="editWorkerSalaryType" class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
                <option value="DAILY" ${worker.salaryType === 'DAILY' ? 'selected' : ''}>Per Day (Daily)</option>
                <option value="MONTHLY" ${worker.salaryType === 'MONTHLY' ? 'selected' : ''}>Per Month (Fixed)</option>
                <option value="HOURLY" ${worker.salaryType === 'HOURLY' ? 'selected' : ''}>Per Hour (Hourly)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Base Wage (₹) *</label>
              <input type="number" id="editWorkerWage" value="${worker.dailyWage || 700}" required class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">OT Rate (₹/hr)</label>
              <input type="number" id="editWorkerOt" value="${worker.otRatePerHour || 100}" required class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Job Role / Secondary Info</label>
            <input type="text" id="editWorkerRole" value="${worker.jobRole || 'Electrician'}" class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
          </div>

          <div id="editWorkerErrorAlert" class="hidden p-3 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-bold"></div>

          <div class="pt-2 flex justify-end gap-2">
            <button type="button" onclick="appController.closeModal()" class="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
            <button type="submit" class="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md">Save Changes</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  showDuplicateMobileModal(mobileNum) {
    const modal = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-md mx-auto space-y-4 border border-amber-200 dark:border-amber-900 text-slate-900 dark:text-white">
        <div class="flex justify-between items-center border-b dark:border-slate-800 pb-3">
          <h3 class="text-lg font-black text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <i class="fa-solid fa-triangle-exclamation"></i> Mobile Number Already Registered
          </h3>
          <button onclick="appController.closeModal()" class="text-slate-400 font-bold text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="space-y-3 text-xs font-medium">
          <p class="text-slate-700 dark:text-slate-300 font-bold text-sm">This mobile number is already assigned to another worker.</p>
          <div class="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-2xl font-mono text-sm font-black flex items-center justify-between">
            <span>Registered Mobile:</span>
            <span class="text-amber-600 dark:text-amber-400 font-extrabold">+91 ${mobileNum}</span>
          </div>
          <p class="text-slate-500">Each worker must have a unique 10-digit mobile number for account login and authentication.</p>
        </div>
        <div class="pt-2 flex justify-end">
          <button onclick="appController.closeModal()" class="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow transition">Close</button>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
  },

  submitEditWorkerForm(e, workerId) {
    e.preventDefault();
    const name = document.getElementById('editWorkerName').value;
    const rawMobile = document.getElementById('editWorkerMobile').value;
    const empCode = document.getElementById('editWorkerEmpCode').value;
    const dept = document.getElementById('editWorkerDept').value;
    const unit = document.getElementById('editWorkerUnit').value;
    const salaryType = document.getElementById('editWorkerSalaryType').value;
    const wage = document.getElementById('editWorkerWage').value;
    const ot = document.getElementById('editWorkerOt').value;
    const role = document.getElementById('editWorkerRole').value;
    const errEl = document.getElementById('editWorkerErrorAlert');
    if (errEl) errEl.classList.add('hidden');

    const cleanMob = String(rawMobile).trim().replace(/^\+91/, '').replace(/[^0-9]/g, '');
    if (cleanMob.length !== 10) {
      if (errEl) {
        errEl.innerText = "❌ Mobile number must be exactly 10 digits.";
        errEl.classList.remove('hidden');
      } else {
        alert("❌ Mobile number must be exactly 10 digits.");
      }
      return;
    }

    const res = window.appStore.updateWorkerProfile(workerId, {
      fullName: name,
      mobile: cleanMob,
      employeeCode: empCode,
      department: dept,
      unit: unit,
      salaryType: salaryType,
      dailyWage: wage,
      otRatePerHour: ot,
      jobRole: role
    });

    if (!res.success) {
      if (res.error && res.error.toLowerCase().includes('already exists')) {
        this.showDuplicateMobileModal(cleanMob);
        return;
      }
      if (errEl) {
        errEl.innerText = `❌ ${res.error}`;
        errEl.classList.remove('hidden');
      } else {
        alert(`❌ ${res.error}`);
      }
      return;
    }

    window.appController.closeModal();
    alert("✅ Worker profile updated successfully!");
    window.appController.renderCurrentView();
  },

  handleWorkerSearch(val) {
    this.workerSearchQuery = val;
    const searchInput = document.getElementById('workerSearchInput');
    const selStart = searchInput ? searchInput.selectionStart : null;
    const selEnd = searchInput ? searchInput.selectionEnd : null;

    window.appController.renderCurrentView();

    const updatedInput = document.getElementById('workerSearchInput');
    if (updatedInput && selStart !== null) {
      updatedInput.focus();
      try {
        updatedInput.setSelectionRange(selStart, selEnd);
      } catch (e) {}
    }
  },

  toggleWorkerPending(workerId) {
    const worker = window.appStore.data.workers.find(w => w.id === workerId);
    if (!worker) return;
    const newStatus = worker.status === 'PENDING' ? 'ACTIVE' : 'PENDING';
    window.appStore.toggleWorkerPending(workerId);
    alert(`${newStatus === 'PENDING' ? '⏳' : '🟢'} ${worker.fullName} status updated to ${newStatus}.`);
    window.appController.renderCurrentView();
  },

  confirmDeactivateWorker(workerId) {
    const worker = window.appStore.data.workers.find(w => w.id === workerId);
    if (!worker) return;
    const t = (k) => window.i18n.t(k);
    if (confirm(`Deactivate ${worker.fullName}?\n\n${t('confirmDeactivate')}`)) {
      window.appStore.deactivateWorker(workerId);
      alert(`✅ ${worker.fullName} has been deactivated.`);
      window.appController.renderCurrentView();
    }
  },

  confirmDeleteWorker(workerId) {
    const worker = window.appStore.data.workers.find(w => w.id === workerId);
    if (!worker) return;

    const modal = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    if (!modal || !content) return;

    // STEP 1 OF 2 MODAL
    content.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-md mx-auto space-y-4 border border-rose-200 dark:border-rose-900 text-slate-900 dark:text-white">
        <div class="flex justify-between items-center border-b dark:border-slate-800 pb-3">
          <h3 class="text-lg font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <i class="fa-solid fa-triangle-exclamation"></i> Delete Worker (Step 1 of 2)
          </h3>
          <button onclick="appController.closeModal()" class="text-slate-400 font-bold text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="space-y-2 text-xs font-medium">
          <p class="text-slate-700 dark:text-slate-300">Are you sure you want to delete this worker profile?</p>
          <div class="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold">
            <div class="text-sm text-slate-900 dark:text-white">${worker.fullName}</div>
            <div class="text-[11px] text-amber-600 dark:text-amber-400 font-mono mt-0.5">Code: ${worker.workerId || worker.id} | Mobile: ${worker.mobile}</div>
          </div>
          <p class="text-slate-500">This will initiate worker record removal from your company database.</p>
        </div>
        <div class="flex gap-2 pt-2">
          <button onclick="appController.closeModal()" class="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition">Cancel</button>
          <button onclick="CompanyAdminModule.openDeleteStep2('${worker.id}')" class="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow flex items-center justify-center gap-1 transition">
            Proceed to Step 2 <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
  },

  openDeleteStep2(workerId) {
    const worker = window.appStore.data.workers.find(w => w.id === workerId);
    if (!worker) return;

    const modal = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    if (!modal || !content) return;

    // STEP 2 OF 2 MODAL (DOUBLE CONFIRMATION)
    content.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-md mx-auto space-y-4 border-2 border-rose-500 dark:border-rose-600 text-slate-900 dark:text-white">
        <div class="flex justify-between items-center border-b dark:border-slate-800 pb-3">
          <h3 class="text-lg font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <i class="fa-solid fa-skull-crossbones"></i> DOUBLE CONFIRMATION (Step 2 of 2)
          </h3>
          <button onclick="appController.closeModal()" class="text-slate-400 font-bold text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="space-y-3 text-xs">
          <div class="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 rounded-2xl font-bold space-y-1">
            <div class="text-sm font-black">🚨 FINAL PERMISSION REQUIRED</div>
            <p class="text-[11px] font-medium">Are you ABSOLUTELY SURE you want to permanently delete <strong>${worker.fullName}</strong>?</p>
            <p class="text-[10px] text-rose-700 dark:text-rose-400">This action CANNOT BE UNDONE. Profile data, attendance history, and balances will be removed permanently.</p>
          </div>
        </div>
        <div class="flex gap-2 pt-2">
          <button onclick="appController.closeModal()" class="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition">Cancel</button>
          <button onclick="CompanyAdminModule.executeDeleteWorker('${worker.id}')" class="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-1 transition active:scale-95">
            <i class="fa-solid fa-trash-can"></i> YES, DELETE PERMANENTLY
          </button>
        </div>
      </div>
    `;
  },

  executeDeleteWorker(workerId) {
    const worker = window.appStore.data.workers.find(w => w.id === workerId);
    window.appStore.deleteWorkerPermanently(workerId);
    window.appController.closeModal();
    if (worker) alert(`🗑️ Worker ${worker.fullName} deleted permanently after 2-Step Double Confirmation!`);
    window.appController.renderCurrentView();
  },

  reactivateWorker(workerId) {
    window.appStore.reactivateWorker(workerId);
    alert("✅ Worker reactivated successfully!");
    window.appController.renderCurrentView();
  },

  promptResetPassword(workerId, workerName) {
    const newPass = prompt(`Enter new password for ${workerName}:`, "password123");
    if (newPass) {
      window.appStore.resetWorkerPassword(workerId, newPass);
      alert(`✅ Password updated for ${workerName}!\n\nNew Password: ${newPass}`);
    }
  },

  renderWorkerProfileView(workerId) {
    const currentUser = window.appStore.getCurrentUser();
    const companyId = currentUser ? currentUser.companyId : "RLV-POWER-8821";
    const worker = window.appStore.data.workers.find(w => w.id === workerId && w.companyId === companyId);
    if (!worker) {
      return `<div class="p-6 text-center font-bold text-rose-600">Access Denied: Worker profile not found in your company.</div>`;
    }

    const company = window.appStore.data.companies.find(c => c.id === companyId);
    const selectedMonth = window.appController.selectedMonth;
    const attLogs = window.appStore.getWorkerMonthlyAttendance(worker.id, selectedMonth);
    const advLogs = window.appStore.getWorkerAdvancesForMonth(worker.id, selectedMonth);
    const sal = window.SalaryEngine.calculateMonthlySalary(worker, company, attLogs, advLogs, selectedMonth);

    return `
      <div class="space-y-6 max-w-4xl mx-auto">
        <div class="glass-card-dark p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-slate-800">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center border-2 border-amber-400 shadow-lg">
              ${worker.fullName.substring(0, 1)}
            </div>
            <div>
              <h2 class="text-2xl font-extrabold text-white tracking-wide">${worker.fullName}</h2>
              <p class="text-xs text-amber-400 font-semibold">${worker.jobRole || 'Worker'} (${worker.department || 'General'})</p>
              <p class="text-xs text-slate-400 mt-0.5">Emp ID: ${worker.workerId} | Mobile: ${worker.mobile} | Status: <span class="font-bold text-emerald-400">${worker.status || 'ACTIVE'}</span></p>
            </div>
          </div>
          <button onclick="appController.navigate('workers')" class="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">← Back to Roster</button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border-l-4 border-amber-500 shadow-sm border border-slate-200 dark:border-slate-800">
            <span class="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Daily Wage</span>
            <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">₹${worker.dailyWage}</div>
          </div>

          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border-l-4 border-blue-500 shadow-sm border border-slate-200 dark:border-slate-800">
            <span class="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">OT Rate</span>
            <div class="text-2xl font-black text-blue-600 dark:text-blue-300 mt-1">₹${worker.otRatePerHour || 100}/hr</div>
          </div>

          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border-l-4 border-emerald-500 shadow-sm border border-slate-200 dark:border-slate-800">
            <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Full Days / Half Days</span>
            <div class="text-2xl font-black text-emerald-600 dark:text-emerald-300 mt-1">${sal.fullDaysCount} / ${sal.halfDaysCount}</div>
          </div>

          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border-l-4 border-purple-500 shadow-sm border border-slate-200 dark:border-slate-800">
            <span class="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Net Salary</span>
            <div class="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">₹${sal.netSalary.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>
    `;
  },

  renderCodeManagementView() {
    const currentUser = window.appStore.getCurrentUser();
    const companyId = currentUser ? currentUser.companyId : "RLV-POWER-8821";
    const codes = window.appStore.getCompanyCodes(companyId);

    return `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-black text-slate-900 brand-font tracking-wide">One-Time Registration Codes</h2>
            <p class="text-xs text-slate-500">Unique codes generated when a worker account is created by Company Admin.</p>
          </div>
          <button onclick="appController.openCreateProfileModal()" class="px-4 py-2.5 bg-amber-500 font-black text-slate-950 rounded-xl text-xs">+ Create Worker & Code</button>
        </div>

        <div class="glass-card p-6 rounded-3xl shadow-sm">
          <table class="w-full custom-table text-left">
            <thead>
              <tr>
                <th>Registration Code</th>
                <th>Assigned Worker</th>
                <th>Status</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${codes.map(c => `
                <tr>
                  <td class="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">${c.code}</td>
                  <td class="font-bold text-slate-900 dark:text-white">${c.usedByName || 'Employment Profile'}</td>
                  <td>
                    <span class="px-2.5 py-1 rounded-lg text-xs font-black ${c.status === 'USED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}">
                      ${c.status}
                    </span>
                  </td>
                  <td class="text-xs text-slate-600 dark:text-slate-400 font-mono">${c.createdAt ? c.createdAt.substring(0, 10) : '2026-01-01'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderSalaryEngineView() {
    const t = (k) => window.i18n.t(k);
    const currentUser = window.appStore.getCurrentUser();
    const companyId = currentUser ? currentUser.companyId : "RLV-POWER-8821";
    const company = window.appStore.data.companies.find(c => c.id === companyId) || window.appStore.data.companies[0];
    const workers = window.appStore.getCompanyWorkers(companyId, true);
    const yearMonth = window.appController.selectedMonth;

    return `
      <div class="space-y-6">
        <div class="glass-card-dark p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 class="text-2xl font-black text-amber-400 brand-font tracking-wide">${t('salaryCalculation')}</h2>
            <p class="text-xs text-slate-300">Full Day = 1.0x Daily Wage | Half Day = 0.5x Daily Wage | Absent = ₹0</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-slate-400 font-bold uppercase">Select Month:</span>
            <input type="month" value="${yearMonth}" onchange="appController.onMonthChange(this.value)" 
                   class="px-3 py-1.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-mono font-bold">
          </div>
        </div>

        <div class="glass-card p-6 rounded-3xl shadow-sm space-y-4">
          <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table class="w-full custom-table text-left min-w-[1100px] whitespace-nowrap">
              <thead>
                <tr>
                  <th class="py-3 px-4">${t('navWorkers')}</th>
                  <th class="py-3 px-4">${t('dailyWage')}</th>
                  <th class="py-3 px-4 text-center">${t('fullDay')}</th>
                  <th class="py-3 px-4 text-center">${t('halfDay')}</th>
                  <th class="py-3 px-4 text-center">${t('absent')}</th>
                  <th class="py-3 px-4 text-center">Co. Holidays</th>
                  <th class="py-3 px-4 text-center">${t('payableDays')}</th>
                  <th class="py-3 px-4">${t('otPayLabel')}</th>
                  <th class="py-3 px-4">${t('grossSalary')}</th>
                  <th class="py-3 px-4">${t('advanceDeducted')}</th>
                  <th class="py-3 px-4">${t('netSalary')}</th>
                  <th class="py-3 px-4 text-center">${t('action')}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                ${workers.length === 0 ? `
                  <tr>
                    <td colspan="12" class="text-center py-8 text-slate-400 font-bold text-xs">
                      No active workers registered in Worker Roster.
                    </td>
                  </tr>
                ` : workers.map(w => {
                  const attLogs = window.appStore.getWorkerMonthlyAttendance(w.id, yearMonth);
                  const advLogs = window.appStore.getWorkerAdvancesForMonth(w.id, yearMonth);
                  const sal = window.SalaryEngine.calculateMonthlySalary(w, company, attLogs, advLogs, yearMonth);

                  return `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td class="py-3 px-4 font-bold text-slate-900 dark:text-white cursor-pointer hover:text-amber-500" onclick="appController.navigate('worker-profile', '${w.id}')">
                        <div class="font-extrabold text-sm">${w.fullName}</div>
                        <div class="text-[10px] text-slate-400 font-mono">${w.workerId || w.id}</div>
                      </td>
                      <td class="py-3 px-4 font-extrabold text-slate-800 dark:text-slate-200 text-xs">₹${sal.dailyWage}</td>
                      <td class="py-3 px-4 text-center">
                        <span class="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-black shadow-sm inline-block min-w-[32px]">${sal.fullDaysCount}</span>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class="px-2.5 py-1 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 rounded-lg text-xs font-black shadow-sm inline-block min-w-[32px]">${sal.halfDaysCount}</span>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 rounded-lg text-xs font-black shadow-sm inline-block min-w-[32px]">${sal.absentDaysCount}</span>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 rounded-lg text-xs font-black shadow-sm inline-block min-w-[32px]">${sal.companyFixedHolidays}</span>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class="px-2.5 py-1 bg-amber-200 dark:bg-amber-950/90 text-amber-950 dark:text-amber-300 rounded-lg text-xs font-black shadow-sm inline-block min-w-[36px]">${sal.payableDays}</span>
                      </td>
                      <td class="py-3 px-4 font-extrabold text-blue-700 dark:text-blue-400 text-xs">₹${sal.totalOtPay}</td>
                      <td class="py-3 px-4 font-bold text-slate-900 dark:text-white text-xs">₹${sal.totalGrossSalary.toLocaleString('en-IN')}</td>
                      <td class="py-3 px-4 font-bold text-rose-600 dark:text-rose-400 text-xs">-₹${sal.totalAdvancesDeducted.toLocaleString('en-IN')}</td>
                      <td class="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">₹${sal.netSalary.toLocaleString('en-IN')}</td>
                      <td class="py-3 px-4 text-center">
                        <button onclick="appController.openPayslipModal('${w.id}')" 
                                class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow transition flex items-center gap-1.5 mx-auto">
                          <i class="fa-solid fa-file-invoice"></i> ${t('generatePayslip')}
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  renderAdvancesView() {
    const t = (k) => window.i18n.t(k);
    const currentUser = window.appStore.getCurrentUser();
    const companyId = currentUser ? currentUser.companyId : "RLV-POWER-8821";
    const activeWorkers = window.appStore.getCompanyWorkers(companyId, true);
    const activeWorkerIds = new Set(activeWorkers.map(w => w.id));
    
    // Only show advances for active, non-deleted workers in company roster
    const advances = window.appStore.data.advances.filter(a => a.companyId === companyId && activeWorkerIds.has(a.workerId));

    return `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-black text-slate-900 dark:text-white brand-font tracking-wide">${t('navAdvances')}</h2>
          <button onclick="appController.openAddAdvanceModal()" class="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs shadow-md">+ Grant Advance</button>
        </div>
        <div class="glass-card p-6 rounded-3xl shadow-sm">
          <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table class="w-full custom-table text-left min-w-[700px] whitespace-nowrap">
              <thead>
                <tr>
                  <th class="py-3 px-4">${t('navWorkers')}</th>
                  <th class="py-3 px-4">Amount (₹)</th>
                  <th class="py-3 px-4">Date</th>
                  <th class="py-3 px-4">Reason / Note</th>
                  <th class="py-3 px-4">${t('workerStatus')}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                ${advances.length === 0 ? `
                  <tr>
                    <td colspan="5" class="text-center py-8 text-slate-400 font-bold text-xs">
                      No advance payments recorded.
                    </td>
                  </tr>
                ` : advances.map(a => `
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td class="py-3 px-4 font-bold text-slate-900 dark:text-white">${a.workerName}</td>
                    <td class="py-3 px-4 font-black text-purple-600 dark:text-purple-400">₹${Number(a.amount).toLocaleString('en-IN')}</td>
                    <td class="py-3 px-4 text-xs text-slate-500 font-mono">${a.date}</td>
                    <td class="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">${a.reason || 'Advance'}</td>
                    <td class="py-3 px-4"><span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 rounded-lg text-xs font-bold">APPROVED</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  renderCompanySettingsView() {
    const currentUser = window.appStore.getCurrentUser();
    const companyId = currentUser ? currentUser.companyId : "RLV-POWER-8821";
    const company = window.appStore.data.companies.find(c => c.id === companyId) || window.appStore.data.companies[0];
    const s = company.settings || {};
    const b = window.appStore.getCompanyBranding(companyId) || {};

    return `
      <div class="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 class="text-2xl font-black text-slate-900 dark:text-white brand-font tracking-wide">Company Branding, Stamp & Settings</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure company logo, official stamp/seal, letterhead contact details, and shift schedules. All saved persistently in SQLite database.</p>
        </div>

        <!-- COMPANY BRANDING & LOGO / STAMP CARD -->
        <div class="glass-card dark:glass-card-dark p-6 rounded-3xl space-y-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-2 border-b dark:border-slate-800 pb-3">
            <i class="fa-solid fa-stamp text-amber-500 text-lg"></i>
            <h3 class="text-base font-extrabold text-slate-900 dark:text-white brand-font">1. Official Company Branding & Letterhead</h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- LOGO UPLOAD & PREVIEW -->
            <div class="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
              <label class="block text-xs font-black text-slate-700 dark:text-slate-300">Company Logo (PNG / JPG)</label>
              <div id="logoPreviewContainer" class="w-full h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-950 overflow-hidden relative">
                ${b.logoUrl ? `<img src="${b.logoUrl}" class="max-h-20 max-w-full object-contain" id="logoPreviewImg">` : `<div class="text-center text-slate-400 text-xs"><i class="fa-solid fa-image text-2xl block mb-1"></i> No Logo Uploaded</div>`}
              </div>
              <div class="flex gap-2">
                <input type="file" id="logoFileInput" accept="image/*" onchange="CompanyAdminModule.handleLogoUpload(event)" class="hidden">
                <button type="button" onclick="document.getElementById('logoFileInput').click()" class="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1">
                  <i class="fa-solid fa-upload"></i> ${b.logoUrl ? 'Change Logo' : 'Upload Logo'}
                </button>
                ${b.logoUrl ? `<button type="button" onclick="CompanyAdminModule.removeLogo()" class="px-3 py-2 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs font-bold rounded-xl"><i class="fa-solid fa-trash"></i></button>` : ''}
              </div>
            </div>

            <!-- STAMP / SEAL UPLOAD & PREVIEW -->
            <div class="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
              <label class="block text-xs font-black text-slate-700 dark:text-slate-300">Company Stamp / Seal (PNG / JPG)</label>
              <div id="stampPreviewContainer" class="w-full h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-950 overflow-hidden relative">
                ${b.stampUrl ? `<img src="${b.stampUrl}" class="max-h-20 max-w-full object-contain" id="stampPreviewImg">` : `<div class="text-center text-slate-400 text-xs"><i class="fa-solid fa-certificate text-2xl block mb-1"></i> No Stamp Uploaded</div>`}
              </div>
              <div class="flex gap-2">
                <input type="file" id="stampFileInput" accept="image/*" onchange="CompanyAdminModule.handleStampUpload(event)" class="hidden">
                <button type="button" onclick="document.getElementById('stampFileInput').click()" class="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1">
                  <i class="fa-solid fa-stamp"></i> ${b.stampUrl ? 'Change Stamp' : 'Upload Stamp'}
                </button>
                ${b.stampUrl ? `<button type="button" onclick="CompanyAdminModule.removeStamp()" class="px-3 py-2 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs font-bold rounded-xl"><i class="fa-solid fa-trash"></i></button>` : ''}
              </div>
            </div>
          </div>

          <!-- LETTERHEAD DETAILS FORM -->
          <div class="space-y-3 border-t dark:border-slate-800 pt-4">
            <h4 class="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Letterhead & Document Details</h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Company Display Name *</label>
                <input type="text" id="brandCompName" value="${b.name || ''}" required class="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Legal Registered Firm Name *</label>
                <input type="text" id="brandLegalName" value="${b.legalName || ''}" required class="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Registered Business Address *</label>
              <textarea id="brandAddress" rows="2" required class="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">${b.address || ''}</textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile / Phone *</label>
                <input type="text" id="brandMobile" value="${b.mobile || ''}" required class="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                <input type="email" id="brandEmail" value="${b.email || ''}" required class="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">GSTIN Number (Optional)</label>
                <input type="text" id="brandGstin" value="${b.gstin || ''}" placeholder="e.g. 07AAACR8821F1Z5" class="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 dark:text-white">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Website URL (Optional)</label>
                <input type="text" id="brandWebsite" value="${b.website || ''}" placeholder="e.g. www.mycompany.com" class="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Company Tagline / Subtitle</label>
                <input type="text" id="brandTagline" value="${b.tagline || ''}" placeholder="e.g. Electrical Contractor & Engineers" class="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
              </div>
            </div>

            <button type="button" onclick="CompanyAdminModule.saveBrandingOnly()" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5">
              <i class="fa-solid fa-floppy-disk"></i> Save Company Branding & Letterhead
            </button>
          </div>
        </div>

        <!-- TIMING PREVIEW CARD -->
        <div class="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
          <div class="space-y-1 text-xs">
            <div class="font-bold text-amber-900 dark:text-amber-400">⏰ Current Company Schedule Preview:</div>
            <div class="text-slate-700 dark:text-slate-300">Full Day: <span class="font-mono font-bold">${window.TimeService ? window.TimeService.format12Hour(s.fullDayStart || '09:00') : '09:00 AM'} - ${window.TimeService ? window.TimeService.format12Hour(s.fullDayEnd || '17:00') : '05:00 PM'}</span></div>
            <div class="text-slate-700 dark:text-slate-300">Half Day: <span class="font-mono font-bold">${window.TimeService ? window.TimeService.format12Hour(s.halfDayStart || '13:00') : '01:00 PM'} - ${window.TimeService ? window.TimeService.format12Hour(s.fullDayEnd || '17:00') : '05:00 PM'}</span></div>
            <div class="text-slate-700 dark:text-slate-300">Attendance Closing Time: <span class="font-mono font-bold text-rose-600">${window.TimeService ? window.TimeService.format12Hour(s.closingTime || '17:00') : '05:00 PM'}</span></div>
          </div>
          <i class="fa-solid fa-clock-rotate-left text-3xl text-amber-500 opacity-40"></i>
        </div>

        <div class="glass-card dark:glass-card-dark p-6 rounded-3xl space-y-4 shadow-sm border border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-2 border-b dark:border-slate-800 pb-3">
            <i class="fa-solid fa-sliders text-amber-500 text-lg"></i>
            <h3 class="text-base font-extrabold text-slate-900 dark:text-white brand-font">2. Shift Timings & Overtime Configuration</h3>
          </div>

          <div class="border-t dark:border-slate-800 pt-3">
            <h4 class="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Full-Day Shift Schedule</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full-Day Start Time *</label>
                <input type="time" id="setFullDayStart" value="${s.fullDayStart || '09:00'}" class="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full-Day Closing Time *</label>
                <input type="time" id="setFullDayEnd" value="${s.fullDayEnd || '17:00'}" class="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
              </div>
            </div>
          </div>

          <div class="border-t dark:border-slate-800 pt-3">
            <h4 class="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Half-Day Shift Schedule</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Half-Day Start Time *</label>
                <input type="time" id="setHalfDayStart" value="${s.halfDayStart || '13:00'}" class="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Half-Day Closing Time *</label>
                <input type="time" id="setHalfDayEnd" value="${s.halfDayEnd || '17:00'}" class="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
              </div>
            </div>
          </div>

          <div class="border-t dark:border-slate-800 pt-3">
            <h4 class="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Attendance Finalization & Overtime</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Attendance Closing Time *</label>
                <input type="time" id="setClosingTime" value="${s.closingTime || '17:00'}" class="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-rose-600">
                <p class="text-[10px] text-slate-500 mt-1">Pending attendance automatically becomes ABSENT after this time.</p>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Overtime Start Time *</label>
                <input type="time" id="setOtStartTime" value="${s.otStartTime || '17:00'}" class="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-blue-600">
              </div>
            </div>
          </div>

          <div class="border-t dark:border-slate-800 pt-3 grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Default Daily Wage (₹)</label>
              <input type="number" id="setWage" value="${s.defaultDailyWage || 700}" class="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Default OT Rate (₹/hr)</label>
              <input type="number" id="setOt" value="${s.defaultOtRate || 100}" class="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
            </div>
          </div>

          <button onclick="CompanyAdminModule.saveCompanySettings()" class="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md">Save Company Schedule & Settings</button>

          <!-- DATA BACKUP & RESTORE PROTECTION CARD -->
          <div class="border-t dark:border-slate-800 pt-4 mt-4 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl space-y-2">
            <div class="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <i class="fa-solid fa-database text-base"></i>
              <h4 class="text-xs font-black uppercase tracking-wider">Company Data Backup & Protection</h4>
            </div>
            <p class="text-[11px] text-slate-600 dark:text-slate-400">Download a full JSON backup of your workers, attendance records, advances, and settings to prevent any data loss across devices or browser clears.</p>
            <div class="flex flex-wrap items-center gap-3 pt-1">
              <button onclick="CompanyAdminModule.downloadJSONBackup()" 
                      class="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-2">
                <i class="fa-solid fa-download"></i> Download Data Backup (JSON)
              </button>
              <button onclick="CompanyAdminModule.triggerImportJSONBackup()" 
                      class="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-2">
                <i class="fa-solid fa-upload"></i> Import Data Backup (JSON)
              </button>
            </div>
          </div>

          <!-- SECURED PLATFORM RESET DATA CARD -->
          <div class="border-t dark:border-slate-800 pt-4 mt-4 bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl space-y-2">
            <div class="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <i class="fa-solid fa-triangle-exclamation text-base"></i>
              <h4 class="text-xs font-black uppercase tracking-wider">Reset Company Platform Data</h4>
            </div>
            <p class="text-[11px] text-slate-600 dark:text-slate-400">Restores platform seed state for testing/development. This option is double-guarded and restricted exclusively to Company Admins.</p>
            <button onclick="CompanyAdminModule.resetCompanyPlatformData()" 
                    class="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-2">
              <i class="fa-solid fa-rotate-right"></i> Reset All Platform Data
            </button>
          </div>
        </div>
      </div>
    `;
  },

  approveOtRequest(otId, status) {
    const res = window.appStore.approveOvertime(otId, status);
    if (res.success) {
      alert(`✅ Overtime request ${status}!`);
      window.appController.renderCurrentView();
    } else {
      alert(`❌ Failed: ${res.error}`);
    }
  },

  resetCompanyPlatformData() {
    const currentUser = window.appStore.getCurrentUser();
    if (!currentUser || currentUser.role !== 'COMPANY_ADMIN') {
      alert("🔒 Access Restricted: Reset platform data requires Company Admin privileges.");
      return;
    }

    const confirmStr = prompt("⚠️ CRITICAL WARNING: You are about to RESET all company workers, attendance, and financial data back to initial seed state.\n\nType 'RESET' to confirm platform reset:");
    if (confirmStr !== 'RESET') {
      alert("Reset cancelled. All platform data remains untouched.");
      return;
    }

    window.appStore.resetToSeed();
    alert("✅ Platform data reset successfully to seed state!");
    window.location.reload();
  },

  handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target.result;
      const currentUser = window.appStore.getCurrentUser();
      if (currentUser && currentUser.companyId) {
        window.appStore.saveCompanyBranding(currentUser.companyId, { logoUrl: dataUrl });
        alert("✅ Company Logo uploaded and saved to database!");
        window.appController.renderCurrentView();
      }
    };
    reader.readAsDataURL(file);
  },

  removeLogo() {
    const currentUser = window.appStore.getCurrentUser();
    if (currentUser && currentUser.companyId) {
      window.appStore.saveCompanyBranding(currentUser.companyId, { logoUrl: null });
      alert("✅ Company Logo removed.");
      window.appController.renderCurrentView();
    }
  },

  handleStampUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target.result;
      const currentUser = window.appStore.getCurrentUser();
      if (currentUser && currentUser.companyId) {
        window.appStore.saveCompanyBranding(currentUser.companyId, { stampUrl: dataUrl });
        alert("✅ Company Stamp/Seal uploaded and saved to database!");
        window.appController.renderCurrentView();
      }
    };
    reader.readAsDataURL(file);
  },

  removeStamp() {
    const currentUser = window.appStore.getCurrentUser();
    if (currentUser && currentUser.companyId) {
      window.appStore.saveCompanyBranding(currentUser.companyId, { stampUrl: null });
      alert("✅ Company Stamp removed.");
      window.appController.renderCurrentView();
    }
  },

  downloadJSONBackup() {
    const backupData = window.appStore.exportBackupJSON();
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `THEKEDAR_PRO_Backup_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert("✅ Data Backup JSON downloaded successfully!");
  },

  triggerImportJSONBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const res = window.appStore.importBackupJSON(evt.target.result);
        if (res.success) {
          alert("✅ Data Backup restored successfully!");
          window.location.reload();
        } else {
          alert(`❌ Import Failed: ${res.error}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  saveBrandingOnly() {
    const currentUser = window.appStore.getCurrentUser();
    if (!currentUser || !currentUser.companyId) return;

    window.appStore.saveCompanyBranding(currentUser.companyId, {
      name: document.getElementById('brandCompName').value,
      legalName: document.getElementById('brandLegalName').value,
      address: document.getElementById('brandAddress').value,
      mobile: document.getElementById('brandMobile').value,
      email: document.getElementById('brandEmail').value,
      gstin: document.getElementById('brandGstin').value,
      website: document.getElementById('brandWebsite').value,
      tagline: document.getElementById('brandTagline').value
    });

    alert("✅ Company Branding & Letterhead information saved to database!");
    window.appController.renderCurrentView();
  },

  saveCompanySettings() {
    const currentUser = window.appStore.getCurrentUser();
    const companyId = currentUser ? currentUser.companyId : "RLV-POWER-8821";
    window.appStore.updateCompanySettings(companyId, {
      fullDayStart: document.getElementById('setFullDayStart').value,
      fullDayEnd: document.getElementById('setFullDayEnd').value,
      halfDayStart: document.getElementById('setHalfDayStart').value,
      halfDayEnd: document.getElementById('setHalfDayEnd').value,
      closingTime: document.getElementById('setClosingTime').value,
      otStartTime: document.getElementById('setOtStartTime').value,
      defaultDailyWage: Number(document.getElementById('setWage').value),
      defaultOtRate: Number(document.getElementById('setOt').value)
    });
    alert("✅ Company working schedule and settings updated successfully!");
    window.appController.renderCurrentView();
  },

  openWorkerPayslip(workerId, monthStr) {
    if (window.WorkerDashboardModule && window.WorkerDashboardModule.openWorkerPayslipModal) {
      window.WorkerDashboardModule.openWorkerPayslipModal(workerId, monthStr);
    } else {
      alert("Payslip renderer loading...");
    }
  },

  renderPayslipsView() {
    const t = (k) => window.i18n.t(k);
    const currentUser = window.appStore.getCurrentUser();
    const companyId = currentUser ? currentUser.companyId : "RLV-POWER-8821";
    const company = window.appStore.data.companies.find(c => c.id === companyId) || window.appStore.data.companies[0];
    const activeWorkers = window.appStore.getCompanyWorkers(companyId, true);
    const currentMonthStr = window.TimeService ? window.TimeService.getCurrentYearMonth() : new Date().toISOString().substring(0, 7);

    return `
      <div class="space-y-6">
        <!-- Header Card -->
        <div class="glass-card card-3d p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-500 text-xs font-bold mb-2">
              <i class="fa-solid fa-building"></i> ${company.name} (${company.id})
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white brand-font tracking-wide">
              ${t('navSalaryPayslips')}
            </h2>
            <p class="text-xs text-slate-500 mt-1">Select month and view or print corporate A4 salary slips for active company workers.</p>
          </div>
          <div class="flex items-center gap-3">
            <label class="text-xs font-extrabold text-slate-700 dark:text-slate-300 whitespace-nowrap">${t('selectMonth')}:</label>
            <input type="month" id="payslipMonthSelect" value="${currentMonthStr}" onchange="window.appController.renderCurrentView()"
                   class="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none shadow-sm">
          </div>
        </div>

        <!-- Worker Salary Slips Roster Table -->
        <div class="glass-card card-3d p-6 rounded-3xl shadow-sm space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-extrabold text-slate-900 dark:text-white brand-font flex items-center gap-2">
              <i class="fa-solid fa-file-invoice-dollar text-amber-500"></i> Active Worker Slips (${activeWorkers.length})
            </h3>
          </div>

          <div class="overflow-x-auto w-full border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table class="w-full custom-table text-left border-collapse min-w-[900px] whitespace-nowrap">
              <thead>
                <tr class="text-[11px] font-black uppercase text-slate-500 bg-slate-100/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 tracking-wider">
                  <th class="py-3 px-4 min-w-[180px]">Worker Name</th>
                  <th class="py-3 px-4 min-w-[110px]">Emp Code / ID</th>
                  <th class="py-3 px-4 min-w-[140px]">Job Role</th>
                  <th class="py-3 px-4 min-w-[120px]">Mobile</th>
                  <th class="py-3 px-4 min-w-[110px]">Daily Wage</th>
                  <th class="py-3 px-4 min-w-[110px]">Payable Days</th>
                  <th class="py-3 px-4 min-w-[130px]">Net Salary</th>
                  <th class="py-3 px-4 text-center min-w-[140px]">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                ${activeWorkers.length === 0 ? `
                  <tr>
                    <td colspan="8" class="py-8 text-center text-slate-400 font-bold">
                      ${t('noWorkersFound')}
                    </td>
                  </tr>
                ` : activeWorkers.map(w => {
                  const selMonth = document.getElementById('payslipMonthSelect') ? document.getElementById('payslipMonthSelect').value : currentMonthStr;
                  const sal = window.SalaryEngine.calculateSalaryForWorker(companyId, w.id, selMonth);
                  return `
                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition">
                      <td class="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <div class="font-extrabold">${w.fullName}</div>
                      </td>
                      <td class="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-400">${w.workerId || w.id}</td>
                      <td class="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">${w.jobRole || 'Worker'}</td>
                      <td class="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">${w.mobile || w.mobileNumber}</td>
                      <td class="py-3 px-4 font-bold text-slate-900 dark:text-white">₹${w.dailyWage}</td>
                      <td class="py-3 px-4">
                        <span class="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 rounded-lg text-[11px] font-black">${sal.payableDays} Days</span>
                      </td>
                      <td class="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400">₹${sal.netSalary.toLocaleString('en-IN')}</td>
                      <td class="py-3 px-4 text-center">
                        <button onclick="CompanyAdminModule.openWorkerPayslip('${w.id}', document.getElementById('payslipMonthSelect') ? document.getElementById('payslipMonthSelect').value : null)"
                                class="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black shadow transition inline-flex items-center gap-1.5 active:scale-95">
                          <i class="fa-solid fa-file-invoice"></i> ${t('viewSalarySlip')}
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  renderFestivalHolidaysView() {
    const t = (k) => window.i18n.t(k);
    const currentUser = window.appStore.getCurrentUser();
    const companyId = currentUser ? currentUser.companyId : "RLV-POWER-8821";
    const company = window.appStore.data.companies.find(c => c.id === companyId) || window.appStore.data.companies[0];
    
    const isHindi = window.i18n.currentLang === 'hi';
    const alerts = window.HolidayService ? window.HolidayService.check15DayFestivalNotifications(companyId) : [];
    const companyHolidayData = window.HolidayService ? window.HolidayService.getCompanyHolidayData(companyId) : { decisions: {}, customHolidays: [] };

    return `
      <div class="space-y-6">
        <!-- Header Card -->
        <div class="glass-card card-3d p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-500 text-xs font-bold mb-2">
              <i class="fa-solid fa-cake-candles"></i> ${company.name} (${company.id})
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white brand-font tracking-wide">
              🎉 ${t('navFestivalHolidays')}
            </h2>
            <p class="text-xs text-slate-500 mt-1">Manage company festival holidays, 15-day advance approvals, and worker paid holiday schedules.</p>
          </div>
          <button onclick="CompanyAdminModule.openAddCustomHolidayModal()" 
                  class="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md flex items-center gap-2 transition active:scale-95">
            <i class="fa-solid fa-plus-circle"></i> ${t('addCustomHolidayBtn')}
          </button>
        </div>

        <!-- 15-Day Festival Notification Banner -->
        <div class="glass-card card-3d p-6 rounded-3xl shadow-sm border-l-4 border-amber-500 space-y-4">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg font-black border border-amber-500/20">
              <i class="fa-solid fa-bell"></i>
            </span>
            <div>
              <h3 class="text-base font-extrabold text-slate-900 dark:text-white brand-font">
                ${t('upcomingFestivals')}
              </h3>
              <p class="text-xs text-slate-500">Festivals within 15 days require company holiday decision.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${alerts.length === 0 ? `
              <div class="col-span-2 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-500 font-bold">
                ℹ️ No upcoming major festivals in the next 15 days.
              </div>
            ` : alerts.map(a => {
              const festName = isHindi ? a.nameHi : a.nameEn;
              const dec = a.decision;
              return `
                <div class="p-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm">
                  <div class="flex justify-between items-start">
                    <div>
                      <h4 class="font-black text-sm text-slate-900 dark:text-white">${festName}</h4>
                      <div class="text-xs text-slate-500 font-bold flex items-center gap-2 mt-0.5">
                        <span><i class="fa-solid fa-calendar"></i> ${a.date}</span>
                        <span class="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 rounded-md text-[10px] font-black">${a.daysRemaining} days remaining</span>
                      </div>
                    </div>
                    <span class="px-2.5 py-1 rounded-xl text-[10px] font-black ${dec === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' : (dec === 'REJECTED' ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-500/30')}">
                      ${dec === 'APPROVED' ? t('paidHolidayBadge') : (dec === 'REJECTED' ? t('workingDayBadge') : 'PENDING DECISION')}
                    </span>
                  </div>

                  <div class="flex gap-2 pt-1">
                    <button onclick="CompanyAdminModule.setHolidayDecision('${a.festivalId}', '${a.date}', 'APPROVED')"
                            class="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow transition flex items-center justify-center gap-1 active:scale-95">
                      <i class="fa-solid fa-circle-check"></i> ${t('approvePaidHoliday')}
                    </button>
                    <button onclick="CompanyAdminModule.setHolidayDecision('${a.festivalId}', '${a.date}', 'REJECTED')"
                            class="flex-1 px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1">
                      <i class="fa-solid fa-briefcase"></i> ${t('rejectNormalWorkingDay')}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- All Festival Calendar Roster Table -->
        <div class="glass-card card-3d p-6 rounded-3xl shadow-sm space-y-4">
          <h3 class="text-lg font-extrabold text-slate-900 dark:text-white brand-font flex items-center gap-2">
            <i class="fa-solid fa-calendar-days text-yellow-500"></i> Indian Festival Calendar 2026
          </h3>

          <div class="overflow-x-auto w-full border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table class="w-full custom-table text-left border-collapse min-w-[700px] whitespace-nowrap">
              <thead>
                <tr class="text-[11px] font-black uppercase text-slate-500 bg-slate-100/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 tracking-wider">
                  <th class="py-3 px-4">Festival Name</th>
                  <th class="py-3 px-4">Date</th>
                  <th class="py-3 px-4">Current Status</th>
                  <th class="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                ${window.HolidayService.indianFestivals.map(f => {
                  const decObj = companyHolidayData.decisions[f.date];
                  const isApproved = decObj && decObj.decision === 'APPROVED';
                  const isRejected = decObj && decObj.decision === 'REJECTED';
                  const name = isHindi ? f.nameHi : f.nameEn;
                  return `
                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition">
                      <td class="py-3 px-4 font-bold text-slate-900 dark:text-white">${name}</td>
                      <td class="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-400">${f.date}</td>
                      <td class="py-3 px-4">
                        <span class="px-2.5 py-1 rounded-xl text-[10px] font-black ${isApproved ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : (isRejected ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300' : 'bg-slate-100 dark:bg-slate-900 text-slate-500')}">
                          ${isApproved ? t('paidHolidayBadge') : (isRejected ? t('workingDayBadge') : 'UNSET')}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-center flex justify-center gap-2">
                        <button onclick="CompanyAdminModule.setHolidayDecision('${f.id}', '${f.date}', 'APPROVED')"
                                class="px-3 py-1.5 ${isApproved ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'} hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold transition">
                          ${t('paidHolidayBadge')}
                        </button>
                        <button onclick="CompanyAdminModule.setHolidayDecision('${f.id}', '${f.date}', 'REJECTED')"
                                class="px-3 py-1.5 ${isRejected ? 'bg-slate-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'} hover:bg-slate-700 hover:text-white rounded-xl text-xs font-bold transition">
                          ${t('workingDayBadge')}
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  setHolidayDecision(festivalId, dateStr, decision) {
    const currentUser = window.appStore.getCurrentUser();
    const companyId = currentUser ? currentUser.companyId : "RLV-POWER-8821";
    window.HolidayService.setCompanyFestivalDecision(companyId, festivalId, dateStr, decision);
    const msg = decision === 'APPROVED' ? "✅ Marked as Approved Paid Company Holiday!" : "ℹ️ Marked as Normal Working Day.";
    alert(msg);
    window.appController.renderCurrentView();
  },

  openAddCustomHolidayModal() {
    const modal = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-lg w-full mx-auto space-y-4 border border-slate-200 dark:border-slate-800">
        <div class="flex justify-between items-center border-b dark:border-slate-800 pb-3">
          <h3 class="text-xl font-extrabold text-slate-900 dark:text-white brand-font">Add Custom Company Holiday</h3>
          <button onclick="appController.closeModal()" class="text-slate-400 font-bold text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form onsubmit="CompanyAdminModule.submitAddCustomHoliday(event)" class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Holiday Name (English) *</label>
            <input type="text" id="custHolNameEn" required placeholder="e.g. Founder's Day" class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Holiday Name (Hindi)</label>
            <input type="text" id="custHolNameHi" placeholder="e.g. स्थापना दिवस" class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date *</label>
            <input type="date" id="custHolDate" required class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
          </div>

          <div class="pt-3 flex justify-end gap-2 border-t dark:border-slate-800">
            <button type="button" onclick="appController.closeModal()" class="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">Cancel</button>
            <button type="submit" class="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs shadow-md">Add & Approve Paid Holiday</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  submitAddCustomHoliday(e) {
    e.preventDefault();
    const currentUser = window.appStore.getCurrentUser();
    const companyId = currentUser ? currentUser.companyId : "RLV-POWER-8821";
    const nameEn = document.getElementById('custHolNameEn').value;
    const nameHi = document.getElementById('custHolNameHi').value || nameEn;
    const dateStr = document.getElementById('custHolDate').value;

    window.HolidayService.addCustomHoliday(companyId, nameEn, nameHi, dateStr);
    window.appController.closeModal();
    alert("✅ Custom Paid Holiday added successfully!");
    window.appController.renderCurrentView();
  }
};

window.CompanyAdminModule = CompanyAdminModule;
