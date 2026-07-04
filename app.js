// ==========================================
// 1. APPLICATION STATE
// ==========================================
const state = {
    currentUser: null,
    currentRoom: 'global', // Tracks 'global', server names, or DM user keys
    peer: null,
    activeCall: null,
    localStream: null,
    isSignUp: false
};

// ==========================================
// 2. DOM ELEMENTS (Matching your HTML perfectly)
// ==========================================
const DOM = {
    // Auth elements
    authContainer: document.getElementById('auth-container'),
    authForm: document.getElementById('auth-form'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    submitBtn: document.getElementById('submit-btn'),
    toggleLink: document.getElementById('toggle-link'),
    
    // Main layout frames
    appContainer: document.getElementById('app-container'),
    chatMessages: document.getElementById('chat-messages'),
    chatForm: document.getElementById('chat-form'),
    messageInput: document.getElementById('message-input'),
    roomTitle: document.getElementById('current-room-title'),
    
    // Sidebar components
    myProfileDisplay: document.getElementById('my-profile-display'),
    myAvatar: document.getElementById('my-avatar'),
    myDisplayName: document.getElementById('my-displayName'),
    targetPublic: document.getElementById('target-public'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Feature modals
    settingsModal: document.getElementById('settings-modal'),
    settingsForm: document.getElementById('settings-form'),
    settingsNameInput: document.getElementById('settings-name-input'),
    settingsAvatarInput: document.getElementById('settings-avatar-input'),
    closeSettingsModal: document.getElementById('close-settings-modal'),
    
    // Video elements
    callBtn: document.getElementById('call-btn'),
    videoCallModal: document.getElementById('video-call-modal'),
    localVideo: document.getElementById('local-video'),
    remoteVideo: document.getElementById('remote-video'),
    endCallBtn: document.getElementById('end-call-btn')
};

// ==========================================
// 3. AUTHENTICATION & LOGIN/SIGNUP TOGGLE
// ==========================================
DOM.toggleLink.addEventListener('click', () => {
    state.isSignUp = !state.isSignUp;
    DOM.submitBtn.innerText = state.isSignUp ? 'Sign Up' : 'Login';
    document.getElementById('toggle-auth').innerHTML = state.isSignUp 
        ? `Already have an account? <span id="toggle-link" style="color: #5865f2; cursor: pointer;">Login</span>`
        : `Don't have an account? <span id="toggle-link" style="color: #5865f2; cursor: pointer;">Sign Up</span>`;
    
    // Rebind the click listener since innerHTML destroys the old reference
    document.getElementById('toggle-link').addEventListener('click', () => DOM.toggleLink.click());
});

DOM.authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = DOM.emailInput.value.trim();
    
    // Setup a user profile profile object based on input data
    const userProfile = {
        email: email,
        displayName: email.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`
    };
    
    loginUser(userProfile);
});

function loginUser(user) {
    state.currentUser = user;
    
    // Hide auth screen, reveal the chat workspace application view
    DOM.authContainer.classList.add('hidden');
    DOM.appContainer.classList.remove('hidden');
    
    // Pop data into sidebar layout fields
    DOM.myDisplayName.innerText = user.displayName;
    DOM.myAvatar.src = user.avatar;
    
    // Initialize PeerJS mesh using a safe clean version of user email
    const peerId = btoa(user.email).replace(/[^a-zA-Z0-9]/g, "").substring(0, 12);
    initNetworking(peerId);
}

// ==========================================
// 4. NETWORKING (PeerJS Engine Integration)
// ==========================================
function initNetworking(id) {
    state.peer = new Peer(`acm-${id}`);
    
    state.peer.on('open', (myPeerId) => {
        console.log(`Successfully connected online via secure dynamic peer ID: ${myPeerId}`);
    });
    
    state.peer.on('call', (incomingCall) => {
        if (confirm(`Incoming face call from other user connection. Answer?`)) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
                state.localStream = stream;
                DOM.localVideo.srcObject = stream;
                DOM.videoCallModal.classList.remove('hidden');
                
                incomingCall.answer(stream);
                handleStreamConnections(incomingCall);
            });
        }
    });
}

// ==========================================
// 5. SETTINGS CONTROL MODALS
// ==========================================
DOM.myProfileDisplay.addEventListener('click', () => {
    DOM.settingsNameInput.value = state.currentUser.displayName;
    DOM.settingsAvatarInput.value = state.currentUser.avatar;
    DOM.settingsModal.classList.remove('hidden');
});

DOM.closeSettingsModal.addEventListener('click', () => {
    DOM.settingsModal.classList.add('hidden');
});

DOM.settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.currentUser.displayName = DOM.settingsNameInput.value.trim();
    if (DOM.settingsAvatarInput.value.trim()) {
        state.currentUser.avatar = DOM.settingsAvatarInput.value.trim();
    }
    
    DOM.myDisplayName.innerText = state.currentUser.displayName;
    DOM.myAvatar.src = state.currentUser.avatar;
    DOM.settingsModal.classList.add('hidden');
});

DOM.logoutBtn.addEventListener('click', () => {
    window.location.reload();
});

// ==========================================
// 6. CHANNEL SWITCHING UI
// ==========================================
DOM.targetPublic.addEventListener('click', () => {
    state.currentRoom = 'global';
    DOM.roomTitle.innerText = 'Global Chat';
    DOM.callBtn.classList.add('hidden'); // Calls are hidden in global lobby rooms
});

// ==========================================
// 7. MESSAGE PROCESSING PIPELINE
// ==========================================
DOM.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = DOM.messageInput.value.trim();
    if (!text) return;
    
    appendNewMessage({
        user: state.currentUser.displayName,
        avatar: state.currentUser.avatar,
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    
    DOM.messageInput.value = '';
});

function appendNewMessage(msg) {
    const msgElement = document.createElement('div');
    msgElement.style.display = 'flex';
    msgElement.style.gap = '10px';
    msgElement.style.marginBottom = '12px';
    msgElement.style.alignItems = 'flex-start';
    
    msgElement.innerHTML = `
        <img src="${msg.avatar}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; margin-top: 2px;">
        <div>
            <div style="display: flex; gap: 8px; align-items: center;">
                <span style="font-weight: bold; font-size: 14px; color: #fff;">${msg.user}</span>
                <span style="font-size: 10px; color: #b9bbbe;">${msg.time}</span>
            </div>
            <div style="font-size: 14px; color: #dcddde; margin-top: 4px; word-break: break-word;">${msg.text}</div>
        </div>
    `;
    
    DOM.chatMessages.appendChild(msgElement);
    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
}

// ==========================================
// 8. WEBRTC LIVE VIDEO FUNCTIONALITY
// ==========================================
function handleStreamConnections(call) {
    state.activeCall = call;
    call.on('stream', (remoteStream) => {
        DOM.remoteVideo.srcObject = remoteStream;
    });
    call.on('close', cleanUpVideoWindow);
}

DOM.endCallBtn.addEventListener('click', () => {
    if (state.activeCall) state.activeCall.close();
    cleanUpVideoWindow();
});

function cleanUpVideoWindow() {
    DOM.videoCallModal.classList.add('hidden');
    if (state.localStream) {
        state.localStream.getTracks().forEach(track => track.stop());
        state.localStream = null;
    }
    DOM.localVideo.srcObject = null;
    DOM.remoteVideo.srcObject = null;
}
