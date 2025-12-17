// ==================== CONVEX SETUP ====================
const CONVEX_URL = window.CONFIG?.CONVEX_URL || "";

/** @type {import("convex/browser")["ConvexClient"]} */
const ConvexClient = typeof convex !== 'undefined' && CONVEX_URL ? convex.ConvexClient : null;
const client = ConvexClient ? new ConvexClient(CONVEX_URL) : null;

/** @type {import("./convex/_generated/api")["api"]} */
const api = typeof convex !== 'undefined' ? convex.anyApi : null;

// ==================== ANIMATION CONFIG ====================
const CONFIG = {
    introText: "order your coffee via terminal",
    commandText: "ssh anoralabs.shop",
    typeSpeed: 65,
    backspaceSpeed: 35,
    introFadeIn: 800,
    introFadeOut: 600,
    introHold: 2000,
    commandHold: 5000,
    pauseBeforeType: 400,
    pauseAfterBackspace: 300,
    successDisplayTime: 3000
};

// ==================== DOM ELEMENTS ====================
// Terminal elements
const introText = document.getElementById('intro-text');
const commandEl = document.getElementById('command');
const cursor = document.getElementById('cursor');

// Waitlist elements
const waitlistBtn = document.getElementById('waitlist-btn');
const nameInputWrapper = document.getElementById('name-input-wrapper');
const nameInput = document.getElementById('name-input');
const nameClear = document.getElementById('name-clear');
const nameConfirm = document.getElementById('name-confirm');
const emailInputWrapper = document.getElementById('email-input-wrapper');
const emailInput = document.getElementById('email-input');
const emailClear = document.getElementById('email-clear');
const emailSubmit = document.getElementById('email-submit');
const successMsg = document.getElementById('success-msg');

// State
let userName = '';

// ==================== UTILITIES ====================
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const easedDelay = (ms, variance = 0.2) => {
    const variation = ms * variance * (Math.random() - 0.5);
    return delay(ms + variation);
};

// ==================== TERMINAL ANIMATIONS ====================
async function showIntro() {
    introText.textContent = CONFIG.introText;
    await delay(50);
    introText.classList.add('visible');
    await delay(CONFIG.introFadeIn);
}

async function hideIntro() {
    introText.classList.remove('visible');
    await delay(CONFIG.introFadeOut);
    introText.textContent = '';
}

async function typeText(text) {
    cursor.classList.add('visible');
    cursor.classList.remove('blink');
    
    for (let i = 0; i < text.length; i++) {
        commandEl.textContent += text[i];
        await easedDelay(CONFIG.typeSpeed, 0.3);
    }
}

async function backspaceText() {
    cursor.classList.remove('blink');
    cursor.classList.add('visible');
    
    const text = commandEl.textContent;
    for (let i = text.length; i > 0; i--) {
        commandEl.textContent = text.slice(0, i - 1);
        const speed = CONFIG.backspaceSpeed * (0.7 + (i / text.length) * 0.3);
        await delay(speed);
    }
}

function startCursorBlink() {
    cursor.classList.add('visible', 'blink');
}

function hideCursor() {
    cursor.classList.remove('visible', 'blink');
}

async function runAnimation() {
    await showIntro();
    await delay(CONFIG.introHold);
    await hideIntro();
    
    await delay(CONFIG.pauseBeforeType);
    
    await typeText(CONFIG.commandText);
    
    startCursorBlink();
    await delay(CONFIG.commandHold);
    
    await backspaceText();
    hideCursor();
    
    await delay(CONFIG.pauseAfterBackspace);
    
    runAnimation();
}

// ==================== WAITLIST FORM ====================

function showElement(el) {
    el.classList.remove('hidden');
    el.classList.add('visible');
}

function hideElement(el) {
    el.classList.remove('visible');
    el.classList.add('hidden');
}

function showActions(clearBtn, confirmBtn) {
    clearBtn.classList.remove('hidden');
    confirmBtn.classList.remove('hidden');
}

function hideActions(clearBtn, confirmBtn) {
    clearBtn.classList.add('hidden');
    confirmBtn.classList.add('hidden');
}

function resetForm() {
    nameInput.value = '';
    emailInput.value = '';
    userName = '';
    hideActions(nameClear, nameConfirm);
    hideActions(emailClear, emailSubmit);
    hideElement(nameInputWrapper);
    hideElement(emailInputWrapper);
    hideElement(successMsg);
    showElement(waitlistBtn);
}

// Show name input when button clicked
waitlistBtn.addEventListener('click', async () => {
    hideElement(waitlistBtn);
    await delay(100);
    showElement(nameInputWrapper);
    await delay(50);
    nameInput.focus();
});

// Name input handlers
nameInput.addEventListener('input', () => {
    if (nameInput.value.trim()) {
        showActions(nameClear, nameConfirm);
    } else {
        hideActions(nameClear, nameConfirm);
    }
});

nameClear.addEventListener('click', () => {
    nameInput.value = '';
    hideActions(nameClear, nameConfirm);
    nameInput.focus();
});

async function confirmName() {
    const name = nameInput.value.trim();
    if (!name) return;
    
    userName = name;
    hideElement(nameInputWrapper);
    await delay(150);
    showElement(emailInputWrapper);
    await delay(50);
    emailInput.focus();
}

nameConfirm.addEventListener('click', confirmName);

nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        confirmName();
    }
});

// Email input handlers
emailInput.addEventListener('input', () => {
    if (emailInput.value.trim()) {
        showActions(emailClear, emailSubmit);
    } else {
        hideActions(emailClear, emailSubmit);
    }
});

emailClear.addEventListener('click', () => {
    emailInput.value = '';
    hideActions(emailClear, emailSubmit);
    emailInput.focus();
});

async function submitWaitlist() {
    const email = emailInput.value.trim();
    if (!email) return;
    
    // Add loading state
    emailSubmit.classList.add('loading');
    
    try {
        // Save to Convex
        if (client && api) {
            await client.mutation(api.waitlist.add, {
                name: userName,
                email: email
            });
        } else {
            // Fallback: log to console if Convex not configured
            console.log('Waitlist signup:', { name: userName, email: email });
        }
        
        // Show success
        emailSubmit.classList.remove('loading');
        hideElement(emailInputWrapper);
        await delay(150);
        showElement(successMsg);
        
        // Reset after 3 seconds
        await delay(CONFIG.successDisplayTime);
        hideElement(successMsg);
        await delay(150);
        
        // Reset form state
        nameInput.value = '';
        emailInput.value = '';
        userName = '';
        hideActions(nameClear, nameConfirm);
        hideActions(emailClear, emailSubmit);
        
        // Show button again
        showElement(waitlistBtn);
        
    } catch (error) {
        console.error('Error saving to waitlist:', error);
        emailSubmit.classList.remove('loading');
        // Still show success for UX (could show error state instead)
        hideElement(emailInputWrapper);
        await delay(150);
        showElement(successMsg);
        await delay(CONFIG.successDisplayTime);
        hideElement(successMsg);
        await delay(150);
        
        nameInput.value = '';
        emailInput.value = '';
        userName = '';
        hideActions(nameClear, nameConfirm);
        hideActions(emailClear, emailSubmit);
        showElement(waitlistBtn);
    }
}

emailSubmit.addEventListener('click', submitWaitlist);

emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        submitWaitlist();
    }
});

// ==================== CLICK OUTSIDE ====================
document.addEventListener('click', (e) => {
    const waitlist = document.querySelector('.waitlist');
    const isWaitlistVisible = !waitlistBtn.classList.contains('hidden');
    
    // If the button is already visible, no need to reset
    if (isWaitlistVisible) return;
    
    // Check if click is outside the waitlist area
    if (!waitlist.contains(e.target)) {
        resetForm();
    }
});

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', () => {
    delay(300).then(runAnimation);
});
