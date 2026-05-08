// ============================================
// FaceHook - Search Page (search.js)
// Search registered users with list/grid views
// ============================================

var currentView = "list";
var currentPage = 1;
var itemsPerPage = 6;
var filteredUsers = [];

// ============================================
// SEARCH USERS
// Filter users by name, username, or weight class
// ============================================

function searchUsers() {
    var input = document.getElementById("search-input");
    var query = input ? input.value.toLowerCase().trim() : "";
    var allUsers = getUsers();

    // Filter users based on search query
    filteredUsers = [];
    for (var i = 0; i < allUsers.length; i++) {
        var u = allUsers[i];
        if (query === "") {
            filteredUsers.push(u);
        } else {
            // Check if query matches name, username, weight class, or bio
            var matchName = u.firstName.toLowerCase().indexOf(query) !== -1;
            var matchLast = u.lastName.toLowerCase().indexOf(query) !== -1;
            var matchUser = u.username.toLowerCase().indexOf(query) !== -1;
            var matchWeight = u.weightClass && u.weightClass.toLowerCase().indexOf(query) !== -1;
            var matchBio = u.bio && u.bio.toLowerCase().indexOf(query) !== -1;

            if (matchName || matchLast || matchUser || matchWeight || matchBio) {
                filteredUsers.push(u);
            }
        }
    }

    currentPage = 1;
    renderSearchResults();
    renderPagination();
}

// ============================================
// SWITCH VIEW MODE
// Toggle between list and grid view
// ============================================

function setView(view) {
    currentView = view;
    var buttons = document.querySelectorAll(".view-toggle-btn");
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active");
    }
    var activeBtn = document.querySelector('[data-view="' + view + '"]');
    if (activeBtn) activeBtn.classList.add("active");
    renderSearchResults();
}

// ============================================
// RENDER SEARCH RESULTS
// Display the filtered users
// ============================================

function renderSearchResults() {
    var container = document.getElementById("search-results");
    if (!container) return;

    // Calculate pagination
    var start = (currentPage - 1) * itemsPerPage;
    var end = start + itemsPerPage;
    if (end > filteredUsers.length) end = filteredUsers.length;

    // Update results count
    var countEl = document.getElementById("results-count");
    if (countEl) {
        if (filteredUsers.length === 0) {
            countEl.textContent = "No users found";
        } else {
            countEl.textContent = "Showing " + (start + 1) + "-" + end + " of " + filteredUsers.length + " users";
        }
    }

    // Get users for this page
    var pageUsers = [];
    for (var i = start; i < end; i++) {
        pageUsers.push(filteredUsers[i]);
    }

    // Empty state
    if (pageUsers.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text-muted);">'
            + '<div style="font-size:4rem;margin-bottom:16px;">🔍</div>'
            + '<h3>No users found</h3>'
            + '<p>Try a different search term.</p></div>';
        container.className = "";
        return;
    }

    var currentUser = getCurrentUser();
    var colors = ["#6C5CE7", "#00CEC9", "#E17055", "#0984E3", "#00B894", "#E84393"];
    var html = "";

    // Build HTML for each user
    for (var j = 0; j < pageUsers.length; j++) {
        var u = pageUsers[j];
        var initials = getUserInitials(u);
        var color = colors[j % colors.length];
        var postCount = getUserPosts(u.id).length;
        var followers = getFollowerCount(u.id);

        if (currentView === "list") {
            html += '<div class="result-item-list animate-fade-in" onclick="window.location.href=\'profile.html?id=' + u.id + '\'">';
            html += '<div class="result-avatar" style="background:' + color + ';color:white;font-weight:700;">' + initials + '</div>';
            html += '<div class="result-info">';
            html += '<h4>' + u.firstName + ' ' + u.lastName + '</h4>';
            html += '<span>@' + u.username + ' · ' + postCount + ' posts</span>';
            html += '</div>';
            if (currentUser && currentUser.id !== u.id) {
                var following = isFollowing(u.id);
                html += '<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();handleSearchFollow(\'' + u.id + '\',this)">';
                html += following ? "Following" : "Follow";
                html += '</button>';
            }
            html += '</div>';
        } else {
            html += '<div class="result-item-grid animate-fade-in" onclick="window.location.href=\'profile.html?id=' + u.id + '\'">';
            html += '<div class="result-avatar" style="background:' + color + ';color:white;font-weight:700;">' + initials + '</div>';
            html += '<div class="result-info">';
            html += '<h4>' + u.firstName + ' ' + u.lastName + '</h4>';
            html += '<span>@' + u.username + '</span>';
            html += '</div>';
            html += '<div class="result-stats">';
            html += '<span><strong>' + postCount + '</strong><br>Posts</span>';
            html += '<span><strong>' + followers + '</strong><br>Followers</span>';
            html += '</div>';
            if (currentUser && currentUser.id !== u.id) {
                var following2 = isFollowing(u.id);
                html += '<button class="btn btn-secondary btn-sm btn-full" style="margin-top:16px;" onclick="event.stopPropagation();handleSearchFollow(\'' + u.id + '\',this)">';
                html += following2 ? "Following" : "Follow";
                html += '</button>';
            }
            html += '</div>';
        }
    }

    container.className = (currentView === "list") ? "search-results-list" : "search-results-grid";
    container.innerHTML = html;
}

// Handle follow button in search results
function handleSearchFollow(userId, btn) {
    if (!isLoggedIn()) {
        showToast("Please log in first!", "warning");
        return;
    }
    var nowFollowing = toggleFollow(userId);
    btn.textContent = nowFollowing ? "Following" : "Follow";
    showToast(nowFollowing ? "Following! 🥊" : "Unfollowed.", nowFollowing ? "success" : "info");
}

// ============================================
// PAGINATION
// ============================================

function renderPagination() {
    var container = document.getElementById("search-pagination");
    if (!container) return;

    var totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    var html = '<button ' + (currentPage === 1 ? "disabled" : "") + ' onclick="goToPage(' + (currentPage - 1) + ')">← Prev</button>';
    for (var i = 1; i <= totalPages; i++) {
        html += '<button class="' + (i === currentPage ? "active" : "") + '" onclick="goToPage(' + i + ')">' + i + '</button>';
    }
    html += '<button ' + (currentPage === totalPages ? "disabled" : "") + ' onclick="goToPage(' + (currentPage + 1) + ')">Next →</button>';
    container.innerHTML = html;
}

function goToPage(page) {
    var totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderSearchResults();
    renderPagination();
}

// ============================================
// INITIALIZE SEARCH ON PAGE LOAD
// ============================================

document.addEventListener("DOMContentLoaded", function() {
    filteredUsers = getUsers();
    renderSearchResults();
    renderPagination();

    var searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("input", searchUsers);
    }
});
