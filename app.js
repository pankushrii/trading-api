// Application State
let appState = {
  step1: { sid: null, auth: null, completed: false },
  step2: { sid: null, auth: null, completed: false },
  currentStep: 1,
  lastActivity: null
};

// API Configuration (Vercel Proxy)
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

// Utility Functions
function updateLastActivity() {
  const now = new Date();
  elements.lastActivity.textContent = now.toLocaleTimeString();
}

function showMessage(element, message, type) {
  element.innerHTML = `<div class="message ${type}">${message}</div>`;
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

function updateSessionStatus(connected) {
  if (connected) {
    elements.sessionStatus.className = 'status-badge connected';
    elements.statusText.textContent = 'Connected';
  } else {
    elements.sessionStatus.className = 'status-badge disconnected';
    elements.statusText.textContent = 'Disconnected';
  }
}

function updateStepIndicator(step) {
  elements.currentStepSpan.textContent = step;
  appState.currentStep = step;
}

function enableSection(section) {
  section.classList.remove('disabled');
}

function disableSection(section) {
  section.classList.add('disabled');
}

// Step 1: tradeApiLogin
async function step1Login(totp) {
  try {
    elements.apiStatus.textContent = 'Authenticating...';
    updateLastActivity();

    const response = await fetch(API_CONFIG.endpoints.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totp })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || data.message);

    // ✅ Extract sid and token from nested response
    appState.step1.sid = data.data.sid;
    appState.step1.auth = data.data.token;  // ✅ Use consistent 'auth' naming
    appState.step1.completed = true;

    elements.apiStatus.textContent = 'Login Successful';
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Step 2: tradeApiValidate
async function step2Validate() {
  console.log('step2Validate called');  // <-- New log at start
  console.log('Sending validation headers:', {
    sid: appState.step1.sid,
    Auth: appState.step1.auth,
  });
  try {
    elements.apiStatus.textContent = 'Validating session...';
    updateLastActivity();

    console.log('Sending validation headers:', {
  sid: appState.step1.sid,
  Auth: appState.step1.auth,
});

    const response = await fetch(API_CONFIG.endpoints.validate, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'sid': appState.step1.sid,       // Must be included in headers
        'Auth': appState.step1.auth,
        'Pnakaj':'Choudhary'// Must be included in headers (case sensitive)
      },
      body: JSON.stringify({
        mpin: '190990'  // or any required body param for validation
      })
    });

    const data = await response.json();

    
    console.log('[LOG] Validation response:', data);

    if (!response.ok) throw new Error(data.error || 'Validation failed');

    appState.step2.sid = data.sid;
    appState.step2.auth = data.Auth;
    appState.step2.completed = true;

    elements.apiStatus.textContent = 'Validated';
    updateSessionStatus(true);
    return { success: true, data };
  } catch (err) {
    elements.apiStatus.textContent = 'Error';
    return { success: false, error: err.message };
  }
}

// Step 3: Place Order
async function step3PlaceOrder(orderData) {
  try {
    elements.apiStatus.textContent = 'Placing order...';
    updateLastActivity();

    const response = await fetch(API_CONFIG.endpoints.placeOrder, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth: appState.step2.auth,
        sid: appState.step2.sid,
        orderData
      })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || data.message);

    elements.apiStatus.textContent = 'Order Placed';
    return { success: true, data };
  } catch (err) {
    elements.apiStatus.textContent = 'Error';
    return { success: false, error: err.message };
  }
}

// Event: TOTP Login Submit
elements.totpForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const totp = elements.totpInput.value.trim();

  if (!/^[0-9]{6}$/.test(totp)) {
    showMessage(elements.step1Message, 'Invalid 6-digit TOTP', 'error');
    return;
  }

  setButtonLoading(elements.loginBtn, true);
  hideMessage(elements.step1Message);

  const result = await step1Login(totp);
  setButtonLoading(elements.loginBtn, false);

  if (result.success) {
    showMessage(elements.step1Message, '✅ Login successful!', 'success');
    elements.step1Status.textContent = '✓';
    disableSection(elements.step1Section);
    updateStepIndicator(2);
    enableSection(elements.step2Section);

    setTimeout(() => executeStep2(), 1000);
  } else {
    showMessage(elements.step1Message, `❌ Login failed: ${result.error}`, 'error');
  }
});

// Step 2 auto execution
async function executeStep2() {
  elements.step2Loader.style.display = 'block';
  hideMessage(elements.step2Message);

  const result = await step2Validate();
  elements.step2Loader.style.display = 'none';

  if (result.success) {
    showMessage(elements.step2Message, '✅ Session validated successfully.', 'success');
    disableSection(elements.step2Section);
    updateStepIndicator(3);
    enableSection(elements.step3Section);
  } else {
    showMessage(elements.step2Message, `❌ Validation failed: ${result.error}`, 'error');
    elements.resetSection.style.display = 'block';
  }
}

// Reset Button
elements.resetBtn.addEventListener('click', () => location.reload());

// Initialize App
elements.apiStatus.textContent = 'Ready';
elements.lastActivity.textContent = 'Never';
updateStepIndicator(1);
updateSessionStatus(false);
console.log('Kotak NEO Trading Terminal initialized');
