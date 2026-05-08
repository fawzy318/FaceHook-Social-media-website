// ============================================
// FaceHook - Feed Page (feed.js)
// Renders posts, handles likes, comments,
// and the post creator
// ============================================

// ============================================
// RENDER ALL POSTS
// Builds the HTML for each post and inserts
// it into the feed container
// ============================================

function renderPosts() {
    var container = document.getElementById("feed-posts");
    if (!container) return;

    var posts = getPosts();
    var currentUser = getCurrentUser();

    // If there are no posts, show empty state
    if (posts.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text-muted);">'
            + '<div style="font-size:4rem;margin-bottom:16px;">🥊</div>'
            + '<h3>No posts yet!</h3>'
            + '<p>Be the first to share something with the boxing community.</p>'
            + '</div>';
        return;
    }

    // Build HTML for each post using a for loop
    var html = "";
    for (var i = 0; i < posts.length; i++) {
        var post = posts[i];
        var author = getUserById(post.authorId);
        var initials = author ? getUserInitials(author) : "?";

        // Check if current user liked this post
        var isLiked = false;
        if (currentUser) {
            isLiked = post.likes.indexOf(currentUser.id) !== -1;
        }

        // Build post HTML using string concatenation
        html += '<article class="post-card animate-fade-in" id="post-' + post.id + '">';

        // Post header with author info
        html += '<div class="post-header">';
        html += '<div class="post-author">';
        html += '<div class="avatar avatar-md" style="display:flex;align-items:center;justify-content:center;background:var(--primary);font-size:1rem;color:white;font-weight:700;">' + initials + '</div>';
        html += '<div class="post-author-info">';
        html += '<h4>' + post.authorName;
        if (currentUser && post.authorId === currentUser.id) {
            html += ' <span class="badge badge-accent">You</span>';
        }
        html += '</h4>';
        html += '<span>' + post.authorUsername + ' · ' + timeAgo(post.createdAt) + '</span>';
        html += '</div></div>';

        // Post menu (delete for own posts)
        html += '<div class="dropdown">';
        html += '<button class="post-menu-btn dropdown-trigger">⋯</button>';
        html += '<div class="dropdown-menu">';
        if (currentUser && post.authorId === currentUser.id) {
            html += '<button onclick="handleDeletePost(\'' + post.id + '\')">🗑️ Delete Post</button>';
        }
        html += '<button onclick="showToast(\'Post reported\',\'warning\')">🚩 Report</button>';
        html += '</div></div></div>';

        // Post content
        html += '<div class="post-content"><p>' + post.content.replace(/\n/g, "<br>") + '</p></div>';

        // Post image (if any)
        if (post.image) {
            html += '<div class="post-media"><img src="' + post.image + '" alt="Post image" loading="lazy"></div>';
        }

        // Post stats
        html += '<div class="post-stats">';
        html += '<span>❤️ ' + post.likes.length + '</span>';
        html += '<span>' + post.comments.length + ' comments</span>';
        html += '</div>';

        // Action buttons (like, comment, share)
        html += '<div class="post-actions-bar">';
        html += '<button class="post-action-btn ' + (isLiked ? "liked" : "") + '" onclick="handleLike(\'' + post.id + '\')">';
        html += (isLiked ? "❤️" : "🤍") + ' <span>Like</span></button>';
        html += '<button class="post-action-btn" onclick="handleToggleComments(\'' + post.id + '\')">💬 <span>Comment</span></button>';
        html += '<button class="post-action-btn" onclick="showToast(\'Link copied!\',\'success\')">🔄 <span>Share</span></button>';
        html += '</div>';

        // Comments section
        html += '<div class="comments-section" id="comments-' + post.id + '">';

        // Show existing comments
        for (var j = 0; j < post.comments.length; j++) {
            var c = post.comments[j];
            var commenter = getUserById(c.authorId);
            var cInitials = commenter ? getUserInitials(commenter) : "?";

            html += '<div class="comment">';
            html += '<div class="avatar avatar-sm" style="display:flex;align-items:center;justify-content:center;background:var(--bg-elevated);font-size:0.7rem;font-weight:700;min-width:36px;">' + cInitials + '</div>';
            html += '<div class="comment-body">';
            html += '<h5>' + c.authorName + '</h5>';
            html += '<p>' + c.text + '</p>';
            html += '<div class="comment-meta"><span>' + timeAgo(c.createdAt) + '</span></div>';
            html += '</div></div>';
        }

        // Comment input (only for logged in users)
        if (currentUser) {
            var userInitials = getUserInitials(currentUser);
            html += '<div class="comment-input-row">';
            html += '<div class="avatar avatar-sm" style="display:flex;align-items:center;justify-content:center;background:var(--primary);font-size:0.7rem;font-weight:700;min-width:36px;color:var(--text-inverse);">' + userInitials + '</div>';
            html += '<input type="text" placeholder="Write a comment..." id="comment-input-' + post.id + '" onkeypress="if(event.key===\'Enter\')handleAddComment(\'' + post.id + '\')">';
            html += '<button class="btn btn-primary btn-sm" onclick="handleAddComment(\'' + post.id + '\')">Post</button>';
            html += '</div>';
        } else {
            html += '<p style="text-align:center;font-size:0.85rem;color:var(--text-muted);padding:8px;">Log in to comment</p>';
        }

        html += '</div>'; // close comments-section
        html += '</article>';
    }

    container.innerHTML = html;

    // Re-initialize dropdowns for post menus
    initDropdowns();
}

// ============================================
// POST ACTIONS
// Handle like, comment, delete
// ============================================

// Handle like button click
function handleLike(postId) {
    if (!isLoggedIn()) {
        showToast("Please log in to like posts!", "warning");
        return;
    }
    toggleLike(postId);
    renderPosts();
}

// Handle toggle comments section
function handleToggleComments(postId) {
    var section = document.getElementById("comments-" + postId);
    if (section) {
        section.classList.toggle("open");
        // Focus on input if opening
        if (section.classList.contains("open")) {
            var input = document.getElementById("comment-input-" + postId);
            if (input) input.focus();
        }
    }
}

// Handle adding a comment
function handleAddComment(postId) {
    if (!isLoggedIn()) {
        showToast("Please log in to comment!", "warning");
        return;
    }
    var input = document.getElementById("comment-input-" + postId);
    if (!input || !input.value.trim()) {
        showToast("Write a comment first!", "warning");
        return;
    }
    addComment(postId, input.value.trim());
    renderPosts();
    showToast("Comment posted! 🥊", "success");

    // Re-open comments section after re-render
    setTimeout(function() {
        var section = document.getElementById("comments-" + postId);
        if (section) section.classList.add("open");
    }, 50);
}

// Handle deleting a post
function handleDeletePost(postId) {
    if (confirm("Are you sure you want to delete this post?")) {
        deletePost(postId);
        renderPosts();
        showToast("Post deleted.", "info");
    }
}

// ============================================
// POST CREATOR
// Handle creating new posts
// ============================================

function initPostCreator() {
    var postBtn = document.getElementById("create-post-btn");
    var textarea = document.getElementById("post-textarea");

    if (postBtn && textarea) {
        postBtn.addEventListener("click", function() {
            if (!isLoggedIn()) {
                showToast("Please log in to post!", "warning");
                return;
            }
            if (!textarea.value.trim()) {
                showToast("Write something first, champ!", "warning");
                return;
            }
            createPost(textarea.value.trim(), null);
            textarea.value = "";
            renderPosts();
            showToast("Post published! 🎉", "success");
        });
    }

    // Update creator avatar with user initials
    var creatorAvatar = document.getElementById("post-creator-avatar");
    var user = getCurrentUser();
    if (creatorAvatar && user) {
        creatorAvatar.textContent = getUserInitials(user);
    }
}

// ============================================
// SIDEBAR - SUGGESTED USERS
// Show other registered users to follow
// ============================================

function updateSidebar() {
    var container = document.getElementById("suggested-users");
    if (!container) return;

    var currentUser = getCurrentUser();
    var allUsers = getUsers();

    // Filter out the current user and take max 3
    var otherUsers = [];
    for (var i = 0; i < allUsers.length; i++) {
        if (currentUser && allUsers[i].id === currentUser.id) continue;
        otherUsers.push(allUsers[i]);
        if (otherUsers.length >= 3) break;
    }

    // If no other users, show message
    if (otherUsers.length === 0) {
        container.innerHTML = '<p style="font-size:0.85rem;color:var(--text-muted);">No other users yet. Invite your friends to join!</p>';
        return;
    }

    // Build HTML for each suggested user
    var html = "";
    for (var j = 0; j < otherUsers.length; j++) {
        var u = otherUsers[j];
        var initials = getUserInitials(u);
        var following = currentUser ? isFollowing(u.id) : false;

        html += '<div class="suggested-user">';
        html += '<div class="avatar avatar-sm" style="display:flex;align-items:center;justify-content:center;background:var(--primary);font-size:0.8rem;color:white;font-weight:700;min-width:36px;">' + initials + '</div>';
        html += '<div class="user-info">';
        html += '<h5>' + u.firstName + ' ' + u.lastName + '</h5>';
        html += '<span>@' + u.username + '</span>';
        html += '</div>';
        html += '<button class="btn btn-secondary btn-sm" onclick="handleFollow(\'' + u.id + '\', this)">';
        html += following ? "Following" : "Follow";
        html += '</button>';
        html += '</div>';
    }

    container.innerHTML = html;
}

// Handle follow button click
function handleFollow(userId, btn) {
    if (!isLoggedIn()) {
        showToast("Please log in first!", "warning");
        return;
    }
    var nowFollowing = toggleFollow(userId);
    btn.textContent = nowFollowing ? "Following" : "Follow";
    showToast(nowFollowing ? "Following! 🥊" : "Unfollowed.", nowFollowing ? "success" : "info");
}

// ============================================
// INITIALIZE FEED ON PAGE LOAD
// ============================================

document.addEventListener("DOMContentLoaded", function() {
    renderPosts();
    initPostCreator();
    updateSidebar();
});
