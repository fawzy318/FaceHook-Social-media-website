// ============================================
// FaceHook - Main Application (app.js)
// Handles: navbar, theme toggle, language toggle,
// dropdown menus, modals, toast notifications,
// and authentication UI.
// ============================================

// ============================================
// TOAST NOTIFICATIONS
// Show small popup messages to the user
// ============================================

// Show a toast message (type: success, warning, danger, info)
function showToast(message, type) {
    // Create a container if it doesn't exist
    var container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.style.cssText = "position:fixed;top:20px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:10px;";
        document.body.appendChild(container);
    }

    // Set the background color based on type
    var bgColor = "#2196F3"; // default blue
    if (type === "success") bgColor = "#4CAF50";
    if (type === "warning") bgColor = "#FF9800";
    if (type === "danger") bgColor = "#F44336";
    if (type === "info") bgColor = "#2196F3";

    // Create the toast element
    var toast = document.createElement("div");
    toast.style.cssText = "padding:12px 24px;border-radius:12px;color:white;font-size:0.9rem;font-weight:500;box-shadow:0 8px 32px rgba(0,0,0,0.3);opacity:0;transition:opacity 0.3s;background:" + bgColor + ";";
    toast.textContent = message;
    container.appendChild(toast);

    // Show the toast with animation
    setTimeout(function() { toast.style.opacity = "1"; }, 50);

    // Remove after 3 seconds
    setTimeout(function() {
        toast.style.opacity = "0";
        setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
}

// Keep the old Toast.show() working for HTML onclick attributes
var Toast = {
    show: function(message, type) {
        showToast(message, type);
    }
};

// ============================================
// THEME TOGGLE
// Switch between dark and light mode
// ============================================

function initThemeToggle() {
    // Load saved theme from localStorage
    var savedTheme = localStorage.getItem("fh-theme");
    if (savedTheme) {
        document.documentElement.setAttribute("data-theme", savedTheme);
    }

    // Find all theme toggle buttons on the page
    var buttons = document.querySelectorAll(".theme-toggle");
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener("click", function() {
            // Get current theme and switch it
            var current = document.documentElement.getAttribute("data-theme");
            var newTheme = (current === "dark") ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", newTheme);
            localStorage.setItem("fh-theme", newTheme);
        });
    }
}

// ============================================
// LANGUAGE TOGGLE
// Switch between English and Arabic
// ============================================

function initLanguageToggle() {
    var savedLang = localStorage.getItem("fh-lang") || "en";

    // Apply saved language
    applyLanguage(savedLang);

    // Find all language toggle buttons
    var buttons = document.querySelectorAll(".lang-toggle");
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener("click", function() {
            var current = localStorage.getItem("fh-lang") || "en";
            var newLang = (current === "en") ? "ar" : "en";
            localStorage.setItem("fh-lang", newLang);
            applyLanguage(newLang);
        });
    }
}

// Apply language to all elements with data-en and data-ar attributes
function applyLanguage(lang) {
    var elements = document.querySelectorAll("[data-" + lang + "]");
    for (var i = 0; i < elements.length; i++) {
        var text = elements[i].getAttribute("data-" + lang);
        if (text) {
            elements[i].textContent = text;
        }
    }

    // Set page direction for Arabic
    if (lang === "ar") {
        document.body.style.direction = "rtl";
    } else {
        document.body.style.direction = "ltr";
    }

    // Update toggle button text
    var buttons = document.querySelectorAll(".lang-toggle");
    for (var j = 0; j < buttons.length; j++) {
        buttons[j].textContent = (lang === "en") ? "عربي" : "English";
    }
}

// ============================================
// DROPDOWN MENUS
// Toggle dropdown menus when clicked
// ============================================

function initDropdowns() {
    var triggers = document.querySelectorAll(".dropdown-trigger");
    for (var i = 0; i < triggers.length; i++) {
        triggers[i].addEventListener("click", function(e) {
            e.stopPropagation();
            // Find the dropdown menu next to the trigger
            var menu = this.nextElementSibling;
            if (!menu) {
                // Look for dropdown-menu inside parent
                menu = this.parentElement.querySelector(".dropdown-menu");
            }
            if (menu) {
                menu.classList.toggle("open");
            }
        });
    }

    // Close all dropdowns when clicking outside
    document.addEventListener("click", function() {
        var openMenus = document.querySelectorAll(".dropdown-menu.open");
        for (var i = 0; i < openMenus.length; i++) {
            openMenus[i].classList.remove("open");
        }
    });
}

// ============================================
// MODAL DIALOGS
// Open and close popup modals
// ============================================

function openModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("open");
    }
}

function closeModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("open");
    }
}

// Keep old ModalManager working for HTML onclick attributes
var ModalManager = {
    open: function(id) { openModal(id); },
    close: function(id) { closeModal(id); }
};

function initModals() {
    // Close buttons inside modals
    var closeButtons = document.querySelectorAll(".modal-close");
    for (var i = 0; i < closeButtons.length; i++) {
        closeButtons[i].addEventListener("click", function() {
            var modal = this.closest(".modal-overlay");
            if (modal) {
                modal.classList.remove("open");
            }
        });
    }

    // Close modal when clicking the overlay background
    var overlays = document.querySelectorAll(".modal-overlay");
    for (var j = 0; j < overlays.length; j++) {
        overlays[j].addEventListener("click", function(e) {
            if (e.target === this) {
                this.classList.remove("open");
            }
        });
    }
}

// ============================================
// MOBILE HAMBURGER MENU
// Toggle mobile navigation
// ============================================

function initHamburger() {
    var btn = document.querySelector(".nav-hamburger");
    var navLinks = document.getElementById("nav-links");
    if (btn && navLinks) {
        btn.addEventListener("click", function() {
            navLinks.classList.toggle("open");
        });
    }
}

// ============================================
// AUTHENTICATION UI
// Show login/register buttons or user avatar
// in the navbar based on login status
// ============================================

function initAuthUI() {
    var navActions = document.querySelector(".nav-actions");
    if (!navActions) return;

    var user = getCurrentUser();

    // Check if we're on a page in the /pages/ folder or in root
    var isInPages = window.location.pathname.indexOf("/pages/") !== -1;
    var prefix = isInPages ? "" : "pages/";

    if (user) {
        // User is logged in - show avatar and dropdown
        var initials = getUserInitials(user);

        // Create notification button
        var notifBtn = document.createElement("button");
        notifBtn.className = "nav-notification";
        notifBtn.innerHTML = "🔔<span class='notif-badge'>0</span>";

        // Create avatar dropdown
        var dropdown = document.createElement("div");
        dropdown.className = "dropdown";

        var avatarBtn = document.createElement("div");
        avatarBtn.className = "nav-avatar dropdown-trigger";
        avatarBtn.style.cssText = "display:flex;align-items:center;justify-content:center;background:var(--primary);color:white;font-weight:700;font-size:0.85rem;width:38px;height:38px;border-radius:50%;cursor:pointer;";
        avatarBtn.textContent = initials;

        var menu = document.createElement("div");
        menu.className = "dropdown-menu";
        menu.innerHTML = '<a href="' + prefix + 'profile.html">👤 My Profile</a>'
            + '<a href="' + prefix + 'dashboard.html">📊 Dashboard</a>'
            + '<a href="' + prefix + 'settings.html">⚙️ Settings</a>'
            + '<button onclick="logoutAndRedirect()">🚪 Logout</button>';

        dropdown.appendChild(avatarBtn);
        dropdown.appendChild(menu);

        // Insert before hamburger button
        var hamburger = navActions.querySelector(".nav-hamburger");
        navActions.insertBefore(notifBtn, hamburger);
        navActions.insertBefore(dropdown, hamburger);

        // Re-initialize dropdowns to handle the new one
        initDropdowns();

    } else {
        // User is NOT logged in - show Login and Register buttons
        var loginBtn = document.createElement("a");
        loginBtn.href = prefix + "login.html";
        loginBtn.className = "btn btn-ghost btn-sm";
        loginBtn.textContent = "Login";

        var registerBtn = document.createElement("a");
        registerBtn.href = prefix + "register.html";
        registerBtn.className = "btn btn-primary btn-sm";
        registerBtn.textContent = "Register";

        var hamburger = navActions.querySelector(".nav-hamburger");
        navActions.insertBefore(loginBtn, hamburger);
        navActions.insertBefore(registerBtn, hamburger);
    }
}

// Logout and redirect to home page
function logoutAndRedirect() {
    logoutUser();
    showToast("Logged out successfully!", "info");
    setTimeout(function() {
        // Go to home page
        var isInPages = window.location.pathname.indexOf("/pages/") !== -1;
        window.location.href = isInPages ? "../index.html" : "index.html";
    }, 1000);
}

// Require authentication - redirect to login if not logged in
function requireAuth() {
    if (!isLoggedIn()) {
        showToast("Please log in to access this page.", "warning");
        setTimeout(function() {
            var isInPages = window.location.pathname.indexOf("/pages/") !== -1;
            window.location.href = isInPages ? "login.html" : "pages/login.html";
        }, 1000);
        return false;
    }
    return true;
}

// Keep old AuthUI working
var AuthUI = {
    init: function() { initAuthUI(); },
    requireAuth: function() { return requireAuth(); }
};

// Keep old DropdownManager working
var DropdownManager = {
    init: function() { initDropdowns(); }
};

// Keep old LangManager working
var LangManager = {
    apply: function(lang) { applyLanguage(lang); }
};

// ============================================
// INITIALIZE EVERYTHING ON PAGE LOAD
// ============================================

document.addEventListener("DOMContentLoaded", function() {
    initThemeToggle();
    initLanguageToggle();
    initHamburger();
    initModals();
    initDropdowns();
    initAuthUI();
});
