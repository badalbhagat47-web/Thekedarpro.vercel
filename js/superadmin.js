// Super Admin Platform Management Module
const SuperAdminModule = {
  searchQuery: '',

  renderSuperAdminDashboardView() {
    const t = (k) => window.i18n.t(k);
    const stats = window.appStore.getSuperAdminStats();
    let companies = window.appStore.getSuperAdminCompanyList();

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase().trim();
      companies = companies.filter(c => 
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.gstin && c.gstin.toLowerCase().includes(q)) ||
        c.ownerName.toLowerCase().includes(q) ||
        c.mobile.includes(q)
      );
    }

    return `
      <div class="space-y-6">
        <!-- Platform Header Banner -->
        <div class="glass-card-dark p-6 rounded-3xl relative overflow-hidden shadow-xl border border-slate-800">
          <div class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold mb-2">
                <i class="fa-solid fa-crown"></i> Platform Super Admin Portal
              </div>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-white brand-font tracking-wide">
                ${t('totalCompanies')} & Platform Control
              </h2>
              <p class="text-xs text-slate-400 mt-1">${t('companyPrivacyNotice')}</p>
            </div>

            <button onclick="appController.openCompanyRegistrationModal()" 
                    class="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold rounded-xl text-xs shadow-lg flex items-center gap-2">
              <i class="fa-solid fa-building-circle-check text-sm"></i> ${t('registerNewCompany')}
            </button>
          </div>
        </div>

        <!-- STATS GRID -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="glass-card p-5 rounded-2xl border-l-4 border-amber-500">
            <span class="text-xs font-bold text-slate-500 uppercase">${t('totalCompanies')}</span>
            <div class="text-3xl font-black text-slate-900 mt-1">${stats.totalCompanies}</div>
          </div>
          <div class="glass-card p-5 rounded-2xl border-l-4 border-emerald-500">
            <span class="text-xs font-bold text-emerald-600 uppercase">${t('activeCompanies')}</span>
            <div class="text-3xl font-black text-emerald-600 mt-1">${stats.activeCompanies}</div>
          </div>
          <div class="glass-card p-5 rounded-2xl border-l-4 border-rose-500">
            <span class="text-xs font-bold text-rose-600 uppercase">${t('blockedCompanies')}</span>
            <div class="text-3xl font-black text-rose-600 mt-1">${stats.blockedCompanies}</div>
          </div>
          <div class="glass-card p-5 rounded-2xl border-l-4 border-blue-500">
            <span class="text-xs font-bold text-blue-600 uppercase">${t('totalPlatformWorkers')}</span>
            <div class="text-3xl font-black text-blue-600 mt-1">${stats.totalWorkers}</div>
          </div>
        </div>

        <!-- SEARCH BAR & COMPANY ROSTER -->
        <div class="glass-card rounded-3xl p-6 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 class="text-lg font-extrabold text-slate-900 brand-font flex items-center gap-2">
              <i class="fa-solid fa-list-check text-amber-500"></i> ${t('companyListHeader')}
            </h3>

            <div class="w-full sm:w-80 relative">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400 text-xs"></i>
              <input type="text" value="${this.searchQuery}" oninput="SuperAdminModule.onSearchInput(this.value)" 
                     placeholder="${t('searchCompanyPlaceholder')}" 
                     class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500">
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full custom-table text-left">
              <thead>
                <tr>
                  <th>${t('companyName')}</th>
                  <th>${t('companyId')}</th>
                  <th>${t('gstStatus')}</th>
                  <th>${t('ownerName')}</th>
                  <th>${t('registeredMobileEmail')}</th>
                  <th>${t('registrationDate')}</th>
                  <th>${t('workerCount')}</th>
                  <th>${t('accountStatus')}</th>
                  <th>${t('action')}</th>
                </tr>
              </thead>
              <tbody>
                ${companies.map(c => `
                  <tr>
                    <td class="font-bold text-slate-900">
                      ${c.name}
                      <span class="block text-[10px] font-normal text-slate-400">${c.businessType || 'Contractor Firm'}</span>
                    </td>
                    <td class="font-mono text-xs font-bold text-amber-600">${c.id}</td>
                    <td>
                      ${c.gstStatus === 'GST_VERIFIED' ? `
                        <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold block">GST VERIFIED</span>
                        <span class="font-mono text-[10px] text-slate-500">${c.gstin || '-'}</span>
                      ` : `
                        <span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">NON-GST</span>
                      `}
                    </td>
                    <td class="font-semibold text-slate-800 text-xs">${c.ownerName}</td>
                    <td class="text-xs">
                      <span class="font-mono font-semibold block">${c.mobile}</span>
                      <span class="text-slate-500 text-[11px]">${c.email}</span>
                    </td>
                    <td class="font-mono text-xs text-slate-500">${c.createdAt ? c.createdAt.substring(0, 10) : '2026-01-01'}</td>
                    <td class="font-bold text-blue-700 text-center bg-blue-50 py-1 rounded">${c.workerCount}</td>
                    <td>
                      ${c.status === 'BLOCKED' ? `
                        <span class="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-black">BLOCKED</span>
                      ` : `
                        <span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-black">ACTIVE</span>
                      `}
                    </td>
                    <td class="space-x-1 whitespace-nowrap">
                      <button onclick="SuperAdminModule.openCompanyOverviewModal('${c.id}')" 
                              class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition">
                        Overview
                      </button>
                      <button onclick="SuperAdminModule.toggleCompanyBlockStatus('${c.id}')" 
                              class="px-2.5 py-1 ${c.status === 'BLOCKED' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'} rounded-lg text-xs font-bold transition">
                        ${c.status === 'BLOCKED' ? t('activate') : t('block')}
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  onSearchInput(val) {
    this.searchQuery = val;
    window.appController.renderCurrentView();
  },

  toggleCompanyBlockStatus(companyId) {
    const comp = window.appStore.data.companies.find(c => c.id === companyId);
    if (!comp) return;

    const actionText = comp.status === 'BLOCKED' ? 'Activate' : 'Block';
    if (confirm(`Are you sure you want to ${actionText} the company "${comp.name}"?`)) {
      const newStatus = window.appStore.toggleCompanyStatus(companyId);
      alert(`Company "${comp.name}" is now ${newStatus}!`);
      window.appController.renderCurrentView();
    }
  },

  openCompanyOverviewModal(companyId) {
    const comp = window.appStore.data.companies.find(c => c.id === companyId);
    if (!comp) return;

    const workerCount = window.appStore.getCompanyWorkers(companyId).length;
    const modal = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');

    content.innerHTML = `
      <div class="bg-white rounded-3xl p-6 shadow-2xl max-w-xl mx-auto space-y-5">
        <div class="flex justify-between items-center border-b border-slate-200 pb-3">
          <div>
            <span class="text-xs uppercase font-extrabold text-amber-500 tracking-wider">Super Admin Overview</span>
            <h3 class="text-2xl font-extrabold text-slate-900 brand-font">${comp.name}</h3>
            <p class="text-xs text-slate-500">Company ID: <strong class="font-mono text-slate-800">${comp.id}</strong></p>
          </div>
          <button onclick="appController.closeModal()" class="text-slate-400 hover:text-slate-600 font-bold text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r text-xs text-blue-900 font-medium">
          🔒 <strong>Privacy Guard Active:</strong> Worker Aadhaar cards, private document scans, and individual worker salary slips are strictly hidden from Platform Super Admin.
        </div>

        <div class="grid grid-cols-2 gap-4 text-xs">
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span class="text-slate-500 block">Owner / Contractor Name</span>
            <span class="font-bold text-slate-900 text-sm">${comp.ownerName}</span>
          </div>
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span class="text-slate-500 block">GST Status</span>
            <span class="font-bold text-slate-900 text-sm">${comp.gstStatus} ${comp.gstin ? `(${comp.gstin})` : ''}</span>
          </div>
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span class="text-slate-500 block">Registered Mobile</span>
            <span class="font-bold font-mono text-slate-900 text-sm">${comp.mobile}</span>
          </div>
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span class="text-slate-500 block">Registered Email</span>
            <span class="font-bold text-slate-900 text-sm">${comp.email}</span>
          </div>
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span class="text-slate-500 block">Business Address</span>
            <span class="font-bold text-slate-900 text-xs">${comp.address || 'Registered Location'}</span>
          </div>
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span class="text-slate-500 block">Registered Workers Count</span>
            <span class="font-black text-blue-600 text-sm">${workerCount} Workers</span>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button onclick="appController.closeModal()" class="px-5 py-2 bg-slate-900 text-white font-extrabold rounded-xl text-xs">Close Overview</button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  }
};

window.SuperAdminModule = SuperAdminModule;
