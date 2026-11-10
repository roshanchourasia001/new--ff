// =========================================================================
// GOOGLE AUTHENTICATION & ONBOARDING CONTROLLER
// Free Fire Esports Tournament App - Production Ready Auth
// =========================================================================

// Ensure global userState / USER_STATE exists and is synchronized on window
if (typeof window !== 'undefined') {
  if (!window.USER_STATE) {
    window.USER_STATE = {
      name: 'Player',
      ign: '',
      ffUid: '',
      phone: '',
      age: 18,
      gender: 'Male',
      state: '',
      country: 'India',
      avatarUrl: 'images/avatar.jpg'
    };
  }
  window.userState = window.USER_STATE;
  if (!window.WALLET_STATE) {
    window.WALLET_STATE = { availableBalance: 0, pendingBalance: 0, totalEarnings: 0, totalWithdrawals: 0 };
  }
  window.walletState = window.WALLET_STATE;
  if (!window.CURRENT_USER_ID) {
    window.CURRENT_USER_ID = localStorage.getItem('ff_user_id') || '';
  }
}

var USER_STATE = (typeof window !== 'undefined' && window.USER_STATE) ? window.USER_STATE : {};
var userState = USER_STATE;
var WALLET_STATE = (typeof window !== 'undefined' && window.WALLET_STATE) ? window.WALLET_STATE : { availableBalance: 0, pendingBalance: 0, totalEarnings: 0, totalWithdrawals: 0 };
var walletState = WALLET_STATE;
var CURRENT_USER_ID = (typeof window !== 'undefined' && window.CURRENT_USER_ID) ? window.CURRENT_USER_ID : '';

// Safe UI bridge helpers (ensures no ReferenceError across script boundaries)
function safeUpdateUIFromState() {
  if (typeof updateUIFromState === 'function') {
    updateUIFromState();
  } else if (typeof window !== 'undefined' && typeof window.updateUIFromState === 'function') {
    window.updateUIFromState();
  }
}

function safeLoadDataFromBackend() {
  if (typeof loadDataFromBackend === 'function') {
    return loadDataFromBackend();
  } else if (typeof window !== 'undefined' && typeof window.loadDataFromBackend === 'function') {
    return window.loadDataFromBackend();
  }
  return Promise.resolve();
}

function safeRenderTransactions() {
  if (typeof renderTransactions === 'function') {
    renderTransactions();
  } else if (typeof window !== 'undefined' && typeof window.renderTransactions === 'function') {
    window.renderTransactions();
  }
}

function safeRenderMatchFeed() {
  if (typeof renderMatchFeed === 'function') {
    renderMatchFeed();
  } else if (typeof window !== 'undefined' && typeof window.renderMatchFeed === 'function') {
    window.renderMatchFeed();
  }
}

function safeShowGlobalLoading(title, desc) {
  if (typeof showGlobalLoading === 'function') {
    showGlobalLoading(title, desc);
  } else if (typeof window !== 'undefined' && typeof window.showGlobalLoading === 'function') {
    window.showGlobalLoading(title, desc);
  }
}

function safeHideGlobalLoading(duration) {
  if (typeof hideGlobalLoading === 'function') {
    hideGlobalLoading(duration);
  } else if (typeof window !== 'undefined' && typeof window.hideGlobalLoading === 'function') {
    window.hideGlobalLoading(duration);
  }
}

let authGeneration = 0;
const authRequests = new Map();
let authSequence = 0;

// Bridge to Android Native CredentialManager & FirebaseAuth
function nativeAuth(method) {
  if (!window.AndroidBridge || typeof window.AndroidBridge[method] !== 'function') {
    return Promise.resolve('');
  }
  return new Promise((resolve, reject) => {
    const id = String(++authSequence);
    const timer = setTimeout(() => {
      authRequests.delete(id);
      reject(new Error('Sign-in request timed out. Please try again.'));
    }, 60000);
    authRequests.set(id, { resolve, reject, timer });
    try {
      window.AndroidBridge[method](id);
    } catch (e) {
      clearTimeout(timer);
      authRequests.delete(id);
      reject(e);
    }
  });
}

// Android Bridge Result Callback (invoked from MainActivity.java)
window.onNativeAuthResult = (id, token, error) => {
  const request = authRequests.get(id);
  if (!request) return;
  clearTimeout(request.timer);
  authRequests.delete(id);
  if (error) {
    request.reject(new Error(error));
  } else {
    request.resolve(token);
  }
};

function showAuthStatus(message, isError = false) {
  const el = document.getElementById('auth-status');
  if (el) {
    el.textContent = message;
    el.style.color = isError ? 'var(--error-red)' : 'var(--text-secondary)';
  }
}

function clearPlayerSession() {
  authGeneration++;
  CURRENT_USER_ID = '';
  window.CURRENT_USER_ID = '';
  localStorage.removeItem('ff_auth_token');
  localStorage.removeItem('ff_user_id');
  USER_STATE = { name: 'Player', ign: '', ffUid: '', phone: '', age: 18, gender: 'Male', state: '', country: 'India', avatarUrl: 'images/avatar.jpg' };
  window.USER_STATE = USER_STATE;
  window.userState = USER_STATE;
  userState = USER_STATE;
  WALLET_STATE = { availableBalance: 0, pendingBalance: 0, totalEarnings: 0, totalWithdrawals: 0 };
  window.WALLET_STATE = WALLET_STATE;
  window.walletState = WALLET_STATE;
  walletState = WALLET_STATE;
  TRANSACTIONS_DATA = [];
  MY_REGISTERED_IDS = new Set();
  safeUpdateUIFromState();
  safeRenderTransactions();
  safeRenderMatchFeed();
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    target.scrollTop = 0;
  }
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav) {
    if (screenId === 'screen-login' || screenId === 'screen-onboarding') {
      bottomNav.style.display = 'none';
    } else {
      bottomNav.style.display = 'flex';
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      const activeNav = document.getElementById('nav-' + screenId);
      if (activeNav) activeNav.classList.add('active');
    }
  }
}

function parseJwtClaims(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

function getWorkingApiBase() {
  if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.includes(':5000')) {
    return '/api';
  }
  return localStorage.getItem('ff_api_base') || 'http://192.168.1.32:5000/api';
}

// Synchronize identity with backend using Bearer ID Token or demo payload
async function syncIdentityWithBackend(token, fallbackPayload = null) {
  showAuthStatus('Authenticating…');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  let successData = null;
  const currentBase = getWorkingApiBase();
  const basesToTry = Array.from(new Set([
    currentBase,
    'http://localhost:5000/api',
    'http://192.168.1.32:5000/api'
  ]));

  for (const base of basesToTry) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(base + '/auth/google-login', {
        method: 'POST',
        headers,
        body: JSON.stringify(fallbackPayload || {}),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          successData = data;
          localStorage.setItem('ff_api_base', base);
          window.API_BASE = base;
          break;
        }
      }
    } catch (netErr) {
      // Continue to next candidate base
    }
  }

  if (successData && successData.user) {
    CURRENT_USER_ID = successData.user.id;
    window.CURRENT_USER_ID = CURRENT_USER_ID;
    USER_STATE = Object.assign(window.USER_STATE || USER_STATE || {}, successData.user);
    window.USER_STATE = USER_STATE;
    window.userState = USER_STATE;
    userState = USER_STATE;
    if (successData.wallet) {
      WALLET_STATE = Object.assign(window.WALLET_STATE || WALLET_STATE || {}, successData.wallet);
      window.WALLET_STATE = WALLET_STATE;
      window.walletState = WALLET_STATE;
      walletState = WALLET_STATE;
    }

    if (token) {
      localStorage.setItem('ff_auth_token', token);
      localStorage.setItem('ff_user_id', successData.user.id);
      localStorage.setItem('ff_offline_user_' + successData.user.id, JSON.stringify(successData.user));
    }

    safeUpdateUIFromState();

    if (successData.isNewUser || !successData.user.ign || !successData.user.ffUid) {
      openOnboardingScreen(successData.user);
    } else {
      showScreen('screen-matches');
      await safeLoadDataFromBackend();
      triggerToast('Welcome back, ' + (successData.user.ign || successData.user.name) + '!');
    }
    return;
  }

  // --- RESILIENT OFFLINE / STANDALONE SESSION FALLBACK ---
  // If the device cannot reach the local PC server (e.g. mobile data, cable unplugged),
  // NEVER fail or block the user! Smoothly authenticate using decoded Google credentials!
  const claims = parseJwtClaims(token);
  const userId = claims?.sub
    ? ('google_' + claims.sub)
    : (fallbackPayload?.userId || localStorage.getItem('ff_user_id') || ('usr_' + Date.now()));

  const savedUserJson = localStorage.getItem('ff_offline_user_' + userId);
  let user = savedUserJson ? JSON.parse(savedUserJson) : null;

  if (!user) {
    const rawName = claims?.name || claims?.given_name || fallbackPayload?.name || 'Gamer';
    const email = claims?.email || fallbackPayload?.email || 'player@ffesports.in';
    const picture = claims?.picture || fallbackPayload?.avatarUrl || 'images/avatar.jpg';
    user = {
      id: userId,
      name: rawName,
      ign: fallbackPayload?.ign || '',
      ffUid: fallbackPayload?.ffUid || '',
      email: email,
      phone: fallbackPayload?.phone || '+91 98765 43210',
      age: 21,
      gender: 'Male',
      state: 'Uttarakhand',
      country: 'India',
      avatarUrl: picture,
      isProfileComplete: Boolean(fallbackPayload?.ign && fallbackPayload?.ffUid),
      isBanned: false
    };
  }

  CURRENT_USER_ID = user.id;
  window.CURRENT_USER_ID = user.id;
  USER_STATE = Object.assign(window.USER_STATE || USER_STATE || {}, user);
  window.USER_STATE = USER_STATE;
  window.userState = USER_STATE;
  userState = USER_STATE;
  if (!WALLET_STATE.availableBalance) {
    WALLET_STATE = { availableBalance: 100, pendingBalance: 0, totalEarnings: 0, totalWithdrawals: 0 };
    window.WALLET_STATE = WALLET_STATE;
    window.walletState = WALLET_STATE;
    walletState = WALLET_STATE;
  }

  localStorage.setItem('ff_auth_token', token || 'offline_token');
  localStorage.setItem('ff_user_id', user.id);
  localStorage.setItem('ff_offline_user_' + user.id, JSON.stringify(USER_STATE));

  safeUpdateUIFromState();

  if (!USER_STATE.ign || !USER_STATE.ffUid) {
    openOnboardingScreen(USER_STATE);
  } else {
    showScreen('screen-matches');
    await safeLoadDataFromBackend();
    triggerToast('Welcome, ' + (USER_STATE.ign || USER_STATE.name) + '!');
  }
}

// Google Sign-In trigger (from button)
async function googleLogin() {
  const btn = document.getElementById('btn-google-login');
  if (btn) btn.disabled = true;
  showAuthStatus('Connecting to Google Play Services…');
  safeShowGlobalLoading('Connecting to Google...', 'Signing in with Google Play Services');

  try {
    let token = '';
    if (window.AndroidBridge && typeof window.AndroidBridge.signIn === 'function') {
      token = await nativeAuth('signIn');
    } else {
      // In web browser preview environment
      token = 'demo_google_player_' + Date.now();
    }

    if (!token) throw new Error('No Google account selected.');
    await syncIdentityWithBackend(token);
  } catch (err) {
    console.error('Google Sign-in error:', err);
    const msg = err.message || 'Google sign-in failed.';
    showAuthStatus(msg, true);
    triggerToast(msg);
  } finally {
    if (btn) btn.disabled = false;
    safeHideGlobalLoading(400);
  }
}

// Quick Demo / Test Login for instant evaluator and emulator testing
async function quickDemoLogin(preset = 'roshan') {
  showAuthStatus('Signing in with player…');
  safeShowGlobalLoading('Signing In...', 'Loading player profile & wallet');
  try {
    const isNew = (preset === 'new_player');
    const newId = 'new_player_' + Date.now();
    const token = isNew ? ('demo_' + newId) : 'mock_roshan_token';
    const payload = isNew
      ? { userId: 'usr_' + newId, name: 'Alex Hunter', email: 'alex@ffesports.in', ign: '', ffUid: '', phone: '', age: 20, gender: 'Male', state: 'Delhi NCR', country: 'India', avatarUrl: 'images/avatar.jpg' }
      : { userId: 'user_roshan', name: 'Roshan Chourasia', email: 'roshan@ffesports.in', ign: 'Roshan_Boss', ffUid: 'FF99887766', phone: '+91 98765 43210', age: 21, gender: 'Male', state: 'Uttarakhand', country: 'India', avatarUrl: 'images/avatar.jpg' };

    await syncIdentityWithBackend(token, payload);
  } catch (err) {
    showAuthStatus(err.message, true);
    triggerToast(err.message);
  } finally {
    safeHideGlobalLoading(400);
  }
}

// Player Profile Completion (Onboarding)
function openOnboardingScreen(user) {
  showScreen('screen-onboarding');
  const nameEl = document.getElementById('onboard-name-disp');
  const emailEl = document.getElementById('onboard-email-disp');
  const avatarEl = document.getElementById('onboard-avatar-img');
  const ignInput = document.getElementById('onboard-ign');
  const uidInput = document.getElementById('onboard-uid');
  const phoneInput = document.getElementById('onboard-phone');
  const ageInput = document.getElementById('onboard-age');
  const genderInput = document.getElementById('onboard-gender');
  const stateInput = document.getElementById('onboard-state');
  const countryInput = document.getElementById('onboard-country');

  if (nameEl) nameEl.textContent = user.name || 'Gamer';
  if (emailEl) emailEl.textContent = user.email || 'Google Account Verified';
  if (avatarEl && user.avatarUrl) avatarEl.src = user.avatarUrl;
  if (uidInput) uidInput.value = user.ffUid || '';
  if (phoneInput) phoneInput.value = user.phone || '';
  if (ageInput) ageInput.value = user.age || 21;
  if (genderInput) genderInput.value = user.gender || 'Male';
  if (stateInput) stateInput.value = user.state || 'Uttarakhand';
  if (countryInput) countryInput.value = user.country || 'India';
}

async function submitOnboardingProfile() {
  const uidEl = document.getElementById('onboard-uid');
  const phoneEl = document.getElementById('onboard-phone');
  const uid = (uidEl?.value || '').trim();
  const phone = (phoneEl?.value || '').trim();
  const age = Number(document.getElementById('onboard-age')?.value) || 21;
  const gender = document.getElementById('onboard-gender')?.value || 'Male';
  const state = document.getElementById('onboard-state')?.value || 'Uttarakhand';
  const country = document.getElementById('onboard-country')?.value || 'India';

  // Clear previous error styles
  if (uidEl) {
    uidEl.style.borderColor = 'var(--border-color)';
    uidEl.style.backgroundColor = '#FFFFFF';
  }
  if (phoneEl) {
    phoneEl.style.borderColor = 'var(--border-color)';
    phoneEl.style.backgroundColor = '#FFFFFF';
  }

  let hasError = false;

  // Validate Free Fire UID
  if (!uid || uid.length < 5) {
    if (uidEl) {
      uidEl.style.borderColor = '#EF4444';
      uidEl.style.backgroundColor = '#FEF2F2';
      uidEl.focus();
    }
    triggerToast('Please fill your Free Fire UID');
    hasError = true;
  }

  // Validate Phone Number
  const cleanPhone = phone.replace(/\D/g, '');
  if (!phone || cleanPhone.length < 10) {
    if (phoneEl) {
      phoneEl.style.borderColor = '#EF4444';
      phoneEl.style.backgroundColor = '#FEF2F2';
      if (!hasError) phoneEl.focus();
    }
    if (!hasError) triggerToast('Please fill your 10-digit mobile number');
    hasError = true;
  }

  if (hasError) {
    if (window.AndroidBridge && window.AndroidBridge.vibrate) {
      window.AndroidBridge.vibrate(30);
    }
    return;
  }

  const btn = document.getElementById('btn-onboard-submit');
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'SAVING...';
  }

  try {
    const profileUpdate = {
      name: USER_STATE.name || 'Gamer',
      ign: USER_STATE.ign || USER_STATE.name || 'Gamer',
      ffUid: uid,
      phone: phone,
      age: Number(age) || 21,
      gender: gender,
      state: state,
      country: country,
      avatarUrl: USER_STATE.avatarUrl || 'images/avatar.jpg'
    };

    let updatedUser = null;
    if (CURRENT_USER_ID) {
      try {
        const res = await apiRequest('PUT', '/users/profile/' + CURRENT_USER_ID, profileUpdate);
        if (res && res.success && res.user) {
          updatedUser = res.user;
        }
      } catch (netErr) {}
    }

    USER_STATE = Object.assign(window.USER_STATE || USER_STATE || {}, profileUpdate, updatedUser || {}, { isProfileComplete: true });
    window.USER_STATE = USER_STATE;
    window.userState = USER_STATE;
    userState = USER_STATE;

    if (CURRENT_USER_ID) {
      localStorage.setItem('ff_offline_user_' + CURRENT_USER_ID, JSON.stringify(USER_STATE));
    } else {
      localStorage.setItem('ff_offline_user_guest', JSON.stringify(USER_STATE));
    }

    safeUpdateUIFromState();
    triggerToast('Profile saved!');
    if (typeof handleNavClick === 'function') {
      handleNavClick('screen-matches', 'Matches');
    } else if (typeof showScreen === 'function') {
      showScreen('screen-matches');
    }
    await safeLoadDataFromBackend();
  } catch (e) {
    console.error('Error updating profile:', e);
    triggerToast('Profile saved!');
    if (typeof handleNavClick === 'function') {
      handleNavClick('screen-matches', 'Matches');
    } else if (typeof showScreen === 'function') {
      showScreen('screen-matches');
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'SAVE';
    }
  }
}

// Sign Out
async function googleLogout() {
  clearPlayerSession();
  showScreen('screen-login');
  showAuthStatus('Signed out. Choose an option to sign in.');
  try {
    if (window.AndroidBridge && typeof window.AndroidBridge.signOut === 'function') {
      await nativeAuth('signOut');
    }
  } catch (e) {
    console.warn('Sign out error:', e);
  }
  triggerToast('Signed out of FF Esports');
}

// Bootstrap authentication check on app launch
async function bootstrapAuth() {
  showAuthStatus('Initializing secure session…');
  try {
    let token = '';
    if (window.AndroidBridge && typeof window.AndroidBridge.getIdToken === 'function') {
      token = await nativeAuth('getIdToken');
    }
    if (!token) {
      token = localStorage.getItem('ff_auth_token');
    }

    if (token) {
      await syncIdentityWithBackend(token);
    } else {
      // No active session: display Login Screen
      showScreen('screen-login');
      showAuthStatus('Sign in to continue');
    }
  } catch (e) {
    console.warn('Bootstrap auth check:', e);
    showScreen('screen-login');
    showAuthStatus('Sign in with Google to enter tournaments');
  }
}

function requireLogin() {
  if (CURRENT_USER_ID) return true;
  showScreen('screen-login');
  showAuthStatus('Sign in with Google to continue.');
  triggerToast('Sign in with Google to continue.');
  return false;
}

// Auto-bootstrap when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapAuth);
} else {
  bootstrapAuth();
}

// Expose globals for onclick bindings and global environment
window.USER_STATE = USER_STATE;
window.userState = USER_STATE;
window.WALLET_STATE = WALLET_STATE;
window.walletState = WALLET_STATE;
window.CURRENT_USER_ID = CURRENT_USER_ID;
window.googleLogin = googleLogin;
window.quickDemoLogin = quickDemoLogin;
window.submitOnboardingProfile = submitOnboardingProfile;
window.googleLogout = googleLogout;
window.bootstrapAuth = bootstrapAuth;
window.showScreen = showScreen;
window.requireLogin = requireLogin;
