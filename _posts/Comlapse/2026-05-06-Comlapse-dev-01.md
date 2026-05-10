---
layout: single
title: "[Comlapse] 개발일지 1 - Electron 기반 학습 기록 앱 시작"
categories: Comlapse
tag: [Comlapse, Electron, React, Vite, Desktop App]
toc: true
toc_label: 목차
author_profile: false
---

# 1. 프로젝트를 시작한 이유

공부를 하다 보면 분명 오래 앉아 있었는데, 막상 하루가 끝났을 때 무엇을 얼마나 했는지 잘 떠오르지 않을 때가 있다. 타이머 앱은 공부 시간을 알려주지만, 그 시간 동안 어떤 자료를 봤고, 어떤 프로그램을 오래 사용했고, 어느 순간 집중이 끊겼는지는 보여주지 않는다.

특히 개발 공부를 할 때는 VS Code, 브라우저, Notion, 터미널을 계속 오가게 된다. 이 흐름을 나중에 다시 보면 내가 어디서 시간을 많이 썼는지, 어떤 방식으로 공부했는지 더 정확히 알 수 있을 것 같았다.

그래서 단순한 공부 타이머가 아니라, 공부 중 사용한 앱과 화면 흐름을 함께 기록하는 데스크톱 앱을 만들어보기로 했다. 이 프로젝트가 바로 `Comlapse`다.

처음 목표는 단순했다.

- 공부 모드를 켜면 활동 기록을 남긴다.
- 현재 사용 중인 앱을 추적한다.
- 나중에 세션 단위로 공부 흐름을 확인한다.
- 웹앱이 아니라 Windows 데스크톱 앱처럼 실행한다.

그래서 React와 Vite로 화면을 만들고, Electron을 붙여서 로컬 PC의 윈도우 정보를 가져오는 구조로 시작했다.

# 2. 초기 개발 환경 구성

프로젝트는 `React + Vite + Electron` 조합으로 구성했다.

`package.json`의 핵심 설정은 다음과 같다.

```json
{
  "name": "comlapse",
  "main": "electron/main.js",
  "scripts": {
    "dev": "concurrently \"vite\" \"wait-on tcp:5173 && cross-env NODE_ENV=development electron .\"",
    "build": "vite build && electron-builder --win --x64"
  }
}
```

개발 모드에서는 Vite 서버를 먼저 띄우고, `wait-on`으로 5173 포트가 준비되면 Electron을 실행한다. 이렇게 해두면 React 화면을 수정할 때 Vite의 빠른 HMR을 그대로 사용할 수 있다.

# 3. Electron 메인 프로세스 준비

초기 Electron 구조에서는 `main.js`와 `preload.js`를 분리했다.

- `electron/main.js`: 앱 창 생성, 메인 프로세스 로직 담당
- `electron/preload.js`: 렌더러에서 안전하게 호출할 API 노출
- `src/App.jsx`: 실제 화면과 상태 관리

Electron 앱은 브라우저처럼 보이지만 실제로는 로컬 파일 시스템과 OS 기능에 접근할 수 있다. 그래서 렌더러에서 Node API를 직접 쓰지 않고, `contextBridge`를 통해 필요한 기능만 열어두는 방식으로 설계했다.

# 4. 첫 UI 구현

첫날에는 Comlapse의 기본 화면을 잡는 데 시간을 많이 썼다.

초기 UI는 크게 세 영역으로 나눴다.

- 사이드바
- 대시보드
- 공부 모드 토글 영역

이 단계에서는 기능보다 앱의 정체성을 먼저 잡는 것이 중요했다. 공부 기록 앱이기 때문에 너무 화려한 화면보다는, 한눈에 현재 상태를 확인할 수 있는 대시보드 형태가 어울린다고 판단했다.

초기 `App.jsx`에서는 공부 모드 상태와 타이머를 중심으로 화면을 구성했다.

```jsx
const [studyMode, setStudyMode] = useState(false)

const handleToggle = () => {
  setStudyMode((prev) => !prev)
}
```

이후 기능이 늘어나면서 이 상태 관리는 `useComlapse` 훅과 Electron IPC 구조로 분리되었다.

# 5. Windows 앱 추적 방향 잡기

Comlapse의 핵심은 "지금 어떤 앱을 사용 중인가"를 알아내는 것이다. 브라우저 안에서 실행되는 일반 웹앱으로는 이 정보를 얻을 수 없기 때문에 Electron이 필요했다.

초기 구현에서는 Electron 메인 프로세스에서 Windows의 포그라운드 윈도우 정보를 가져오는 방향으로 설계했다.

이후 `main.js`에는 PowerShell 스크립트를 통해 현재 활성 창의 프로세스명, 창 제목, 실행 파일 경로를 읽는 로직이 들어갔다.

```js
function getActiveWindow() {
  return new Promise((resolve) => {
    exec(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${PS_SCRIPT_PATH}"`,
      { timeout: PS_TIMEOUT_MS, encoding: 'utf8' },
      (err, stdout) => {
        if (err || !stdout) { resolve(null); return }
        const parts = stdout.trim().split('|')
        resolve({
          processName: parts[0]?.trim() ?? '',
          title: parts[1]?.trim() ?? '',
        })
      }
    )
  })
}
```

처음에는 앱 이름만 기록해도 충분하다고 생각했지만, 실제로 공부 흐름을 복기하려면 창 제목과 브라우저 URL도 필요하다는 것을 알게 되었다. 이 부분은 다음 개발 단계에서 확장했다.

# 6. 첫날 정리

2026년 5월 6일에는 프로젝트의 뼈대를 만들었다.

- Vite 기반 React 프로젝트 생성
- Electron 실행 구조 연결
- 기본 대시보드 UI 제작
- 공부 모드 토글 흐름 설계
- Windows 활성 창 추적 방향 결정

이날의 핵심은 "Comlapse가 어떤 앱인지"를 코드 구조와 화면 구조로 처음 세운 것이다. 아직 완성된 기능은 많지 않았지만, 이후 세션 기록, 타임랩스, AI 질의 기능을 붙일 수 있는 출발점이 만들어졌다.
