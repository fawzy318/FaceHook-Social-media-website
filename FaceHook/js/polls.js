// ============================================
// FaceHook - Polls Page (polls.js)
// Create polls and vote on options
// ============================================

// ============================================
// RENDER ALL POLLS
// ============================================

function renderPolls() {
    var container = document.getElementById("polls-container");
    if (!container) return;

    var polls = getPolls();

    // Empty state
    if (polls.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);">'
            + '<div style="font-size:4rem;margin-bottom:16px;">📊</div>'
            + '<h3>No polls yet!</h3>'
            + '<p>Create the first poll for the community.</p></div>';
        return;
    }

    var currentUser = getCurrentUser();
    var html = "";

    // Build HTML for each poll
    for (var i = 0; i < polls.length; i++) {
        var poll = polls[i];

        // Count total votes
        var totalVotes = 0;
        for (var j = 0; j < poll.options.length; j++) {
            totalVotes = totalVotes + poll.options[j].votes.length;
        }

        // Check if current user has voted
        var hasVoted = false;
        if (currentUser) {
            for (var k = 0; k < poll.options.length; k++) {
                if (poll.options[k].votes.indexOf(currentUser.id) !== -1) {
                    hasVoted = true;
                    break;
                }
            }
        }

        html += '<div class="card" style="padding:24px;margin-bottom:20px;">';
        html += '<h3 style="margin-bottom:16px;">📊 ' + poll.question + '</h3>';
        html += '<span style="font-size:0.85rem;color:var(--text-muted);">' + totalVotes + ' total votes · ' + timeAgo(poll.createdAt) + '</span>';
        html += '<div style="margin-top:16px;">';

        // Render each option
        for (var m = 0; m < poll.options.length; m++) {
            var option = poll.options[m];
            var percent = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;

            if (hasVoted) {
                // Show results
                html += '<div style="margin-bottom:12px;">';
                html += '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">';
                html += '<span>' + option.text + '</span>';
                html += '<span style="font-weight:600;">' + percent + '% (' + option.votes.length + ')</span>';
                html += '</div>';
                html += '<div style="background:var(--bg-elevated);border-radius:8px;height:8px;overflow:hidden;">';
                html += '<div style="height:100%;border-radius:8px;background:var(--primary);width:' + percent + '%;transition:width 0.5s;"></div>';
                html += '</div></div>';
            } else {
                // Show vote buttons
                html += '<button class="btn btn-ghost btn-full" style="margin-bottom:8px;text-align:left;" onclick="handleVote(\'' + poll.id + '\',' + m + ')">';
                html += option.text;
                html += '</button>';
            }
        }

        html += '</div></div>';
    }

    container.innerHTML = html;
}

// ============================================
// HANDLE VOTING
// ============================================

function handleVote(pollId, optionIndex) {
    if (!isLoggedIn()) {
        showToast("Please log in to vote!", "warning");
        return;
    }

    var result = votePoll(pollId, optionIndex);
    if (result) {
        showToast("Vote recorded! 🎉", "success");
        renderPolls();
    } else {
        showToast("You already voted on this poll.", "info");
    }
}

// ============================================
// CREATE NEW POLL
// ============================================

function handleCreatePoll() {
    if (!isLoggedIn()) {
        showToast("Please log in first!", "warning");
        return;
    }
    openModal("poll-modal");
}

function submitPoll() {
    var question = document.getElementById("poll-question");
    if (!question || !question.value.trim()) {
        showToast("Enter a poll question.", "warning");
        return;
    }

    // Get options
    var options = [];
    var optionInputs = document.querySelectorAll(".poll-option-input");
    for (var i = 0; i < optionInputs.length; i++) {
        var val = optionInputs[i].value.trim();
        if (val) {
            options.push(val);
        }
    }

    if (options.length < 2) {
        showToast("Add at least 2 options.", "warning");
        return;
    }

    createPoll(question.value.trim(), options);
    showToast("Poll created! 🎉", "success");
    closeModal("poll-modal");
    question.value = "";
    for (var j = 0; j < optionInputs.length; j++) {
        optionInputs[j].value = "";
    }
    renderPolls();
}

// ============================================
// INITIALIZE POLLS ON PAGE LOAD
// ============================================

document.addEventListener("DOMContentLoaded", function() {
    renderPolls();
});
