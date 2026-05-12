---
layout: single
title: "[Comlapse] 개발일지 4 - 오프라인 음성인식과 PDF/타임랩스 뷰어 확장"
categories: Comlapse
tag: [Comlapse, Electron, Vosk, PDF, Timelapse, AI]
toc: true
toc_label: 목차
author_profile: false
---

# 1. Web Speech API에서 Vosk로 전환하기

2026년 5월 12일에는 Comlapse의 기록 기능을 더 실제 사용에 가까운 방향으로 확장했다.

이전에는 마이크 음성 인식에 브라우저의 `SpeechRecognition` API를 사용했다. 구현은 빠르지만 환경 의존성이 크고, 네트워크 상태나 브라우저 지원 여부에 따라 동작이 달라질 수 있었다.

Comlapse는 Electron 기반 데스크톱 앱이기 때문에, 가능하면 로컬에서 안정적으로 돌아가는 구조가 더 어울린다고 판단했다. 그래서 한국어 STT를 `vosk-browser` 기반으로 바꾸고, 최초 1회 모델을 내려받은 뒤 오프라인으로 음성을 인식하는 흐름을 만들었다.

![Comlapse 대시보드의 Vosk 음성 모델 다운로드 UI](/image/2026-05-12-Comlapse-dev-04/dashboard-vosk-pdf.png)

```jsx
const { modelStatus, downloadProgress, error: voskError, downloadModel, start: voskStart, stop: voskStop } = useVosk()
```

녹음 패널은 이제 모델 상태에 따라 다른 화면을 보여준다.

- `checking`: 모델 설치 여부 확인
- `missing`: 모델 다운로드 안내
- `downloading`: 다운로드 진행률 표시
- `ready`: 세션 시작 시 실시간 STT 실행
- `error`: 다운로드 또는 초기화 오류 표시

이 구조로 바꾸면서 음성 인식 기능이 단순한 브라우저 기능 호출이 아니라, Comlapse 내부의 기록 장치 중 하나로 자리 잡게 되었다.

# 2. Vosk 모델을 Electron IPC로 관리

Vosk 모델은 용량이 있는 파일이기 때문에 렌더러에서 바로 다루기보다 Electron 메인 프로세스에서 관리하도록 했다.

`preload.js`에는 렌더러가 호출할 수 있는 안전한 API만 노출했다.

```js
getVoskModelStatus:   ()   => safeInvoke('vosk-model-status'),
downloadVoskModel:    ()   => safeInvoke('vosk-model-download'),
readVoskModel:        ()   => safeInvoke('vosk-model-read'),
onVoskModelProgress:  (cb) => safeOn('vosk-model-progress', cb),
```

그리고 `main.js`에서는 모델 파일을 `userData/models` 아래에 저장하고, 다운로드 진행률을 렌더러로 전달했다.

```js
ipcMain.handle('vosk-model-status', () => {
  const zipPath = path.join(modelsDir, 'vosk-model-ko-0.22.zip')
  return { downloaded: fs.existsSync(zipPath) }
})
```

이렇게 나눈 이유는 보안과 유지보수 때문이다. 렌더러는 "모델이 있는지 확인한다", "다운로드한다", "읽는다" 같은 명령만 요청하고, 실제 파일 경로와 저장 위치는 메인 프로세스가 책임진다.

# 3. SharedArrayBuffer와 model 프로토콜 설정

Vosk WASM을 안정적으로 사용하려면 `SharedArrayBuffer`가 필요하다. 이를 위해 Electron 응답 헤더에 COOP/COEP 설정을 추가했다.

```js
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Cross-Origin-Opener-Policy':   ['same-origin'],
      'Cross-Origin-Embedder-Policy': ['require-corp'],
    },
  })
})
```

또한 모델 파일을 안전하게 제공하기 위해 `model://` 프로토콜도 등록했다.

```js
protocol.registerSchemesAsPrivileged([
  { scheme: 'capture', privileges: { secure: true, standard: true, supportFetchAPI: true } },
  { scheme: 'model',   privileges: { secure: true, standard: true, supportFetchAPI: true } },
])
```

Comlapse에서는 이미 화면 녹화 파일을 `capture://`로 제공하고 있었다. 여기에 모델 파일을 위한 `model://`을 추가하면서, 로컬 리소스를 다루는 방식이 조금 더 명확해졌다.

# 4. PDF 자료 미리보기 추가

이날 대시보드의 타임랩스 패널에는 파일 자료를 함께 볼 수 있는 흐름도 추가했다.

공부할 때는 화면만 보는 것이 아니라 PDF 강의자료, 문서, 문제집 같은 자료를 같이 열어두는 경우가 많다. 그래서 타임랩스 미리보기 영역에 `파일 추가` 탭을 만들고, PDF를 불러와 페이지 단위로 넘겨볼 수 있도록 했다.

![Comlapse 대시보드의 PDF 파일 추가 탭](/image/2026-05-12-Comlapse-dev-04/dashboard-file-tab.png)

```jsx
const nextDoc = await pdfjsLib.getDocument({
  data: buffer,
  cMapUrl: './pdfjs/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: './pdfjs/standard_fonts/',
  useSystemFonts: true,
}).promise
```

단순히 PDF 파일을 띄우는 것에서 끝내지 않고, 한국어 PDF가 깨지지 않도록 `cMap`과 표준 폰트 경로도 같이 설정했다. 개발하면서 PDF 렌더링은 "파일만 읽으면 된다"가 아니라, 문자셋과 폰트 리소스까지 맞춰야 제대로 보인다는 점을 다시 확인했다.

# 5. 타임랩스 미리보기와 전체화면

타임랩스 패널은 공부 모드가 켜져 있을 때 현재 화면 스트림을 보여준다. 이번 작업에서는 PDF 탭과 타임랩스 탭을 오가더라도 비디오 스트림이 끊기지 않도록 `srcObject` 갱신 조건을 다듬었다.

```jsx
if (video.srcObject !== stream) {
  video.srcObject = stream || null
}
```

그리고 미리보기 영역에 전체화면 전환도 추가했다.

```jsx
const toggleFullscreen = () => {
  const el = previewContainerRef.current
  if (!el) return
  if (!document.fullscreenElement) {
    el.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}
```

작은 패널에서 대략적인 흐름을 보고, 필요할 때 전체화면으로 자세히 확인할 수 있게 만든 것이다.

# 6. 세션 기록 화면의 타임랩스 썸네일 개선

세션 기록 화면도 함께 다듬었다.

기존에는 타임랩스 재생 버튼이 별도로 있었지만, 사용자는 보통 썸네일을 보면 바로 그것을 누르고 싶어 한다. 그래서 세션 테이블의 타임랩스 썸네일 자체를 버튼으로 바꿨다.

![Comlapse 세션 기록 화면의 타임랩스 썸네일 영역](/image/2026-05-12-Comlapse-dev-04/sessions-timelapse-thumbnails.png)

```jsx
<button
  type="button"
  className="tl-thumb-box"
  title="타임랩스 재생"
  aria-label="타임랩스 재생"
  onClick={() => onOpenTimelapse?.(s)}
>
```

이 변경으로 세션 기록 화면은 더 직관적인 구조가 되었다. 또한 삭제 버튼은 텍스트/이모지 대신 SVG 아이콘으로 교체해서 UI의 밀도를 맞췄다.

# 7. AI 모델 선택 구조 추가

AI 질의 기능에는 모델 선택 구조를 추가했다.

이전에는 서버의 `AI_PROVIDER` 환경 변수에 따라 하나의 모델만 선택되는 구조였다. 이제는 프론트에서 선택한 모델 정보를 서버로 넘기고, 서버가 해당 요청에 맞는 provider/model을 선택하도록 바꿨다.

```js
const modelPresets = {
  'claude-4-5-medium': { provider: 'anthropic', model: anthropicModel },
  'gpt-5-5-medium': { provider: 'openai', model: openaiModel },
  'gemini-2-5-medium': { provider: 'gemini', model: geminiModel },
}
```

서버에서는 `modelPreference`를 받아 요청별로 모델을 결정한다.

```js
async function createAIMessage({ systemPrompt, messages, modelPreference }) {
  const requestedModel = resolveModelPreference(modelPreference)
  const provider = requestedModel?.provider || aiProvider
  const model = requestedModel?.model
}
```

이 구조를 넣어두면 나중에 사용자가 질문 성격에 따라 빠른 모델, 품질이 높은 모델, 비용이 낮은 모델을 선택하는 식으로 확장할 수 있다.

# 8. 상단 앱 아이콘과 창 컨트롤 정리

상단 윈도우 컨트롤도 다시 정리했다.

기존에는 CSS로 만든 단순 아이콘을 사용했지만, 이번에는 앱 아이콘 이미지를 상단에 배치하고 사이드바 토글, 뒤로가기, 앞으로가기 아이콘을 SVG로 교체했다.

```jsx
<img
  className="window-app-icon"
  src="/app-icon.png"
  alt=""
  aria-hidden="true"
/>
```

작은 변화지만 데스크톱 앱에서는 상단 바의 완성도가 전체 인상에 크게 영향을 준다. Comlapse가 웹페이지가 아니라 하나의 로컬 앱처럼 느껴지도록 하는 작업이었다.

# 9. 넷째 개발일 정리

2026년 5월 12일에는 Comlapse의 핵심 기록 경험을 한 단계 확장했다.

- Web Speech API 기반 STT를 Vosk 기반 오프라인 음성 인식으로 전환
- 한국어 Vosk 모델 다운로드/상태 확인/읽기 IPC 추가
- Vosk WASM 실행을 위한 COOP/COEP와 `model://` 프로토콜 설정
- PDF 자료 미리보기와 페이지 이동 기능 추가
- 타임랩스 미리보기 스트림 유지와 전체화면 기능 추가
- 세션 기록 화면의 타임랩스 썸네일 UX 개선
- AI 질의 모델 선택 구조 추가
- 상단 앱 아이콘과 창 컨트롤 UI 정리

이번 개발은 기능을 단순히 더 붙이는 작업이라기보다, Comlapse가 "공부 중인 화면과 음성, 자료, AI 질문"을 하나의 흐름으로 묶어가는 과정이었다.

특히 Vosk를 붙이면서 Electron 앱에서 로컬 파일, WASM, 권한, 보안 헤더를 함께 다뤄야 한다는 점을 경험했다. 구현 난이도는 올라갔지만, 그만큼 Comlapse가 웹앱보다 데스크톱 앱에 더 가까운 형태로 발전한 날이었다.
