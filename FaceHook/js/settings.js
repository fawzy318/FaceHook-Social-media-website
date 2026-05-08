// ============================================
// FaceHook - Settings Page (settings.js)
// Tab switching, feedback form, account
// management, and account deletion
// ============================================

// ============================================
// TAB SWITCHING
// Switch between settings sections
// ============================================

function switchSettingsTab(tabId, btn) {
    // Hide all sections
    var sections = document.querySelectorAll(".settings-section");
    for (var i = 0; i < sections.length; i++) {
        sections[i].classList.remove("active");
    }

    // Remove active from all buttons
    var buttons = document.querySelectorAll(".settings-nav button");
    for (var j = 0; j < buttons.length; j++) {
        buttons[j].classList.remove("active");
    }

    // Show selected section and highlight button
    var target = document.getElementById(tabId);
    if (target) target.classList.add("active");
    btn.classList.add("active");
}

// ============================================
// FEEDBACK FORM
// ============================================

function saveFeedbackForm() {
    var subject = document.getElementById("feedback-subject");
    var message = document.getElementById("feedback-message");

    // Check if fields are filled
    if (!subject || !subject.value.trim() || !message || !message.value.trim()) {
        showToast("Please fill out all fields.", "warning");
        return;
    }

    showToast("Feedback submitted! Thank you!", "success");
    subject.value = "";
    message.value = "";
}

// ============================================
// SAVE ACCOUNT SETTINGS
// Update email and username
// ============================================

function saveAccountSettings() {
    var user = getCurrentUser();
    if (!user) {
        showToast("Please log in first!", "warning");
        return;
    }

    var emailInput = document.getElementById("account-email");
    var usernameInput = document.getElementById("account-username");

    var newEmail = emailInput ? emailInput.value.trim() : "";
    var newUsername = usernameInput ? usernameInput.value.trim() : "";

    // Check if fields are empty
    if (!newEmail || !newUsername) {
        showToast("Email and username cannot be empty.", "warning");
        return;
    }

    // Check email format
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
        showToast("Please enter a valid email address.", "warning");
        return;
    }

    // Check username format
    var usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(newUsername)) {
        showToast("Username: 3-20 chars, letters/numbers/underscore only.", "warning");
        return;
    }

    // Check if email is taken by another user
    var existingEmail = getUserByEmail(newEmail);
    if (existingEmail && existingEmail.id !== user.id) {
        showToast("This email is already used by another account.", "danger");
        return;
    }

    // Check if username is taken
    var existingUsername = getUserByUsername(newUsername);
    if (existingUsername && existingUsername.id !== user.id) {
        showToast("This username is already taken.", "danger");
        return;
    }

    // Update the user
    updateUser(user.id, { email: newEmail, username: newUsername });
    showToast("Account settings saved!", "success");
}

// ============================================
// DELETE MY ACCOUNT
// Permanently delete account and all data
// ============================================

function deleteMyAccount() {
    var user = getCurrentUser();
    if (!user) {
        showToast("No account to delete.", "warning");
        return;
    }

    // First confirmation
    if (!confirm("Are you sure you want to DELETE your account?\n\nThis will permanently remove all your posts, messages, and profile data.\n\nThis action CANNOT be undone!")) {
        return;
    }

    // Second confirmation
    if (!confirm("FINAL WARNING: Click OK to permanently delete your account.")) {
        return;
    }

    var userId = user.id;

    // Delete all posts by this user and remove their likes/comments from other posts
    var posts = getPosts();
    var remainingPosts = [];
    for (var i = 0; i < posts.length; i++) {
        if (posts[i].authorId !== userId) {
            // Remove this user's likes
            var newLikes = [];
            for (var li = 0; li < posts[i].likes.length; li++) {
                if (posts[i].likes[li] !== userId) newLikes.push(posts[i].likes[li]);
            }
            posts[i].likes = newLikes;

            // Remove this user's comments
            var newComments = [];
            for (var ci = 0; ci < posts[i].comments.length; ci++) {
                if (posts[i].comments[ci].authorId !== userId) newComments.push(posts[i].comments[ci]);
            }
            posts[i].comments = newComments;

            remainingPosts.push(posts[i]);
        }
    }
    savePosts(remainingPosts);

    // Delete messages involving this user
    var messages = getMessages();
    var remainingMsgs = [];
    for (var j = 0; j < messages.length; j++) {
        if (messages[j].senderId !== userId && messages[j].receiverId !== userId) {
            remainingMsgs.push(messages[j]);
        }
    }
    saveMessages(remainingMsgs);

    // Delete follows involving this user
    var follows = getFollows();
    var remainingFollows = [];
    for (var k = 0; k < follows.length; k++) {
        if (follows[k].followerId !== userId && follows[k].followingId !== userId) {
            remainingFollows.push(follows[k]);
        }
    }
    saveFollows(remainingFollows);

    // Logout and delete the user
    logoutUser();
    deleteUser(userId);

    showToast("Your account has been permanently deleted. Goodbye!", "danger");

    // Redirect to home after 2 seconds
    setTimeout(function() {
        window.location.href = "../index.html";
    }, 2000);
}

// ============================================
// POPULATE ACCOUNT FIELDS
// Fill email/username inputs with current data
// ============================================

function populateAccountFields() {
    var user = getCurrentUser();
    if (!user) return;

    var emailInput = document.getElementById("account-email");
    var usernameInput = document.getElementById("account-username");

    if (emailInput) emailInput.value = user.email;
    if (usernameInput) usernameInput.value = user.username;
}

// ============================================
// INITIALIZE SETTINGS ON PAGE LOAD
// ============================================

document.addEventListener("DOMContentLoaded", function() {
    populateAccountFields();

    // Add feedback for toggle switches
    var toggles = document.querySelectorAll(".toggle-switch input");
    for (var i = 0; i < toggles.length; i++) {
        toggles[i].addEventListener("change", function() {
            var label = this.closest(".setting-item").querySelector("h4").textContent;
            var status = this.checked ? "Enabled" : "Disabled";
            showToast(label + ": " + status, "info");
        });
    }
});
