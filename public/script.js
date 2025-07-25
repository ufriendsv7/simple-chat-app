// Socket.IO 연결
const socket = io({
    transports: ['websocket', 'polling'],
    timeout: 20000,
    forceNew: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    maxReconnectionAttempts: 10
});

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
const connectionStatus = document.getElementById('connection-status');
const accessModal = document.getElementById('access-modal');
const accessForm = document.getElementById('access-form');
const accessInput = document.getElementById('access-input');
const accessError = document.getElementById('access-error');
const chatContainer = document.getElementById('chat-container');

const ACCESS_CODE = '1234';
const ACCESS_KEY = 'chat_access_granted';

function showChat() {
    accessModal.style.display = 'none';
    chatContainer.style.display = 'block';
}

function showAccessModal() {
    accessModal.style.display = 'flex';
    chatContainer.style.display = 'none';
    accessInput.value = '';
    accessError.textContent = '';
    setTimeout(() => accessInput.focus(), 100);
}

function checkAccess() {
    if (localStorage.getItem(ACCESS_KEY) === 'true') {
        showChat();
    } else {
        showAccessModal();
    }
}

accessForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (accessInput.value === ACCESS_CODE) {
        localStorage.setItem(ACCESS_KEY, 'true');
        showChat();
    } else {
        accessError.textContent = '코드가 올바르지 않습니다.';
        accessInput.value = '';
        accessInput.focus();
    }
});

// window.onload로 변경
window.onload = checkAccess;

// 현재 사용자 정보
let currentUser = null;

// 모바일 환경 감지
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// 모바일에서 뷰포트 높이 조정
function adjustViewportHeight() {
    if (isMobile) {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // 입력창이 보이도록 강제로 스크롤
        setTimeout(() => {
            window.scrollTo(0, 0);
            scrollToBottom();
        }, 100);
    }
}

// 메시지 전송
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    
    if (message) {
        // AI 메시지인지 확인
        if (message.startsWith('@ai')) {
            const aiMessage = message.substring(3).trim();
            if (aiMessage) {
                // 사용자 메시지 먼저 표시
                const userMessage = {
                    id: 'user-ai-request',
                    user: currentUser ? currentUser.name : '사용자',
                    text: message,
                    timestamp: new Date()
                };
                addMessage(userMessage);
                
                // 입력창 비우기
                messageInput.value = '';
                
                // AI 응답 요청
                try {
                    const response = await fetch('/api/ai', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ message: aiMessage })
                    });
                    
                    const data = await response.json();
                    
                    if (data.response) {
                        // AI 응답 메시지 표시
                        const aiResponse = {
                            id: 'ai-response',
                            user: 'guestAI',
                            text: data.response,
                            timestamp: new Date()
                        };
                        addMessage(aiResponse);
                    } else {
                        addMessage('AI 응답을 받을 수 없습니다.', 'system');
                    }
                } catch (error) {
                    console.error('AI API 호출 오류:', error);
                    addMessage('AI 응답 처리 중 오류가 발생했습니다.', 'system');
                }
            }
        } else {
            // 일반 메시지
            socket.emit('sendMessage', { text: message });
            messageInput.value = '';
        }
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
        const isAIMessage = message.user === 'guestAI';
        
        let messageClass = 'message ';
        if (isOwnMessage) {
            messageClass += 'own';
        } else if (isAIMessage) {
            messageClass += 'ai';
        } else {
            messageClass += 'other';
        }
        
        messageDiv.className = messageClass;
        
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
    addMessage('서버에 연결되었습니다.', 'system');
    
    // 연결 상태 표시
    document.body.classList.add('connected');
    document.body.classList.remove('disconnected');
    connectionStatus.classList.add('connected');
    connectionStatus.classList.remove('disconnected');
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
socket.on('disconnect', (reason) => {
    console.log('서버와의 연결이 끊어졌습니다. 이유:', reason);
    addMessage('서버와의 연결이 끊어졌습니다. 다시 연결을 시도합니다...', 'system');
    
    // 연결 상태 표시
    document.body.classList.remove('connected');
    document.body.classList.add('disconnected');
    connectionStatus.classList.remove('connected');
    connectionStatus.classList.add('disconnected');
});

// 재연결
socket.on('reconnect', (attemptNumber) => {
    console.log(`서버에 재연결되었습니다. (시도 횟수: ${attemptNumber})`);
    addMessage(`서버에 재연결되었습니다. (시도 횟수: ${attemptNumber})`, 'system');
    
    // 연결 상태 표시
    document.body.classList.add('connected');
    document.body.classList.remove('disconnected');
    connectionStatus.classList.add('connected');
    connectionStatus.classList.remove('disconnected');
});

// 재연결 시도
socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`재연결 시도 중... (${attemptNumber}번째 시도)`);
    addMessage(`재연결 시도 중... (${attemptNumber}번째 시도)`, 'system');
});

// 재연결 실패
socket.on('reconnect_failed', () => {
    console.log('재연결에 실패했습니다.');
    addMessage('재연결에 실패했습니다. 페이지를 새로고침해주세요.', 'system');
});

// 페이지 로드 시 access code 체크
// window.addEventListener('DOMContentLoaded', checkAccess); // 이 부분은 window.onload로 이동

// 페이지 로드 시 스크롤을 맨 아래로
window.addEventListener('load', () => {
    adjustViewportHeight();
    scrollToBottom();
});

// 화면 크기 변경 시 뷰포트 조정
window.addEventListener('resize', () => {
    adjustViewportHeight();
});

// 화면 방향 변경 시 뷰포트 조정
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        adjustViewportHeight();
    }, 500);
});

// 입력 필드 자동 포커스
messageInput.focus();

// 입력창 포커스 시 자동 스크롤
messageInput.addEventListener('focus', () => {
    setTimeout(() => {
        scrollToBottom();
    }, 300);
});

// 입력창에서 포커스가 벗어날 때
messageInput.addEventListener('blur', () => {
    // 입력창이 포커스를 잃어도 메시지 영역이 가려지지 않도록
    setTimeout(() => {
        scrollToBottom();
    }, 100);
});

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
