# 간단한 채팅 애플리케이션

소수의 인원이 간단하게 채팅을 할 수 있는 웹 기반 실시간 채팅 애플리케이션입니다.

## 주요 기능

- 🌐 **웹 기반**: 브라우저에서 바로 사용 가능
- 🔗 **링크 공유**: 별도의 로그인 없이 링크로 접근 가능
- 👤 **자동 프로필**: 입장 순서대로 guest1, guest2 등 자동 이름 부여
- ✏️ **이름 변경**: 원하는 이름으로 변경 가능
- 👥 **실시간 접속자 목록**: 현재 접속 중인 사용자 확인
- 💬 **실시간 채팅**: Socket.IO를 사용한 실시간 메시지 전송
- 📱 **반응형 디자인**: 모바일과 데스크톱 모두 지원

## 기술 스택

- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.IO
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: CSS Grid, Flexbox, CSS Animations

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 모드로 실행

```bash
npm run dev
```

### 3. 프로덕션 모드로 실행

```bash
npm start
```

### 4. 브라우저에서 접속

```
http://localhost:3000
```

## 사용법

1. **채팅방 입장**: 브라우저에서 `http://localhost:3000` 접속
2. **자동 이름**: 입장 시 자동으로 guest1, guest2 등 이름 부여
3. **이름 변경**: 우측 상단의 "이름 변경" 버튼 클릭
4. **메시지 전송**: 하단 입력창에 메시지 입력 후 Enter 또는 전송 버튼 클릭
5. **접속자 확인**: 좌측 사이드바에서 현재 접속 중인 사용자 목록 확인

## 키보드 단축키

- `Enter`: 메시지 전송
- `Ctrl/Cmd + Enter`: 이름 변경 모달 열기
- `Escape`: 모달 닫기

## 프로젝트 구조

```
simple-chat-app/
├── server.js          # Express 서버 및 Socket.IO 설정
├── package.json       # 프로젝트 의존성 및 스크립트
├── public/            # 정적 파일들
│   ├── index.html     # 메인 HTML 파일
│   ├── style.css      # CSS 스타일
│   └── script.js      # 클라이언트 JavaScript
└── README.md          # 프로젝트 설명서
```

## 기능 상세

### 실시간 채팅
- Socket.IO를 사용한 실시간 양방향 통신
- 메시지 전송/수신 시 즉시 반영
- 연결 끊김/재연결 자동 처리

### 사용자 관리
- 자동 게스트 이름 생성 (guest1, guest2, ...)
- 실시간 접속자 목록 업데이트
- 사용자 입장/퇴장 알림
- 이름 변경 기능

### UI/UX
- 모던하고 직관적인 인터페이스
- 반응형 디자인 (모바일/데스크톱 지원)
- 부드러운 애니메이션 효과

## 배포

### 🚀 Railway로 온라인 배포 (추천)

1. **Railway 계정 생성**: [railway.app](https://railway.app)에서 GitHub 계정으로 로그인

2. **GitHub 연동** (가장 간단한 방법):
   - GitHub에 코드 푸시
   - Railway에서 "Deploy from GitHub repo" 선택
   - 저장소 연결 후 자동 배포

3. **CLI 사용**:
   ```bash
   # Railway CLI 설치
   npm install -g @railway/cli
   
   # 로그인
   railway login
   
   # 프로젝트 초기화
   railway init
   
   # 배포
   railway up
   ```

### 🌐 다른 배포 옵션

#### Render
1. [render.com](https://render.com)에서 계정 생성
2. "New Web Service" 선택
3. GitHub 저장소 연결
4. Build Command: `npm install`
5. Start Command: `npm start`

#### Vercel
1. [vercel.com](https://vercel.com)에서 계정 생성
2. GitHub 저장소 연결
3. 자동 배포 설정

### 🔧 배포 후 설정

배포가 완료되면:
1. 공개 URL 확인 (예: `https://your-app.railway.app`)
2. URL을 다른 사람들과 공유
3. 누구나 링크로 접속하여 채팅 가능

### 📱 로컬 네트워크에서 공유

개발 중에 같은 네트워크의 다른 기기에서 테스트하려면:

1. 서버 실행 후 터미널에서 IP 주소 확인
2. 같은 네트워크의 다른 기기에서 `http://[IP주소]:3000` 접속

## 라이선스

MIT License

## 기여

버그 리포트나 기능 제안은 언제든 환영합니다!
