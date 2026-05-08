// ============================================
// FaceHook - Profile Page (profile.js)
// Shows user profile, posts, follow/unfollow
// ============================================

var profileUserId = null;

// ============================================
// INITIALIZE PROFILE PAGE
// Load user data from URL parameter or current user
// ============================================

function initProfile() {
    // Get profile user from URL, or use current user
    var urlParams = new URLSearchParams(window.location.search);
    profileUserId = urlParams.get("id");

    if (!profileUserId) {
        var currentUser = getCurrentUser();
        if (currentUser) {
            profileUserId = currentUser.id;
        }
    }

    // If no user to show, display message
    if (!profileUserId) {
        var content = document.querySelector(".profile-content");
        if (content) {
            content.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);">'
                + '<div style="font-size:4rem;margin-bottom:16px;">👤</div>'
                + '<h3>No profile to display</h3>'
                + '<p>Please <a href="login.html">log in</a> or select a user from <a href="search.html">search</a>.</p></div>';
        }
        return;
    }

    var user = getUserById(profileUserId);
    if (!user) {
        var content2 = document.querySelector(".profile-content");
        if (content2) {
            content2.innerHTML = '<div style="text-align:center;padding:60px;"><h3>User not found</h3></div>';
        }
        return;
    }

    var currentUser = getCurrentUser();
    var isOwnProfile = currentUser && currentUser.id === user.id;
    var following = currentUser ? isFollowing(user.id) : false;

    // Update profile display name
    var nameEl = document.getElementById("profile-display-name");
    if (nameEl) nameEl.textContent = user.firstName + " " + user.lastName;

    // Update username
    var usernameEl = document.getElementById("profile-username");
    if (usernameEl) {
        var roleLabel = user.role === "admin" ? "🛡️ Admin" : "🥊 Member";
        usernameEl.innerHTML = "@" + user.username + ' · <span class="badge badge-primary">' + roleLabel + '</span>';
    }

    // Update bio
    var bioEl = document.getElementById("profile-bio");
    if (bioEl) bioEl.textContent = user.bio || "No bio yet.";

    // Update avatar initials
    var avatarEl = document.getElementById("profile-avatar-initials");
    if (avatarEl) avatarEl.textContent = getUserInitials(user);

    // Update stats
    var postCount = document.getElementById("profile-post-count");
    if (postCount) postCount.textContent = getUserPosts(user.id).length;

    var followerEl = document.getElementById("follower-count");
    if (followerEl) followerEl.textContent = getFollowerCount(user.id);

    var followingEl = document.getElementById("following-count");
    if (followingEl) followingEl.textContent = getFollowingCount(user.id);

    // Update action buttons
    var actionsEl = document.getElementById("profile-actions");
    if (actionsEl) {
        if (isOwnProfile) {
            actionsEl.innerHTML = '<button class="btn btn-primary" onclick="openModal(\'edit-profile-modal\')">✏️ Edit Profile</button>';
        } else if (currentUser) {
            var followBtnClass = following ? "btn-ghost" : "btn-primary";
            var followBtnText = following ? "Following ✓" : "Follow";

            actionsEl.innerHTML = '<button class="btn ' + followBtnClass + '" id="follow-btn" onclick="handleProfileFollow()">' + followBtnText + '</button>'
                + '<button class="btn btn-secondary" onclick="window.location.href=\'chat.html?partner=' + user.id + '\'">Message</button>';
        } else {
            actionsEl.innerHTML = '<a href="login.html" class="btn btn-primary">Login to interact</a>';
        }
    }

    // Update about section
    var aboutEl = document.getElementById("profile-about-info");
    if (aboutEl) {
        var aboutHtml = '<div class="about-item"><span class="about-icon">👤</span> <span>' + user.firstName + ' ' + user.lastName + '</span></div>';
        aboutHtml += '<div class="about-item"><span class="about-icon">📧</span> <span>' + user.email + '</span></div>';
        if (user.weightClass) {
            aboutHtml += '<div class="about-item"><span class="about-icon">🥊</span> <span>' + user.weightClass + '</span></div>';
        }
        aboutHtml += '<div class="about-item"><span class="about-icon">📅</span> <span>Joined ' + new Date(user.joinDate).toLocaleDateString() + '</span></div>';
        aboutEl.innerHTML = aboutHtml;
    }

    // Render user's posts
    renderProfilePosts(user.id);
}

// ============================================
// RENDER PROFILE POSTS
// ============================================

function renderProfilePosts(userId) {
    var container = document.getElementById("profile-posts");
    if (!container) return;

    var posts = getUserPosts(userId);
    var author = getUserById(userId);

    if (posts.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);"><p>No posts yet.</p></div>';
        return;
    }

    var html = "";
    for (var i = 0; i < posts.length; i++) {
        var post = posts[i];
        var initials = author ? getUserInitials(author) : "?";

        html += '<article class="post-card">';
        html += '<div class="post-header"><div class="post-author">';
        html += '<div class="avatar avatar-md" style="display:flex;align-items:center;justify-content:center;background:var(--primary);font-size:1rem;color:white;font-weight:700;">' + initials + '</div>';
        html += '<div class="post-author-info">';
        html += '<h4>' + post.authorName + '</h4>';
        html += '<span>' + post.authorUsername + ' · ' + timeAgo(post.createdAt) + '</span>';
        html += '</div></div></div>';
        html += '<div class="post-content"><p>' + post.content.replace(/\n/g, "<br>") + '</p></div>';
        if (post.image) {
            html += '<div class="post-media"><img src="' + post.image + '" alt="Post image"></div>';
        }
        html += '<div class="post-stats">';
        html += '<span>❤️ ' + post.likes.length + '</span>';
        html += '<span>' + post.comments.length + ' comments</span>';
        html += '</div></article>';
    }

    container.innerHTML = html;
}

// ============================================
// PROFILE ACTIONS
// ============================================

function handleProfileFollow() {
    if (!isLoggedIn()) {
        showToast("Please log in first!", "warning");
        return;
    }
    var nowFollowing = toggleFollow(profileUserId);
    initProfile(); // Re-render profile
    showToast(nowFollowing ? "Following! 🥊" : "Unfollowed.", nowFollowing ? "success" : "info");
}

function submitReport() {
    var reason = document.getElementById("report-reason");
    var details = document.getElementById("report-details");
    if (reason && !reason.value) {
        showToast("Please select a reason.", "warning");
        return;
    }
    submitReport(profileUserId, "user", reason.value, details ? details.value : "");
    showToast("Report submitted. Thank you! 🙏", "success");
    closeModal("report-modal");
}

function saveProfile() {
    var displayName = document.getElementById("edit-display-name");
    var bio = document.getElementById("edit-bio");
    var user = getCurrentUser();
    if (!user) return;

    // Split display name into first and last
    var names = displayName ? displayName.value.trim().split(" ") : [];
    var firstName = names[0] || user.firstName;
    var lastName = names.length > 1 ? names.slice(1).join(" ") : user.lastName;

    updateUser(user.id, {
        firstName: firstName,
        lastName: lastName,
        bio: bio ? bio.value.trim() : user.bio
    });

    showToast("Profile updated! ✨", "success");
    closeModal("edit-profile-modal");
    initProfile();
}

// ============================================
// INITIALIZE PROFILE ON PAGE LOAD
// ============================================

document.addEventListener("DOMContentLoaded", initProfile);
