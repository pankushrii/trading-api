// Application State
let appState = {
  step1: {
    sid: null,
    auth: null,
    completed: false
  },
  step2: {
    sid: null,
    auth: null,
    completed: false
  },
  currentStep: 1,
  lastActivity: null
};

// API Configuration - FIXED TO USE VERCEL PROXY
const API_CONFIG = {
  endpoints: {
    login: '/api/tradeApiLogin',        // ✅ Use Vercel proxy
    validate: '/api/tradeApiValidate',   // ✅ Use Vercel proxy
    placeOrder: '/api/placeOrder'       // ✅ Use Vercel proxy
  }
};

// DOM Elements
const elements = {
  // Step indicators
  currentStepSpan: document.getElementById('currentStep'),
  sessionStatus: document.getElementById('sessionStatus'),
  statusText: document.getElementById('statusText'),
  // Step 1
  totpForm: document.getElementById('totpForm'),
  totpInput: document.getElementById('totpInput'),
  loginBtn: document.getElementById('loginBtn'),
  step1Message: document.getElementById('step1Message'),
  step1Status: document.getElementById('step1Status'),
  step1Section: document.getElementById('step1Section'),
  // Step 2
  step2Section: document.getElementById('step2Section'),
  step2Loader: document.getElementById('step2Loader'),
  step2Message: document.getElementById('step2Message'),
  step2Status: document.getElementById('step2Status'),
  // Step 3
  step3Section: document.getElementById('step3Section'),
  orderForm: document.getElementById('orderForm'),
  placeOrderBtn: document.getElementById('placeOrderBtn'),
  step3Message: document.getElementById('step3Message'),
  step3Status: document.getElementById('step3Status'),
  // Footer
  apiStatus: document.getElementById('apiStatus'),
  lastActivity: document.getElementById('lastActivity'),
  // Reset
  resetSection: document.getElementById('resetSection'),
  resetBtn: document.getElementById('resetBtn')
};

// Utility Functions
function updateLastActivity() {
  const now = new Date();
  appState.lastActivity = now;
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

function updateSessionStatus(isConnected) {
  if (isConnected) {
    elements.sessionStatus.className = 'status-badge connected';
    elements.statusText.textContent = 'Connected';
  } else {
    elements.sessionStatus.className = 'status-badge disconnected';
    elements.statusText.textContent = 'Disconnected';
  }
}

function updateStepIndicator(step) {
  appState.currentStep = step;
  elements.currentStepSpan.textContent = step;
}

function enableSection(sectionElement) {
  sectionElement.classList.remove('disabled');
}

function disableSection(sectionElement) {
  sectionElement.classList.add('disabled');
}

// API Functions - FIXED FIELD MAPPING
async function step1Login(totp) {
  try {
    elements.apiStatus.textContent = 'Authenticating...';
    updateLastActivity();
    
    const response = await fetch(API_CONFIG.endpoints.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ totp })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Authentication failed');
    }
    
    // FIXED: Correct field names from Kotak API
    appState.step1.sid = data.sid;     // ✅ Direct field
    appState.step1.auth = data.Auth;   // ✅ Capital A
    appState.step1.completed = true;
    
    elements.apiStatus.textContent = 'Connected';
    return { success: true, data };
  } catch (error) {
    elements.apiStatus.textContent = 'Error';
    return { success: false, error: error.message };
  }
}

async function step2Validate() {
  try {
    elements.apiStatus.textContent = 'Validating session...';
    updateLastActivity();
    
    const response = await fetch(API_CONFIG.endpoints.validate, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sid: appState.step1.sid,   // ✅ Pass stored sid
        auth: appState.step1.auth  // ✅ Pass stored Auth
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Validation failed');
    }
    
    // Store new trade session data
    appState.step2.sid = data.sid;     // ✅ New sid
    appState.step2.auth = data.Auth;   // ✅ New Auth token
    appState.step2.completed = true;
    
    elements.apiStatus.textContent = 'Trade Ready';
    updateSessionStatus(true);
    return { success: true, data };
  } catch (error) {
    elements.apiStatus.textContent = 'Error';
    return { success: false, error: error.message };
  }
}

async function step3PlaceOrder(orderData) {
  try {
    elements.apiStatus.textContent = 'Placing order...';
    updateLastActivity();
    
    const response = await fetch(API_CONFIG.endpoints.placeOrder, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        auth: appState.step2.auth,
        sid: appState.step2.sid,
        orderData: orderData
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Order placement failed');
    }
    
    elements.apiStatus.textContent = 'Order Placed';
    return { success: true, data };
  } catch (error) {
    elements.apiStatus.textContent = 'Error';
    return { success: false, error: error.message };
  }
}

// Event Handlers
elements.totpForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const totp = elements.totpInput.value.trim();
  
  if (!/^\d{6}$/.test(totp)) {
    showMessage(elements.step1Message, '❌ Please enter a valid 6-digit TOTP code', 'error');
    return;
  }
  
  hideMessage(elements.step1Message);
  setButtonLoading(elements.loginBtn, true);
  
  const result = await step1Login(totp);
  
  setButtonLoading(elements.loginBtn, false);
  elements.loginBtn.innerHTML = '<span>Login</span>';
  
  if (result.success) {
    showMessage(elements.step1Message, '✅ Login successful!', 'success');
    elements.step1Status.textContent = '✓';
    disableSection(elements.step1Section);
    updateStepIndicator(2);
    enableSection(elements.step2Section);
    
    setTimeout(() => {
      executeStep2();
    }, 500);
  } else {
    showMessage(elements.step1Message, `❌ Login failed: ${result.error}`, 'error');
  }
});

async function executeStep2() {
  elements.step2Loader.style.display = 'block';
  hideMessage(elements.step2Message);
  
  const result = await step2Validate();
  
  elements.step2Loader.style.display = 'none';
  
  if (result.success) {
    showMessage(elements.step2Message, '✅ Session validated! Ready to trade.', 'success');
    elements.step2Status.textContent = '✓';
    disableSection(elements.step2Section);
    updateStepIndicator(3);
    enableSection(elements.step3Section);
  } else {
    showMessage(elements.step2Message, `❌ Validation failed: ${result.error}`, 'error');
    elements.resetSection.style.display = 'block';
  }
}

elements.orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const orderData = {
    tradingSymbol: document.getElementById('tradingSymbol').value.trim(),
    transactionType: document.getElementById('transactionType').value,
    quantity: parseInt(document.getElementById('quantity').value),
    price: parseFloat(document.getElementById('price').value),
    productCode: document.getElementById('productCode').value,
    priceType: document.getElementById('priceType').value,
    validity: document.getElementById('validity').value,
    exchangeSegment: document.getElementById('exchangeSegment').value
  };
  
  hideMessage(elements.step3Message);
  setButtonLoading(elements.placeOrderBtn, true);
  
  const result = await step3PlaceOrder(orderData);
  
  setButtonLoading(elements.placeOrderBtn, false);
  elements.placeOrderBtn.innerHTML = '<span>Place Order</span>';
  
  if (result.success) {
    const orderInfo = `✅ Order placed successfully!<br>Symbol: ${orderData.tradingSymbol}<br>Type: ${orderData.transactionType === 'B' ? 'Buy' : 'Sell'}<br>Quantity: ${orderData.quantity}`;
    showMessage(elements.step3Message, orderInfo, 'success');
    elements.step3Status.textContent = '✓';
    elements.resetSection.style.display = 'block';
    elements.orderForm.reset();
  } else {
    showMessage(elements.step3Message, `❌ Order failed: ${result.error}`, 'error');
  }
});

elements.resetBtn.addEventListener('click', () => {
  location.reload();
});

// Initialize
elements.apiStatus.textContent = 'Ready';
elements.lastActivity.textContent = 'Never';
updateStepIndicator(1);
updateSessionStatus(false);
elements.totpInput.focus();
console.log('Kotak NEO Trading Terminal initialized');
