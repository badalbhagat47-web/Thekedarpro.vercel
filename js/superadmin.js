// Super Admin Platform Management Module (THEKEDAR PRO)
const SuperAdminModule = {
  activeTab: 'overview', // 'overview', 'companies', 'workers', 'subscriptions', 'payments'
  searchQuery: '',
  companyFilter: 'ALL', // 'ALL', 'GST', 'NON_GST', 'ACTIVE', 'BLOCKED', 'EXPIRED'

  switchTab(tabName) {
    this.activeTab = tabName;
    window.appController.renderCurrentView();
  },

  onSearchInput(val) {
    this.searchQuery = val;
    window.appController.renderCurrentView();
  },

  onFilterChange(val) {
    this.companyFilter = val;
    window.appController.renderCurrentView();
  },

  renderSuperAdminDashboardView() {
    const stats = window.appStore.getSuperAdminStats();
    let companies = window.appStore.getSuperAdminCompanyList();
    const allWorkers = window.appStore.data.workers || [];

    // Filter Logic
    if (this.companyFilter !== 'ALL') {
      if (this.companyFilter === 'GST') companies = companies.filter(c => c.gstStatus === 'GST_VERIFIED');
      if (this.companyFilter === 'NON_GST') companies = companies.filter(c => c.gstStatus !== 'GST_VERIFIED');
      if (this.companyFilter === 'ACTIVE') companies = companies.filter(c => c.status === 'ACTIVE');
      if (this.companyFilter === 'BLOCKED') companies = companies.filter(c => c.status === 'BLOCKED');
      if (this.companyFilter === 'EXPIRED') companies = companies.filter(c => c.subscription && c.subscription.status === 'EXPIRED');
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase().trim();
      companies = companies.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.gstin && c.gstin.toLowerCase().includes(q)) ||
        (c.ownerName && c.ownerName.toLowerCase().includes(q)) ||
        (c.mobile && c.mobile.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
      );
    }

    return `
      <div class="space-y-6 pb-12">
        <!-- TOP EXECUTIVE HEADER BANNER -->
        <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 rounded-lg text-blue-700 dark:text-blue-300 text-xs font-semibold mb-1">
              <i class="fa-solid fa-shield-halved text-xs"></i> Master Super Admin Dashboard
            </div>
            <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Platform Overview & Management
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Live Database Directory & Subscription Control</p>
          </div>

          <div class="flex items-center gap-2">
            <span class="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Database Active
            </span>
          </div>
        </div>

        ${this.renderActiveTabContent(stats, companies, allWorkers)}
      </div>
    `;
  },

  renderActiveTabContent(stats, companies, allWorkers) {
    if (this.activeTab === 'overview') {
      return this.renderOverviewSection(stats, companies);
    } else if (this.activeTab === 'companies') {
      return this.renderCompaniesSection(companies);
    } else if (this.activeTab === 'workers') {
      return this.renderWorkersSection(allWorkers);
    } else if (this.activeTab === 'subscriptions') {
      return this.renderSubscriptionsSection(companies);
    } else if (this.activeTab === 'payments') {
      return this.renderPaymentsSection(stats, companies);
    }
    return this.renderOverviewSection(stats, companies);
  },

  // 1. OVERVIEW VIEW (5 Summary Cards + Recent Registrations)
  renderOverviewSection(stats, companies) {
    return `
      <!-- 5 PRIMARY SUMMARY CARDS -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Companies</span>
          <div class="text-2xl font-bold text-slate-900 dark:text-white">${stats.totalCompanies}</div>
          <span class="text-[10px] text-slate-400 font-medium block">Registered Firms</span>
        </div>

        <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Workers</span>
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${stats.totalWorkers}</div>
          <span class="text-[10px] text-slate-400 font-medium block">Platform Workforce</span>
        </div>

        <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active Subs</span>
          <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${stats.activeSubscriptions}</div>
          <span class="text-[10px] text-slate-400 font-medium block">Paid Active Plans</span>
        </div>

        <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span class="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Expired Subs</span>
          <div class="text-2xl font-bold text-rose-600 dark:text-rose-400">${stats.expiredSubscriptions}</div>
          <span class="text-[10px] text-slate-400 font-medium block">Renewal Pending</span>
        </div>

        <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <span class="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Total Revenue</span>
          <div class="text-2xl font-bold text-slate-900 dark:text-white">₹${stats.totalRevenue.toLocaleString()}</div>
          <span class="text-[10px] text-slate-400 font-medium block">SaaS Collection</span>
        </div>
      </div>

      <!-- RECENT REGISTRATIONS TABLE -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <i class="fa-solid fa-building text-blue-600"></i> Recently Registered Companies
          </h3>
          <button onclick="SuperAdminModule.switchTab('companies')" class="text-xs font-semibold text-blue-600 hover:underline">
            View All (${companies.length}) →
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th class="p-3">Company Name</th>
                <th class="p-3">Company ID</th>
                <th class="p-3">GST / Non-GST</th>
                <th class="p-3">Owner</th>
                <th class="p-3">Workers</th>
                <th class="p-3">Subscription</th>
                <th class="p-3">Account Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${companies.slice(0, 5).map(c => `
                <tr>
                  <td class="p-3 font-semibold text-slate-900 dark:text-white">${c.name}</td>
                  <td class="p-3 font-mono text-blue-600 dark:text-blue-400 font-medium">${c.id}</td>
                  <td class="p-3">
                    <span class="px-2.5 py-0.5 ${c.gstStatus === 'GST_VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'} rounded-md text-[10px] font-medium">
                      ${c.gstStatus === 'GST_VERIFIED' ? 'GST VERIFIED' : 'NON-GST'}
                    </span>
                  </td>
                  <td class="p-3 text-slate-700 dark:text-slate-300 font-medium">${c.ownerName}</td>
                  <td class="p-3 font-semibold text-blue-600 dark:text-blue-400">${c.workerCount}</td>
                  <td class="p-3">
                    <span class="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 rounded-md text-[10px] font-medium">
                      ${c.subscription ? c.subscription.plan : 'PRO SaaS'}
                    </span>
                  </td>
                  <td class="p-3">
                    <span class="px-2.5 py-0.5 ${c.status === 'BLOCKED' ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'} rounded-md text-[10px] font-medium">
                      ${c.status || 'ACTIVE'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 2. ALL COMPANIES PAGE
  renderCompaniesSection(companies) {
    return `
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <!-- TOOLBAR -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i class="fa-solid fa-building text-blue-600"></i> All Companies (${companies.length})
            </h3>
            <p class="text-xs text-slate-500">Directory of registered contractor firms</p>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <select onchange="SuperAdminModule.onFilterChange(this.value)" 
                    class="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
              <option value="ALL" ${this.companyFilter === 'ALL' ? 'selected' : ''}>All Companies</option>
              <option value="GST" ${this.companyFilter === 'GST' ? 'selected' : ''}>GST Verified</option>
              <option value="NON_GST" ${this.companyFilter === 'NON_GST' ? 'selected' : ''}>Non-GST Firms</option>
              <option value="ACTIVE" ${this.companyFilter === 'ACTIVE' ? 'selected' : ''}>Active Only</option>
              <option value="BLOCKED" ${this.companyFilter === 'BLOCKED' ? 'selected' : ''}>Suspended Only</option>
            </select>

            <div class="w-full sm:w-64 relative">
              <input type="text" value="${this.searchQuery}" oninput="SuperAdminModule.onSearchInput(this.value)" 
                     placeholder="Search company, ID, owner..." 
                     class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
            </div>
          </div>
        </div>

        <!-- TABLE -->
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th class="p-3">Company Name</th>
                <th class="p-3">Company ID</th>
                <th class="p-3">Owner</th>
                <th class="p-3">Mobile</th>
                <th class="p-3">Email</th>
                <th class="p-3">GST Status</th>
                <th class="p-3">Workers Count</th>
                <th class="p-3">Subscription</th>
                <th class="p-3">Status</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${companies.map(c => `
                <tr>
                  <td class="p-3 font-semibold text-slate-900 dark:text-white">${c.name}</td>
                  <td class="p-3 font-mono text-blue-600 dark:text-blue-400 font-medium">${c.id}</td>
                  <td class="p-3 text-slate-700 dark:text-slate-300">${c.ownerName}</td>
                  <td class="p-3 font-mono">${c.mobile}</td>
                  <td class="p-3 text-slate-500">${c.email}</td>
                  <td class="p-3">
                    <span class="px-2.5 py-0.5 ${c.gstStatus === 'GST_VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'} rounded-md text-[10px] font-medium">
                      ${c.gstStatus === 'GST_VERIFIED' ? 'GST VERIFIED' : 'NON-GST'}
                    </span>
                  </td>
                  <td class="p-3 font-semibold text-blue-600 dark:text-blue-400">${c.workerCount}</td>
                  <td class="p-3">
                    <span class="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 rounded-md text-[10px] font-medium">
                      ${c.subscription ? c.subscription.plan : 'PRO SaaS'}
                    </span>
                  </td>
                  <td class="p-3">
                    <span class="px-2.5 py-0.5 ${c.status === 'BLOCKED' ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'} rounded-md text-[10px] font-medium">
                      ${c.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td class="p-3 text-right space-x-1 whitespace-nowrap">
                    <button onclick="SuperAdminModule.openCompanyOverviewModal('${c.id}')" 
                            class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition">
                      View Profile
                    </button>
                    <button onclick="SuperAdminModule.toggleCompanyBlockStatus('${c.id}')" 
                            class="px-2.5 py-1 ${c.status === 'BLOCKED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-700 hover:bg-slate-800'} text-white rounded-lg text-xs font-semibold transition">
                      ${c.status === 'BLOCKED' ? 'Activate' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 3. PLATFORM WORKERS PAGE (Monitoring View)
  renderWorkersSection(allWorkers) {
    return `
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i class="fa-solid fa-users text-blue-600"></i> Platform Workers Directory (${allWorkers.length})
            </h3>
            <p class="text-xs text-slate-500">Cross-company registered workers monitoring</p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th class="p-3">Worker Name</th>
                <th class="p-3">Worker ID</th>
                <th class="p-3">Company</th>
                <th class="p-3">Job Role</th>
                <th class="p-3">Mobile</th>
                <th class="p-3">Email</th>
                <th class="p-3">Daily Wage</th>
                <th class="p-3">Joining Date</th>
                <th class="p-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${allWorkers.map(w => {
                const comp = window.appStore.data.companies.find(c => c.id === w.companyId);
                return `
                  <tr>
                    <td class="p-3 font-semibold text-slate-900 dark:text-white">${w.fullName}</td>
                    <td class="p-3 font-mono text-blue-600 font-medium">${w.workerId || w.id}</td>
                    <td class="p-3 font-medium text-slate-700 dark:text-slate-300">${comp ? comp.name : 'Unknown Company'}</td>
                    <td class="p-3 text-slate-500">${w.jobRole || 'Electrician'}</td>
                    <td class="p-3 font-mono">${w.mobile}</td>
                    <td class="p-3 text-slate-500">${w.email || '-'}</td>
                    <td class="p-3 font-mono font-semibold text-slate-900 dark:text-white">₹${w.dailyWage}</td>
                    <td class="p-3 font-mono text-slate-500">${w.joiningDate || '-'}</td>
                    <td class="p-3">
                      <span class="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-md text-[10px] font-medium uppercase">
                        ${w.status || 'ACTIVE'}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 4. SUBSCRIPTIONS PAGE
  renderSubscriptionsSection(companies) {
    return `
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i class="fa-solid fa-receipt text-blue-600"></i> Platform Subscriptions
            </h3>
            <p class="text-xs text-slate-500">Company subscription status & lifecycle</p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th class="p-3">Company</th>
                <th class="p-3">Plan</th>
                <th class="p-3">Start Date</th>
                <th class="p-3">Expiry Date</th>
                <th class="p-3">Amount</th>
                <th class="p-3">Payment Status</th>
                <th class="p-3">Subscription Status</th>
                <th class="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${companies.map(c => {
                const sub = c.subscription || { plan: 'PRO SaaS', status: 'ACTIVE', startDate: '2026-01-01', expiryDate: '2026-12-31', amount: 4999, paymentStatus: 'PAID' };
                return `
                  <tr>
                    <td class="p-3 font-semibold text-slate-900 dark:text-white">${c.name}</td>
                    <td class="p-3 font-semibold text-blue-600">${sub.plan}</td>
                    <td class="p-3 font-mono text-slate-500">${sub.startDate}</td>
                    <td class="p-3 font-mono font-medium">${sub.expiryDate}</td>
                    <td class="p-3 font-mono font-semibold text-slate-900 dark:text-white">₹${sub.amount}</td>
                    <td class="p-3">
                      <span class="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 rounded-md text-[10px] font-medium">
                        ${sub.paymentStatus}
                      </span>
                    </td>
                    <td class="p-3">
                      <span class="px-2.5 py-0.5 ${sub.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300'} rounded-md text-[10px] font-medium uppercase">
                        ${sub.status}
                      </span>
                    </td>
                    <td class="p-3 text-right">
                      <button onclick="SuperAdminModule.openSubscriptionModal('${c.id}')" 
                              class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition">
                        Update Plan
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 5. REVENUE & PAYMENTS PAGE (Read-Only)
  renderPaymentsSection(stats, companies) {
    return `
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i class="fa-solid fa-wallet text-blue-600"></i> Revenue & Payment Overview
            </h3>
            <p class="text-xs text-slate-500">Platform financial summary (Read-Only)</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
            <span class="text-xs font-semibold text-slate-600 dark:text-slate-400 block">Total Revenue Collected</span>
            <div class="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹${stats.totalRevenue.toLocaleString()}</div>
          </div>
          <div class="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl">
            <span class="text-xs font-semibold text-blue-700 dark:text-blue-300 block">Paid Invoices</span>
            <div class="text-2xl font-bold text-blue-800 dark:text-blue-200 mt-1">₹${stats.totalRevenue.toLocaleString()}</div>
          </div>
          <div class="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl">
            <span class="text-xs font-semibold text-rose-700 dark:text-rose-300 block">Pending Invoices</span>
            <div class="text-2xl font-bold text-rose-800 dark:text-rose-200 mt-1">₹${stats.pendingPayments.toLocaleString()}</div>
          </div>
        </div>

        <div class="space-y-2">
          <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Company-Wise Payment Records</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th class="p-3">Company</th>
                  <th class="p-3">Owner</th>
                  <th class="p-3">Subscription Plan</th>
                  <th class="p-3">Amount</th>
                  <th class="p-3">Payment Status</th>
                  <th class="p-3">Renewal Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                ${companies.map(c => {
                  const sub = c.subscription || { plan: 'PRO SaaS', amount: 4999, paymentStatus: 'PAID', expiryDate: '2026-12-31' };
                  return `
                    <tr>
                      <td class="p-3 font-semibold text-slate-900 dark:text-white">${c.name}</td>
                      <td class="p-3 text-slate-600 dark:text-slate-400">${c.ownerName}</td>
                      <td class="p-3 font-semibold text-blue-600">${sub.plan}</td>
                      <td class="p-3 font-mono font-semibold text-slate-900 dark:text-white">₹${sub.amount}</td>
                      <td class="p-3">
                        <span class="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-md text-[10px] font-medium">
                          ${sub.paymentStatus || 'PAID'}
                        </span>
                      </td>
                      <td class="p-3 font-mono text-slate-500">${sub.expiryDate}</td>
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

  // SUSPEND / ACTIVATE WITH CONFIRMATION POPUP
  toggleCompanyBlockStatus(companyId) {
    const comp = window.appStore.data.companies.find(c => c.id === companyId);
    if (!comp) return;

    const isBlocked = comp.status === 'BLOCKED';
    const actionWord = isBlocked ? 'activate' : 'suspend';

    const modal = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');

    content.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg max-w-md mx-auto space-y-4 border border-slate-200 dark:border-slate-800">
        <div class="flex items-center gap-3 ${isBlocked ? 'text-emerald-600' : 'text-blue-600'}">
          <i class="fa-solid fa-circle-question text-2xl"></i>
          <h3 class="text-base font-bold text-slate-900 dark:text-white">Confirm Action</h3>
        </div>
        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Are you sure you want to <strong>${actionWord}</strong> the company <strong>"${comp.name}"</strong> (ID: <span class="font-mono font-semibold text-blue-600">${comp.id}</span>)?
        </p>
        <div class="flex justify-end gap-2 pt-2">
          <button onclick="appController.closeModal()" class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200">
            Cancel
          </button>
          <button onclick="SuperAdminModule.confirmToggleBlock('${comp.id}')" class="px-4 py-2 ${isBlocked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'} text-white rounded-xl text-xs font-semibold">
            Confirm ${isBlocked ? 'Activation' : 'Suspension'}
          </button>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
  },

  confirmToggleBlock(companyId) {
    const comp = window.appStore.data.companies.find(c => c.id === companyId);
    const newStatus = window.appStore.toggleCompanyStatus(companyId);
    window.appController.closeModal();
    window.appController.renderCurrentView();
  },

  openSubscriptionModal(companyId) {
    const comp = window.appStore.data.companies.find(c => c.id === companyId);
    if (!comp) return;
    const sub = comp.subscription || { plan: 'PRO SaaS', status: 'ACTIVE', startDate: '2026-01-01', expiryDate: '2026-12-31', amount: 4999, paymentStatus: 'PAID' };

    const modal = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');

    content.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg max-w-md mx-auto space-y-4 border border-slate-200 dark:border-slate-800">
        <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">Update Subscription</h3>
            <p class="text-xs text-blue-600 font-semibold">${comp.name}</p>
          </div>
          <button onclick="appController.closeModal()" class="text-slate-400 hover:text-slate-600 font-bold text-lg"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form onsubmit="SuperAdminModule.saveSubscriptionForm(event, '${comp.id}')" class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subscription Plan</label>
            <select id="subPlan" class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
              <option value="BASIC SaaS" ${sub.plan === 'BASIC SaaS' ? 'selected' : ''}>BASIC SaaS (₹2,999/yr)</option>
              <option value="PRO SaaS" ${sub.plan === 'PRO SaaS' ? 'selected' : ''}>PRO SaaS (₹4,999/yr)</option>
              <option value="ENTERPRISE SaaS" ${sub.plan === 'ENTERPRISE SaaS' ? 'selected' : ''}>ENTERPRISE SaaS (₹9,999/yr)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subscription Status</label>
            <select id="subStatus" class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
              <option value="ACTIVE" ${sub.status === 'ACTIVE' ? 'selected' : ''}>ACTIVE</option>
              <option value="EXPIRED" ${sub.status === 'EXPIRED' ? 'selected' : ''}>EXPIRED</option>
              <option value="TRIAL" ${sub.status === 'TRIAL' ? 'selected' : ''}>TRIAL (14 Days)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Expiry Date</label>
            <input type="date" id="subExpiry" value="${sub.expiryDate || '2026-12-31'}" class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" onclick="appController.closeModal()" class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm">Save Changes</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  saveSubscriptionForm(e, companyId) {
    e.preventDefault();
    const plan = document.getElementById('subPlan').value;
    const status = document.getElementById('subStatus').value;
    const expiryDate = document.getElementById('subExpiry').value;

    window.appStore.updateCompanySubscription(companyId, { plan, status, expiryDate });
    window.appController.closeModal();
    window.appController.renderCurrentView();
  },

  openCompanyOverviewModal(companyId) {
    const comp = window.appStore.data.companies.find(c => c.id === companyId);
    if (!comp) return;

    const workers = window.appStore.getCompanyWorkers(companyId);
    const sub = comp.subscription || { plan: 'PRO SaaS', status: 'ACTIVE', startDate: '2026-01-01', expiryDate: '2026-12-31', amount: 4999, paymentStatus: 'PAID' };
    const modal = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');

    content.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg max-w-2xl mx-auto space-y-4 border border-slate-200 dark:border-slate-800">
        <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <span class="text-[10px] uppercase font-semibold text-blue-600 tracking-wider">Company Profile</span>
            <h3 class="text-xl font-bold text-slate-900 dark:text-white">${comp.name}</h3>
            <p class="text-xs text-slate-500">ID: <strong class="font-mono text-blue-600">${comp.id}</strong></p>
          </div>
          <button onclick="appController.closeModal()" class="text-slate-400 hover:text-slate-600 font-bold text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div class="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span class="text-slate-500 block text-[10px]">Owner</span>
            <span class="font-semibold text-slate-900 dark:text-white">${comp.ownerName}</span>
          </div>
          <div class="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span class="text-slate-500 block text-[10px]">GST Status</span>
            <span class="font-semibold text-emerald-600">${comp.gstStatus} ${comp.gstin ? `(${comp.gstin})` : ''}</span>
          </div>
          <div class="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span class="text-slate-500 block text-[10px]">Contact</span>
            <span class="font-semibold font-mono text-slate-900 dark:text-white">${comp.mobile}</span>
          </div>
          <div class="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span class="text-slate-500 block text-[10px]">Plan Type</span>
            <span class="font-semibold text-blue-600">${sub.plan} (${sub.status})</span>
          </div>
          <div class="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span class="text-slate-500 block text-[10px]">Total Workers</span>
            <span class="font-semibold text-blue-600">${workers.length} Workers</span>
          </div>
          <div class="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span class="text-slate-500 block text-[10px]">Plan Expiry</span>
            <span class="font-semibold font-mono text-slate-900 dark:text-white">${sub.expiryDate}</span>
          </div>
        </div>

        <!-- WORKERS SUMMARY TABLE -->
        <div class="space-y-2">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-500">Registered Workers (${workers.length})</h4>
          <div class="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table class="w-full text-xs text-left">
              <thead class="bg-slate-50 dark:bg-slate-950 text-slate-500">
                <tr>
                  <th class="p-2">Worker</th>
                  <th class="p-2">Role</th>
                  <th class="p-2">Mobile</th>
                  <th class="p-2">Daily Wage</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                ${workers.map(w => `
                  <tr>
                    <td class="p-2 font-semibold text-slate-900 dark:text-white">${w.fullName}</td>
                    <td class="p-2 text-slate-500">${w.jobRole || 'Electrician'}</td>
                    <td class="p-2 font-mono">${w.mobile}</td>
                    <td class="p-2 font-semibold text-slate-900 dark:text-white">₹${w.dailyWage}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button onclick="appController.closeModal()" class="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white font-semibold rounded-xl text-xs">Close</button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  }
};

window.SuperAdminModule = SuperAdminModule;
