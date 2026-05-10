---
layout: single
title: "[Comlapse] 개발일지 3 - 기록 장치 토글과 대시보드 UX 개선"
categories: Comlapse
tag: [Comlapse, React, Electron, UX, Recording]
toc: true
toc_label: 목차
author_profile: false
---

# 1. 기록 장치를 사용자가 고르게 만들기

2026년 5월 10일에는 대시보드 사용성을 다듬었다.

이전 버전에서는 공부 모드를 켜면 화면 녹화가 바로 시작되는 구조였다. 하지만 실제 사용을 생각해보면 항상 화면과 마이크를 모두 기록하고 싶은 것은 아니다.

그래서 대시보드에 `Screen`, `Mic` 기록 장치 토글을 추가했다.

```jsx
const [captureOptions, setCaptureOptions] = useState({
  screen: true,
  mic: true,
})
```

이 상태는 `App.jsx`에서 관리하고, `Dashboard`와 `RecordingPanel`로 전달한다.

```jsx
<Dashboard
  studyMode={studyMode}
  liveTimeline={liveTimeline}
  captureOptions={captureOptions}
  setCaptureOptions={setCaptureOptions}
/>
```

# 2. 화면 녹화 조건 분리

기존에는 `recording-start` 이벤트가 오면 무조건 화면 녹화를 시작했다. 이제는 사용자가 `Screen`을 켜둔 경우에만 녹화를 시작하도록 바꿨다.

```jsx
const unsubStart = window.comlapse.onRecordingStart(({ sessionId, savePath }) => {
  setCurrentSessionId(sessionId)
  if (captureOptions.screen) {
    startRecording(sessionId, savePath)
  } else {
    setRecordingError('')
  }
})
```

이렇게 하면 세션 로그만 남기고 화면 녹화는 끄는 사용 흐름도 가능해진다.

# 3. 마이크 녹음도 공부 모드와 연결

마이크 녹음도 수동 버튼 중심에서 공부 모드와 연결되는 방식으로 바꿨다.

공부 모드가 켜져 있고 `Mic` 옵션이 켜져 있으면 자동으로 녹음과 STT를 시작한다. 공부 모드가 꺼지거나 옵션이 꺼지면 녹음을 멈춘다.

```jsx
useEffect(() => {
  if (studyMode && micEnabled) {
    startRecording()
    return
  }
  if (status === 'recording') stopRecording()
}, [micEnabled, startRecording, status, stopRecording, studyMode])
```

처음에는 녹음 패널 안에 별도의 시작/중지 버튼이 있었지만, Comlapse의 핵심 흐름은 "공부 모드"다. 그래서 녹음 장치도 공부 모드에 자연스럽게 묶는 편이 더 일관적이었다.

# 4. 기록 장치 UI

기록 장치는 버튼 두 개로 표시했다.

- `Screen`: 화면 녹화 여부
- `Mic`: 마이크 녹음과 실시간 음성 인식 여부

```jsx
function CaptureOptionRow({ icon, label, enabled, active, detail, onToggle }) {
  return (
    <button
      type="button"
      className={`capture-option ${enabled ? 'enabled' : ''}`}
      onClick={onToggle}
      aria-pressed={enabled}
    >
      <span className={`capture-option-icon ${icon}`} aria-hidden="true" />
      <span className="capture-option-copy">
        <span className="capture-option-label">{label}</span>
        <span className="capture-option-detail">
          {detail || (enabled ? (active ? '녹화 중' : '허용됨') : '꺼짐')}
        </span>
      </span>
      <span className="capture-check" aria-hidden="true">
        {enabled ? '✓' : ''}
      </span>
    </button>
  )
}
```

사용자는 지금 어떤 장치가 켜져 있는지, 실제로 녹화 중인지, 오류가 발생했는지를 한눈에 확인할 수 있다.

# 5. 빈 타임라인에서 바로 시작하기

대시보드에서 아직 공부 모드를 시작하지 않은 상태라면 활동 타임라인이 비어 있다. 이전에는 단순 안내 문구만 있었지만, 이 상태에서 바로 공부를 시작할 수 있도록 CTA 버튼을 추가했다.

```jsx
{timeline.length === 0 && (
  <div className={`tl-empty ${studyMode ? '' : 'idle'}`}>
    <span>{studyMode ? d.detecting : d.timelineEmpty}</span>
    {!studyMode && (
      <>
        <p>{d.timelineCta}</p>
        <button className="tl-start-btn" type="button" onClick={onStartStudy}>
          {d.startStudy}
        </button>
      </>
    )}
  </div>
)}
```

이제 사용자는 상단 토글을 찾지 않아도 빈 타임라인에서 바로 공부를 시작할 수 있다.

# 6. 다국어 문구 추가

대시보드에 새로 들어간 문구는 한국어와 영어 리소스에 함께 추가했다.

```js
timelineCta: '공부를 시작하고 활동 기록을 쌓아보세요!',
startStudy:  '공부 시작하기',
```

```js
timelineCta: 'Start studying and build an activity history.',
startStudy:  'Start studying',
```

Comlapse는 아직 개인 프로젝트지만, UI 문구를 한 곳에서 관리하면 이후 화면이 늘어나도 수정하기 쉽다.

# 7. 셋째 개발일 정리

2026년 5월 10일에는 기능을 크게 늘리기보다, 실제 사용 흐름을 매끄럽게 만드는 데 집중했다.

- 화면 녹화와 마이크 녹음 옵션 분리
- 공부 모드와 마이크 녹음 자동 연동
- 기록 장치 상태 UI 추가
- 빈 타임라인 CTA 추가
- 한국어/영어 문구 업데이트
- 대시보드 패널 높이와 레이아웃 정리

이번 작업으로 Comlapse는 단순히 기록을 시작하는 앱이 아니라, 사용자가 어떤 방식으로 기록할지 선택할 수 있는 앱에 가까워졌다.
