# 오메추 🍽️ - 오늘의 메뉴 추천 챗봇

Google AI Studio(Gemini API)를 이용해 사용자의 기분, 날씨, 예산, 매운맛 선호 등을 듣고
메뉴를 추천해주는 Node.js 기반 챗봇입니다.

## 구조

```
server/   Node.js(Express) 백엔드 - Gemini API 호출
docs/     정적 프론트엔드 - GitHub Pages로 배포
```

GitHub Pages는 정적 파일만 서빙할 수 있어서, 백엔드(Node.js) 서버는
Render / Railway / Fly.io 등에 별도로 배포하거나 로컬에서 실행해야 합니다.
프론트엔드(우측 상단 ⚙️ 설정)에서 백엔드 주소를 지정하면 됩니다.

## 추가 기능 2가지

1. **⭐ 즐겨찾기** - 추천받은 메뉴나 랜덤 룰렛으로 뽑은 메뉴를 저장해서 언제든 다시 볼 수 있어요. (브라우저 `localStorage`에 저장)
2. **🎲 랜덤 메뉴 룰렛** - 뭘 먹을지 전혀 못 정했을 때, 버튼 하나로 메뉴를 랜덤으로 뽑아주는 기능. 바로 즐겨찾기에 추가할 수 있어요.

## 1. Google AI Studio API 키 발급

1. https://aistudio.google.com/ 에 접속해 로그인합니다.
2. **Get API key**를 눌러 API 키를 생성합니다.
3. 발급받은 키를 아래 백엔드 설정에 사용합니다.

## 2. 백엔드 서버 실행

```bash
cd server
cp .env.example .env     # .env 파일에 GEMINI_API_KEY 입력
npm install
npm start                # http://localhost:3000 에서 실행
```

`.env` 예시:

```
GEMINI_API_KEY=발급받은_API_키
GEMINI_MODEL=gemini-2.0-flash
PORT=3000
```

### API

- `POST /api/chat` — `{ message: string, history: [{role, text}] }` → `{ reply, recommendations }`
- `GET /api/health` — 서버 상태 확인

## 3. 프론트엔드 로컬 확인

`docs/index.html`을 브라우저로 열거나, 간단히 정적 서버로 띄워도 됩니다.

```bash
cd docs
npx serve .
```

페이지 우측 상단 ⚙️ 버튼에서 백엔드 주소(기본값 `http://localhost:3000`)를 확인/변경하세요.

## 4. GitHub Pages 배포

이 저장소에는 이미 `docs/` 폴더로 프론트엔드가 구성되어 있습니다.

1. GitHub 저장소 → **Settings → Pages**
2. **Build and deployment → Source: Deploy from a branch**
3. **Branch: `main` / Folder: `/docs`** 선택 후 저장
4. 몇 분 후 `https://<계정명>.github.io/noCode/` 에서 접속 가능

> 배포된 페이지는 정적 파일이므로, 실제 추천을 받으려면 백엔드 서버를
> (Render 등에 배포 후) ⚙️ 설정 메뉴에 입력해야 합니다.

## 5. 백엔드 배포 (예: Render)

1. Render에서 **New Web Service** 생성, 이 저장소의 `server/` 디렉터리를 Root Directory로 지정
2. Build Command: `npm install`, Start Command: `npm start`
3. 환경변수에 `GEMINI_API_KEY`, `GEMINI_MODEL` 추가
4. 배포 후 발급되는 URL을 GitHub Pages 페이지의 ⚙️ 설정에 입력
