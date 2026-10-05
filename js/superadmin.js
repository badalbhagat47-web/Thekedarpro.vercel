// Super Admin Platform Management Module (THEKEDAR PRO)
const SuperAdminModule = {
  activeTab: 'overview', // 'overview', 'companies', 'workers', 'subscriptions', 'payments', 'settings'
  searchQuery: '',
  companyFilter: 'ALL', // 'ALL', 'GST', 'NON_GST', 'ACTIVE', 'BLOCKED', 'EXPIRED'
  selectedCompanyForModal: null,

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
    const t = (k) => window.i18n.t(k);
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
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.gstin && c.gstin.toLowerCase().includes(q)) ||
        c.ownerName.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }

    return `
      <div class="space-y-6 pb-12">
        <!-- PLATFORM TOP HEADER BANNER -->
        <div class="glass-card-dark p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-slate-800">
          <div class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-xs font-black mb-2">
                <i class="fa-solid fa-crown text-sm"></i> Master Super Admin Control Center
              </div>
              <h2 class="text-2xl sm:text-3xl font-black text-white brand-font tracking-wide">
                Platform Overview & Executive Control
              </h2>
              <p class="text-xs text-slate-400 mt-1">Real-time database statistics & multi-tenant SaaS administration</p>
            </div>
          </div>
        </div>

        <!-- 3D SUB-TAB NAVIGATION SYSTEM -->
        <div class="flex items-center gap-2 overflow-x-auto pb-3 border-b border-slate-200 dark:border-slate-800">
          <button onclick="SuperAdminModule.switchTab('overview')" 
                  class="px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${this.activeTab === 'overview' ? 'nav-link-3d-active' : 'nav-link-3d-inactive'}">
            <i class="fa-solid fa-chart-pie"></i> Overview
          </button>
          <button onclick="SuperAdminModule.switchTab('companies')" 
                  class="px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${this.activeTab === 'companies' ? 'nav-link-3d-active' : 'nav-link-3d-inactive'}">
            <i class="fa-solid fa-building"></i> All Companies (${stats.totalCompanies})
          </button>
          <button onclick="SuperAdminModule.switchTab('workers')" 
                  class="px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${this.activeTab === 'workers' ? 'nav-link-3d-active' : 'nav-link-3d-inactive'}">
            <i class="fa-solid fa-users"></i> Platform Workers (${stats.totalWorkers})
          </button>
          <button onclick="SuperAdminModule.switchTab('subscriptions')" 
                  class="px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${this.activeTab === 'subscriptions' ? 'nav-link-3d-active' : 'nav-link-3d-inactive'}">
            <i class="fa-solid fa-receipt"></i> Subscriptions
          </button>
          <button onclick="SuperAdminModule.switchTab('payments')" 
                  class="px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${this.activeTab === 'payments' ? 'nav-link-3d-active' : 'nav-link-3d-inactive'}">
            <i class="fa-solid fa-wallet"></i> Revenue & Payments
          </button>
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

  // 1. OVERVIEW VIEW
  renderOverviewSection(stats, companies) {
    return `
      <!-- 10 MASTER SUPER ADMIN KPI METRIC CARDS -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-amber-500 shadow-sm space-y-1">
          <span class="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Total Companies</span>
          <div class="text-2xl font-black text-slate-900 dark:text-white">${stats.totalCompanies}</div>
          <span class="text-[9px] text-slate-400 font-semibold block">Registered Firms</span>
        </div>

        <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-indigo-500 shadow-sm space-y-1">
          <span class="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Total Workers</span>
          <div class="text-2xl font-black text-indigo-600 dark:text-indigo-400">${stats.totalWorkers}</div>
          <span class="text-[9px] text-slate-400 font-semibold block">Platform Workforce</span>
        </div>

        <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-emerald-500 shadow-sm space-y-1">
          <span class="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Active Companies</span>
          <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400">${stats.activeCompanies}</div>
          <span class="text-[9px] text-slate-400 font-semibold block">Operational</span>
        </div>

        <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-rose-500 shadow-sm space-y-1">
          <span class="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider">Suspended Companies</span>
          <div class="text-2xl font-black text-rose-600 dark:text-rose-400">${stats.suspendedCompanies}</div>
          <span class="text-[9px] text-slate-400 font-semibold block">Blocked Access</span>
        </div>

        <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-teal-500 shadow-sm space-y-1">
          <span class="text-[10px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider">With Subscription</span>
          <div class="text-2xl font-black text-teal-600 dark:text-teal-400">${stats.companiesWithSub}</div>
          <span class="text-[9px] text-slate-400 font-semibold block">Paid or Active Trial</span>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-slate-600 shadow-sm space-y-1">
          <span class="text-[10px] font-black uppercase text-slate-500 tracking-wider">Without Sub</span>
          <div class="text-xl font-black text-slate-800 dark:text-slate-200">${stats.companiesWithoutSub}</div>
          <span class="text-[9px] text-slate-400 font-semibold block">Expired / Unsubscribed</span>
        </div>

        <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-blue-500 shadow-sm space-y-1">
          <span class="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Active Subs</span>
          <div class="text-xl font-black text-blue-600 dark:text-blue-400">${stats.activeSubscriptions}</div>
          <span class="text-[9px] text-slate-400 font-semibold block">Paid Active Plans</span>
        </div>

        <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-purple-500 shadow-sm space-y-1">
          <span class="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">Expired Subs</span>
          <div class="text-xl font-black text-purple-600 dark:text-purple-400">${stats.expiredSubscriptions}</div>
          <span class="text-[9px] text-slate-400 font-semibold block">Renewal Overdue</span>
        </div>

        <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-amber-600 shadow-sm space-y-1">
          <span class="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Trial Companies</span>
          <div class="text-xl font-black text-amber-600 dark:text-amber-400">${stats.trialCompanies}</div>
          <span class="text-[9px] text-slate-400 font-semibold block">14-Day Free Access</span>
        </div>

        <div class="glass-card card-3d p-4 rounded-2xl border-l-4 border-emerald-600 shadow-sm space-y-1">
          <span class="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Total Revenue</span>
          <div class="text-xl font-black text-emerald-600 dark:text-emerald-400">₹${stats.totalRevenue.toLocaleString()}</div>
          <span class="text-[9px] text-slate-400 font-semibold block">Gross SaaS Collection</span>
        </div>
      </div>

      <!-- RECENT REGISTRATIONS QUICK PREVIEW -->
      <div class="glass-card card-3d rounded-3xl p-6 shadow-sm space-y-4">
        <div class="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 class="text-base font-black text-slate-900 dark:text-white brand-font flex items-center gap-2">
            <i class="fa-solid fa-clock-rotate-left text-amber-500"></i> Recently Registered Contractor Companies
          </h3>
          <button onclick="SuperAdminModule.switchTab('companies')" class="text-xs font-extrabold text-amber-600 dark:text-amber-400 hover:underline">
            View All (${companies.length}) →
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${companies.slice(0, 4).map(c => `
            <div class="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-black text-slate-900 dark:text-white text-sm">${c.name}</h4>
                  <span class="text-[11px] font-semibold text-slate-500 block">${c.ownerName} • <span class="font-mono text-amber-600">${c.id}</span></span>
                </div>
                <span class="px-2 py-0.5 ${c.gstStatus === 'GST_VERIFIED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'} rounded text-[10px] font-black uppercase">
                  ${c.gstStatus === 'GST_VERIFIED' ? 'GST Verified' : 'Non-GST'}
                </span>
              </div>
              <div class="flex justify-between items-center text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                <span class="text-slate-400 font-mono"><i class="fa-solid fa-phone text-[10px]"></i> ${c.mobile}</span>
                <span class="font-black text-indigo-600 dark:text-indigo-400">${c.workerCount} Workers</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // 2. ALL COMPANIES MANAGEMENT VIEW
  renderCompaniesSection(companies) {
    const t = (k) => window.i18n.t(k);

    return `
      <div class="glass-card card-3d rounded-3xl p-6 shadow-sm space-y-4">
        <!-- SEARCH & FILTER TOOLBAR -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 class="text-lg font-black text-slate-900 dark:text-white brand-font flex items-center gap-2">
              <i class="fa-solid fa-building text-amber-500"></i> All Registered Companies (${companies.length})
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Complete company directory & management actions</p>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            <!-- Filter Dropdown -->
            <select onchange="SuperAdminModule.onFilterChange(this.value)" 
                    class="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none">
              <option value="ALL" ${this.companyFilter === 'ALL' ? 'selected' : ''}>All Filter Statuses</option>
              <option value="GST" ${this.companyFilter === 'GST' ? 'selected' : ''}>GST Verified Only</option>
              <option value="NON_GST" ${this.companyFilter === 'NON_GST' ? 'selected' : ''}>Non-GST Only</option>
              <option value="ACTIVE" ${this.companyFilter === 'ACTIVE' ? 'selected' : ''}>Active Status Only</option>
              <option value="BLOCKED" ${this.companyFilter === 'BLOCKED' ? 'selected' : ''}>Blocked / Suspended Only</option>
            </select>

            <!-- Search Field -->
            <div class="w-full sm:w-72 relative">
              <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-400 text-xs"></i>
              <input type="text" value="${this.searchQuery}" oninput="SuperAdminModule.onSearchInput(this.value)" 
                     placeholder="Search company, ID, owner, mobile..." 
                     class="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none">
            </div>
          </div>
        </div>

        <!-- COMPANY TABLE -->
        <div class="overflow-x-auto">
          <table class="w-full custom-table text-left">
            <thead>
              <tr>
                <th>Company & ID</th>
                <th>Contractor Owner</th>
                <th>GST Status</th>
                <th>Contact Details</th>
                <th>Reg Date</th>
                <th>Workers</th>
                <th>Subscription</th>
                <th>Status</th>
                <th class="text-right">Management Actions</th>
              </tr>
            </thead>
            <tbody>
              ${companies.map(c => `
                <tr>
                  <td class="font-bold text-slate-900 dark:text-white">
                    <span class="block text-sm font-black">${c.name}</span>
                    <span class="font-mono text-[11px] text-amber-600 dark:text-amber-400 block">${c.id}</span>
                  </td>
                  <td class="font-semibold text-slate-800 dark:text-slate-200 text-xs">${c.ownerName}</td>
                  <td>
                    ${c.gstStatus === 'GST_VERIFIED' ? `
                      <span class="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded text-[10px] font-bold block">GST VERIFIED</span>
                      <span class="font-mono text-[10px] text-slate-500">${c.gstin || '-'}</span>
                    ` : `
                      <span class="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold">NON-GST</span>
                    `}
                  </td>
                  <td class="text-xs">
                    <span class="font-mono font-bold block text-slate-800 dark:text-slate-200">${c.mobile}</span>
                    <span class="text-slate-500 text-[11px]">${c.email}</span>
                  </td>
                  <td class="font-mono text-xs text-slate-500">${c.createdAt ? c.createdAt.substring(0, 10) : '2026-01-01'}</td>
                  <td class="font-black text-indigo-600 dark:text-indigo-400 text-center bg-indigo-50 dark:bg-indigo-950/50 py-1.5 rounded-xl">${c.workerCount}</td>
                  <td>
                    <span class="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded text-[10px] font-bold block">${c.subscription ? c.subscription.plan : 'PRO SaaS'}</span>
                    <span class="text-[9px] text-slate-400 block">Exp: ${c.subscription ? c.subscription.expiryDate : '2026-12-31'}</span>
                  </td>
                  <td>
                    ${c.status === 'BLOCKED' ? `
                      <span class="px-2 py-1 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-lg text-[10px] font-black">BLOCKED</span>
                    ` : `
                      <span class="px-2 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-[10px] font-black">ACTIVE</span>
                    `}
                  </td>
                  <td class="text-right space-x-1 whitespace-nowrap">
                    <button onclick="SuperAdminModule.openCompanyOverviewModal('${c.id}')" 
                            title="View Full Company Profile Modal"
                            class="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black shadow-sm transition">
                      <i class="fa-solid fa-eye"></i> View Profile
                    </button>
                    <button onclick="SuperAdminModule.openSubscriptionModal('${c.id}')" 
                            title="Subscription & Plan Actions"
                            class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition">
                      <i class="fa-solid fa-key"></i> Subscription
                    </button>
                    <button onclick="SuperAdminModule.toggleCompanyBlockStatus('${c.id}')" 
                            class="px-2.5 py-1 ${c.status === 'BLOCKED' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'} rounded-lg text-xs font-bold transition">
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

  // 3. PLATFORM WORKERS VIEW
  renderWorkersSection(allWorkers) {
    return `
      <div class="glass-card card-3d rounded-3xl p-6 shadow-sm space-y-4">
        <div class="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 class="text-lg font-black text-slate-900 dark:text-white brand-font flex items-center gap-2">
            <i class="fa-solid fa-users text-indigo-500"></i> Platform Workers Directory (${allWorkers.length})
          </h3>
          <span class="text-xs text-slate-500 font-semibold">Cross-company workforce oversight</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full custom-table text-left">
            <thead>
              <tr>
                <th>Worker Name & ID</th>
                <th>Company</th>
                <th>Job Role</th>
                <th>Mobile Number</th>
                <th>Email</th>
                <th>Daily Wage</th>
                <th>Joining Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${allWorkers.map(w => {
                const comp = window.appStore.data.companies.find(c => c.id === w.companyId);
                return `
                  <tr>
                    <td class="font-bold text-slate-900 dark:text-white">
                      ${w.fullName}
                      <span class="block font-mono text-[10px] text-amber-600 dark:text-amber-400">${w.workerId || w.id}</span>
                    </td>
                    <td class="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      ${comp ? comp.name : 'Unknown Company'}
                    </td>
                    <td class="text-xs text-slate-600 dark:text-slate-400">${w.jobRole || 'Electrician'}</td>
                    <td class="font-mono text-xs text-slate-800 dark:text-slate-200">${w.mobile}</td>
                    <td class="text-xs text-slate-500">${w.email || '-'}</td>
                    <td class="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">₹${w.dailyWage}</td>
                    <td class="font-mono text-xs text-slate-500">${w.joiningDate || '-'}</td>
                    <td>
                      <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded text-[10px] font-bold uppercase">
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

  // 4. SUBSCRIPTION MANAGEMENT VIEW
  renderSubscriptionsSection(companies) {
    return `
      <div class="glass-card card-3d rounded-3xl p-6 shadow-sm space-y-4">
        <div class="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 class="text-lg font-black text-slate-900 dark:text-white brand-font flex items-center gap-2">
            <i class="fa-solid fa-receipt text-purple-500"></i> Platform Subscription Plans & Lifecycle
          </h3>
          <span class="text-xs text-slate-500 font-semibold">Active SaaS Plan Management</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full custom-table text-left">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Plan Name</th>
                <th>Subscription Status</th>
                <th>Start Date</th>
                <th>Expiry Date</th>
                <th>Plan Amount</th>
                <th>Payment Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${companies.map(c => {
                const sub = c.subscription || { plan: 'PRO SaaS', status: 'ACTIVE', startDate: '2026-01-01', expiryDate: '2026-12-31', amount: 4999, paymentStatus: 'PAID' };
                return `
                  <tr>
                    <td class="font-black text-slate-900 dark:text-white text-xs">${c.name}</td>
                    <td class="font-bold text-amber-600 dark:text-amber-400 text-xs">${sub.plan}</td>
                    <td>
                      <span class="px-2.5 py-1 ${sub.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'} rounded-lg text-[10px] font-black uppercase">
                        ${sub.status}
                      </span>
                    </td>
                    <td class="font-mono text-xs text-slate-500">${sub.startDate}</td>
                    <td class="font-mono text-xs text-slate-500 font-bold">${sub.expiryDate}</td>
                    <td class="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">₹${sub.amount}</td>
                    <td>
                      <span class="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded text-[10px] font-bold">
                        ${sub.paymentStatus}
                      </span>
                    </td>
                    <td class="text-right">
                      <button onclick="SuperAdminModule.openSubscriptionModal('${c.id}')" 
                              class="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black">
                        Manage Plan
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

  // 5. PAYMENTS VIEW
  renderPaymentsSection(stats, companies) {
    return `
      <div class="glass-card card-3d rounded-3xl p-6 shadow-sm space-y-6">
        <div class="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 class="text-lg font-black text-slate-900 dark:text-white brand-font flex items-center gap-2">
            <i class="fa-solid fa-wallet text-emerald-500"></i> SaaS Revenue & Payment Transactions
          </h3>
          <span class="text-xs text-slate-500 font-semibold">Total Revenue: ₹${stats.totalRevenue.toLocaleString()}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
            <span class="text-xs font-bold text-emerald-700 dark:text-emerald-300 block">Total SaaS Revenue Collected</span>
            <div class="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-1">₹${stats.totalRevenue.toLocaleString()}</div>
          </div>
          <div class="p-5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl">
            <span class="text-xs font-bold text-rose-700 dark:text-rose-300 block">Pending Invoices</span>
            <div class="text-2xl font-black text-rose-800 dark:text-rose-300 mt-1">₹${stats.pendingPayments.toLocaleString()}</div>
          </div>
          <div class="p-5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl">
            <span class="text-xs font-bold text-blue-700 dark:text-blue-300 block">Active Enterprise Accounts</span>
            <div class="text-2xl font-black text-blue-800 dark:text-blue-300 mt-1">${stats.activeCompanies} Companies</div>
          </div>
        </div>
      </div>
    `;
  },

  toggleCompanyBlockStatus(companyId) {
    const comp = window.appStore.data.companies.find(c => c.id === companyId);
    if (!comp) return;

    const actionText = comp.status === 'BLOCKED' ? 'Activate' : 'Suspend';
    if (confirm(`Are you sure you want to ${actionText} the company "${comp.name}"?`)) {
      const newStatus = window.appStore.toggleCompanyStatus(companyId);
      alert(`Company "${comp.name}" status updated to ${newStatus}!`);
      window.appController.renderCurrentView();
    }
  },

  openSubscriptionModal(companyId) {
    const comp = window.appStore.data.companies.find(c => c.id === companyId);
    if (!comp) return;
    const sub = comp.subscription || { plan: 'PRO SaaS', status: 'ACTIVE', startDate: '2026-01-01', expiryDate: '2026-12-31', amount: 4999, paymentStatus: 'PAID' };

    const modal = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');

    content.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-md mx-auto space-y-5 border border-slate-200 dark:border-slate-800">
        <div class="flex justify-between items-center border-b dark:border-slate-800 pb-3">
          <div>
            <h3 class="text-xl font-black text-slate-900 dark:text-white brand-font">Manage Subscription</h3>
            <p class="text-xs text-amber-600 font-bold">${comp.name}</p>
          </div>
          <button onclick="appController.closeModal()" class="text-slate-400 font-bold text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form onsubmit="SuperAdminModule.saveSubscriptionForm(event, '${comp.id}')" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subscription Plan</label>
            <select id="subPlan" class="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
              <option value="BASIC SaaS" ${sub.plan === 'BASIC SaaS' ? 'selected' : ''}>BASIC SaaS (₹2,999/yr)</option>
              <option value="PRO SaaS" ${sub.plan === 'PRO SaaS' ? 'selected' : ''}>PRO SaaS (₹4,999/yr)</option>
              <option value="ENTERPRISE SaaS" ${sub.plan === 'ENTERPRISE SaaS' ? 'selected' : ''}>ENTERPRISE SaaS (₹9,999/yr)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subscription Status</label>
            <select id="subStatus" class="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
              <option value="ACTIVE" ${sub.status === 'ACTIVE' ? 'selected' : ''}>ACTIVE</option>
              <option value="EXPIRED" ${sub.status === 'EXPIRED' ? 'selected' : ''}>EXPIRED</option>
              <option value="TRIAL" ${sub.status === 'TRIAL' ? 'selected' : ''}>TRIAL (14 Days)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Expiry Date</label>
            <input type="date" id="subExpiry" value="${sub.expiryDate || '2026-12-31'}" class="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
          </div>

          <button type="submit" class="w-full py-3.5 bg-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg">
            Save Subscription Updates
          </button>
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
    alert("✅ Company Subscription updated successfully!");
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
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-2xl mx-auto space-y-5 border border-slate-200 dark:border-slate-800">
        <div class="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <span class="text-xs uppercase font-black text-amber-500 tracking-wider">Platform Super Admin Overview</span>
            <h3 class="text-2xl font-black text-slate-900 dark:text-white brand-font">${comp.name}</h3>
            <p class="text-xs text-slate-500">Company ID: <strong class="font-mono text-amber-600">${comp.id}</strong></p>
          </div>
          <button onclick="appController.closeModal()" class="text-slate-400 hover:text-slate-600 font-bold text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div class="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span class="text-slate-500 block text-[10px]">Owner / Contractor</span>
            <span class="font-bold text-slate-900 dark:text-white">${comp.ownerName}</span>
          </div>
          <div class="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span class="text-slate-500 block text-[10px]">GST Status</span>
            <span class="font-bold text-emerald-600">${comp.gstStatus} ${comp.gstin ? `(${comp.gstin})` : ''}</span>
          </div>
          <div class="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span class="text-slate-500 block text-[10px]">Registered Contact</span>
            <span class="font-bold font-mono text-slate-900 dark:text-white">${comp.mobile}</span>
          </div>
          <div class="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span class="text-slate-500 block text-[10px]">Plan Type</span>
            <span class="font-bold text-blue-600">${sub.plan} (${sub.status})</span>
          </div>
          <div class="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span class="text-slate-500 block text-[10px]">Workers Roster</span>
            <span class="font-bold text-indigo-600">${workers.length} Active Workers</span>
          </div>
          <div class="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span class="text-slate-500 block text-[10px]">Plan Expiry</span>
            <span class="font-bold font-mono text-slate-900 dark:text-white">${sub.expiryDate}</span>
          </div>
        </div>

        <!-- WORKER SUMMARY TABLE -->
        <div class="space-y-2">
          <h4 class="text-xs font-black uppercase tracking-wider text-slate-500">Registered Workers Summary (${workers.length})</h4>
          <div class="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table class="w-full text-xs text-left">
              <thead class="bg-slate-100 dark:bg-slate-950 text-slate-500">
                <tr>
                  <th class="p-2">Worker</th>
                  <th class="p-2">Role</th>
                  <th class="p-2">Mobile</th>
                  <th class="p-2">Daily Wage</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
                ${workers.map(w => `
                  <tr>
                    <td class="p-2 font-bold">${w.fullName}</td>
                    <td class="p-2 text-slate-500">${w.jobRole || 'Electrician'}</td>
                    <td class="p-2 font-mono">${w.mobile}</td>
                    <td class="p-2 font-bold text-emerald-600">₹${w.dailyWage}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button onclick="appController.closeModal()" class="px-5 py-2 bg-slate-900 dark:bg-slate-800 text-white font-extrabold rounded-xl text-xs">Close Profile</button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  }
};

window.SuperAdminModule = SuperAdminModule;
