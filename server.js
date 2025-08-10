// 환경변수 로드
require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 미들웨어 설정
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 환경변수에서 API 키 가져오기
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Gemini AI 초기화 (API 키가 있을 때만)
let genAI = null;
if (GOOGLE_API_KEY) {
    genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
}

// AI API 엔드포인트
app.post('/api/ai', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || !message.trim()) {
            return res.status(400).json({ error: '메시지가 필요합니다.' });
        }
        
        if (!genAI) {
            return res.status(503).json({ 
                error: 'AI 서비스가 현재 사용할 수 없습니다. API 키가 설정되지 않았습니다.' 
            });
        }
        
                                // Gemini 모델 초기화 (최신 모델 사용)
                        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        
        // 프롬프트 설정
        const prompt = `당신은 '잼민이'라는 친근하고 재미있는 AI 어시스턴트입니다. 
        사용자와 자연스럽게 대화하고, 유용하고 재미있는 답변을 제공해주세요. 
        답변은 한국어로 하고, 친근하고 재미있는 톤을 유지해주세요.
        
        사용자 메시지: ${message}`;
        
        // AI 응답 생성
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        res.json({ response: text });
        
    } catch (error) {
        console.error('AI API 오류:', error);
        
        // 구체적인 에러 메시지 제공
        if (error.message.includes('API_KEY')) {
            res.status(401).json({ 
                error: 'AI 서비스 인증에 실패했습니다. API 키를 확인해주세요.' 
            });
        } else if (error.message.includes('quota')) {
            res.status(429).json({ 
                error: 'AI 서비스 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' 
            });
        } else if (error.message.includes('content')) {
            res.status(400).json({ 
                error: '부적절한 내용이 감지되었습니다. 다른 메시지를 시도해주세요.' 
            });
        } else {
            res.status(500).json({ 
                error: 'AI 서비스 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
            });
        }
    }
});

// 사용자 관리
const users = new Map();
let guestCounter = 1;

// Socket.IO 연결 처리
io.on('connection', (socket) => {
    console.log('새로운 사용자가 연결되었습니다:', socket.id);
    
    // 새 사용자 생성
    const userName = `guest${guestCounter++}`;
    const user = {
        id: socket.id,
        name: userName
    };
    
    users.set(socket.id, user);
    
    // 사용자 입장 알림
    const joinMessage = `${userName}님이 입장하셨습니다.`;
    socket.broadcast.emit('userJoined', {
        message: joinMessage,
        users: Array.from(users.values())
    });
    
    // 현재 사용자 목록 전송
    socket.emit('userList', Array.from(users.values()));
    
    // 메시지 수신
    socket.on('sendMessage', (data) => {
        const user = users.get(socket.id);
        if (user) {
            const message = {
                id: socket.id,
                user: user.name,
                text: data.text,
                timestamp: new Date()
            };
            
            io.emit('newMessage', message);
        }
    });
    
    // 이름 변경
    socket.on('changeName', (newName) => {
        const user = users.get(socket.id);
        if (user && newName && newName.trim() && newName.length <= 20) {
            const oldName = user.name;
            user.name = newName.trim();
            
            const changeMessage = `${oldName}님이 ${newName}으로 이름을 변경하셨습니다.`;
            io.emit('nameChanged', {
                userId: socket.id,
                newName: newName,
                message: changeMessage
            });
            
            // 사용자 목록 업데이트
            io.emit('userList', Array.from(users.values()));
        }
    });
    
    // 연결 해제
    socket.on('disconnect', () => {
        console.log('사용자가 연결을 해제했습니다:', socket.id);
        
        const user = users.get(socket.id);
        if (user) {
            const leaveMessage = `${user.name}님이 퇴장하셨습니다.`;
            users.delete(socket.id);
            
            socket.broadcast.emit('userLeft', {
                message: leaveMessage,
                users: Array.from(users.values())
            });
        }
    });
});

// 서버 상태 확인 엔드포인트
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        aiAvailable: !!genAI,
        connectedUsers: users.size,
        timestamp: new Date().toISOString()
    });
});

// 루트 경로
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 포트 설정
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`AI 서비스 상태: ${genAI ? '사용 가능' : 'API 키 없음'}`);
    
    if (!genAI) {
        console.log('⚠️  AI 기능을 사용하려면 GOOGLE_API_KEY 환경변수를 설정하세요.');
        console.log('   예: GOOGLE_API_KEY=your_api_key_here npm start');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
    server.close(() => {
        console.log('서버가 정상적으로 종료되었습니다.');
        process.exit(0);
    });
});
