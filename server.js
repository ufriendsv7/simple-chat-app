const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 연결된 사용자들을 추적
let connectedUsers = [];
let guestCounter = 1;

// Socket.IO 연결 처리
io.on('connection', (socket) => {
    console.log('새로운 사용자가 연결되었습니다.');
    
    // 자동으로 게스트 이름 생성
    const guestName = `guest${guestCounter}`;
    guestCounter++;
    
    // 사용자 정보 저장
    const user = {
        id: socket.id,
        name: guestName,
        joinedAt: new Date()
    };
    
    connectedUsers.push(user);
    
    // 새 사용자 입장 알림을 모든 클라이언트에게 전송
    io.emit('userJoined', {
        user: user,
        message: `${user.name}님이 입장하셨습니다.`,
        timestamp: new Date()
    });
    
    // 현재 접속자 목록 전송
    io.emit('userList', connectedUsers);
    
    // 메시지 수신 처리
    socket.on('sendMessage', (data) => {
        const message = {
            id: socket.id,
            user: user.name,
            text: data.text,
            timestamp: new Date()
        };
        
        // 모든 클라이언트에게 메시지 전송
        io.emit('newMessage', message);
    });
    
    // 사용자 이름 변경 처리
    socket.on('changeName', (newName) => {
        const oldName = user.name;
        user.name = newName;
        
        // 이름 변경 알림 전송
        io.emit('nameChanged', {
            userId: socket.id,
            oldName: oldName,
            newName: newName,
            message: `${oldName}님이 ${newName}으로 이름을 변경하셨습니다.`,
            timestamp: new Date()
        });
        
        // 업데이트된 사용자 목록 전송
        io.emit('userList', connectedUsers);
    });
    
    // 연결 해제 처리
    socket.on('disconnect', () => {
        console.log(`${user.name}님이 연결을 해제했습니다.`);
        
        // 사용자 목록에서 제거
        connectedUsers = connectedUsers.filter(u => u.id !== socket.id);
        
        // 사용자 퇴장 알림 전송
        io.emit('userLeft', {
            user: user,
            message: `${user.name}님이 퇴장하셨습니다.`,
            timestamp: new Date()
        });
        
        // 업데이트된 사용자 목록 전송
        io.emit('userList', connectedUsers);
    });
});

// 메인 페이지 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
    console.log(`채팅 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`http://localhost:${PORT}에서 접속하세요.`);
});
