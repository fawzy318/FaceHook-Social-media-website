// ============================================
// FaceHook - Data Storage (data.js)
// This file handles saving and loading data
// using the browser's localStorage.
// All data is stored as JSON strings.
// ============================================

// --- Storage Key Names ---
// We use these keys to store data in localStorage
var STORAGE_KEYS = {
    users: "fh-users",
    currentUser: "fh-current-user",
    posts: "fh-posts",
    messages: "fh-messages",
    threads: "fh-threads",
    polls: "fh-polls",
    follows: "fh-follows",
    reports: "fh-reports",
    notifications: "fh-notifications"
};

// ============================================
// HELPER FUNCTIONS
// These functions help us read/write localStorage
// ============================================

// Get data from localStorage and parse it from JSON
function getData(key) {
    var data = localStorage.getItem(key);
    if (data) {
        return JSON.parse(data);
    }
    return null;
}

// Save data to localStorage as a JSON string
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Generate a unique ID using random numbers
function generateId() {
    return "id-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
}

// Get the initials from a user's name (e.g., "Mike Tyson" -> "MT")
function getUserInitials(user) {
    if (!user) return "?";
    var first = user.firstName ? user.firstName[0] : "";
    var last = user.lastName ? user.lastName[0] : "";
    return (first + last).toUpperCase();
}

// Format a date to show how long ago it was
function timeAgo(dateString) {
    var now = new Date();
    var date = new Date(dateString);
    var seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
    if (seconds < 604800) return Math.floor(seconds / 86400) + "d ago";
    return date.toLocaleDateString();
}

// ============================================
// USER FUNCTIONS
// Register, login, logout, and manage users
// ============================================

// Get all registered users from localStorage
function getUsers() {
    var users = getData(STORAGE_KEYS.users);
    if (!users) return [];
    return users;
}

// Save the users array to localStorage
function saveUsers(users) {
    saveData(STORAGE_KEYS.users, users);
}

// Find a user by their ID
function getUserById(userId) {
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
        if (users[i].id === userId) {
            return users[i];
        }
    }
    return null;
}

// Find a user by their email
function getUserByEmail(email) {
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
        if (users[i].email === email) {
            return users[i];
        }
    }
    return null;
}

// Find a user by their username
function getUserByUsername(username) {
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
        if (users[i].username === username) {
            return users[i];
        }
    }
    return null;
}

// Register a new user account
function registerUser(firstName, lastName, username, email, password, weightClass, bio) {
    // Check if email already exists
    if (getUserByEmail(email)) {
        return { success: false, message: "Email already registered!" };
    }

    // Check if username already exists
    if (getUserByUsername(username)) {
        return { success: false, message: "Username already taken!" };
    }

    // Create the user object
    var newUser = {
        id: generateId(),
        firstName: firstName,
        lastName: lastName,
        username: username,
        email: email,
        password: password,
        weightClass: weightClass || "",
        bio: bio || "",
        role: "member",
        banned: false,
        joinDate: new Date().toISOString()
    };

    // First user gets admin role
    var users = getUsers();
    if (users.length === 0) {
        newUser.role = "admin";
    }

    // Add to users array and save
    users.push(newUser);
    saveUsers(users);

    // Auto-login the new user
    loginUserById(newUser.id);

    return { success: true, message: "Account created!", user: newUser };
}

// Login user by checking email and password
function loginUser(email, password) {
    var user = getUserByEmail(email);
    if (!user) {
        return { success: false, message: "No account found with this email." };
    }
    if (user.password !== password) {
        return { success: false, message: "Incorrect password." };
    }
    if (user.banned) {
        return { success: false, message: "Your account has been banned." };
    }

    // Save the current user ID
    loginUserById(user.id);
    return { success: true, message: "Welcome back!", user: user };
}

// Save the current user's ID to localStorage
function loginUserById(userId) {
    localStorage.setItem(STORAGE_KEYS.currentUser, userId);
}

// Get the currently logged in user
function getCurrentUser() {
    var userId = localStorage.getItem(STORAGE_KEYS.currentUser);
    if (!userId) return null;
    return getUserById(userId);
}

// Check if someone is logged in
function isLoggedIn() {
    return getCurrentUser() !== null;
}

// Logout - remove current user from localStorage
function logoutUser() {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
}

// Update a user's information
function updateUser(userId, updates) {
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
        if (users[i].id === userId) {
            // Update each field that was provided
            if (updates.firstName) users[i].firstName = updates.firstName;
            if (updates.lastName) users[i].lastName = updates.lastName;
            if (updates.email) users[i].email = updates.email;
            if (updates.username) users[i].username = updates.username;
            if (updates.bio !== undefined) users[i].bio = updates.bio;
            if (updates.weightClass) users[i].weightClass = updates.weightClass;
            break;
        }
    }
    saveUsers(users);
}

// Delete a user from the system
function deleteUser(userId) {
    var users = getUsers();
    var newUsers = [];
    for (var i = 0; i < users.length; i++) {
        if (users[i].id !== userId) {
            newUsers.push(users[i]);
        }
    }
    saveUsers(newUsers);
}

// Toggle ban status of a user
function toggleBanUser(userId) {
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
        if (users[i].id === userId) {
            users[i].banned = !users[i].banned;
            saveUsers(users);
            return users[i].banned;
        }
    }
    return false;
}

// ============================================
// POST FUNCTIONS
// Create, delete, like, and comment on posts
// ============================================

// Get all posts from localStorage (newest first)
function getPosts() {
    var posts = getData(STORAGE_KEYS.posts);
    if (!posts) return [];
    // Sort by date - newest first
    posts.sort(function(a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return posts;
}

// Save the posts array to localStorage
function savePosts(posts) {
    saveData(STORAGE_KEYS.posts, posts);
}

// Create a new post
function createPost(content, image) {
    var user = getCurrentUser();
    if (!user) return null;

    var post = {
        id: generateId(),
        authorId: user.id,
        authorName: user.firstName + " " + user.lastName,
        authorUsername: "@" + user.username,
        content: content,
        image: image || null,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString()
    };

    var posts = getPosts();
    posts.push(post);
    savePosts(posts);
    return post;
}

// Delete a post by its ID
function deletePost(postId) {
    var posts = getPosts();
    var newPosts = [];
    for (var i = 0; i < posts.length; i++) {
        if (posts[i].id !== postId) {
            newPosts.push(posts[i]);
        }
    }
    savePosts(newPosts);
}

// Get posts by a specific user
function getUserPosts(userId) {
    var posts = getPosts();
    var userPosts = [];
    for (var i = 0; i < posts.length; i++) {
        if (posts[i].authorId === userId) {
            userPosts.push(posts[i]);
        }
    }
    return userPosts;
}

// Toggle like on a post (add or remove like)
function toggleLike(postId) {
    var user = getCurrentUser();
    if (!user) return null;

    var posts = getPosts();
    for (var i = 0; i < posts.length; i++) {
        if (posts[i].id === postId) {
            // Check if user already liked
            var likeIndex = posts[i].likes.indexOf(user.id);
            if (likeIndex === -1) {
                // Add like
                posts[i].likes.push(user.id);
            } else {
                // Remove like
                posts[i].likes.splice(likeIndex, 1);
            }
            savePosts(posts);
            return posts[i];
        }
    }
    return null;
}

// Add a comment to a post
function addComment(postId, text) {
    var user = getCurrentUser();
    if (!user) return null;

    var comment = {
        id: generateId(),
        authorId: user.id,
        authorName: user.firstName + " " + user.lastName,
        text: text,
        createdAt: new Date().toISOString()
    };

    var posts = getPosts();
    for (var i = 0; i < posts.length; i++) {
        if (posts[i].id === postId) {
            posts[i].comments.push(comment);
            savePosts(posts);
            return comment;
        }
    }
    return null;
}

// ============================================
// MESSAGE FUNCTIONS
// Send and receive chat messages
// ============================================

// Get all messages from localStorage
function getMessages() {
    var messages = getData(STORAGE_KEYS.messages);
    if (!messages) return [];
    return messages;
}

// Save messages to localStorage
function saveMessages(messages) {
    saveData(STORAGE_KEYS.messages, messages);
}

// Send a message to another user
function sendMessage(receiverId, text) {
    var user = getCurrentUser();
    if (!user) return null;

    var message = {
        id: generateId(),
        senderId: user.id,
        receiverId: receiverId,
        text: text,
        createdAt: new Date().toISOString()
    };

    var messages = getMessages();
    messages.push(message);
    saveMessages(messages);
    return message;
}

// Get messages between current user and a partner
function getMessagesWith(partnerId) {
    var user = getCurrentUser();
    if (!user) return [];

    var allMessages = getMessages();
    var conversation = [];

    for (var i = 0; i < allMessages.length; i++) {
        var msg = allMessages[i];
        // Check if message is between the two users
        var isFromMe = msg.senderId === user.id && msg.receiverId === partnerId;
        var isToMe = msg.senderId === partnerId && msg.receiverId === user.id;
        if (isFromMe || isToMe) {
            conversation.push(msg);
        }
    }

    // Sort by date
    conversation.sort(function(a, b) {
        return new Date(a.createdAt) - new Date(b.createdAt);
    });

    return conversation;
}

// Get list of conversations (unique partners)
function getConversations() {
    var user = getCurrentUser();
    if (!user) return [];

    var allMessages = getMessages();
    var partners = {};

    // Find all unique conversation partners
    for (var i = 0; i < allMessages.length; i++) {
        var msg = allMessages[i];
        var partnerId = null;

        if (msg.senderId === user.id) {
            partnerId = msg.receiverId;
        } else if (msg.receiverId === user.id) {
            partnerId = msg.senderId;
        }

        if (partnerId) {
            // Keep the latest message for each partner
            if (!partners[partnerId] || new Date(msg.createdAt) > new Date(partners[partnerId].createdAt)) {
                partners[partnerId] = msg;
            }
        }
    }

    // Convert to array
    var result = [];
    for (var pid in partners) {
        result.push({
            partnerId: pid,
            lastMessage: partners[pid]
        });
    }

    return result;
}

// ============================================
// FORUM FUNCTIONS
// Create threads and add replies
// ============================================

// Get all forum threads
function getThreads() {
    var threads = getData(STORAGE_KEYS.threads);
    if (!threads) return [];
    // Sort newest first
    threads.sort(function(a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return threads;
}

// Save threads to localStorage
function saveThreads(threads) {
    saveData(STORAGE_KEYS.threads, threads);
}

// Create a new forum thread
function createThread(title, category, content) {
    var user = getCurrentUser();
    if (!user) return null;

    var thread = {
        id: generateId(),
        title: title,
        category: category,
        content: content,
        authorId: user.id,
        authorName: user.firstName + " " + user.lastName,
        authorUsername: "@" + user.username,
        replies: [],
        views: 0,
        createdAt: new Date().toISOString()
    };

    var threads = getThreads();
    threads.push(thread);
    saveThreads(threads);
    return thread;
}

// Find a thread by its ID
function getThreadById(threadId) {
    var threads = getThreads();
    for (var i = 0; i < threads.length; i++) {
        if (threads[i].id === threadId) {
            return threads[i];
        }
    }
    return null;
}

// Add a reply to a thread
function addReply(threadId, text) {
    var user = getCurrentUser();
    if (!user) return null;

    var reply = {
        id: generateId(),
        authorId: user.id,
        authorName: user.firstName + " " + user.lastName,
        text: text,
        createdAt: new Date().toISOString()
    };

    var threads = getThreads();
    for (var i = 0; i < threads.length; i++) {
        if (threads[i].id === threadId) {
            threads[i].replies.push(reply);
            saveThreads(threads);
            return reply;
        }
    }
    return null;
}

// ============================================
// POLL FUNCTIONS
// Create polls and vote
// ============================================

// Get all polls
function getPolls() {
    var polls = getData(STORAGE_KEYS.polls);
    if (!polls) return [];
    return polls;
}

// Save polls to localStorage
function savePolls(polls) {
    saveData(STORAGE_KEYS.polls, polls);
}

// Create a new poll
function createPoll(question, options) {
    var user = getCurrentUser();
    if (!user) return null;

    // Build the options array with empty vote arrays
    var pollOptions = [];
    for (var i = 0; i < options.length; i++) {
        pollOptions.push({
            text: options[i],
            votes: []
        });
    }

    var poll = {
        id: generateId(),
        question: question,
        options: pollOptions,
        authorId: user.id,
        createdAt: new Date().toISOString()
    };

    var polls = getPolls();
    polls.push(poll);
    savePolls(polls);
    return poll;
}

// Vote on a poll option
function votePoll(pollId, optionIndex) {
    var user = getCurrentUser();
    if (!user) return null;

    var polls = getPolls();
    for (var i = 0; i < polls.length; i++) {
        if (polls[i].id === pollId) {
            // Check if user already voted
            for (var j = 0; j < polls[i].options.length; j++) {
                if (polls[i].options[j].votes.indexOf(user.id) !== -1) {
                    return null; // Already voted
                }
            }
            // Add vote
            polls[i].options[optionIndex].votes.push(user.id);
            savePolls(polls);
            return polls[i];
        }
    }
    return null;
}

// ============================================
// FOLLOW FUNCTIONS
// Follow and unfollow other users
// ============================================

// Get all follow relationships
function getFollows() {
    var follows = getData(STORAGE_KEYS.follows);
    if (!follows) return [];
    return follows;
}

// Save follows to localStorage
function saveFollows(follows) {
    saveData(STORAGE_KEYS.follows, follows);
}

// Toggle follow/unfollow a user
function toggleFollow(targetId) {
    var user = getCurrentUser();
    if (!user) return false;

    var follows = getFollows();

    // Check if already following
    for (var i = 0; i < follows.length; i++) {
        if (follows[i].followerId === user.id && follows[i].followingId === targetId) {
            // Unfollow - remove this entry
            follows.splice(i, 1);
            saveFollows(follows);
            return false; // Not following anymore
        }
    }

    // Follow - add new entry
    follows.push({
        followerId: user.id,
        followingId: targetId
    });
    saveFollows(follows);
    return true; // Now following
}

// Check if current user is following a target user
function isFollowing(targetId) {
    var user = getCurrentUser();
    if (!user) return false;

    var follows = getFollows();
    for (var i = 0; i < follows.length; i++) {
        if (follows[i].followerId === user.id && follows[i].followingId === targetId) {
            return true;
        }
    }
    return false;
}

// Count how many followers a user has
function getFollowerCount(userId) {
    var follows = getFollows();
    var count = 0;
    for (var i = 0; i < follows.length; i++) {
        if (follows[i].followingId === userId) {
            count++;
        }
    }
    return count;
}

// Count how many users a user is following
function getFollowingCount(userId) {
    var follows = getFollows();
    var count = 0;
    for (var i = 0; i < follows.length; i++) {
        if (follows[i].followerId === userId) {
            count++;
        }
    }
    return count;
}

// ============================================
// REPORT FUNCTIONS
// Submit and manage user reports
// ============================================

// Get all reports
function getReports() {
    var reports = getData(STORAGE_KEYS.reports);
    if (!reports) return [];
    return reports;
}

// Save reports to localStorage
function saveReports(reports) {
    saveData(STORAGE_KEYS.reports, reports);
}

// Submit a report
function submitReport(targetId, targetType, reason, details) {
    var user = getCurrentUser();
    if (!user) return null;

    var report = {
        id: generateId(),
        reporterId: user.id,
        targetId: targetId,
        targetType: targetType,
        reason: reason,
        details: details || "",
        createdAt: new Date().toISOString()
    };

    var reports = getReports();
    reports.push(report);
    saveReports(reports);
    return report;
}

// Delete a report
function deleteReport(reportId) {
    var reports = getReports();
    var newReports = [];
    for (var i = 0; i < reports.length; i++) {
        if (reports[i].id !== reportId) {
            newReports.push(reports[i]);
        }
    }
    saveReports(newReports);
}

// ============================================
// STATISTICS FUNCTION
// Get site-wide and user stats
// ============================================

function getStats() {
    var user = getCurrentUser();
    var posts = getPosts();
    var threads = getThreads();
    var reports = getReports();
    var users = getUsers();

    // Count likes and comments on current user's posts
    var myLikes = 0;
    var myComments = 0;
    var myPosts = 0;

    if (user) {
        for (var i = 0; i < posts.length; i++) {
            if (posts[i].authorId === user.id) {
                myPosts++;
                myLikes = myLikes + posts[i].likes.length;
                myComments = myComments + posts[i].comments.length;
            }
        }
    }

    return {
        totalUsers: users.length,
        totalPosts: posts.length,
        totalThreads: threads.length,
        pendingReports: reports.length,
        myPosts: myPosts,
        myFollowers: user ? getFollowerCount(user.id) : 0,
        myLikes: myLikes,
        myComments: myComments
    };
}
