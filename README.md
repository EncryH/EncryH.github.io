# EncryH.blog

보안 학습과 개발 과정을 기록하는 개인 기술 블로그입니다.

Linux, 네트워크, 웹 해킹, C/Data Structure, 프로젝트 개발일지를 실습 중심으로 정리합니다. 단순히 결과만 적기보다, 어떤 문제를 만났고 어떤 방식으로 해결했는지 남기는 것을 목표로 합니다.

## Links

- Blog: <https://encryh.github.io>
- GitHub: <https://github.com/EncryH>
- Instagram: <https://instagram.com/h07zzm>

## About

EncryH.blog는 보안 공부와 개발 경험을 포트폴리오처럼 쌓아가는 공간입니다.

주요 기록 방향은 다음과 같습니다.

- Linux 명령어, 권한, 네트워크, 방화벽, 웹 서버 구축 실습
- OverTheWire Bandit 기반 리눅스 워게임 풀이
- Wireshark를 활용한 패킷 분석과 네트워크 흐름 이해
- C언어, 포인터, 자료구조, 컴파일 과정 정리
- 웹 해킹과 보안 실습 환경 구축
- 개인 프로젝트 개발일지와 현장 경험 기록

## Portfolio

### Comlapse

Electron 기반 학습 기록 데스크톱 앱 개발 프로젝트입니다.

학습 세션을 기록하고, 타임랩스와 음성 인식, PDF 뷰어, AI 질의 흐름을 하나의 데스크톱 환경에서 다루는 것을 목표로 개발했습니다.

기록한 개발 내용:

- Electron, React, Vite 기반 앱 구조 설계
- SQLite 기반 세션 데이터 저장
- 학습 타임랩스 기록 및 뷰어 기능
- 녹음 장치 토글과 대시보드 UX 개선
- Vosk 기반 오프라인 음성 인식 적용
- PDF 뷰어와 타임랩스 뷰어 확장

관련 글:

- [[Comlapse] 개발일지 1 - Electron 기반 학습 기록 앱 시작](https://encryh.github.io/comlapse/Comlapse-dev-01/)
- [[Comlapse] 개발일지 2 - 세션 DB, 타임랩스, AI 질의 구조 확장](https://encryh.github.io/comlapse/Comlapse-dev-02/)
- [[Comlapse] 개발일지 3 - 기록 장치 토글과 대시보드 UX 개선](https://encryh.github.io/comlapse/Comlapse-dev-03/)
- [[Comlapse] 개발일지 4 - 오프라인 음성인식과 PDF/타임랩스 뷰어 확장](https://encryh.github.io/comlapse/Comlapse-dev-04/)

### C Language Tetris

C언어로 구현한 콘솔 기반 테트리스 프로젝트입니다.

배열, 좌표 처리, 입력 처리, 게임 루프를 직접 다루며 C언어 기초를 실제 동작하는 프로그램으로 연결한 프로젝트입니다.

관련 글:

- [C언어 테트리스 프로젝트](https://encryh.github.io/c/Tetris/)

### Battery Manufacturing CIM Field Note

배터리 제조 현장의 CIM 설정 경험을 정리한 포트폴리오 기록입니다.

CIM, MES, PLC, 제조 시스템이 현장에서 어떻게 연결되는지 경험 기반으로 정리했습니다.

관련 글:

- [Battery Manufacturing CIM Setup Experience](https://encryh.github.io/portfolio/Daeheung-CIM-setting/)

### Linux Security Lab

Ubuntu와 Kali 환경을 사용해 보안 실습 환경을 구성하고 운영하는 기록입니다.

다룬 내용:

- VirtualBox 기반 Linux 설치
- 사용자와 파일 권한 관리
- 네트워크 설정과 서비스 관리
- UFW 방화벽 정책 구성
- Apache, PHP, MariaDB 기반 웹 서버 구축
- 웹 해킹 실습 환경 구성

관련 글:

- [리눅스 설치](https://encryh.github.io/linux/Linux1/)
- [UFW 방화벽 설정 및 웹 서비스 접근 제어 실습](https://encryh.github.io/linux/ufw/)
- [Ubuntu 기반 Apache + PHP + MariaDB 웹 서버 구축 및 웹 해킹 실습 환경 구성](https://encryh.github.io/linux/WebServer/)

### OverTheWire Bandit

리눅스 기본기와 보안 문제 해결력을 기르기 위한 워게임 풀이 기록입니다.

명령어 사용, 파일 탐색, 권한 이해, 문자열 처리, 인코딩/디코딩 등 터미널 기반 문제 해결 과정을 단계별로 정리합니다.

관련 카테고리:

- [Wargame posts](https://encryh.github.io/categories/#wargame)

## Blog Categories

| Category | Description |
| --- | --- |
| Comlapse | 개인 앱 개발일지와 기능 개선 기록 |
| Linux | 리눅스 실습, 서버, 네트워크, 방화벽 |
| Wargame | OverTheWire Bandit 풀이 |
| C | C언어, 포인터, 컴파일, 자료구조 |
| Packet | Wireshark와 네트워크 패킷 분석 |
| Hacking | 웹 해킹과 보안 실습 |
| Portfolio | 프로젝트와 현장 경험 기록 |

## Tech Stack

이 블로그는 GitHub Pages와 Jekyll 기반으로 운영됩니다.

- Jekyll
- Minimal Mistakes
- GitHub Pages
- Sass/SCSS
- Lunr.js search
- Disqus comments
- Google Analytics

## Recent Improvements

- 홈 화면 상단 메인바에 인라인 검색창 추가
- 작성한 게시글 제목, 본문, 카테고리, 태그 검색 지원
- 카테고리 기반 홈 화면 필터링
- 다크 스킨 기반 블로그 UI 구성

## Repository Structure

```text
.
├── _posts/       # 블로그 게시글
├── _pages/       # 검색, 태그, 카테고리 페이지
├── _includes/    # Jekyll include templates
├── _layouts/     # Jekyll layouts
├── _sass/        # 스타일시트
├── assets/       # JS, CSS, 이미지
├── image/        # 게시글 이미지
└── _config.yml   # 사이트 설정
```

## Local Development

```bash
bundle install
bundle exec jekyll serve
```

로컬 서버는 기본적으로 `http://localhost:4000`에서 확인할 수 있습니다.

## Credits

이 블로그는 [Minimal Mistakes Jekyll theme](https://mmistakes.github.io/minimal-mistakes/)을 기반으로 커스터마이징했습니다.

Theme copyright: Michael Rose and contributors.

## License

테마 원본은 MIT License를 따릅니다. 블로그 글과 이미지의 저작권은 별도 명시가 없는 한 작성자에게 있습니다.
