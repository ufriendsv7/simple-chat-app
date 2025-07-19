// Socket.IO 연결
const socket = io();

// DOM 요소들
const messagesContainer = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const userList = document.getElementById('user-list');
const currentUserSpan = document.getElementById('current-user');
const changeNameBtn = document.getElementById('change-name-btn');
const nameModal = document.getElementById('name-modal');
const nameForm = document.getElementById('name-form');
const newNameInput = document.getElementById('new-name-input');
const cancelNameBtn = document.getElementById('cancel-name-btn');

// 현재 사용자 정보
let currentUser = null;

// 메시지 전송
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    
    if (message) {
        socket.emit('sendMessage', { text: message });
        messageInput.value = '';
    }
});

// Enter 키로 메시지 전송
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        messageForm.dispatchEvent(new Event('submit'));
    }
});

// 이름 변경 모달
changeNameBtn.addEventListener('click', () => {
    nameModal.style.display = 'block';
    newNameInput.focus();
});

cancelNameBtn.addEventListener('click', () => {
    nameModal.style.display = 'none';
    newNameInput.value = '';
});

// 모달 외부 클릭 시 닫기
nameModal.addEventListener('click', (e) => {
    if (e.target === nameModal) {
        nameModal.style.display = 'none';
        newNameInput.value = '';
    }
});

// 이름 변경 폼 제출
nameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newName = newNameInput.value.trim();
    
    if (newName && newName.length <= 20) {
        socket.emit('changeName', newName);
        nameModal.style.display = 'none';
        newNameInput.value = '';
    }
});

// 메시지 추가 함수
function addMessage(message, type = 'message') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    if (type === 'system') {
        messageDiv.className = 'system-message';
        messageDiv.textContent = message;
    } else {
        const isOwnMessage = currentUser && message.id === socket.id;
        messageDiv.className = `message ${isOwnMessage ? 'own' : 'other'}`;
        
        const time = new Date(message.timestamp).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-user">${message.user}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content">${escapeHtml(message.text)}</div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// 사용자 목록 업데이트
function updateUserList(users) {
    userList.innerHTML = '';
    
    if (users.length === 0) {
        userList.innerHTML = '<div class="loading">접속자가 없습니다.</div>';
        return;
    }
    
    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item online';
        userDiv.textContent = user.name;
        userList.appendChild(userDiv);
    });
}

// 스크롤을 맨 아래로
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// HTML 이스케이프 함수
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 시간 포맷팅 함수
function formatTime(date) {
    return new Date(date).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Socket.IO 이벤트 리스너들

// 연결 성공
socket.on('connect', () => {
    console.log('서버에 연결되었습니다.');
});

// 새 메시지 수신
socket.on('newMessage', (message) => {
    addMessage(message);
});

// 사용자 입장
socket.on('userJoined', (data) => {
    addMessage(data.message, 'system');
    updateUserList(data.users || []);
});

// 사용자 퇴장
socket.on('userLeft', (data) => {
    addMessage(data.message, 'system');
    updateUserList(data.users || []);
});

// 사용자 목록 업데이트
socket.on('userList', (users) => {
    updateUserList(users);
    
    // 현재 사용자 찾기
    currentUser = users.find(user => user.id === socket.id);
    if (currentUser) {
        currentUserSpan.textContent = currentUser.name;
    }
});

// 이름 변경 알림
socket.on('nameChanged', (data) => {
    addMessage(data.message, 'system');
    
    // 현재 사용자 이름 업데이트
    if (data.userId === socket.id) {
        currentUserSpan.textContent = data.newName;
    }
});

// 연결 해제
socket.on('disconnect', () => {
    console.log('서버와의 연결이 끊어졌습니다.');
    addMessage('서버와의 연결이 끊어졌습니다. 다시 연결을 시도합니다...', 'system');
});

// 재연결
socket.on('reconnect', () => {
    console.log('서버에 재연결되었습니다.');
    addMessage('서버에 재연결되었습니다.', 'system');
});

// 페이지 로드 시 스크롤을 맨 아래로
window.addEventListener('load', () => {
    scrollToBottom();
});

// 입력 필드 자동 포커스
messageInput.focus();

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter로 이름 변경 모달 열기
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        changeNameBtn.click();
    }
    
    // Escape로 모달 닫기
    if (e.key === 'Escape' && nameModal.style.display === 'block') {
        nameModal.style.display = 'none';
        newNameInput.value = '';
    }
});
