// Salary Slip (Payslip) Generation & Professional Corporate A4 PDF Printing Module
const PayslipRenderer = {
  /**
   * Generates corporate-grade A4 payslip HTML content for modal display or printing
   */
  renderPayslip(salaryData, company, worker) {
    if (!worker || !company) {
      return `<div class="p-6 text-center text-rose-600 font-bold">Error: Worker or Company data missing.</div>`;
    }

    const t = (k) => window.i18n.t(k);
    const lang = (window.i18n && window.i18n.currentLang) || 'hi';
    const isHi = lang === 'hi';

    const b = window.appStore.getCompanyBranding(company.id) || {};
    
    // Fallback to company object fields if branding details not set
    const logoUrl = b.logoUrl || null;
    const stampUrl = b.stampUrl || null;
    const compName = b.name || company.name || "COMPANY NAME";
    const legalName = b.legalName || company.name || compName;
    const address = b.address || company.address || "Registered Business Address";
    const mobile = b.mobile || company.mobile || "N/A";
    const email = b.email || company.email || "N/A";
    const gstin = b.gstin || company.gstin || "";
    const website = b.website || company.website || "";

    const payslipNo = `PAY-${salaryData.monthYear.replace(/[^0-9]/g, '')}-${worker.workerId || worker.id}`;
    const issueDate = new Date().toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // Number to Words converter helper
    const netSalaryInWords = this.numberToWords(salaryData.netSalary, isHi);

    return `
      <div id="payslipPrintArea" class="bg-white p-4 sm:p-6 rounded-2xl border border-slate-300 shadow-2xl max-w-4xl mx-auto text-slate-900 font-sans leading-snug">
        
        <!-- TOP BRANDING & LETTERHEAD HEADER -->
        <div class="border-b-2 border-slate-900 pb-3 mb-4">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            
            <!-- LEFT: COMPANY LOGO & NAME -->
            <div class="flex items-center gap-3">
              ${logoUrl ? `
                <div class="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <img src="${logoUrl}" alt="Company Logo" class="max-h-full max-w-full object-contain">
                </div>
              ` : `
                <div class="w-12 h-12 bg-amber-500 text-slate-950 font-black text-xl rounded-2xl flex items-center justify-center border-2 border-slate-900 shadow-md flex-shrink-0">
                  <i class="fa-solid fa-building"></i>
                </div>
              `}
              
              <div>
                <h1 class="text-xl sm:text-2xl font-black text-slate-950 tracking-wide uppercase brand-font leading-none">
                  ${compName}
                </h1>
                <p class="text-[11px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">${legalName}</p>
                <p class="text-[10px] text-slate-500 font-semibold mt-0.5 max-w-md">${address}</p>
                <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-600 font-medium mt-0.5">
                  <span><b>${isHi ? 'फ़ोन' : 'Tel'}:</b> ${mobile}</span>
                  <span><b>${isHi ? 'ईमेल' : 'Email'}:</b> ${email}</span>
                  ${gstin ? `<span class="font-mono"><b>GSTIN:</b> ${gstin}</span>` : ''}
                  ${website ? `<span><b>Web:</b> ${website}</span>` : ''}
                </div>
              </div>
            </div>

            <!-- RIGHT: DOCUMENT TITLE BADGE -->
            <div class="text-left sm:text-right bg-slate-900 text-white p-3 rounded-xl shadow-md min-w-[180px]">
              <span class="text-[9px] uppercase font-black tracking-widest text-amber-400 block">${isHi ? 'आधिकारिक वेतन पर्ची (PAYSLIP)' : 'OFFICIAL PAYSLIP'}</span>
              <span class="text-base font-black text-white block mt-0.5">${salaryData.monthYear}</span>
              <div class="mt-0.5 border-t border-slate-700 pt-0.5 text-[9px] text-slate-300 font-mono space-y-0.5">
                <div>${isHi ? 'पर्ची संख्या' : 'SLIP NO'}: <b>${payslipNo}</b></div>
                <div>${isHi ? 'जारी तिथि' : 'ISSUE DATE'}: <b>${issueDate}</b></div>
              </div>
            </div>

          </div>
        </div>

        <!-- WORKER EMPLOYMENT & PAYMENT INFORMATION GRID -->
        <div class="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <span class="text-[9px] font-extrabold uppercase text-slate-500 block mb-0.5">${isHi ? 'कर्मचारी का नाम' : 'Employee Name'}</span>
            <span class="font-black text-slate-950 text-xs block">${worker.fullName}</span>
            <span class="text-slate-600 font-medium text-[11px]">${worker.jobRole || (isHi ? 'कर्मचारी' : 'Worker')} (${worker.department || (isHi ? 'सामान्य' : 'General')})</span>
          </div>

          <div>
            <span class="text-[9px] font-extrabold uppercase text-slate-500 block mb-0.5">${isHi ? 'एम्प्लॉई ID एवं मोबाइल' : 'Employee ID & Contact'}</span>
            <span class="font-mono font-extrabold text-slate-900 block text-xs">${salaryData.employeeCode}</span>
            <span class="text-slate-600 font-medium text-[11px]">${isHi ? 'मोबाइल' : 'Mob'}: ${worker.mobile}</span>
          </div>

          <div>
            <span class="text-[9px] font-extrabold uppercase text-slate-500 block mb-0.5">${isHi ? 'दिहाड़ी एवं OT दर' : 'Pay Rates'}</span>
            <span class="font-bold text-slate-900 block text-[11px]">${isHi ? 'दैनिक दिहाड़ी' : 'Daily Wage'}: ₹${salaryData.dailyWage}/day</span>
            <span class="text-slate-600 font-medium text-[10px]">${isHi ? 'ओवरटाइम दर' : 'OT Rate'}: ₹${salaryData.otRatePerHour}/hr</span>
          </div>

          <div>
            <span class="text-[9px] font-extrabold uppercase text-slate-500 block mb-0.5">${isHi ? 'भुगतान स्थिति' : 'Payment Status'}</span>
            <span class="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px] border border-emerald-300 uppercase mt-0.5">${isHi ? 'सत्यापित एवं स्वीकृत' : 'GENERATED & VERIFIED'}</span>
            <span class="text-slate-500 text-[9px] block mt-0.5">${isHi ? 'माध्यम: बैंक / नकद' : 'Mode: Bank / Cash'}</span>
          </div>
        </div>

        <!-- ATTENDANCE & WORKING DAYS SUMMARY ROW -->
        <div class="mb-4 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div class="bg-slate-900 px-3 py-1.5 text-white text-[11px] font-extrabold tracking-wider uppercase flex justify-between items-center">
            <span><i class="fa-solid fa-calendar-check text-amber-400 mr-1.5"></i> ${isHi ? 'मासिक हाजिरी विवरण' : 'Attendance Breakdown'}</span>
            <span class="font-mono text-[10px] text-amber-300">${isHi ? 'कुल कैलेंडर दिन' : 'Total Calendar Days'}: ${salaryData.totalMonthDays} ${isHi ? 'दिन' : 'Days'}</span>
          </div>
          
          <div class="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-200 text-center bg-white text-xs">
            <div class="p-2 bg-emerald-50/50">
              <span class="text-[9px] font-bold text-emerald-800 uppercase block">${t('fullDay')}</span>
              <span class="text-lg font-black text-emerald-700 block">${salaryData.fullDaysCount}</span>
              <span class="text-[9px] text-slate-500">₹${salaryData.dailyWage}/day</span>
            </div>

            <div class="p-2 bg-blue-50/50">
              <span class="text-[9px] font-bold text-blue-800 uppercase block">${t('halfDay')}</span>
              <span class="text-lg font-black text-blue-700 block">${salaryData.halfDaysCount}</span>
              <span class="text-[9px] text-slate-500">₹${salaryData.halfDayWage}/half-day</span>
            </div>

            <div class="p-2 bg-indigo-50/50">
              <span class="text-[9px] font-bold text-indigo-800 uppercase block">${isHi ? 'कंपनी अवकाश' : 'Co. Holidays'}</span>
              <span class="text-lg font-black text-indigo-700 block">${salaryData.companyFixedHolidays}</span>
              <span class="text-[9px] text-indigo-600 font-semibold">${isHi ? 'सवेतन' : 'PAID'}</span>
            </div>

            <div class="p-2 bg-rose-50/50">
              <span class="text-[9px] font-bold text-rose-800 uppercase block">${t('absent')}</span>
              <span class="text-lg font-black text-rose-700 block">${salaryData.absentDaysCount}</span>
              <span class="text-[9px] text-rose-600 font-semibold">${isHi ? 'बिना वेतन' : 'No Pay'}</span>
            </div>

            <div class="p-2 bg-amber-100/70 font-black">
              <span class="text-[9px] font-bold text-amber-900 uppercase block">${t('payableDays')}</span>
              <span class="text-lg font-black text-amber-950 block">${salaryData.payableDays}</span>
              <span class="text-[9px] text-amber-800">${isHi ? 'कुल कार्य इकाइयां' : 'Final Working Units'}</span>
            </div>
          </div>
        </div>

        <!-- EARNINGS vs DEDUCTIONS TABLE -->
        <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          
          <!-- LEFT: EARNINGS COLUMN -->
          <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div class="bg-emerald-700 px-3 py-1.5 text-white text-[11px] font-black tracking-wider uppercase flex justify-between">
              <span>${t('earningsHeading')}</span>
              <span>${isHi ? 'राशि (₹)' : 'AMOUNT (₹)'}</span>
            </div>
            <table class="w-full text-[11px] text-left divide-y divide-slate-100">
              <tbody>
                <tr class="hover:bg-slate-50">
                  <td class="p-2 font-medium text-slate-800">${isHi ? 'पूरा दिन वेतन' : 'Basic Full Days Pay'} (${salaryData.fullDaysCount} × ₹${salaryData.dailyWage})</td>
                  <td class="p-2 text-right font-bold text-slate-900">₹${salaryData.fullDaySalary.toLocaleString('en-IN')}</td>
                </tr>
                <tr class="hover:bg-slate-50">
                  <td class="p-2 font-medium text-slate-800">${isHi ? 'आधा दिन वेतन' : 'Half Days Pay'} (${salaryData.halfDaysCount} × ₹${salaryData.halfDayWage})</td>
                  <td class="p-2 text-right font-bold text-slate-900">₹${salaryData.halfDaySalary.toLocaleString('en-IN')}</td>
                </tr>
                <tr class="hover:bg-slate-50">
                  <td class="p-2 font-medium text-slate-800">${isHi ? 'कंपनी अवकाश वेतन' : 'Paid Holidays'} (${salaryData.companyFixedHolidays} × ₹${salaryData.dailyWage})</td>
                  <td class="p-2 text-right font-bold text-slate-900">₹${(salaryData.companyFixedHolidays * salaryData.dailyWage).toLocaleString('en-IN')}</td>
                </tr>
                ${salaryData.totalOtPay > 0 ? `
                <tr class="bg-blue-50/70 hover:bg-blue-50">
                  <td class="p-2 font-bold text-blue-900">${isHi ? 'ओवरटाइम भुगतान' : 'Overtime Pay'} (${salaryData.totalOtHoursMonth} hrs × ₹${salaryData.otRatePerHour}/hr)</td>
                  <td class="p-2 text-right font-black text-blue-900">+ ₹${salaryData.totalOtPay.toLocaleString('en-IN')}</td>
                </tr>
                ` : ''}
              </tbody>
              <tfoot>
                <tr class="bg-slate-100 font-extrabold text-slate-900 border-t border-slate-300">
                  <td class="p-2">${isHi ? 'कुल सकल वेतन (GROSS)' : 'TOTAL GROSS EARNINGS'}</td>
                  <td class="p-2 text-right text-xs text-emerald-800">₹${salaryData.totalGrossSalary.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- RIGHT: DEDUCTIONS COLUMN -->
          <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div class="bg-rose-700 px-3 py-1.5 text-white text-[11px] font-black tracking-wider uppercase flex justify-between">
              <span>${t('deductionsHeading')}</span>
              <span>${isHi ? 'राशि (₹)' : 'AMOUNT (₹)'}</span>
            </div>
            <table class="w-full text-[11px] text-left divide-y divide-slate-100">
              <tbody>
                <tr class="hover:bg-slate-50">
                  <td class="p-2 font-medium text-slate-800">${t('advanceDeducted')}</td>
                  <td class="p-2 text-right font-bold text-rose-700">₹${salaryData.totalAdvancesDeducted.toLocaleString('en-IN')}</td>
                </tr>
                <tr class="hover:bg-slate-50">
                  <td class="p-2 font-medium text-slate-400">${isHi ? 'अनुपस्थित कटौती (स्व-समायोजित)' : 'Absent Days Deductions'}</td>
                  <td class="p-2 text-right font-bold text-slate-400">₹0</td>
                </tr>
                <tr class="hover:bg-slate-50">
                  <td class="p-2 font-medium text-slate-400">${isHi ? 'PF / ESIC (यदि लागू हो)' : 'PF / ESIC (If applicable)'}</td>
                  <td class="p-2 text-right font-bold text-slate-400">₹0</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-slate-100 font-extrabold text-slate-900 border-t border-slate-300">
                  <td class="p-2">${isHi ? 'कुल कटौती (DEDUCTIONS)' : 'TOTAL DEDUCTIONS'}</td>
                  <td class="p-2 text-right text-xs text-rose-700">₹${salaryData.totalAdvancesDeducted.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>

        <!-- NET SALARY HIGHLIGHT CARD IN NUMBERS & WORDS -->
        <div class="mb-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 p-4 rounded-xl text-slate-950 border-2 border-amber-500 shadow-md flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-900 block">${t('netSalaryPayable')}</span>
            <span class="text-[11px] font-extrabold text-slate-800 block mt-0.5">${isHi ? 'शब्दों में' : 'In Words'}: <i class="capitalize font-serif">"${isHi ? 'रुपये ' + netSalaryInWords + ' मात्र' : 'Rupees ' + netSalaryInWords + ' Only'}"</i></span>
          </div>
          <div class="text-right flex-shrink-0">
            <span class="text-2xl sm:text-3xl font-black text-slate-950 brand-font tracking-wider">₹${salaryData.netSalary.toLocaleString('en-IN')}/-</span>
          </div>
        </div>

        <!-- FORMULA EXPLANATION BADGE -->
        <div class="mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600 flex items-center gap-2">
          <i class="fa-solid fa-circle-check text-emerald-600 text-xs"></i>
          <span><b>${isHi ? 'वेतन गणना सूत्र' : 'Payroll Formula'}:</b> ${salaryData.formulaExplanation}</span>
        </div>

        <!-- STAMP & AUTHORIZED SIGNATURES -->
        <div class="pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-6 items-end">
          
          <!-- WORKER SIGNATURE -->
          <div class="text-center space-y-0.5">
            <div class="h-12 border-b border-dashed border-slate-400 flex items-end justify-center pb-0.5">
              <span class="font-semibold text-slate-800 italic text-[11px]">${worker.fullName}</span>
            </div>
            <p class="text-[11px] font-bold text-slate-700 uppercase">${t('workerSignature')}</p>
            <p class="text-[9px] text-slate-400">${isHi ? 'तिथि' : 'Date'}: _______________</p>
          </div>

          <!-- COMPANY STAMP / SEAL & AUTHORIZED SIGNATORY -->
          <div class="text-center space-y-0.5 relative">
            ${stampUrl ? `
              <div class="absolute -top-10 left-1/2 transform -translate-x-1/2 w-20 h-20 pointer-events-none opacity-90">
                <img src="${stampUrl}" alt="Company Stamp" class="w-full h-full object-contain">
              </div>
            ` : ''}
            <div class="h-12 border-b border-dashed border-slate-400 flex items-end justify-center pb-0.5">
              <span class="font-extrabold text-slate-900 uppercase brand-font text-sm tracking-wider">${company.ownerName || compName}</span>
            </div>
            <p class="text-[11px] font-bold text-slate-900 uppercase">${t('contractorStampSignature')}</p>
            <p class="text-[9px] text-slate-500">${legalName}</p>
          </div>

        </div>

        <!-- ACTION BUTTONS (NO-PRINT) -->
        <div class="no-print pt-4 mt-4 border-t border-slate-200 flex flex-wrap justify-end gap-3">
          <button onclick="appController.closeModal()" class="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-extrabold rounded-xl text-xs transition">
            ${t('close')}
          </button>
          <button onclick="PayslipRenderer.triggerPrint()" class="btn-3d-amber px-6 py-2.5 text-slate-950 font-black rounded-xl text-xs shadow-lg flex items-center gap-2">
            <i class="fa-solid fa-file-pdf text-sm"></i> ${isHi ? 'Print / Save PDF' : 'Print / Save PDF'}
          </button>
        </div>

      </div>
    `;
  },

  triggerPrint() {
    window.print();
  },

  // Helper method to convert numbers to Indian currency words
  numberToWords(num, isHi = false) {
    if (!num || num === 0) return isHi ? 'शून्य' : 'Zero';
    
    const aEn = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const bEn = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    const aHi = ['', 'एक ', 'दो ', 'तीन ', 'चार ', 'पांच ', 'छह ', 'सात ', 'आठ ', 'नौ ', 'दस ', 'ग्यारह ', 'बारह ', 'तेरह ', 'चौदह ', 'पंद्रह ', 'सोलह ', 'सत्रह ', 'अठारह ', 'उन्नीस '];
    const bHi = ['', '', 'बीस', 'तीस', 'चालिस', 'पचास', 'साठ', 'सत्तर', 'अस्सी', 'नब्बे'];

    const a = isHi ? aHi : aEn;
    const b = isHi ? bHi : bEn;

    const inWords = (n) => {
      if ((n = n.toString()).length > 9) return 'overflow';
      let n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n_array) return ''; 
      let str = '';
      str += (n_array[1] != 0) ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + (isHi ? 'करोड़ ' : 'crore ') : '';
      str += (n_array[2] != 0) ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + (isHi ? 'लाख ' : 'lakh ') : '';
      str += (n_array[3] != 0) ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + (isHi ? 'हज़ार ' : 'thousand ') : '';
      str += (n_array[4] != 0) ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + (isHi ? 'सौ ' : 'hundred ') : '';
      str += (n_array[5] != 0) ? ((str != '') ? (isHi ? '' : 'and ') : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';
      return str;
    };

    return inWords(num).trim();
  }
};

window.PayslipRenderer = PayslipRenderer;
