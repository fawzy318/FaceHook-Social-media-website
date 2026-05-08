// ============================================
// FaceHook - Authentication (auth.js)
// Handles registration and login forms
// ============================================

// ============================================
// REGISTRATION FORM
// ============================================

function initRegisterForm() {
    var form = document.getElementById("register-form");
    if (!form) return;

    form.addEventListener("submit", function(e) {
        // Prevent the form from submitting normally
        e.preventDefault();

        // Get form values
        var firstName = document.getElementById("first-name").value.trim();
        var lastName = document.getElementById("last-name").value.trim();
        var username = document.getElementById("username").value.trim();
        var email = document.getElementById("email").value.trim();
        var password = document.getElementById("password").value;
        var confirmPassword = document.getElementById("confirm-password").value;

        // Get optional fields
        var weightSelect = document.getElementById("weight-class");
        var weightClass = weightSelect ? weightSelect.value : "";
        var bioField = document.getElementById("bio");
        var bio = bioField ? bioField.value.trim() : "";

        // Get terms checkbox
        var termsBox = document.getElementById("terms");

        // --- Validation ---

        // Check if all required fields are filled
        if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
            showToast("Please fill in all required fields.", "warning");
            return;
        }

        // Check name length
        if (firstName.length < 2 || lastName.length < 2) {
            showToast("Names must be at least 2 characters.", "warning");
            return;
        }

        // Check username format (letters, numbers, underscore only)
        var usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            showToast("Username: 3-20 characters, letters/numbers/underscore only.", "warning");
            return;
        }

        // Check email format
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast("Please enter a valid email address.", "warning");
            return;
        }

        // Check password length
        if (password.length < 6) {
            showToast("Password must be at least 6 characters.", "warning");
            return;
        }

        // Check passwords match
        if (password !== confirmPassword) {
            showToast("Passwords do not match!", "danger");
            return;
        }

        // Check terms checkbox
        if (termsBox && !termsBox.checked) {
            showToast("Please agree to the Terms & Conditions.", "warning");
            return;
        }

        // --- Try to register ---
        var result = registerUser(firstName, lastName, username, email, password, weightClass, bio);

        if (result.success) {
            showToast("Account created successfully! 🎉", "success");
            // Redirect to feed page after 1.5 seconds
            setTimeout(function() {
                window.location.href = "feed.html";
            }, 1500);
        } else {
            showToast(result.message, "danger");
        }
    });
}

// ============================================
// LOGIN FORM
// ============================================

function initLoginForm() {
    var form = document.getElementById("login-form");
    if (!form) return;

    form.addEventListener("submit", function(e) {
        // Prevent the form from submitting normally
        e.preventDefault();

        // Get form values
        var email = document.getElementById("login-email").value.trim();
        var password = document.getElementById("login-password").value;

        // --- Validation ---

        // Check if fields are filled
        if (!email || !password) {
            showToast("Please enter your email and password.", "warning");
            return;
        }

        // Check email format
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast("Please enter a valid email address.", "warning");
            return;
        }

        // --- Try to login ---
        var result = loginUser(email, password);

        if (result.success) {
            showToast("Welcome back, " + result.user.firstName + "! 🥊", "success");
            // Redirect to feed page after 1 second
            setTimeout(function() {
                window.location.href = "feed.html";
            }, 1000);
        } else {
            showToast(result.message, "danger");
        }
    });
}

// ============================================
// PASSWORD VISIBILITY TOGGLE
// Show or hide the password text
// ============================================

function initPasswordToggles() {
    var toggleButtons = document.querySelectorAll(".toggle-password");
    for (var i = 0; i < toggleButtons.length; i++) {
        toggleButtons[i].addEventListener("click", function() {
            // Find the password input next to this button
            var input = this.previousElementSibling;
            if (!input) {
                input = this.parentElement.querySelector("input");
            }
            if (input) {
                // Toggle between password and text type
                if (input.type === "password") {
                    input.type = "text";
                    this.textContent = "🙈";
                } else {
                    input.type = "password";
                    this.textContent = "👁";
                }
            }
        });
    }
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

document.addEventListener("DOMContentLoaded", function() {
    initRegisterForm();
    initLoginForm();
    initPasswordToggles();
});
