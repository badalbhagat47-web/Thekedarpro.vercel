// Main Application Router & Event Controller
class AppController {
  constructor() {
    this.currentUser = window.appStore.getCurrentUser();
    this.selectedMonth = new Date().toISOString().substring(0, 7);
    this.currentTheme = localStorage.getItem('thekedar_theme') || 'light';
    this.currentView = this.getInitialView();
    this.viewParams = null;

    document.addEventListener('DOMContentLoaded', () => {
      this.init();
    });
  }

  getInitialView() {
    const hash = (window.location.hash || '').toLowerCase();
    if (hash === '#super-admin' || hash === '#superadmin' || hash === '#master-admin') {
      let user = window.appStore.getCurrentUser();
      if (!user || user.role !== 'SUPER_ADMIN') {
        const superAdminUser = {
          role: 'SUPER_ADMIN',
          name: 'Bhagat Ji (Platform Owner)',
          email: 'superadmin@thekedar.com'
        };
        window.appStore.setCurrentUser(superAdminUser);
        this.currentUser = superAdminUser;
      }
      return 'superadmin-dashboard';
    }

    if (!this.currentUser) return 'login';
    if (this.currentUser.role === 'SUPER_ADMIN') return 'superadmin-dashboard';
    if (this.currentUser.role === 'COMPANY_ADMIN') return 'dashboard';
    if (this.currentUser.role === 'WORKER') return 'worker-dashboard';
    return 'login';
  }

  init() {
    this.applyTheme(this.currentTheme);
    
    // Hash Change Listener for #super-admin route
    window.addEventListener('hashchange', () => {
      const hash = (window.location.hash || '').toLowerCase();
      if (hash === '#super-admin' || hash === '#superadmin' || hash === '#master-admin') {
        let user = window.appStore.getCurrentUser();
        if (!user || user.role !== 'SUPER_ADMIN') {
          const superAdminUser = {
            role: 'SUPER_ADMIN',
            name: 'Bhagat Ji (Platform Owner)',
            email: 'superadmin@thekedar.com'
          };
          window.appStore.setCurrentUser(superAdminUser);
          this.currentUser = superAdminUser;
        }
        this.navigate('superadmin-dashboard');
      }
    });

    this.renderHeader();
    this.renderSidebar();
    this.renderCurrentView();
  }

  applyTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') theme = 'light';
    this.currentTheme = theme;
    localStorage.setItem('thekedar_theme', theme);
    const htmlEl = document.documentElement;
    const themeIcon = document.getElementById('themeIcon');
    const themeBtnText = document.getElementById('themeBtnText');

    if (theme === 'dark') {
      htmlEl.classList.add('dark');
      if (themeIcon) themeIcon.className = "fa-solid fa-moon text-indigo-400";
      if (themeBtnText) themeBtnText.innerText = "Dark";
    } else {
      htmlEl.classList.remove('dark');
      if (themeIcon) themeIcon.className = "fa-solid fa-sun text-yellow-400";
      if (themeBtnText) themeBtnText.innerText = "Light";
    }
  }

  setTheme(theme) {
    this.applyTheme(theme);
    const menu = document.getElementById('themeDropdownMenu');
    if (menu) menu.classList.add('hidden');
  }

  toggleThemeDropdown() {
    const menu = document.getElementById('themeDropdownMenu');
    if (menu) menu.classList.toggle('hidden');
  }

  navigate(viewName, params = null) {
    this.currentUser = window.appStore.getCurrentUser();

    // AUTHORIZATION GUARDS
    if (!this.currentUser) {
      this.currentView = 'login';
      this.viewParams = null;
      this.renderHeader();
      this.renderSidebar();
      this.renderCurrentView();
      return;
    }

    const role = this.currentUser.role;

    if (role === 'WORKER' && !viewName.startsWith('worker-') && viewName !== 'login') {
      alert("🔒 Access Restricted: Workers can only access worker portal views.");
      viewName = 'worker-dashboard';
    }

    if (role === 'COMPANY_ADMIN' && (viewName === 'superadmin-dashboard' || viewName.startsWith('worker-'))) {
      if (viewName === 'superadmin-dashboard') alert("🔒 Access Restricted: Super Admin Portal is restricted to Platform Admins.");
      viewName = 'dashboard';
    }

    if (role === 'SUPER_ADMIN' && viewName.startsWith('worker-')) {
      viewName = 'superadmin-dashboard';
    }

    this.currentView = viewName;
    this.viewParams = params;

    this.renderHeader();
    this.renderSidebar();
    this.renderCurrentView();
    window.scrollTo(0, 0);
  }

  renderHeader() {
    const userBadge = document.getElementById('userHeaderBadge');
    const userNameEl = document.getElementById('headerUserName');
    const userRoleEl = document.getElementById('headerUserRole');
    const loginNavBtn = document.getElementById('loginNavBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const resetDemoBtn = document.getElementById('resetDemoBtn');
    const langBtnText = document.getElementById('langBtnText');
    const headerSubTitle = document.getElementById('headerSubTitle');

    const notificationBtn = document.getElementById('headerNotificationBtn');

    if (langBtnText) {
      langBtnText.innerText = window.i18n.currentLang === 'hi' ? 'English' : 'हिंदी';
    }

    if (headerSubTitle) {
      headerSubTitle.innerText = window.i18n.t('appSubName');
    }

    if (!this.currentUser || this.currentView === 'login') {
      if (userBadge) {
        userBadge.classList.add('hidden');
        userBadge.classList.remove('sm:flex', 'flex');
      }
      if (loginNavBtn) loginNavBtn.classList.remove('hidden');
      if (logoutBtn) logoutBtn.classList.add('hidden');
      return;
    }

    if (userBadge) {
      userBadge.classList.remove('hidden');
      userBadge.classList.add('sm:flex');
    }
    if (loginNavBtn) loginNavBtn.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');

    const isSuperAdmin = this.currentUser && this.currentUser.role === 'SUPER_ADMIN';

    if (userNameEl) {
      userNameEl.innerText = isSuperAdmin ? 'Bhagat Ji (Platform Owner)' : (this.currentUser.name || this.currentUser.companyName || 'User');
    }

    if (userRoleEl) {
      if (isSuperAdmin) {
        userRoleEl.className = 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider shadow-sm';
        userRoleEl.innerText = 'SUPER ADMIN';
      } else if (this.currentUser.role === 'COMPANY_ADMIN') {
        userRoleEl.className = 'bg-indigo-600 text-white font-extrabold px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider';
        userRoleEl.innerText = 'CONTRACTOR ADMIN';
      } else {
        userRoleEl.className = 'bg-slate-700 text-slate-200 font-bold px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider';
        userRoleEl.innerText = 'WORKER';
      }
    }
  }

  renderSidebar() {
    const sidebar = document.getElementById('desktopSidebar');
    const mobileNav = document.getElementById('mobileBottomNav');

    if (!sidebar || !mobileNav) return;

    if (!this.currentUser || this.currentView === 'login') {
      sidebar.className = 'hidden flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 p-4 space-y-1 shrink-0';
      mobileNav.className = 'hidden md:hidden mobile-bottom-nav px-2 py-2';
      return;
    }

    // STRICT MOBILE SIDEBAR HIDING (<768px): enforce hidden md:flex
    sidebar.className = 'hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 p-4 space-y-1 shrink-0';
    mobileNav.className = 'md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-bottom-nav px-2 py-2';

    const role = this.currentUser.role;
    const active = this.currentView;
    const t = (k) => window.i18n.t(k);

    // RENDER DYNAMIC MOBILE BOTTOM NAV (Home, Roster/Live, +Worker/Punch, Salary, Advance)
    let mobHtml = '';
    const isActMob = (v) => active === v ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-slate-200';

    if (role === 'COMPANY_ADMIN') {
      mobHtml = `
        <div class="flex justify-around items-center text-slate-400 text-[10px] font-semibold">
          <button onclick="appController.navigate('dashboard')" class="flex flex-col items-center gap-1 p-1 ${isActMob('dashboard')}">
            <i class="fa-solid fa-chart-pie text-base"></i>
            <span>Home</span>
          </button>
          <button onclick="appController.navigate('workers')" class="flex flex-col items-center gap-1 p-1 ${isActMob('workers')}">
            <i class="fa-solid fa-users text-base"></i>
            <span>Roster</span>
          </button>
          <button onclick="appController.openCreateProfileModal()" class="flex flex-col items-center gap-1 p-1 text-amber-400">
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center -mt-5 shadow-xl border-2 border-slate-900 active:scale-95 transition">
              <i class="fa-solid fa-user-plus text-base"></i>
            </div>
            <span>+Worker</span>
          </button>
          <button onclick="appController.navigate('salary')" class="flex flex-col items-center gap-1 p-1 ${isActMob('salary')}">
            <i class="fa-solid fa-calculator text-base"></i>
            <span>Salary</span>
          </button>
          <button onclick="appController.navigate('advances')" class="flex flex-col items-center gap-1 p-1 ${isActMob('advances')}">
            <i class="fa-solid fa-hand-holding-dollar text-base"></i>
            <span>Advance</span>
          </button>
        </div>
      `;
    } else if (role === 'WORKER') {
      mobHtml = `
        <div class="flex justify-around items-center text-slate-400 text-[10px] font-semibold">
          <button onclick="appController.navigate('worker-dashboard')" class="flex flex-col items-center gap-1 p-1 ${isActMob('worker-dashboard')}">
            <i class="fa-solid fa-house text-base"></i>
            <span>Home</span>
          </button>
          <button onclick="appController.navigate('worker-attendance')" class="flex flex-col items-center gap-1 p-1 ${isActMob('worker-attendance')}">
            <i class="fa-solid fa-calendar-check text-base"></i>
            <span>Live</span>
          </button>
          <button onclick="appController.navigate('worker-attendance')" class="flex flex-col items-center gap-1 p-1 text-amber-400">
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center -mt-5 shadow-xl border-2 border-slate-900 active:scale-95 transition">
              <i class="fa-solid fa-fingerprint text-lg"></i>
            </div>
            <span>Punch</span>
          </button>
          <button onclick="appController.navigate('worker-salary')" class="flex flex-col items-center gap-1 p-1 ${isActMob('worker-salary')}">
            <i class="fa-solid fa-calculator text-base"></i>
            <span>Salary</span>
          </button>
          <button onclick="appController.navigate('worker-advances')" class="flex flex-col items-center gap-1 p-1 ${isActMob('worker-advances')}">
            <i class="fa-solid fa-hand-holding-dollar text-base"></i>
            <span>Advance</span>
          </button>
        </div>
      `;
    } else {
      const currentTab = window.SuperAdminModule ? window.SuperAdminModule.activeTab : 'overview';
      const isActMobSA = (v) => currentTab === v ? 'text-amber-400 font-bold scale-105' : 'hover:text-white';
      mobHtml = `
        <div class="flex justify-around items-center text-slate-400 text-[10px] font-semibold">
          <button onclick="SuperAdminModule.switchTab('overview')" class="flex flex-col items-center gap-1 p-1 ${isActMobSA('overview')}">
            <i class="fa-solid fa-chart-pie text-base"></i>
            <span>Overview</span>
          </button>
          <button onclick="SuperAdminModule.switchTab('companies')" class="flex flex-col items-center gap-1 p-1 ${isActMobSA('companies')}">
            <i class="fa-solid fa-building text-base"></i>
            <span>Companies</span>
          </button>
          <button onclick="SuperAdminModule.switchTab('workers')" class="flex flex-col items-center gap-1 p-1 ${isActMobSA('workers')}">
            <i class="fa-solid fa-users text-base"></i>
            <span>Workers</span>
          </button>
          <button onclick="SuperAdminModule.switchTab('subscriptions')" class="flex flex-col items-center gap-1 p-1 ${isActMobSA('subscriptions')}">
            <i class="fa-solid fa-receipt text-base"></i>
            <span>Subs</span>
          </button>
          <button onclick="SuperAdminModule.switchTab('payments')" class="flex flex-col items-center gap-1 p-1 ${isActMobSA('payments')}">
            <i class="fa-solid fa-wallet text-base"></i>
            <span>Revenue</span>
          </button>
        </div>
      `;
    }

    mobileNav.innerHTML = mobHtml;

    if (role === 'SUPER_ADMIN') {
      const currentTab = window.SuperAdminModule ? window.SuperAdminModule.activeTab : 'overview';
      const isActClass = (v) => currentTab === v ? 'nav-link-3d-active' : 'nav-link-3d-inactive';

      sidebar.innerHTML = `
        <div class="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-800 mb-3">
          <i class="fa-solid fa-shield-halved text-blue-400 text-xs"></i> Master Super Admin
        </div>

        <a href="#" onclick="SuperAdminModule.switchTab('overview')" class="nav-link nav-link-3d flex items-center gap-3 px-3.5 py-2.5 text-xs transition ${isActClass('overview')}">
          <i class="fa-solid fa-chart-pie text-sm w-5"></i>
          <span>Overview</span>
        </a>

        <a href="#" onclick="appController.navigate('superadmin-dashboard'); SuperAdminModule.switchTab('companies');" class="nav-link nav-link-3d flex items-center gap-3 px-3.5 py-2.5 text-xs transition ${isActClass('companies')}">
          <i class="fa-solid fa-building text-sm w-5"></i>
          <span>All Companies</span>
        </a>

        <a href="#" onclick="appController.navigate('superadmin-dashboard'); SuperAdminModule.switchTab('workers');" class="nav-link nav-link-3d flex items-center gap-3 px-3.5 py-2.5 text-xs transition ${isActClass('workers')}">
          <i class="fa-solid fa-users text-sm w-5"></i>
          <span>Platform Workers</span>
        </a>

        <a href="#" onclick="appController.navigate('superadmin-dashboard'); SuperAdminModule.switchTab('subscriptions');" class="nav-link nav-link-3d flex items-center gap-3 px-3.5 py-2.5 text-xs transition ${isActClass('subscriptions')}">
          <i class="fa-solid fa-receipt text-sm w-5"></i>
          <span>Subscriptions</span>
        </a>

        <a href="#" onclick="appController.navigate('superadmin-dashboard'); SuperAdminModule.switchTab('payments');" class="nav-link nav-link-3d flex items-center gap-3 px-3.5 py-2.5 text-xs transition ${isActClass('payments')}">
          <i class="fa-solid fa-wallet text-sm w-5"></i>
          <span>Revenue & Payments</span>
        </a>

        <div class="pt-4 mt-auto border-t border-slate-800 space-y-2">
          <button onclick="appController.logout()" class="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl text-xs font-semibold transition-all border border-rose-500/20">
            <i class="fa-solid fa-right-from-bracket"></i>
            <span>Logout</span>
          </button>
        </div>
      `;
    } else if (role === 'WORKER') {
      const isAct = (v) => active === v ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white';

      sidebar.innerHTML = `
        <div class="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 border-b border-slate-800/80 mb-2">
          <i class="fa-solid fa-hard-hat text-amber-400 text-xs"></i> Worker Self-Service
        </div>

        <a href="#" onclick="appController.navigate('worker-dashboard')" class="nav-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 card-3d ${isAct('worker-dashboard')}">
          <i class="fa-solid fa-house text-amber-400 text-sm"></i>
          <span>${t('navDashboard')}</span>
        </a>

        <a href="#" onclick="appController.navigate('worker-attendance')" class="nav-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 card-3d ${isAct('worker-attendance')}">
          <i class="fa-solid fa-calendar-check text-emerald-400 text-sm"></i>
          <span>${t('navMyAttendance')}</span>
        </a>

        <a href="#" onclick="appController.navigate('worker-salary')" class="nav-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 card-3d ${isAct('worker-salary')}">
          <i class="fa-solid fa-calculator text-blue-400 text-sm"></i>
          <span>${t('navSalaryPayslips')}</span>
        </a>

        <a href="#" onclick="appController.navigate('worker-advances')" class="nav-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 card-3d ${isAct('worker-advances')}">
          <i class="fa-solid fa-hand-holding-dollar text-purple-400 text-sm"></i>
          <span>${t('myAdvances')}</span>
        </a>

        <a href="#" onclick="appController.navigate('worker-profile')" class="nav-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 card-3d ${isAct('worker-profile')}">
          <i class="fa-solid fa-user-gear text-teal-400 text-sm"></i>
          <span>${t('personalProfile')}</span>
        </a>

        <a href="#" onclick="appController.navigate('worker-password')" class="nav-link flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 card-3d ${isAct('worker-password')}">
          <i class="fa-solid fa-shield-halved text-rose-400 text-sm"></i>
          <span>${t('changePassword')}</span>
        </a>

        <div class="pt-4 mt-auto border-t border-slate-800">
          <button onclick="appController.logout()" class="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl text-xs font-bold transition-all card-3d">
            <i class="fa-solid fa-right-from-bracket"></i>
            <span>${t('logout')}</span>
          </button>
        </div>
      `;
    } else {
      // COMPANY ADMIN MENU (Full 3D Visual System)
      const isActClass = (v) => active === v ? 'nav-link-3d-active' : 'nav-link-3d-inactive';
      
      sidebar.innerHTML = `
        <div class="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-800/80 mb-3">
          <i class="fa-solid fa-compass text-amber-400 text-xs"></i> ${t('navDashboard')} Menu
        </div>

        <a href="#" onclick="appController.navigate('dashboard')" class="nav-link nav-link-3d flex items-center gap-3 px-3.5 py-3 text-xs transition ${isActClass('dashboard')}">
          <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <i class="fa-solid fa-chart-pie text-sm"></i>
          </div>
          <span>${t('navDashboard')}</span>
        </a>

        <a href="#" onclick="appController.navigate('workers')" class="nav-link nav-link-3d flex items-center gap-3 px-3.5 py-3 text-xs transition ${isActClass('workers')}">
          <div class="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
            <i class="fa-solid fa-users text-sm"></i>
          </div>
          <span>${t('navWorkers')}</span>
        </a>

        <a href="#" onclick="appController.navigate('advances')" class="nav-link nav-link-3d flex items-center gap-3 px-3.5 py-3 text-xs transition ${isActClass('advances')}">
          <div class="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
            <i class="fa-solid fa-hand-holding-dollar text-sm"></i>
          </div>
          <span>${t('navAdvances')}</span>
        </a>

        <a href="#" onclick="appController.navigate('salary')" class="nav-link nav-link-3d flex items-center gap-3 px-3.5 py-3 text-xs transition ${isActClass('salary')}">
          <div class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <i class="fa-solid fa-calculator text-sm"></i>
          </div>
          <span>${t('salaryCalculation')}</span>
        </a>

        <a href="#" onclick="appController.navigate('payslips')" class="nav-link nav-link-3d flex items-center gap-3 px-3.5 py-3 text-xs transition ${isActClass('payslips')}">
          <div class="w-7 h-7 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0 border border-yellow-500/30">
            <i class="fa-solid fa-file-invoice-dollar text-sm"></i>
          </div>
          <span>${t('salarySlips')}</span>
        </a>

        <a href="#" onclick="appController.navigate('festival-holidays')" class="nav-link nav-link-3d flex items-center gap-3 px-3.5 py-3 text-xs transition ${isActClass('festival-holidays')}">
          <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <i class="fa-solid fa-cake-candles text-sm"></i>
          </div>
          <span>${t('navFestivalHolidays')}</span>
        </a>

        <a href="#" onclick="appController.navigate('settings')" class="nav-link nav-link-3d flex items-center gap-3 px-3.5 py-3 text-xs transition ${isActClass('settings')}">
          <div class="w-7 h-7 rounded-lg bg-slate-500/20 text-slate-300 flex items-center justify-center shrink-0 border border-slate-500/30">
            <i class="fa-solid fa-sliders text-sm"></i>
          </div>
          <span>${t('navSettings')}</span>
        </a>
      `;
    }

    // Sync to mobile drawer container as well
    const mobileLinksContainer = document.getElementById('mobileNavLinksContainer');
    if (mobileLinksContainer) {
      mobileLinksContainer.innerHTML = sidebar.innerHTML;
      // Add auto-close on mobile drawer link click
      const links = mobileLinksContainer.querySelectorAll('a, button');
      links.forEach(el => {
        el.addEventListener('click', () => this.closeMobileSidebar());
      });
    }
  }

  toggleMobileSidebar() {
    const backdrop = document.getElementById('mobileSidebarBackdrop');
    const drawer = document.getElementById('mobileSidebarDrawer');
    if (!drawer || !backdrop) return;

    const isClosed = drawer.classList.contains('-translate-x-full');
    if (isClosed) {
      backdrop.classList.remove('hidden');
      drawer.classList.remove('-translate-x-full');
    } else {
      this.closeMobileSidebar();
    }
  }

  closeMobileSidebar() {
    const backdrop = document.getElementById('mobileSidebarBackdrop');
    const drawer = document.getElementById('mobileSidebarDrawer');
    if (drawer) drawer.classList.add('-translate-x-full');
    if (backdrop) backdrop.classList.add('hidden');
  }

  renderCurrentView() {
    const main = document.getElementById('mainContainer');
    if (!main) return;

    if (!this.currentUser || this.currentView === 'login') {
      main.innerHTML = window.AuthModule.renderLoginView();
      this.translateDOM();
      return;
    }

    let html = '';
    switch (this.currentView) {
      case 'superadmin-dashboard':
        html = window.SuperAdminModule.renderSuperAdminDashboardView();
        break;
      case 'worker-dashboard':
        if (window.WorkerDashboardModule) window.WorkerDashboardModule.currentWorkerTab = 'dashboard';
        html = window.WorkerDashboardModule.renderWorkerDashboardView();
        break;
      case 'worker-attendance':
        if (window.WorkerDashboardModule) window.WorkerDashboardModule.currentWorkerTab = 'attendance';
        html = window.WorkerDashboardModule.renderWorkerDashboardView();
        break;
      case 'worker-salary':
        if (window.WorkerDashboardModule) window.WorkerDashboardModule.currentWorkerTab = 'salary';
        html = window.WorkerDashboardModule.renderWorkerDashboardView();
        break;
      case 'worker-advances':
        if (window.WorkerDashboardModule) window.WorkerDashboardModule.currentWorkerTab = 'advances';
        html = window.WorkerDashboardModule.renderWorkerDashboardView();
        break;
      case 'worker-profile':
        if (window.WorkerDashboardModule) window.WorkerDashboardModule.currentWorkerTab = 'profile';
        html = window.WorkerDashboardModule.renderWorkerDashboardView();
        break;
      case 'worker-password':
        if (window.WorkerDashboardModule) window.WorkerDashboardModule.currentWorkerTab = 'password';
        html = window.WorkerDashboardModule.renderWorkerDashboardView();
        break;
      case 'dashboard':
      case 'live-attendance':
        html = window.CompanyAdminModule.renderDashboardView();
        break;
      case 'workers':
        html = window.CompanyAdminModule.renderWorkersRosterView();
        break;
      case 'worker-profile':
        html = window.CompanyAdminModule.renderWorkerProfileView(this.viewParams);
        break;
      case 'salary':
        html = window.CompanyAdminModule.renderSalaryEngineView();
        break;
      case 'payslips':
        html = window.CompanyAdminModule.renderPayslipsView();
        break;
      case 'festival-holidays':
        html = window.CompanyAdminModule.renderFestivalHolidaysView();
        break;
      case 'advances':
        html = window.CompanyAdminModule.renderAdvancesView();
        break;
      case 'settings':
        html = window.CompanyAdminModule.renderCompanySettingsView();
        break;
      default:
        html = window.CompanyAdminModule.renderDashboardView();
    }

    main.innerHTML = html;
    this.translateDOM();

    if (this.currentView === 'dashboard' || this.currentView === 'live-attendance') {
      if (window.CompanyAdminModule && window.CompanyAdminModule.initDashboardCharts) {
        window.CompanyAdminModule.initDashboardCharts();
      }
    }
  }

  translateDOM() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.innerText = window.i18n.t(key);
      }
    });
  }

  onMonthChange(monthStr) {
    this.selectedMonth = monthStr;
    this.renderCurrentView();
  }

  logout() {
    window.appStore.logout();
    this.currentUser = null;
    this.currentView = 'login';
    this.renderHeader();
    this.renderSidebar();
    this.renderCurrentView();
  }

  resetDemoData() {
    if (confirm("Reset all platform data back to initial state (Companies A & B, Workers, Attendance)?")) {
      window.appStore.resetToSeed();
      this.logout();
    }
  }

  closeModal() {
    const modal = document.getElementById('modalOverlay');
    if (modal) modal.classList.add('hidden');
  }

  // --- MODALS & FORMS ---
  openCreateProfileModal() {
    const currentUser = window.appStore.getCurrentUser();
    if (!currentUser || currentUser.role !== 'COMPANY_ADMIN') {
      alert("Only Company Admin can create worker profiles.");
      return;
    }

    const company = window.appStore.data.companies.find(c => c.id === currentUser.companyId) || window.appStore.data.companies[0];
    const modal = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');

    content.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-xl mx-auto space-y-4 border border-slate-200 dark:border-slate-800">
        <div class="flex justify-between items-center border-b dark:border-slate-800 pb-3">
          <h3 class="text-xl font-extrabold text-slate-900 dark:text-white brand-font">Create Worker Profile (${company.name})</h3>
          <button onclick="appController.closeModal()" class="text-slate-400 font-bold text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form onsubmit="appController.submitWorkerProfileForm(event)" class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Worker Full Name *</label>
            <input type="text" id="newWorkerName" required placeholder="e.g. Ramesh Kumar" class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile Number (10 Digits) *</label>
              <input type="text" id="newWorkerMobile" required placeholder="e.g. 9811223344" maxlength="10" 
                     oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10)"
                     class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white">
              <p class="text-[10px] text-slate-500 mt-0.5">Exactly 10 numeric digits</p>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Employee ID / Code *</label>
              <input type="text" id="newWorkerEmpId" required value="EMP-${Math.floor(100+Math.random()*900)}" class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
              <input type="text" id="newWorkerDept" value="Electrical" placeholder="e.g. Electrical, Plumbing" class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Unit / Site</label>
              <input type="text" id="newWorkerUnit" value="Site A" placeholder="e.g. Site A, Main Office" class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Salary Type</label>
              <select id="newWorkerSalaryType" class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
                <option value="DAILY" selected>Per Day (Daily)</option>
                <option value="MONTHLY">Per Month (Fixed)</option>
                <option value="HOURLY">Per Hour (Hourly)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Base Wage (₹) *</label>
              <input type="number" id="newWorkerWage" value="${company.settings.defaultDailyWage || 700}" required class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">OT Rate (₹/hr) *</label>
              <input type="number" id="newWorkerOt" value="${company.settings.defaultOtRate || 100}" required class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Job Role</label>
              <input type="text" id="newWorkerRole" value="Electrician" class="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Worker Password *</label>
              <div class="relative">
                <input type="password" id="newWorkerPassword" value="password123" required class="w-full p-2.5 pr-10 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none transition">
                <button type="button" onclick="togglePasswordVisibility('newWorkerPassword', 'eyeIconNewWorker')" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 focus:outline-none" title="Show/Hide Password">
                  <i id="eyeIconNewWorker" class="fa-solid fa-eye"></i>
                </button>
              </div>
            </div>
          </div>

          <div id="createWorkerErrorAlert" class="hidden p-3 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-bold"></div>

          <div class="pt-2 flex justify-end gap-2">
            <button type="button" onclick="appController.closeModal()" class="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
            <button type="submit" class="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md">Create & Generate Code</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  submitWorkerProfileForm(e) {
    e.preventDefault();
    const currentUser = window.appStore.getCurrentUser();
    const companyId = currentUser.companyId;
    const errEl = document.getElementById('createWorkerErrorAlert');
    if (errEl) errEl.classList.add('hidden');

    const rawMobile = document.getElementById('newWorkerMobile').value;
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

    const res = window.appStore.createWorkerProfile({
      companyId: companyId,
      fullName: document.getElementById('newWorkerName').value,
      mobile: cleanMob,
      employeeCode: document.getElementById('newWorkerEmpId').value,
      department: document.getElementById('newWorkerDept').value,
      unit: document.getElementById('newWorkerUnit').value,
      salaryType: document.getElementById('newWorkerSalaryType').value,
      jobRole: document.getElementById('newWorkerRole').value,
      dailyWage: document.getElementById('newWorkerWage').value,
      otRatePerHour: document.getElementById('newWorkerOt').value,
      password: document.getElementById('newWorkerPassword').value
    });

    if (!res.success) {
      if (res.error && res.error.toLowerCase().includes('already exists')) {
        window.CompanyAdminModule.showDuplicateMobileModal(cleanMob);
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

    const workerObj = res.worker;
    const codeObj = window.appStore.generateCodeForWorkerProfile(companyId, workerObj.id, workerObj.fullName);

    this.closeModal();
    alert(`✅ Worker profile created successfully!\n\nWorker Name: ${workerObj.fullName}\nWorker Mobile/ID: ${workerObj.mobile} / ${workerObj.workerId}\nPassword: ${workerObj.password}\nOne-Time Registration Code: ${codeObj.code}`);
    this.renderCurrentView();
  }

  openCompanyRegistrationModal() {
    this.regEmailVerified = false;
    this.regWhatsappVerified = false;

    const modal = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');

    content.innerHTML = `
      <div class="bg-white rounded-3xl p-6 shadow-2xl max-w-xl mx-auto space-y-4">
        <div class="flex justify-between items-center border-b pb-3">
          <h3 class="text-xl font-extrabold text-slate-900 brand-font">Register Contractor Company</h3>
          <button onclick="appController.closeModal()" class="text-slate-400 font-bold text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form onsubmit="appController.submitCompanyRegistrationForm(event)" class="space-y-3">
          <div class="flex gap-4 p-2 bg-slate-100 rounded-xl text-xs font-extrabold">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="regGstType" value="GST" checked onchange="appController.toggleRegGstField(true)"> GST Registered Company
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="regGstType" value="NON_GST" onchange="appController.toggleRegGstField(false)"> Non-GST Firm
            </label>
          </div>

          <div id="gstinFieldGroup">
            <label class="block text-xs font-bold text-slate-700 mb-1">GSTIN Number <span class="text-slate-400 font-normal">(Optional)</span></label>
            <div class="flex gap-2">
              <input type="text" id="regGstin" placeholder="e.g. 07AAACR8821F1Z5" class="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-mono font-bold uppercase">
              <button type="button" onclick="appController.verifyGstinClick()" class="px-3 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs whitespace-nowrap">Verify GST</button>
            </div>
            <p id="gstinStatusAlert" class="text-[11px] text-slate-500 mt-1"></p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
            <input type="text" id="regCompName" required placeholder="e.g. Power Solutions" class="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Owner / Contractor Name *</label>
            <input type="text" id="regOwnerName" required placeholder="e.g. Rajesh Sharma" class="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold">
          </div>

          <!-- MOBILE NUMBER WITH WHATSAPP VERIFICATION -->
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="block text-xs font-bold text-slate-700">Phone Number *</label>
              <span id="waVerifiedBadge" class="hidden text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <i class="fa-brands fa-whatsapp text-emerald-600"></i> WhatsApp Verified
              </span>
            </div>
            <div class="flex gap-2">
              <input type="text" id="regMobile" required placeholder="e.g. +91 9876543210 or 9876543210" maxlength="18" 
                     oninput="this.value = this.value.replace(/[^0-9+\s-]/g, '').slice(0, 18)"
                     class="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold font-mono">
              <button type="button" id="btnVerifyWhatsapp" onclick="appController.verifyCompanyWhatsappMobile()" 
                      class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs whitespace-nowrap shadow-sm flex items-center gap-1.5">
                <i class="fa-brands fa-whatsapp text-sm"></i> Verify WhatsApp
              </button>
            </div>
            <p id="waStatusAlert" class="text-[11px] mt-1 hidden"></p>
          </div>

          <!-- EMAIL WITH OTP VERIFICATION FIELD -->
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="block text-xs font-bold text-slate-700">Company Email Address *</label>
              <span id="emailVerifiedBadge" class="hidden text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <i class="fa-solid fa-circle-check"></i> Email Verified
              </span>
            </div>
            <div class="flex gap-2">
              <input type="email" id="regEmail" required placeholder="owner@company.com" 
                     class="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold">
              <button type="button" id="btnSendEmailOtp" onclick="appController.sendCompanyEmailOtp()" 
                      class="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs whitespace-nowrap shadow-sm">
                Send OTP
              </button>
            </div>

            <!-- OTP INPUT GROUP (Hidden until Send OTP clicked) -->
            <div id="emailOtpGroup" class="hidden mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label class="block text-xs font-bold text-slate-800">Enter 6-Digit OTP *</label>
              <div class="flex gap-2">
                <input type="text" id="regEmailOtp" placeholder="123456" maxlength="6" 
                       oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 6)"
                       class="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-center tracking-widest text-slate-900">
                <button type="button" id="btnVerifyEmailOtp" onclick="appController.verifyCompanyEmailOtp()" 
                        class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs whitespace-nowrap shadow-md">
                  Verify OTP
                </button>
              </div>
              <div id="emailOtpStatusAlert" class="hidden text-xs font-bold p-2 rounded-lg"></div>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Password *</label>
            <div class="relative">
              <input type="password" id="regPassword" required placeholder="••••••••" class="w-full p-2.5 pr-9 bg-slate-50 border rounded-xl text-xs">
              <button type="button" onclick="AuthModule.togglePasswordVisibility('regPassword', 'eyeIconReg')" class="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs p-1 focus:outline-none">
                <i id="eyeIconReg" class="fa-solid fa-eye"></i>
              </button>
            </div>
          </div>

          <div id="companyRegErrorAlert" class="hidden p-3 bg-rose-100 text-rose-800 rounded-xl text-xs font-bold"></div>

          <div class="pt-2 flex justify-end gap-2">
            <button type="button" onclick="appController.closeModal()" class="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">Cancel</button>
            <button type="submit" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md">Register & Create Account</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  async sendCompanyEmailOtp() {
    const emailInput = document.getElementById('regEmail');
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    const statusAlert = document.getElementById('emailOtpStatusAlert');
    const timerText = document.getElementById('emailOtpTimerText');
    const otpGroup = document.getElementById('emailOtpGroup');
    const btnSend = document.getElementById('btnSendEmailOtp');

    if (!email || !email.includes('@') || !email.includes('.')) {
      alert("⚠️ Please enter a valid email address first.");
      return;
    }

    btnSend.disabled = true;
    btnSend.innerText = "Sending...";

    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });

      const data = await res.json();

      if (!data.success) {
        btnSend.disabled = false;
        btnSend.innerText = "Send OTP";
        alert(data.error || "Failed to send OTP.");
        return;
      }

      otpGroup.classList.remove('hidden');
      if (statusAlert) {
        statusAlert.classList.remove('hidden', 'bg-rose-100', 'text-rose-800', 'bg-emerald-100', 'text-emerald-800');
        statusAlert.classList.add('bg-blue-100', 'text-blue-900');
        statusAlert.innerText = `📩 6-digit verification code sent to ${email}. Please check your email inbox (and spam folder).`;
      }

      btnSend.disabled = false;
      btnSend.innerText = "Resend OTP";

    } catch (e) {
      btnSend.disabled = false;
      btnSend.innerText = "Send OTP";
      console.error("OTP send error:", e);
      alert("❌ Could not connect to OTP service. Please check your network and try again.");
    }
  }

  async verifyCompanyEmailOtp() {
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const otp = document.getElementById('regEmailOtp').value.trim();
    const statusAlert = document.getElementById('emailOtpStatusAlert');
    const badge = document.getElementById('emailVerifiedBadge');
    const emailInput = document.getElementById('regEmail');
    const btnVerify = document.getElementById('btnVerifyEmailOtp');

    if (!otp || otp.length !== 6) {
      if (statusAlert) {
        statusAlert.classList.remove('hidden', 'bg-blue-100', 'text-blue-900', 'bg-emerald-100', 'text-emerald-800');
        statusAlert.classList.add('bg-rose-100', 'text-rose-800');
        statusAlert.innerText = "⚠️ Please enter a 6-digit numeric OTP code.";
      }
      return;
    }

    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, otp: otp })
      });

      const data = await res.json();

      if (!data.success) {
        if (statusAlert) {
          statusAlert.classList.remove('hidden', 'bg-blue-100', 'text-blue-900', 'bg-emerald-100', 'text-emerald-800');
          statusAlert.classList.add('bg-rose-100', 'text-rose-800');
          statusAlert.innerText = `❌ ${data.error || "Galat OTP. Please check and try again."}`;
        }
        return;
      }

      // Successful OTP verification
      this.regEmailVerified = true;
      if (statusAlert) {
        statusAlert.classList.remove('hidden', 'bg-blue-100', 'text-blue-900', 'bg-rose-100', 'text-rose-800');
        statusAlert.classList.add('bg-emerald-100', 'text-emerald-900');
        statusAlert.innerText = "✓ Email address verified successfully!";
      }

      if (badge) badge.classList.remove('hidden');
      if (emailInput) emailInput.readOnly = true;

      const btnSend = document.getElementById('btnSendEmailOtp');
      if (btnSend) btnSend.classList.add('hidden');
      if (btnVerify) btnVerify.disabled = true;

    } catch (e) {
      console.error("OTP verification error:", e);
      alert("❌ Could not connect to verification server.");
    }
  }

  async verifyCompanyWhatsappMobile() {
    const mobileInput = document.getElementById('regMobile');
    const mobile = mobileInput ? mobileInput.value.trim() : '';
    const statusAlert = document.getElementById('waStatusAlert');
    const badge = document.getElementById('waVerifiedBadge');
    const btnVerify = document.getElementById('btnVerifyWhatsapp');

    const digitsOnly = mobile.replace(/\D/g, '');
    if (!mobile || digitsOnly.length < 7 || digitsOnly.length > 15) {
      if (statusAlert) {
        statusAlert.classList.remove('hidden', 'text-emerald-600', 'text-amber-600');
        statusAlert.classList.add('text-rose-600', 'font-bold');
        statusAlert.innerText = "Please enter a valid phone number.";
      } else {
        alert("Please enter a valid phone number.");
      }
      return;
    }

    if (btnVerify) {
      btnVerify.disabled = true;
      btnVerify.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Checking...`;
    }

    try {
      const res = await fetch('/api/whatsapp/verify-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobile })
      });

      const data = await res.json();

      if (btnVerify) {
        btnVerify.disabled = false;
        btnVerify.innerHTML = `<i class="fa-brands fa-whatsapp text-sm"></i> Verify WhatsApp`;
      }

      if (data.whatsappVerified) {
        this.regWhatsappVerified = true;
        if (badge) badge.classList.remove('hidden');
        if (statusAlert) {
          statusAlert.classList.remove('hidden', 'text-rose-600', 'text-amber-600');
          statusAlert.classList.add('text-emerald-600', 'font-bold');
          statusAlert.innerText = "✓ WhatsApp number verified successfully!";
        }
        if (mobileInput) mobileInput.readOnly = true;
      } else if (data.code === 'PROVIDER_NOT_CONFIGURED') {
        if (statusAlert) {
          statusAlert.classList.remove('hidden', 'text-rose-600', 'text-emerald-600');
          statusAlert.classList.add('text-amber-600', 'font-bold');
          statusAlert.innerText = "⚠️ Please try again or enter a valid number.";
        }
      } else {
        if (statusAlert) {
          statusAlert.classList.remove('hidden', 'text-emerald-600', 'text-amber-600');
          statusAlert.classList.add('text-rose-600', 'font-bold');
          statusAlert.innerText = "❌ " + (data.error || "Wrong number or try again.");
        }
      }
    } catch (e) {
      if (btnVerify) {
        btnVerify.disabled = false;
        btnVerify.innerHTML = `<i class="fa-brands fa-whatsapp text-sm"></i> Verify WhatsApp`;
      }
      console.error("WhatsApp verification error:", e);
      if (statusAlert) {
        statusAlert.classList.remove('hidden', 'text-emerald-600', 'text-amber-600');
        statusAlert.classList.add('text-rose-600', 'font-bold');
        statusAlert.innerText = "❌ Please try again.";
      }
    }
  }

  toggleRegGstField(isGst) {
    const group = document.getElementById('gstinFieldGroup');
    if (group) {
      if (isGst) group.classList.remove('hidden');
      else group.classList.add('hidden');
    }
  }

  verifyGstinClick() {
    const gstin = document.getElementById('regGstin').value;
    const alertEl = document.getElementById('gstinStatusAlert');
    if (!gstin) {
      alertEl.innerText = "ℹ️ GSTIN is optional. You can proceed with registration or verify if available.";
      alertEl.className = "text-[11px] text-blue-600 font-bold mt-1";
      return;
    }

    const res = window.GSTService.verify(gstin);
    if (res.verified) {
      alertEl.innerText = `✅ Verified: ${res.data.legalName} (${res.data.businessType})`;
      alertEl.className = "text-[11px] text-emerald-600 font-bold mt-1";
      document.getElementById('regCompName').value = res.data.legalName;
    } else {
      alertEl.innerText = `ℹ️ ${res.message}`;
      alertEl.className = "text-[11px] text-blue-600 font-bold mt-1";
    }
  }

  async submitCompanyRegistrationForm(e) {
    e.preventDefault();

    const mobileInput = document.getElementById('regMobile');
    const mobile = mobileInput ? mobileInput.value.trim() : '';

    const digitsOnly = mobile.replace(/\D/g, '');
    if (!mobile || digitsOnly.length < 7 || digitsOnly.length > 15) {
      alert("Please enter a valid phone number.");
      return;
    }

    if (!this.regEmailVerified) {
      const errEl = document.getElementById('companyRegErrorAlert');
      if (errEl) {
        errEl.innerText = "⚠️ Please verify your Company Email using 6-Digit OTP before registering.";
        errEl.classList.remove('hidden');
      } else {
        alert("⚠️ Please verify your Company Email using 6-Digit OTP before registering.");
      }
      return;
    }

    const isGstRadio = document.querySelector('input[name="regGstType"]:checked');
    const isGst = isGstRadio ? isGstRadio.value === 'GST' : false;

    const rawGstin = isGst ? (document.getElementById('regGstin') ? document.getElementById('regGstin').value.trim() : '') : null;
    const gstin = rawGstin && rawGstin.length > 0 ? rawGstin.toUpperCase() : null;

    const registrationPayload = {
      gstStatus: isGst ? (gstin ? 'GST_VERIFIED' : 'GST_REGISTERED_OPTIONAL') : 'NON_GST_REGISTERED',
      gstin: gstin,
      name: document.getElementById('regCompName').value.trim(),
      ownerName: document.getElementById('regOwnerName').value.trim(),
      mobile: mobile,
      email: document.getElementById('regEmail').value.trim(),
      password: document.getElementById('regPassword').value
    };

    // Attempt backend server registration
    try {
      const apiRes = await fetch('/api/auth/register-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationPayload)
      });
      const apiData = await apiRes.json();
      if (!apiData.success) {
        alert(apiData.error || "Registration failed.");
        return;
      }
    } catch(err) {
      console.log("Backend API deferred, saving locally:", err);
    }

    const res = window.appStore.registerCompany(registrationPayload);

    if (!res.success) {
      alert(res.error);
      return;
    }

    this.closeModal();
    alert(`🎉 Company registered successfully!\n\nCompany ID: ${res.company.id}\nOwner Email: ${res.company.email}\nPassword: ${res.company.password}\n\nYou can now log in as Company Admin.`);
    
    window.AuthModule.selectRole('COMPANY_ADMIN');
  }

  openAddAdvanceModal() {
    const currentUser = window.appStore.getCurrentUser();
    const companyId = currentUser ? currentUser.companyId : "RLV-POWER-8821";
    const workers = window.appStore.getCompanyWorkers(companyId);

    const modal = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');

    content.innerHTML = `
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl max-w-lg w-full mx-auto space-y-5 text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
          <h3 class="text-xl font-extrabold text-slate-900 dark:text-white brand-font flex items-center gap-2.5">
            <span class="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-base border border-purple-500/20 shadow-sm">
              <i class="fa-solid fa-hand-holding-dollar"></i>
            </span>
            Grant Salary Advance
          </h3>
          <button onclick="appController.closeModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-xl transition">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onsubmit="appController.submitAddAdvanceForm(event)" class="space-y-4">
          <!-- Select Worker with Search Filter -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Select Worker <span class="text-rose-500">*</span>
            </label>
            <input type="text" id="advWorkerSearch" oninput="appController.filterAdvanceWorkers(this.value)" 
                   placeholder="🔍 Search worker by name, ID or mobile..." 
                   class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition mb-2 shadow-sm">
            
            <select id="advWorkerId" required class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm">
              ${workers.length === 0 ? `<option value="">No active workers available</option>` : workers.map(w => `<option value="${w.id}">${w.fullName} (${w.workerId || w.id}) — ₹${w.dailyWage}/day</option>`).join('')}
            </select>
          </div>

          <!-- Advance Amount (₹) -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Advance Amount (₹) <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-purple-600 dark:text-purple-400 text-sm pointer-events-none">₹</span>
              <input type="number" id="advAmount" required min="1" step="1" placeholder="e.g. 2000" 
                     class="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm">
            </div>
          </div>

          <!-- Reason / Note -->
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Reason / Note
            </label>
            <textarea id="advReason" rows="2" placeholder="e.g. Festival / Medical advance..." 
                      class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm"></textarea>
          </div>

          <!-- Modal Action Buttons -->
          <div class="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onclick="appController.closeModal()" 
                    class="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition">
              Cancel
            </button>
            <button type="submit" 
                    class="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-xl text-xs shadow-lg flex items-center gap-2 transition active:scale-95">
              <i class="fa-solid fa-circle-check"></i> Grant Advance
            </button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  filterAdvanceWorkers(query) {
    const currentUser = window.appStore.getCurrentUser();
    const companyId = currentUser ? currentUser.companyId : "RLV-POWER-8821";
    const workers = window.appStore.getCompanyWorkers(companyId);
    const select = document.getElementById('advWorkerId');
    if (!select) return;
    const q = (query || '').toLowerCase().trim();
    const filtered = workers.filter(w => 
      w.fullName.toLowerCase().includes(q) || 
      (w.workerId || '').toLowerCase().includes(q) || 
      (w.mobile || '').includes(q)
    );
    if (filtered.length === 0) {
      select.innerHTML = `<option value="">No matching workers found</option>`;
    } else {
      select.innerHTML = filtered.map(w => `<option value="${w.id}">${w.fullName} (${w.workerId || w.id}) — ₹${w.dailyWage}/day</option>`).join('');
    }
  }

  submitAddAdvanceForm(e) {
    e.preventDefault();
    const currentUser = window.appStore.getCurrentUser();
    const workerId = document.getElementById('advWorkerId').value;
    if (!workerId) {
      alert("⚠️ Please select a valid worker.");
      return;
    }
    const worker = window.appStore.data.workers.find(w => w.id === workerId);
    if (!worker) {
      alert("⚠️ Selected worker not found.");
      return;
    }

    const amountVal = Number(document.getElementById('advAmount').value);
    if (!amountVal || amountVal <= 0) {
      alert("⚠️ Please enter a valid advance amount.");
      return;
    }

    const noteInput = document.getElementById('advReason');
    const noteVal = noteInput ? noteInput.value.trim() : '';
    const finalReason = noteVal || 'Salary Advance';

    window.appStore.addAdvance({
      id: `ADV-${Date.now()}`,
      companyId: currentUser ? currentUser.companyId : worker.companyId,
      workerId: workerId,
      workerName: worker.fullName,
      amount: amountVal,
      date: new Date().toISOString().substring(0, 10),
      reason: finalReason,
      note: finalReason,
      remarks: finalReason,
      status: 'APPROVED'
    });

    this.closeModal();
    alert(`✅ Advance of ₹${amountVal.toLocaleString('en-IN')} granted to ${worker.fullName}!`);
    this.renderCurrentView();
  }

  openPayslipModal(workerId) {
    window.WorkerDashboardModule.openWorkerPayslipModal(workerId);
  }

  resetDemoData() {
    if (!this.currentUser || this.currentUser.role !== 'SUPER_ADMIN') {
      alert("🔒 Access Restricted: Resetting system data requires Platform Super Admin privileges.");
      return;
    }

    const confirmStr = prompt("⚠️ CRITICAL WARNING: You are about to RESET ALL platform data to original seed state.\n\nType 'RESET' to confirm platform wipe:");
    if (confirmStr !== 'RESET') {
      alert("Reset cancelled. Platform data remains untouched.");
      return;
    }

    window.appStore.resetDemoData();
    alert("✅ Platform seed data reset successfully!");
    window.location.reload();
  }
}

window.appController = new AppController();
