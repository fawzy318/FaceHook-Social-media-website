// ============================================
// FaceHook - Trending Page (trending.js)
// Simple page-level interactions
// ============================================

document.addEventListener("DOMContentLoaded", function() {
    // Initialize polls if the container exists
    if (document.getElementById("polls-container")) {
        renderPolls();
    }
});
