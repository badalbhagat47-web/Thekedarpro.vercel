// Auth & Landing Interface Module (THEKEDAR PRO - DenaLena SaaS Redesign)
const AuthModule = {
  activeTab: 'COMPANY', // 'COMPANY' or 'WORKER'

  renderLoginView() {
    const t = (k) => window.i18n.t(k);

    return `
      <div class="max-w-5xl mx-auto py-6 sm:py-10 px-4 space-y-6">
        <!-- BRAND HEADER SECTION -->
        <div class="text-center space-y-2 max-w-3xl mx-auto flex flex-col items-center">
          <img src="brand/thekedar-logo.png" alt="Thekedar Logo" class="h-20 sm:h-24 max-w-full w-auto object-contain mx-auto my-3 filter drop-shadow-xl hover:scale-105 transition" onerror="this.onerror=null; this.src='public/brand/thekedar-logo.png';">
        </div>

        <!-- MAIN DUAL-PANEL LOGIN CONTAINER CARD -->
        <div class="max-w-xl mx-auto glass-card dark:glass-card-dark card-3d p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 border border-slate-200 dark:border-slate-800 transition-all">
          
          <!-- TAB SWITCHER HEADER (COMPANY vs WORKER) -->
          <div class="p-1.5 bg-slate-100 dark:bg-slate-900/90 rounded-2xl flex items-center justify-between border border-slate-200 dark:border-slate-800 shadow-inner">
            <button type="button" onclick="AuthModule.switchTab('COMPANY')" id="tabBtnCompany"
                    class="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 flex items-center justify-center gap-2 ${this.activeTab === 'COMPANY' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02] border border-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}">
              <i class="fa-solid fa-building text-base"></i>
              <span data-i18n="companyLoginTab">${t('companyLoginTab')}</span>
            </button>
            
            <button type="button" onclick="AuthModule.switchTab('WORKER')" id="tabBtnWorker"
                    class="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 flex items-center justify-center gap-2 ${this.activeTab === 'WORKER' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-[1.02] border border-amber-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}">
              <i class="fa-solid fa-hard-hat text-base text-amber-500 dark:text-amber-400"></i>
              <span data-i18n="workerLoginTab">${t('workerLoginTab')}</span>
            </button>
          </div>

          <!-- DYNAMIC PANEL TITLE & SUBTITLE -->
          <div class="space-y-1 text-center sm:text-left">
            <div class="inline-flex items-center gap-2 px-3 py-1 ${this.activeTab === 'COMPANY' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'} border rounded-full text-[11px] font-black uppercase tracking-wider mb-1">
              <i class="fa-solid ${this.activeTab === 'COMPANY' ? 'fa-building-columns' : 'fa-id-card'}"></i>
              <span>${this.activeTab === 'COMPANY' ? 'Contractor Management Portal' : 'Worker Self-Service Portal'}</span>
            </div>
            <h2 id="loginPanelTitle" class="text-2xl font-black text-slate-900 dark:text-white brand-font tracking-wide" data-i18n="${this.activeTab === 'COMPANY' ? 'companyLoginTitle' : 'workerLoginTitle'}">
              ${this.activeTab === 'COMPANY' ? t('companyLoginTitle') : t('workerLoginTitle')}
            </h2>
            <p id="loginPanelSubTitle" class="text-xs text-slate-500 dark:text-slate-400" data-i18n="${this.activeTab === 'COMPANY' ? 'companyLoginSubTitle' : 'workerLoginSubTitle'}">
              ${this.activeTab === 'COMPANY' ? t('companyLoginSubTitle') : t('workerLoginSubTitle')}
            </p>
          </div>

          <!-- LOGIN FORM -->
          <form onsubmit="AuthModule.handleLoginSubmit(event)" class="space-y-4">
            <div>
              <label id="loginIdentifierLabel" class="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider" data-i18n="${this.activeTab === 'COMPANY' ? 'companyIdEmailMobileLabel' : 'workerIdMobileLabel'}">
                ${this.activeTab === 'COMPANY' ? t('companyIdEmailMobileLabel') : t('workerIdMobileLabel')}
              </label>
              <div class="relative">
                <i class="fa-solid ${this.activeTab === 'COMPANY' ? 'fa-building text-emerald-500' : 'fa-id-card text-amber-500'} absolute left-3.5 top-3.5 text-xs"></i>
                <input type="text" id="loginIdentifier" required 
                       placeholder="${this.activeTab === 'COMPANY' ? 'rlv@powersolutions.com / 9876543210' : '9811122233 / EMP-101'}" 
                       class="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none transition">
              </div>
            </div>

            <div>
              <div class="flex justify-between items-center mb-1.5">
                <label class="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider"><span data-i18n="password">${t('password')}</span> *</label>
                <button type="button" onclick="AuthModule.openForgotPasswordModal()" class="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline" data-i18n="forgotPassword">
                  ${t('forgotPassword')}
                </button>
              </div>
              <div class="relative">
                <i class="fa-solid fa-lock absolute left-3.5 top-3.5 text-slate-400 text-xs"></i>
                <input type="password" id="loginPassword" required placeholder="••••••••" 
                       class="w-full pl-9 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none transition">
                <button type="button" onclick="AuthModule.togglePasswordVisibility('loginPassword', 'eyeIconLogin')" 
                        class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1.5 focus:outline-none"
                        title="Show/Hide Password">
                  <i id="eyeIconLogin" class="fa-solid fa-eye"></i>
                </button>
              </div>
            </div>

            <!-- Status Error Alert -->
            <div id="loginErrorMsg" class="hidden p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-2xl text-xs font-bold space-y-1"></div>

            <button type="submit" 
                    class="w-full py-3.5 ${this.activeTab === 'COMPANY' ? 'btn-3d-emerald text-white' : 'btn-3d-amber text-slate-950'} font-black text-sm rounded-2xl shadow-xl transition flex items-center justify-center gap-2">
              <i class="fa-solid ${this.activeTab === 'COMPANY' ? 'fa-right-to-bracket' : 'fa-hard-hat'} text-base"></i> 
              <span data-i18n="${this.activeTab === 'COMPANY' ? 'logInToCompany' : 'logInToWorker'}">${this.activeTab === 'COMPANY' ? t('logInToCompany') : t('logInToWorker')}</span>
            </button>
          </form>

          ${this.activeTab === 'COMPANY' ? `
            <!-- CONTRACTOR REGISTRATION BANNER (COMPANY LOGIN ONLY) -->
            <div class="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
              <p class="text-xs text-slate-500 dark:text-slate-400 font-medium" data-i18n="newContractorRegistration">${t('newContractorRegistration')}</p>
              <button onclick="appController.openCompanyRegistrationModal()" 
                      class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition flex items-center gap-1.5" data-i18n="registerContractorCompany">
                <i class="fa-solid fa-building-circle-check"></i> ${t('registerContractorCompany')}
              </button>
            </div>
          ` : ''}

        </div>
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    const errEl = document.getElementById('loginErrorMsg');
    if (errEl) errEl.classList.add('hidden');

    const mainContainer = document.getElementById('mainContainer');
    if (mainContainer) {
      mainContainer.innerHTML = this.renderLoginView();
    }
  },

  handleLoginSubmit(e) {
    e.preventDefault();
    const identifier = document.getElementById('loginIdentifier').value;
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginErrorMsg');

    if (errEl) errEl.classList.add('hidden');

    const res = window.appStore.authenticate(identifier, password, this.activeTab);

    if (!res.success) {
      if (errEl) {
        errEl.innerText = res.error;
        errEl.classList.remove('hidden');
      } else {
        alert(res.error);
      }
      return;
    }

    if (res.user.role === 'WORKER' && res.isFirstLogin) {
      this.openFirstLoginResetModal(res.user);
      return;
    }

    window.appController.currentUser = res.user;
    window.appController.renderHeader();
    window.appController.renderSidebar();

    if (res.user.role === 'SUPER_ADMIN') {
      window.appController.navigate('superadmin-dashboard');
    } else if (res.user.role === 'COMPANY_ADMIN') {
      window.appController.navigate('dashboard');
    } else if (res.user.role === 'WORKER') {
      window.appController.navigate('worker-dashboard');
    }
  },

  openFirstLoginResetModal(user) {
    const t = (k) => window.i18n.t(k);
    const modal = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');

    content.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-md mx-auto space-y-5 border border-slate-200 dark:border-slate-800">
        <div class="text-center space-y-2">
          <div class="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto text-2xl font-black shadow-lg">
            <i class="fa-solid fa-key"></i>
          </div>
          <h3 class="text-xl font-black text-slate-900 dark:text-white brand-font">${t('createPasswordTitle')}</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">${t('createPasswordDesc')}</p>
        </div>

        <form onsubmit="AuthModule.submitFirstLoginReset(event, '${user.workerId}')" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">${t('newPasswordLabel')} *</label>
            <div class="relative">
              <input type="password" id="firstLoginNewPass" required minlength="4" placeholder="••••••••" class="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none transition">
              <button type="button" onclick="togglePasswordVisibility('firstLoginNewPass', 'eyeIconFirstLoginNew')" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 focus:outline-none" title="Show/Hide Password">
                <i id="eyeIconFirstLoginNew" class="fa-solid fa-eye"></i>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">${t('confirmPasswordLabel')} *</label>
            <div class="relative">
              <input type="password" id="firstLoginConfirmPass" required minlength="4" placeholder="••••••••" class="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none transition">
              <button type="button" onclick="togglePasswordVisibility('firstLoginConfirmPass', 'eyeIconFirstLoginConfirm')" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 focus:outline-none" title="Show/Hide Password">
                <i id="eyeIconFirstLoginConfirm" class="fa-solid fa-eye"></i>
              </button>
            </div>
          </div>

          <div id="firstLoginPassError" class="hidden p-2.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-bold"></div>

          <button type="submit" class="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-lg">
            ${t('saveNewPasswordBtn')}
          </button>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  submitFirstLoginReset(e, workerId) {
    e.preventDefault();
    const pass1 = document.getElementById('firstLoginNewPass').value;
    const pass2 = document.getElementById('firstLoginConfirmPass').value;
    const errEl = document.getElementById('firstLoginPassError');

    if (pass1 !== pass2) {
      errEl.innerText = "❌ Passwords do not match. Please re-enter.";
      errEl.classList.remove('hidden');
      return;
    }

    window.appStore.completeFirstLoginPasswordChange(workerId, pass1);
    window.appController.closeModal();
    alert("✅ New password saved successfully! You are now logged in.");

    const worker = window.appStore.data.workers.find(w => w.id === workerId);
    const comp = window.appStore.data.companies.find(c => c.id === worker.companyId);

    window.appController.currentUser = {
      role: 'WORKER',
      companyId: worker.companyId,
      companyName: comp ? comp.name : "Company",
      workerId: worker.id,
      employeeCode: worker.workerId || worker.id,
      name: worker.fullName,
      mobile: worker.mobile,
      email: worker.email,
      isFirstLogin: false
    };

    window.appController.renderHeader();
    window.appController.renderSidebar();
    window.appController.navigate('worker-dashboard');
  },

  openForgotPasswordModal() {
    const modal = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');

    content.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-md mx-auto space-y-4 border border-slate-200 dark:border-slate-800">
        <div class="flex justify-between items-center border-b dark:border-slate-800 pb-3">
          <h3 class="text-xl font-extrabold text-slate-900 dark:text-white brand-font">Password Help & Reset</h3>
          <button onclick="appController.closeModal()" class="text-slate-400 font-bold text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          - <strong>Workers:</strong> Your Company Admin can generate or reset your password directly from the <strong>Worker Roster</strong>.<br><br>
          - <strong>Company Admins:</strong> If you forgot your password, contact platform support or register a new company account.
        </p>

        <div class="pt-2 flex justify-end">
          <button onclick="appController.closeModal()" class="px-5 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-bold">Understood</button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (icon) {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      }
    } else {
      input.type = 'password';
      if (icon) {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    }
  }
};

window.togglePasswordVisibility = function(inputId, iconId) {
  AuthModule.togglePasswordVisibility(inputId, iconId);
};

window.AuthModule = AuthModule;
