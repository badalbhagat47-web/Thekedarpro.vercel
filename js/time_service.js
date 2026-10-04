// Server-Authoritative Time Service (Asia/Kolkata IST / UTC)
const TimeService = {
  serverOffsetMs: 0,
  lastSyncedServerTime: null,
  isSynced: false,

  async syncWithServer() {
    try {
      const startMs = Date.now();
      const response = await fetch('/api/time');
      const data = await response.json();
      if (data && data.success && data.timestamp_ms) {
        const networkLatency = (Date.now() - startMs) / 2;
        const serverTimeMs = data.timestamp_ms + networkLatency;
        this.serverOffsetMs = serverTimeMs - Date.now();
        this.lastSyncedServerTime = data;
        this.isSynced = true;
        console.log(`[TimeService] Synced with server IST time. Offset: ${this.serverOffsetMs}ms. Date: ${data.date_ist} ${data.time_ist}`);
      }
    } catch (err) {
      console.warn(`[TimeService] Server time sync warning. Operating with local clock offset fallback:`, err);
    }
  },

  /**
   * Returns Date object synchronized to server time (IST offset adjusted)
   */
  getNow() {
    const serverNowMs = Date.now() + this.serverOffsetMs;
    return new Date(serverNowMs);
  },

  /**
   * Returns server IST date string "YYYY-MM-DD"
   */
  getTodayStr() {
    const now = this.getNow();
    // Convert to IST offset string (+05:30)
    const istDate = new Date(now.getTime() + (330 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
    return istDate.toISOString().substring(0, 10);
  },

  /**
   * Returns server IST time string "HH:MM"
   */
  getCurrentTimeStr() {
    const now = this.getNow();
    const istDate = new Date(now.getTime() + (330 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
    const hours = String(istDate.getHours()).padStart(2, '0');
    const minutes = String(istDate.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  /**
   * Returns server IST time with seconds "HH:MM:SS"
   */
  getCurrentTimeWithSecondsStr() {
    const now = this.getNow();
    const istDate = new Date(now.getTime() + (330 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
    return istDate.toTimeString().split(' ')[0];
  },

  /**
   * Returns server IST year-month string "YYYY-MM"
   */
  getCurrentYearMonth() {
    return this.getTodayStr().substring(0, 7);
  },

  /**
   * Calculate difference in days between two ISO date strings "YYYY-MM-DD"
   */
  getDaysDiff(targetDateStr, baseDateStr = this.getTodayStr()) {
    const d1 = new Date(baseDateStr + 'T00:00:00Z');
    const d2 = new Date(targetDateStr + 'T00:00:00Z');
    const diffTime = d2.getTime() - d1.getTime();
    return Math.round(diffTime / (1000 * 3600 * 24));
  },

  /**
   * Formats a 24-hour time string "HH:MM" or "HH:MM:SS" into clean 12-hour AM/PM string "hh:MM AM/PM"
   */
  format12Hour(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return '09:00 AM';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].substring(0, 2);
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour becomes 12
    const strHours = String(hours).padStart(2, '0');
    return `${strHours}:${minutes} ${ampm}`;
  },

  /**
   * Converts "HH:MM" 24h or 12h time string to minutes from 00:00
   */
  timeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    let isPM = false;
    let isAM = false;
    let cleanStr = timeStr.trim().toUpperCase();
    if (cleanStr.includes('PM')) { isPM = true; cleanStr = cleanStr.replace('PM', '').trim(); }
    if (cleanStr.includes('AM')) { isAM = true; cleanStr = cleanStr.replace('AM', '').trim(); }
    
    const parts = cleanStr.split(':');
    if (parts.length < 2) return 0;
    let hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return hours * 60 + minutes;
  },

  /**
   * Returns difference in minutes between time2 and time1 (time2 - time1)
   */
  getMinutesDiff(timeStr1, timeStr2) {
    return this.timeToMinutes(timeStr2) - this.timeToMinutes(timeStr1);
  },

  /**
   * Returns true if currentTimeStr is equal to or past targetTimeStr
   */
  isTimePast(targetTimeStr, currentTimeStr = this.getCurrentTimeStr()) {
    return this.timeToMinutes(currentTimeStr) >= this.timeToMinutes(targetTimeStr);
  }
};

// Initial sync on script load
TimeService.syncWithServer();
// Periodic sync every 60 seconds
setInterval(() => TimeService.syncWithServer(), 60000);

window.TimeService = TimeService;
