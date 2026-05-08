// ============================================
// FaceHook - Dashboard (dashboard.js)
// Shows user stats, activity, admin functions
// ============================================

// ============================================
// ANIMATE STAT NUMBERS
// Makes numbers count up from 0
// ============================================

function animateStats() {
    var elements = document.querySelectorAll(".stat-value[data-target]");
    for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        var target = parseInt(el.getAttribute("data-target"));
        if (target === 0) {
            el.textContent = "0";
            continue;
        }
        // Animate counting up
        animateNumber(el, target);
    }
}

// Helper function to animate a single number
function animateNumber(element, target) {
    var current = 0;
    var step = Math.max(1, Math.ceil(target / 50));
    var timer = setInterval(function() {
        current = current + step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = current;
    }, 30);
}

// ============================================
// INITIALIZE DASHBOARD
// ============================================

function initDashboard() {
    if (!requireAuth()) return;

    var stats = getStats();

    // Update stat card values
    var statElements = document.querySelectorAll(".stat-value[data-target]");
    if (statElements.length >= 4) {
        statElements[0].setAttribute("data-target", stats.myPosts);
        statElements[1].setAttribute("data-target", stats.myFollowers);
        statElements[2].setAttribute("data-target", stats.myLikes);
        statElements[3].setAttribute("data-target", stats.myComments);
    }
    animateStats();

    // Render activity list
    renderActivity();
}

// ============================================
// RENDER ACTIVITY
// Shows recent likes, comments, follows
// ============================================

function renderActivity() {
    var container = document.getElementById("activity-list");
    if (!container) return;

    var user = getCurrentUser();
    if (!user) return;

    var posts = getPosts();
    var activities = [];

    // Find likes and comments on my posts
    for (var i = 0; i < posts.length; i++) {
        var post = posts[i];
        if (post.authorId !== user.id) continue;

        // Check likes
        for (var j = 0; j < post.likes.length; j++) {
            if (post.likes[j] !== user.id) {
                var liker = getUserById(post.likes[j]);
                if (liker) {
                    activities.push({
                        icon: "❤️",
                        text: liker.firstName + " liked your post",
                        time: post.createdAt
                    });
                }
            }
        }

        // Check comments
        for (var k = 0; k < post.comments.length; k++) {
            var comment = post.comments[k];
            if (comment.authorId !== user.id) {
                activities.push({
                    icon: "💬",
                    text: comment.authorName + " commented on your post",
                    time: comment.createdAt
                });
            }
        }
    }

    // Check followers
    var follows = getFollows();
    for (var m = 0; m < follows.length; m++) {
        if (follows[m].followingId === user.id) {
            var follower = getUserById(follows[m].followerId);
            if (follower) {
                activities.push({
                    icon: "👤",
                    text: follower.firstName + " started following you",
                    time: new Date().toISOString()
                });
            }
        }
    }

    // If no activity, show message
    if (activities.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No activity yet. Start posting and connecting!</p>';
        return;
    }

    // Build activity HTML (show max 8 items)
    var html = "";
    var max = activities.length > 8 ? 8 : activities.length;
    for (var n = 0; n < max; n++) {
        var a = activities[n];
        html += '<div class="activity-item">';
        html += '<div class="activity-icon">' + a.icon + '</div>';
        html += '<div class="activity-info"><h5>' + a.text + '</h5><span>' + timeAgo(a.time) + '</span></div>';
        html += '</div>';
    }

    container.innerHTML = html;
}

// ============================================
// ADMIN FUNCTIONS
// Ban/unban users, delete users/posts
// ============================================

// Toggle ban status
function toggleUserStatus(userId, btn) {
    var isBanned = toggleBanUser(userId);
    btn.textContent = isBanned ? "Banned" : "Active";
    btn.className = isBanned ? "badge badge-danger" : "badge badge-success";
    showToast("User " + (isBanned ? "banned" : "reactivated") + ".", isBanned ? "danger" : "success");
}

// Resolve a report
function deleteContent(reportId, row) {
    if (confirm("Delete this report?")) {
        deleteReport(reportId);
        row.style.opacity = "0";
        setTimeout(function() { row.remove(); }, 300);
        showToast("Report resolved.", "success");
    }
}

// Delete a user and all their data (admin only)
function adminDeleteUser(userId) {
    var currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
        showToast("Admin access required!", "danger");
        return;
    }
    if (userId === currentUser.id) {
        showToast("You cannot delete your own account!", "warning");
        return;
    }

    var user = getUserById(userId);
    if (!user) return;

    if (!confirm('Delete "' + user.firstName + " " + user.lastName + '" and ALL their data? This cannot be undone.')) return;

    // Delete all posts by this user
    var posts = getPosts();
    var remainingPosts = [];
    for (var i = 0; i < posts.length; i++) {
        if (posts[i].authorId !== userId) {
            // Also remove this user's likes and comments from other posts
            var newLikes = [];
            for (var li = 0; li < posts[i].likes.length; li++) {
                if (posts[i].likes[li] !== userId) newLikes.push(posts[i].likes[li]);
            }
            posts[i].likes = newLikes;

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

    // Delete the user
    deleteUser(userId);
    showToast("User deleted.", "danger");

    // Re-render admin page if available
    if (typeof renderAdminPage === "function") renderAdminPage();
}

// Delete a single post (admin only)
function adminDeletePost(postId) {
    var currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
        showToast("Admin access required!", "danger");
        return;
    }

    var posts = getPosts();
    var post = null;
    for (var i = 0; i < posts.length; i++) {
        if (posts[i].id === postId) {
            post = posts[i];
            break;
        }
    }
    if (!post) return;

    var preview = post.content.substring(0, 80);
    if (post.content.length > 80) preview += "...";

    if (!confirm('Delete this post by ' + post.authorName + '?\n\n"' + preview + '"')) return;

    deletePost(postId);
    showToast("Post deleted by admin.", "danger");

    if (typeof renderAdminPage === "function") renderAdminPage();
}

// ============================================
// INITIALIZE DASHBOARD ON PAGE LOAD
// ============================================

document.addEventListener("DOMContentLoaded", initDashboard);
