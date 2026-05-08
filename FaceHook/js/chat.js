// ============================================
// FaceHook - Chat Page (chat.js)
// Handles messaging between users
// ============================================

var currentPartnerId = null;

// ============================================
// RENDER CONVERSATION LIST
// Show all chat contacts in the sidebar
// ============================================

function renderConversations() {
    var container = document.getElementById("chat-contacts");
    if (!container) return;

    var conversations = getConversations();

    // If no conversations, show empty state
    if (conversations.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);">'
            + '<div style="font-size:2rem;margin-bottom:8px;">💬</div>'
            + '<p style="font-size:0.85rem;">No conversations yet.<br>Visit a profile to start a chat!</p>'
            + '</div>';
        return;
    }

    // Build HTML for each conversation
    var html = "";
    for (var i = 0; i < conversations.length; i++) {
        var convo = conversations[i];
        var partner = getUserById(convo.partnerId);
        if (!partner) continue;

        var initials = getUserInitials(partner);
        var lastMsg = convo.lastMessage;
        var isActive = convo.partnerId === currentPartnerId;
        var preview = lastMsg ? lastMsg.text.substring(0, 30) : "";
        if (lastMsg && lastMsg.text.length > 30) preview += "...";

        html += '<div class="chat-contact ' + (isActive ? "active" : "") + '" onclick="openConversation(\'' + convo.partnerId + '\')">';
        html += '<div class="avatar avatar-sm" style="display:flex;align-items:center;justify-content:center;background:var(--primary);font-size:0.8rem;color:white;font-weight:700;min-width:36px;">' + initials + '</div>';
        html += '<div class="contact-info">';
        html += '<h5>' + partner.firstName + ' ' + partner.lastName + '</h5>';
        html += '<span>' + preview + '</span>';
        html += '</div>';
        html += '<span class="contact-time">' + (lastMsg ? timeAgo(lastMsg.createdAt) : "") + '</span>';
        html += '</div>';
    }

    container.innerHTML = html;
}

// ============================================
// OPEN A CONVERSATION
// Load messages with a specific user
// ============================================

function openConversation(partnerId) {
    currentPartnerId = partnerId;
    renderConversations(); // Update active state
    renderChatMessages();

    // Update header with partner name
    var partner = getUserById(partnerId);
    var nameEl = document.getElementById("chat-partner-name");
    if (nameEl && partner) {
        nameEl.textContent = partner.firstName + " " + partner.lastName;
    }

    var headerAvatar = document.getElementById("chat-header-avatar");
    if (headerAvatar && partner) {
        headerAvatar.textContent = getUserInitials(partner);
    }
}

// ============================================
// RENDER MESSAGES
// Display messages in the chat window
// ============================================

function renderChatMessages() {
    var container = document.getElementById("chat-messages");
    if (!container || !currentPartnerId) {
        if (container) {
            container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">'
                + '<div style="text-align:center;">'
                + '<div style="font-size:4rem;margin-bottom:16px;">💬</div>'
                + '<p>Select a conversation or start a new one.</p>'
                + '</div></div>';
        }
        return;
    }

    var currentUser = getCurrentUser();
    var messages = getMessagesWith(currentPartnerId);

    if (messages.length === 0) {
        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">'
            + '<p>No messages yet. Say hello! 🥊</p></div>';
        return;
    }

    // Build messages HTML
    var html = "";
    for (var i = 0; i < messages.length; i++) {
        var msg = messages[i];
        var isSent = msg.senderId === currentUser.id;
        html += '<div class="message ' + (isSent ? "sent" : "received") + '">';
        html += msg.text;
        html += '<span class="msg-time">' + timeAgo(msg.createdAt) + '</span>';
        html += '</div>';
    }

    container.innerHTML = html;
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// ============================================
// SEND A MESSAGE
// ============================================

function handleSendMessage() {
    if (!isLoggedIn()) {
        showToast("Please log in first!", "warning");
        return;
    }
    if (!currentPartnerId) {
        showToast("Select a conversation first!", "warning");
        return;
    }

    var input = document.getElementById("chat-input");
    if (!input || !input.value.trim()) return;

    sendMessage(currentPartnerId, input.value.trim());
    input.value = "";
    renderChatMessages();
    renderConversations();
}

// ============================================
// INITIALIZE CHAT ON PAGE LOAD
// ============================================

document.addEventListener("DOMContentLoaded", function() {
    if (!requireAuth()) return;

    // Check URL for partner parameter
    var urlParams = new URLSearchParams(window.location.search);
    var partnerId = urlParams.get("partner");

    renderConversations();

    if (partnerId) {
        currentPartnerId = partnerId;
        openConversation(partnerId);
    }

    // Send message on Enter key
    var input = document.getElementById("chat-input");
    if (input) {
        input.addEventListener("keypress", function(e) {
            if (e.key === "Enter") handleSendMessage();
        });
    }
});
