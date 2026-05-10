---
layout: single
title: "[Comlapse] 개발일지 2 - 세션 DB, 타임랩스, AI 질의 구조 확장"
categories: Comlapse
tag: [Comlapse, Electron, SQLite, Timelapse, AI]
toc: true
toc_label: 목차
author_profile: false
---

# 1. 기능 중심 구조로 리팩터링

2026년 5월 9일에는 Comlapse를 단순한 화면 프로토타입에서 실제 기록 앱에 가까운 구조로 확장했다.

이날 가장 큰 변화는 기능을 컴포넌트와 모듈 단위로 분리한 것이다.

```text
src/
  components/
    Dashboard.jsx
    SessionsView.jsx
    TimelapseView.jsx
    AIQueryView.jsx
    SettingsView.jsx
    Sidebar.jsx
  hooks/
    useComlapse.js
  constants/
    apps.js
    aiPrompts.js
    mockData.js
electron/
  main.js
  db.js
  capture.js
  recorder.js
  preload.js
```

초기에는 `App.jsx`와 `App.css`에 많은 코드가 모여 있었는데, 기능이 늘어나면서 유지보수가 어려워졌다. 그래서 화면은 컴포넌트로, Electron 로직은 `electron` 폴더로, 반복되는 상태 관리는 커스텀 훅으로 나누었다.

# 2. SQLite로 세션 저장하기

Comlapse는 공부가 끝난 뒤에도 기록을 다시 볼 수 있어야 하므로 로컬 저장소가 필요했다. 이를 위해 `better-sqlite3`를 사용했다.

DB는 크게 두 테이블로 나눴다.

- `sessions`: 공부 세션의 시작/종료 시각, 총 시간, 앱 수 저장
- `activity_log`: 세션 중 앱 전환 이벤트 저장

```js
CREATE TABLE IF NOT EXISTS sessions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  start_ts     INTEGER NOT NULL,
  end_ts       INTEGER,
  duration_sec INTEGER DEFAULT 0,
  app_count    INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS activity_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  ts           INTEGER NOT NULL,
  time_str     TEXT NOT NULL,
  app          TEXT NOT NULL,
  process_name TEXT NOT NULL,
  title        TEXT DEFAULT ''
);
```

처음에는 앱 이름만 저장하면 될 것 같았지만, 실제 데이터를 복기하려면 `url`, `exe_path`, `capture_dir`, `name` 같은 정보도 필요했다. 그래서 기존 DB와의 호환을 위해 마이그레이션 방식으로 컬럼을 추가했다.

# 3. 활성 앱과 브라우저 URL 추적

앱 추적은 Electron 메인 프로세스에서 처리했다.

Windows의 현재 포그라운드 창을 가져오고, 브라우저인 경우에는 주소창의 URL까지 추출한다. URL은 민감한 쿼리스트링을 제거하고 `http`, `https`만 허용하도록 정리했다.

```js
function sanitizeTrackedUrl(value) {
  const raw = sanitizeString(value, 2048)
  if (!raw) return ''
  try {
    const url = new URL(raw)
    if (!['http:', 'https:'].includes(url.protocol)) return ''
    url.username = ''
    url.password = ''
    url.search = ''
    url.hash = ''
    return sanitizeString(url.toString(), 500)
  } catch {
    return ''
  }
}
```

공부 기록 앱은 사용자의 활동 데이터를 다루기 때문에, 저장할 정보의 범위를 줄이는 것이 중요했다. 그래서 URL 전체를 그대로 저장하지 않고, 인증 정보나 검색 파라미터처럼 민감할 수 있는 부분은 제거했다.

# 4. 화면 녹화와 타임랩스

이날 추가한 큰 기능 중 하나는 화면 녹화 기반 타임랩스다.

공부 모드를 시작하면 세션이 생성되고, 녹화 파일 경로를 만든 뒤 렌더러에 녹화 시작 이벤트를 보낸다. 렌더러에서는 `MediaRecorder`로 화면을 녹화하고, 종료 시 `.webm` 파일로 저장한다.

```js
function buildRecordingPath(sessionName) {
  const dir = getRecordingsDir()
  const d = new Date()
  const ts = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}-${pad(d.getMinutes())}`
  const base = sessionName ? `${sessionName} - ${ts}` : `Comlapse - ${ts}`
  const safe = base.replace(/[\\/:*?"<>|]/g, '-')
  return path.join(dir, `${safe}.webm`)
}
```

타임랩스 화면에서는 녹화 파일과 활동 로그를 함께 불러온다. 단순히 영상을 재생하는 것이 아니라, 어떤 시간대에 어떤 앱을 사용했는지 함께 볼 수 있도록 만들었다.

```jsx
Promise.all([
  window.comlapse.getRecording(sessionId),
  window.comlapse.getSessionActivity(sessionId),
]).then(async ([recRes, actRes]) => {
  if (recRes?.ok && recRes.path) {
    const captureUrl = toCaptureSrc(recRes.path)
    const res = await fetch(captureUrl)
    const blob = await res.blob()
    setVideoSrc(URL.createObjectURL(blob))
  }
  if (actRes?.ok && actRes.data?.length > 0) {
    setActivities(actRes.data)
  }
})
```

이 구조 덕분에 사용자는 공부가 끝난 뒤 "영상"과 "활동 로그"를 한 번에 확인할 수 있다.

# 5. AI 질의 서버 추가

Comlapse의 또 다른 목표는 기록한 데이터를 AI에게 물어볼 수 있게 만드는 것이다.

이를 위해 별도 Express 서버를 추가하고, `/api/chat` 엔드포인트를 만들었다. 서버는 학습 데이터 컨텍스트와 사용자의 질문을 받아 AI 모델에 전달한다.

```js
app.post('/api/chat', rateLimit, requireAuth, async (req, res) => {
  const { messages, context } = req.body
  const normalizedMessages = normalizeMessages(messages)
  if (!normalizedMessages) {
    return res.status(400).json({ ok: false, error: '메시지 형식이 올바르지 않아요.' })
  }

  const safeContext = typeof context === 'string' ? context.slice(0, 20_000) : ''
  const text = await createAIMessage({
    systemPrompt,
    messages: normalizedMessages,
  })

  res.json({ ok: true, text })
})
```

개발 단계에서는 Anthropic과 OpenAI를 모두 선택할 수 있도록 `AI_PROVIDER` 환경 변수를 기준으로 분기했다. 운영 환경에서는 API 토큰과 CORS, rate limit도 함께 확인하도록 했다.

# 6. 보안 하드닝

Electron 앱은 편하지만 보안 경계가 중요하다. 그래서 `preload.js`에서 허용된 IPC 채널만 호출할 수 있게 제한했다.

```js
const ALLOWED_INVOKE_CHANNELS = new Set([
  'ai-query',
  'db-get-sessions',
  'db-get-session-count',
  'db-get-session-activity',
  'db-get-stats',
  'save-recording',
  'get-recording',
  'get-app-icon',
])
```

렌더러에서는 `window.comlapse` API만 사용할 수 있고, 임의의 IPC 채널을 직접 호출하지 못하게 했다. 이 구조는 이후 기능이 늘어나도 보안 범위를 관리하기 쉽게 해준다.

# 7. 둘째 개발일 정리

2026년 5월 9일에는 Comlapse의 핵심 기능 대부분이 들어갔다.

- 컴포넌트/스타일/훅 구조 분리
- SQLite 기반 세션 저장
- 활성 앱, 창 제목, URL 추적
- 앱 아이콘 캐시
- 화면 녹화와 타임랩스 재생
- AI 질의 서버
- Electron IPC 보안 하드닝

이날 작업을 지나면서 Comlapse는 "공부 타이머 UI"에서 "학습 활동을 기록하고 복기하는 데스크톱 앱"으로 바뀌었다.
