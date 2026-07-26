---
layout: single
title: "[DAH 2026] 국방 AI 사이버보안 해커톤 예선 — 방산 UAV 도메인 공격·방어 에이전트 설계기"
categories: Portfolio
tag: [DAH, Hackathon, UAV, MAVLink, AI Agent, Docker, Python, 방산, 보안]
toc: true
toc_label: 목차
author_profile: false
---

# 1. 참여 배경

Comlapse를 만들면서 Electron이나 LLM API 연동 경험은 생겼는데, 보안 도메인에서 AI를 직접 굴려본 적은 없었다. 그러던 중 같은 과 동기가 DAH 2026(Defense AI Cyber Security Hackathon) 대회를 알려줬다. LIG Defense & Aerospace 주최, 방산 도메인에서 UAV/UGV 공격·방어 AI 에이전트를 설계하고 구현하는 대회. 설명 듣자마자 해야겠다 싶어서 바로 합류했고, 팀을 꾸렸다.

# 2. 대회 구조

| 항목 | 내용 |
|------|------|
| 대회명 | AI DAH 2026 (Defense AI Cyber Security Hackathon) |
| 주최 | LIG Defense & Aerospace |
| 예선 | 보고서 제출 (2026.06.15 ~ 2026.07.10) |
| 본선 | 2026.08.21 |

예선은 PDF 보고서 제출이다. 공격 시나리오 설계(30점), 방어 전략(25점), AI 에이전트 아키텍처(25점), 팀 역량(10점), 문서 완성도(10점)으로 총 100점. 시나리오만 써서 내는 게 아니라 Docker 환경에서 실제로 돌아가는 에이전트를 구현하고 실행 증거까지 같이 제출해야 한다.

![방산 무인체계 운용 환경 개념도 — UAV/UGV, 지상통제, 전술통신망의 연동 구조](/image/2026-07-27-DAH2026-preliminary/defense-uav-concept.png)

# 3. 팀과 내 역할

팀명은 **TEAM SMU**(Secure Modeling Unit). 상명대 정보보안공학과 4명이다.

| 멤버 | 역할 |
|------|------|
| 팀원 A | PM / Initial Access Agent / 보고서 구조화 |
| **나** | **Follow-Up Attack Agent / 후속공격 설계 / 공격효과 검증** |
| 팀원 B | Recon Agent / 정찰 흐름 / IntelDocument 정규화 |
| 팀원 C | Defense Agent / 4-Agent 탐지·대응 |

나는 공격 체인 마지막 단계인 Follow-Up Attack Agent를 맡았다. 쉽게 말하면 정찰팀이 정보를 모아오고, 분석팀이 취약점을 찾으면, 내가 그걸 가지고 실제로 공격 이벤트를 쏘는 역할이다. 전자전(EW) 링크 저하 시뮬레이션이랑 프로토콜 프레임 무결성 테스트 모듈을 직접 만들었다.

# 4. Docker로 방산 통신망 재현하기

당연히 진짜 UAV를 날릴 수는 없다. Docker Compose로 방산 무인체계 통신 구조를 컨테이너로 재현했다.

```text
┌──────────────────────────────────────────────────┐
│                  dah-net (172.31.50.x)            │
│                                                   │
│  ┌─────────┐   ┌──────────┐   ┌──────────────┐   │
│  │ dah-uav │   │ dah-ugv  │   │ dah-companion│   │
│  │ (.10)   │   │ (.20)    │   │   (.30)      │   │
│  └────┬────┘   └──────────┘   └──────┬───────┘   │
│       │                              │            │
│  ┌────┴───────────────┐    ┌────────┴─────────┐  │
│  │     dah-gcs        │    │ dah-tactical-    │  │
│  │                    │    │    router        │  │
│  └────────────────────┘    └──────────────────┘  │
│                                                   │
│  ┌─────────────────┐  ┌────────────────────────┐  │
│  │ dah-dashboard   │  │ dah-mission-control    │  │
│  │ (:9000)         │  │                        │  │
│  └─────────────────┘  └────────────────────────┘  │
│                                                   │
│  ┌─────────────┐      ┌───────────────────────┐   │
│  │attack_agent │      │  defense_agents (.60) │   │
│  └─────────────┘      └───────────────────────┘   │
└──────────────────────────────────────────────────┘
```

| 계층 | 컨테이너 | 하는 일 |
|------|----------|---------|
| 무인 자산 | `dah-uav`, `dah-ugv` | UAV/UGV 상태 생성, 임무 시뮬레이션 |
| 탑재/중계 | `dah-companion` | Telemetry 변환해서 GCS로 전달 |
| 지상통제 | `dah-gcs` | 명령 중계, 상태 모니터링 |
| 전술망 | `dah-tactical-router` | 링크 품질, 지연, 손실률 조절 |
| 상위 지휘통제 | `dah-mission-control` | C2/BMS 역할 |
| 관제 | `dah-dashboard` | 실시간 시각화, Agent 로그 |
| Agent | `attack_agent`, `defense_agents` | 공격·방어 실행 |

![Docker Desktop에서 실행 중인 DAH 테스트베드 — 12개 컨테이너의 실시간 로그](/image/2026-07-27-DAH2026-preliminary/docker-containers-log.png)

컨테이너를 하나씩 올릴 때마다 느낀 건데, `docker-compose.yml` 자체가 아키텍처 문서였다. UAV → companion → GCS → tactical-router → mission-control, 이 계층 구조가 Docker 네트워크에 그대로 들어가 있으니까 코드를 읽기 전에 `docker-compose.yml`만 봐도 전체 그림이 보였다.

# 5. MAVLink이 왜 뚫리는가

공격 시나리오의 출발점은 MAVLink 프로토콜의 구조적 문제 두 가지였다.

하나는 **서명 검증이 기본으로 꺼져 있다**는 거다. 시스템 ID(SYS_ID)를 지상통제체계 번호인 255로 세팅하기만 하면, 누가 보냈든 정당한 명령으로 처리된다. 진짜 이게 돼? 싶었는데 된다.

다른 하나는 **Fail-safe 임계값이 API로 노출**된다는 거다. 링크 품질이 얼마나 떨어지면 안전 착륙에 들어가는지, 그 숫자를 정찰 단계에서 그냥 읽어올 수 있었다. 임계값을 알면 딱 그만큼만 초과시키면 되니까.

이 두 가지를 엮어서 최종 목표를 잡았다.

```text
정찰 임무 지속성 저하 → Telemetry 신뢰성 저하 → 전술링크 안정성 저하 → Fail-safe 강제 전환
```

성공이면 UAV가 `FAILSAFE_LAND`(착륙 진입), `FAILSAFE_LANDED`(착륙 완료), `FAILSAFE_STOPPED`(임무 중단) 중 하나로 빠지는 거다.

# 6. 공격 에이전트 — 3단계 체인

공격 에이전트는 3단계로 나눠서 설계했다.

![3단계 공격 에이전트 아키텍처 — Recon → Initial Access → Follow-Up Attack, 하단에 3종 Adapter](/image/2026-07-27-DAH2026-preliminary/attack-agent-architecture.png)

```text
ReconAgent → InitialAccessAgent → FollowUpAttackAgent
```

| 단계 | 뭘 하나 | 산출물 |
|------|---------|--------|
| Recon | Dashboard/Failsafe API 조회, MAVLink 수동 미러 | `stage_1_recon.json` |
| Initial Access | API 표면, 자산, 통신 흐름 분석 | `stage_2_initial_access.json`, `stage_2_attack_graph.json` |
| Follow-up | 공격 계획 세우고 실행, 전후 상태 비교 | `stage_3_attack_plan.json`, `stage_3_execution_report.json` |

각 단계가 JSON을 남기고 다음 단계한테 넘긴다. 이게 생각보다 편했다. 정찰 결과가 JSON으로 떨어지니까 분석 단계에서 바로 파싱해서 쓰고, 분석 결과도 JSON이니까 내가 공격 계획 짤 때 그대로 읽으면 됐다.

## 5개 공격 벡터

최종적으로 구현한 건 MAVLink 인증 부재 계열 3개 + 전자전 링크 저하 계열 2개, 총 5개다.

실행 전략은 `fallback_until_success`. 앞에서 성공하면 끝, 실패하면 다음 벡터로 넘어간다.

| 순서 | 벡터 | 성공 기준 | Adapter |
|------|------|-----------|---------|
| 1 | `MAVLINK_STATUS_SPOOF` | UAV 위치 이동 80m 미만 | `MavlinkInjectorAdapter` |
| 2 | `HB_TIMEOUT_INDUCTION` | UAV 위치 이동 80m 미만 | `MavlinkInjectorAdapter` |
| 3 | `MAVLINK_COMMAND_INJECTION` | 고도 50m 이상 하강 or LANDING 전환 | `MavlinkInjectorAdapter` |
| 4 | `EW_LINK_DEGRADATION_SIM` | `loss_pct` >= 목표 손실률 | `JammerAdapter` |
| 5 | `EW_STEALTH_DEGRADATION_SIM` | `loss_pct` >= 목표 손실률 | `JammerAdapter` |

기본은 dry-run이다. 실제 이벤트를 날리려면 `--execute` 플래그랑 `ENABLE_LAB_ATTACKS=true` 환경변수가 둘 다 있어야 한다. 실수로 공격이 날아가면 안 되니까 이중으로 잠가놨다.

```python
# dry-run (기본)
python -m attack_agent.kill_chain --stage all --objective FAILSAFE_INDUCTION --max-steps 5

# 실제 실행 (이중 안전장치)
$env:ENABLE_LAB_ATTACKS="true"
python -m attack_agent.kill_chain --stage all --objective FAILSAFE_INDUCTION --execute --max-steps 5
```

# 7. 내가 직접 만든 것들

## JammerAdapter

내 메인 담당은 `JammerAdapter`다. 전술 라우터(TMMR/TICN)의 링크 품질을 떨어뜨리는 건데, 당연히 진짜 전파 방해가 아니라 Docker 안에서 `dah-tactical-router`의 링크 지표를 조작하는 시뮬레이션이다.

벡터 두 개를 만들었다.

- **`EW_LINK_DEGRADATION_SIM`**: 급격하게 확 떨어뜨린다. 빠르긴 한데 방어 에이전트한테 바로 걸린다.
- **`EW_STEALTH_DEGRADATION_SIM`**: 천천히 조금씩 떨어뜨린다. 방어 에이전트의 threshold 기반 탐지를 우회하면서 Fail-safe 조건까지 도달하는 게 목표다.

이 두 개를 만들면서 재밌었던 게, 급격한 저하 버전을 먼저 만들고 나서 "이거 방어 에이전트가 너무 쉽게 잡는데?" 하고 느끼고 은닉 버전을 추가한 거다. 공격을 만들어봐야 방어의 허점이 보인다는 걸 직접 체감했다.

## TamperAdapter

`PROTOCOL_FRAME_INTEGRITY_SIM` 벡터를 처리한다. MAVLink 프레임을 일부러 비정상으로 합성해서, 방어 쪽이 이걸 제대로 탐지하는지 테스트하는 용도다. Fail-safe 유도보다는 공격 표면 검증 성격이 강하다.

솔직히 이 모듈들 만들면서 제일 많이 고민한 건 "이게 의미가 있나?"였다. Docker 안에서 숫자 조작하는 건데 현실적인 공격이라고 할 수 있나? 근데 결론은, 공격 메커니즘이 아니라 **공격이 성공했을 때 시스템이 어떻게 반응하는지**를 보는 게 핵심이었다. Fail-safe가 제대로 걸리는지, 방어 에이전트가 잡아내는지, 그걸 검증하는 테스트베드로서 의미가 있었다.

# 8. 방어 에이전트 — 4-Agent 구조

방어는 공격과 독립적으로 돌아가는 4단계 구조다.

![4-Agent 방어 체계 아키텍처 — Policy → Detection → Response → Recovery](/image/2026-07-27-DAH2026-preliminary/defense-agent-architecture.png)

```text
DefensePolicyAgent → DefenseDetectionAgent → DefenseResponseAgent → DefenseRecoveryAgent
```

| Agent | 하는 일 |
|-------|---------|
| Policy | 허용 SYS_ID, 제한 명령, threshold 등 정책 로드 |
| Detection | MAVLink 명령 주입, replay, GPS spoofing, jamming 탐지 |
| Response | `BLOCK_COMMAND`, `FORCE_RTL`, `SAFE_MODE` 같은 playbook 실행 |
| Recovery | 상태 재확인하고 incident report 저장 |

제출 직전에 급하게 넣은 **Defense Guard**가 은근 중요했다. Dashboard, Router, UAV 각각에 방어 게이트를 심어서, 공격 이벤트가 들어와도 실제 상태 변경으로 이어지지 않게 막고 `BLOCKED` 증거를 남기는 구조다.

| 차단 지점 | 뭘 막나 |
|-----------|---------|
| Dashboard guard | 공격 이벤트 → fail-safe overlay, mission state 변경 차단 |
| Router guard | EW/JAM 이벤트 → TICN 손실률 변경 차단 |
| UAV guard | 비허용 SYS_ID, 제한 command, 위조 heartbeat 차단 |

![방어 에이전트 실행 결과 — defense_incident_report.json의 탐지·대응·복구 타임라인](/image/2026-07-27-DAH2026-preliminary/defense-incident-report.png)

# 9. 실행 결과

## 정상 운영

대시보드(`http://localhost:9000`)에서 UAV/UGV 위치, Mission State, 통신 링크, TMMR/TICN 상태, Agent 로그를 한눈에 볼 수 있다.

![대시보드 정상 운영 — EN_ROUTE 임무 수행 중](/image/2026-07-27-DAH2026-preliminary/dashboard-normal.png)

## Fail-safe 유도 성공

Kill Chain을 돌리면 5개 벡터가 순서대로 시도된다. 1~3번(MAVLink 계열)이 다 실패하고 4번 `EW_LINK_DEGRADATION_SIM`에서 성공했다. Mission State가 `FAILSAFE_LANDED`로 바뀌고 UAV 고도가 0m로 내려간 걸 볼 때 좀 짜릿했다.

![FAILSAFE_LANDED 상태 전환 — 4번째 벡터에서 성공, UAV 고도 0m](/image/2026-07-27-DAH2026-preliminary/dashboard-failsafe-landed.png)

## 증거 확보

`stage_3_execution_report.json`에 공격 전후 상태가 다 기록된다. `mission_state: FAILSAFE_LAND`, `status: FAILSAFE_TRIGGERED`, 링크 `satcom: DEGRADED`까지.

![execution_report.json — Fail-safe 유도 성공 증거](/image/2026-07-27-DAH2026-preliminary/execution-report-json.png)

# 10. 39페이지 보고서 쓰기

보고서 구성은 이렇다.

| 장 | 내용 | 페이지 |
|----|------|--------|
| 1 | 팀 구성 및 역할 | p3 |
| 2 | 공격 시나리오 설계 | p4~14 |
| 3 | 방어 아키텍처 | p15~20 |
| 4 | AI 에이전트 설계 및 구현 | p21~35 |
| 5 | 결론 및 향후 계획 | p36~38 |
| 6 | 참고문헌 | p39 |

39페이지를 2주 만에 쓰는 건 코드 짜는 것만큼 힘들었다.

7월 7일 시점에 돌아가는 공격 벡터가 C-1(EW 링크 저하) 하나뿐이었다. "일단 돌아가는 거 먼저, 안 돌아가면 보고서도 못 쓴다"는 원칙으로 C-1에 집중했는데, 쓰다 보니 MAVLink 인증 부재 계열도 구현할 수 있겠다는 판단이 들어서 결국 5개 벡터를 다 만들었다.

보고서 쓸 때 가장 신경 쓴 건 **말투**다. "침입 탐지 우회"같은 표현은 전부 빼고 "저강도 read-only 정찰", "비파괴적 정보 수집"으로 바꿨다. MAVLink도 `MAVLink-like`로 표기해서 시뮬레이션 환경이라는 걸 확실히 했다. 공격만 강조하면 인상이 안 좋으니까, 탐지·차단·복구 설계를 같이 강조하는 방향으로 잡았다.

참고문헌은 15편. MAVLink Developer Guide, ArduPilot Failsafe 문서, KISA 드론 보안 가이드부터 MAVSec 논문, NIST CSF 2.0까지 달았다. 우크라이나 전쟁 드론 사례(CSIS, 2025)나 광섬유 드론(Atlantic Council, 2026) 같은 최근 동향도 넣었다.

# 11. 기술 스택

| 구분 | 기술 |
|------|------|
| 언어 | Python 3.11 |
| 실행환경 | Docker, Docker Compose |
| 프로토콜 | MAVLink v2 (pymavlink) |
| 통신 | HTTP API (urllib), UDP/JSON |
| 비동기 | threading, queue.Queue (방어) |
| 대시보드 | Flask, Flask-SocketIO, eventlet |
| 네트워크 | Docker bridge `dah-net` (172.31.50.x) |
| 데이터 | JSON |

한 가지 의식적으로 지킨 게 있다. 대회 규정상 GPL은 못 쓰고 MIT, Apache 2.0, BSD만 허용이다. 코드 IP는 팀 귀속이지만 LIG D&A에 무상 비독점 실시권을 부여하는 조건이라, 라이브러리 하나 가져다 쓸 때마다 라이선스를 확인했다.

# 12. 돌아보면

## 계획이랑 결과가 다르다

7월 7일 계획은 "C-1 하나에 집중"이었는데 제출할 때는 5개 벡터를 다 넣었다. 계획 자체는 크게 바뀌었지만 "돌아가는 코드 먼저 → 보고서에 재료 투입"이라는 원칙은 끝까지 먹혔다. 코드가 돌아가니까 보고서에 넣을 게 생기고, 보고서를 쓰다 보니 빠진 구현이 보이고, 그걸 채우면 보고서가 더 탄탄해지는 순환이 생겼다.

## 공격을 만들어봐야 방어가 보인다

`EW_STEALTH_DEGRADATION_SIM`(점진적 링크 저하)을 만들 때 느낀 건데, 기존 방어 에이전트의 threshold 기반 탐지가 이 공격을 놓칠 수 있다는 걸 직접 확인했다. 그래서 방어 로직에 추세 기반 탐지를 추가하게 됐다. 공격하는 쪽에서 시도해봐야 방어에서 뭘 놓치는지가 보인다.

## 보고서도 엔지니어링이다

8섹션 구조를 잡고, 각 섹션에 들어갈 재료를 정리하고, 표현 톤을 맞추는 작업이 코드 아키텍처 잡는 거랑 크게 다르지 않았다. "시나리오 개요 → 운용 환경 → 공격 목표 → 위협 모델 → 공격 표면 → 공격 전개 → 판정 기준 → 예상 피해" 순서가 자연스럽게 읽히려면, 각 섹션이 다음 섹션의 전제를 깔아줘야 한다. 이건 함수 간 의존성 정리하는 거랑 비슷한 감각이었다.

## 보안 + AI, 이제 좀 감이 잡힌다

Comlapse에서는 AI를 사용자 도구로 썼고, DAH에서는 AI를 공격/방어 자동화 에이전트로 썼다. 같은 AI인데 도메인에 따라 완전히 다른 형태가 된다. 이번 대회 덕에 "정보보안 전공 위에 AI 서비스 개발"이라는 방향이 말로만 하는 게 아니라 실제 결과물로 붙기 시작했다.

# 13. 다음

예선 보고서는 7월 10일에 제출했다. 결과 발표가 7월 31일이고 본선은 8월 21일이다.

본선은 실제 시뮬레이션 환경에서 공격-방어 에이전트를 실시간으로 대결시키는 방식이 될 거다. 예선에서 만든 5개 벡터랑 4-Agent 방어가 실전에서 어떻게 돌아가는지 확인할 수 있는 무대가 된다.
