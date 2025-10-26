console.log('!!! app.js loaded at', new Date().toISOString());

// Application State
let appState = {
  step1: { sid: null, auth: null, completed: false },
  step2: { sid: null, auth: null, completed: false },
  currentStep: 1,
  lastActivity: null
};

// API Configuration
const API_CONFIG = {
  endpoints: {
    login: '/api/tradeApiLogin',
    validate: '/api/tradeApiValidate',
    placeOrder: '/api/placeOrder'
  }
};

// DOM Elements
const elements = {
  currentStepSpan: document.getElementById('currentStep'),
  sessionStatus: document.getElementById('sessionStatus'),
  statusText: document.getElementById('statusText'),
  totpForm: document.getElementById('totpForm'),
  totpInput: document.getElementById('totpInput'),
  loginBtn: document.getElementById('loginBtn'),
  step1Message: document.getElementById('step1Message'),
  step1Status: document.getElementById('step1Status'),
  step1Section: document.getElementById('step1Section'),
  step2Section: document.getElementById('step2Section'),
  step2Loader: document.getElementById('step2Loader'),
  step2Message: document.getElementById('step2Message'),
  step2Status: document.getElementById('step2Status'),
  step3Section: document.getElementById('step3Section'),
  orderForm: document.getElementById('orderForm'),
  placeOrderBtn: document.getElementById('placeOrderBtn'),
  step3Message: document.getElementById('step3Message'),
  step3Status: document.getElementById('step3Status'),
  apiStatus: document.getElementById('apiStatus'),
  lastActivity: document.getElementById('lastActivity'),
  resetSection: document.getElementById('resetSection'),
  resetBtn: document.getElementById('resetBtn')
};

function updateLastActivity() {
  const now = new Date();
  elements.lastActivity.textContent = now.toLocaleTimeString();
  console.log('[LOG] Last activity updated:', now.toLocaleTimeString());
}

function showMessage(element, message, type) {
  element.innerHTML = `<div class="message ${type}">${message}</div>`;
  console.log(`[LOG] Message on ${element.id}:`, message);
}

function hideMessage(element) {
  element.innerHTML = '';
}

function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.innerHTML = '<span class="loader"></span><span>Loading...</span>';
  } else {
    button.disabled = false;
    button.innerHTML = '<span>Submit</span>';
  }
}

function updateSessionStatus(isConnected) {
  if (isConnected) {
    elements.sessionStatus.className = 'status-badge connected';
    elements.statusText.textContent = 'Connected';
  } else {
    elements.sessionStatus.className = 'status-badge disconnected';
    elements.statusText.textContent = 'Disconnected';
  }
  console.log('[LOG] Session status updated:', isConnected ? 'Connected' : 'Disconnected');
}

function updateStepIndicator(step) {
  elements.currentStepSpan.textContent = step;
  appState.currentStep = step;
  console.log('[LOG] Step indicator updated to:', step);
}

function enableSection(section) {
  section.classList.remove('disabled');
  console.log('[LOG] Enabled section:', section.id);
}

function disableSection(section) {
  section.classList.add('disabled');
  console.log('[LOG] Disabled section:', section.id);
}

// Step 1: tradeApiLogin
async function step1Login(totp) {
  try {
    elements.apiStatus.textContent = 'Authenticating...';
    updateLastActivity();
    console.log('[LOG] Starting step1Login with TOTP:', totp);

    const response = await fetch(API_CONFIG.endpoints.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totp })
    });

    const data = await response.json();
    console.log('[LOG] step1Login response data:', data);

    if (!response.ok) throw new Error(data.error || data.message);

    // Store sid and token in state
    appState.step1.sid = data.data.sid;
    appState.step1.auth = data.data.token;
    appState.step1.completed = true;
    console.log('[LOG] Captured sid:', appState.step1.sid);
    console.log('[LOG] Captured token:', appState.step1.auth);

    elements.apiStatus.textContent = 'Login Successful';
    return { success: true, data };
  } catch (err) {
    console.error('[ERROR] step1Login failed:', err);
    return { success: false, error: err.message };
  }
}

// Step 2: tradeApiValidate (sends x-sid/x-auth)
async function step2Validate() {
  console.log('[LOG] step2Validate called');
  console.log('[LOG] Will send x-sid:', appState.step1.sid);
  console.log('[LOG] Will send x-auth:', appState.step1.auth);

  try {
    elements.apiStatus.textContent = 'Validating session...';
    updateLastActivity();

    const response = await fetch(API_CONFIG.endpoints.validate, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sid': appState.step1.sid,
        'x-auth': appState.step1.auth
      },
      body: JSON.stringify({
        mpin: '190990'
      })
    });

    const data = await response.json();
    console.log('[LOG] step2Validate response data:', data);

    if (!response.ok) throw new Error(data.error || 'Validation failed');

    appState.step2.sid = data.sid;
    appState.step2.auth = data.Auth;
    appState.step2.completed = true;

    elements.apiStatus.textContent = 'Validated';
    updateSessionStatus(true);
    return { success: true, data };
  } catch (err) {
    console.error('[ERROR] step2Validate failed:', err);
    elements.apiStatus.textContent = 'Error';
    return { success: false, error: err.message };
  }
}

// Step 3: Place Order also using x-sid/x-auth
async function step3PlaceOrder(orderData) {
  try {
    elements.apiStatus.textContent = 'Placing order...';
    updateLastActivity();
    console.log('[LOG] Starting step3PlaceOrder with:', orderData);

    const response = await
