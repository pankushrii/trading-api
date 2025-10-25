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

// API Configuration
const API_CONFIG = {
  credentials: {
    mobileNumber: '+917000560918',
    ucc: 'YIVKF',
    mpin: '190990',
    authorizationKey: 'a3de4fd6-da0b-49bc-8f11-256b84b5ec0f',
    neoFinKey: 'neotradeapi'
  },
  endpoints: {
    login: 'https://mis.kotaksecurities.com/login/1.0/tradeApiLogin',
    validate: 'https://mis.kotaksecurities.com/login/1.0/tradeApiValidate',
    placeOrder: 'https://mis.kotaksecurities.com/quick/order/rule/ms/place'
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
  element.textContent = message;
  element.className = `message-box show ${type}`;
}

function hideMessage(element) {
  element.className = 'message-box';
}

function setButtonLoading(button, isLoading) {
  const btnText = button.querySelector('.btn-text');
  const btnLoader = button.querySelector('.btn-loader');
  
  if (isLoading) {
    button.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
  } else {
    button.disabled = false;
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
  }
}

function updateSessionStatus(isConnected) {
  const statusDot = elements.sessionStatus.querySelector('.status-dot');
  
  if (isConnected) {
    statusDot.className = 'status-dot status-connected';
    elements.statusText.textContent = 'Connected';
  } else {
    statusDot.className = 'status-dot status-disconnected';
    elements.statusText.textContent = 'Disconnected';
  }
}

function updateStepIndicator(step) {
  appState.currentStep = step;
  elements.currentStepSpan.textContent = step;
}

function enableSection(sectionElement) {
  sectionElement.classList.remove('section-disabled');
}

function disableSection(sectionElement) {
  sectionElement.classList.add('section-disabled');
}

function setStepStatus(statusElement, emoji) {
  statusElement.textContent = emoji;
}

// API Functions
async function step1Login(totp) {
  try {
    elements.apiStatus.textContent = 'Authenticating...';
    updateLastActivity();
    
    const response = await fetch(API_CONFIG.endpoints.login, {
      method: 'POST',
      headers: {
        'Authorization': API_CONFIG.credentials.authorizationKey,
        'neo-fin-key': API_CONFIG.credentials.neoFinKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mobileNumber: API_CONFIG.credentials.mobileNumber,
        ucc: API_CONFIG.credentials.ucc,
        totp: totp
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Authentication failed: ${response.status}`);
    }
    
    // Store session data
    appState.step1.sid = data.data?.sid || data.sid;
    appState.step1.auth = data.data?.token || data.token;
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
        'Authorization': API_CONFIG.credentials.authorizationKey,
        'neo-fin-key': API_CONFIG.credentials.neoFinKey,
        'sid': appState.step1.sid,
        'Auth': appState.step1.auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mpin: API_CONFIG.credentials.mpin
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Validation failed: ${response.status}`);
    }
    
    // Store trade session data
    appState.step2.sid = data.data?.sid || data.sid;
    appState.step2.auth = data.data?.token || data.token;
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
    
    // Construct jData object
    const jData = {
      am: 'NO',
      dq: '0',
      es: orderData.exchangeSegment,
      mp: '0',
      pc: orderData.productCode,
      pf: 'N',
      pr: orderData.price,
      pt: orderData.priceType,
      qt: orderData.quantity,
      rt: orderData.validity,
      tp: '0',
      ts: orderData.tradingSymbol,
      tt: orderData.transactionType
    };
    
    // Create URL-encoded body
    const body = new URLSearchParams({
      jData: JSON.stringify(jData)
    });
    
    const response = await fetch(API_CONFIG.endpoints.placeOrder, {
      method: 'POST',
      headers: {
        'Auth': appState.step2.auth,
        'Sid': appState.step2.sid,
        'neo-fin-key': API_CONFIG.credentials.neoFinKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Order placement failed: ${response.status}`);
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
  
  // Validate TOTP
  if (!/^\d{6}$/.test(totp)) {
    showMessage(elements.step1Message, '❌ Please enter a valid 6-digit TOTP code', 'error');
    return;
  }
  
  // Clear previous messages
  hideMessage(elements.step1Message);
  
  // Set loading state
  setButtonLoading(elements.loginBtn, true);
  
  // Call login API
  const result = await step1Login(totp);
  
  // Remove loading state
  setButtonLoading(elements.loginBtn, false);
  
  if (result.success) {
    showMessage(elements.step1Message, '✅ Login successful! Session ID obtained.', 'success');
    setStepStatus(elements.step1Status, '✓');
    disableSection(elements.step1Section);
    
    // Move to Step 2
    updateStepIndicator(2);
    enableSection(elements.step2Section);
    
    // Auto-trigger Step 2
    setTimeout(() => {
      executeStep2();
    }, 500);
    
  } else {
    showMessage(elements.step1Message, `❌ Login failed: ${result.error}`, 'error');
    setStepStatus(elements.step1Status, '✗');
  }
});

async function executeStep2() {
  // Show loader
  elements.step2Loader.classList.remove('hidden');
  hideMessage(elements.step2Message);
  
  // Call validate API
  const result = await step2Validate();
  
  // Hide loader
  elements.step2Loader.classList.add('hidden');
  
  if (result.success) {
    showMessage(elements.step2Message, '✅ Session validated! Trade authorization obtained. You can now place orders.', 'success');
    setStepStatus(elements.step2Status, '✓');
    disableSection(elements.step2Section);
    
    // Move to Step 3
    updateStepIndicator(3);
    enableSection(elements.step3Section);
    
  } else {
    showMessage(elements.step2Message, `❌ Validation failed: ${result.error}`, 'error');
    setStepStatus(elements.step2Status, '✗');
    elements.resetSection.style.display = 'block';
  }
}

elements.orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Get form data
  const orderData = {
    tradingSymbol: document.getElementById('tradingSymbol').value.trim(),
    transactionType: document.getElementById('transactionType').value,
    quantity: document.getElementById('quantity').value,
    price: document.getElementById('price').value,
    productCode: document.getElementById('productCode').value,
    priceType: document.getElementById('priceType').value,
    validity: document.getElementById('validity').value,
    exchangeSegment: document.getElementById('exchangeSegment').value
  };
  
  // Validate
  if (!orderData.tradingSymbol) {
    showMessage(elements.step3Message, '❌ Trading symbol is required', 'error');
    return;
  }
  
  if (parseInt(orderData.quantity) < 1) {
    showMessage(elements.step3Message, '❌ Quantity must be at least 1', 'error');
    return;
  }
  
  if (parseFloat(orderData.price) < 0) {
    showMessage(elements.step3Message, '❌ Price cannot be negative', 'error');
    return;
  }
  
  // Clear previous messages
  hideMessage(elements.step3Message);
  
  // Set loading state
  setButtonLoading(elements.placeOrderBtn, true);
  
  // Call place order API
  const result = await step3PlaceOrder(orderData);
  
  // Remove loading state
  setButtonLoading(elements.placeOrderBtn, false);
  
  if (result.success) {
    const orderInfo = `
      ✅ Order placed successfully!
      Symbol: ${orderData.tradingSymbol}
      Type: ${orderData.transactionType === 'B' ? 'Buy' : 'Sell'}
      Quantity: ${orderData.quantity}
      Price: ${orderData.price === '0' ? 'Market Price' : '₹' + orderData.price}
    `;
    showMessage(elements.step3Message, orderInfo, 'success');
    setStepStatus(elements.step3Status, '✓');
    
    // Show reset button
    elements.resetSection.style.display = 'block';
    
    // Reset form
    elements.orderForm.reset();
    
  } else {
    showMessage(elements.step3Message, `❌ Order placement failed: ${result.error}`, 'error');
    setStepStatus(elements.step3Status, '✗');
  }
});

// Reset handler
elements.resetBtn.addEventListener('click', () => {
  // Reset state
  appState = {
    step1: { sid: null, auth: null, completed: false },
    step2: { sid: null, auth: null, completed: false },
    currentStep: 1,
    lastActivity: null
  };
  
  // Reset UI
  updateStepIndicator(1);
  updateSessionStatus(false);
  elements.apiStatus.textContent = 'Ready';
  elements.lastActivity.textContent = 'Never';
  
  // Reset sections
  elements.step1Section.classList.remove('section-disabled');
  elements.step2Section.classList.add('section-disabled');
  elements.step3Section.classList.add('section-disabled');
  
  // Clear status indicators
  elements.step1Status.textContent = '';
  elements.step2Status.textContent = '';
  elements.step3Status.textContent = '';
  
  // Clear messages
  hideMessage(elements.step1Message);
  hideMessage(elements.step2Message);
  hideMessage(elements.step3Message);
  
  // Reset forms
  elements.totpForm.reset();
  elements.orderForm.reset();
  
  // Hide reset button
  elements.resetSection.style.display = 'none';
  
  // Focus on TOTP input
  elements.totpInput.focus();
});

// Initialize
function init() {
  elements.apiStatus.textContent = 'Ready';
  elements.lastActivity.textContent = 'Never';
  updateStepIndicator(1);
  updateSessionStatus(false);
  
  // Focus on TOTP input
  elements.totpInput.focus();
  
  console.log('Kotak NEO Trading Terminal initialized');
}

// Run initialization
init();
