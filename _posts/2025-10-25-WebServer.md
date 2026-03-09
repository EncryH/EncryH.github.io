---
layout: single
title: "Ubuntu 기반 Apache + PHP + MariaDB 웹 서버 구축 및 웹 해킹 실습 환경 구성"
categories: Linux
tag: [ubuntu, 웹 해킹]
toc: true
toc_label: 목차
author_profile: false
---
# Apache + PHP + MariaDB 웹 서버 구축 및 웹 해킹 실습 환경 구성

# 실습을 위한 웹 서버 구축
웹 서버를 구축하고 운영할 때 단순히 웹 서버만 구축하여 운영하는 경우는 많지 않다.
실제 구성 방식은 아파치(apache), 엔진엑스(Nginx) 등과 같은 웹 서버와 MariaDB와 같은 데이터베이스 시스템을 구축한 후 그 위에 웹 애플리케이션을 개발하여 웹 서버와 데이터베이스와 연동하는 웹 서비스를 한다.

# 아파치 + PHP + MariaDB 설치

## 우분투
## 1. 패키지와 웹 서버, MariaDB 등 설치
[패키지 정보 업데이트]
![패키지 정보 업데이트](/image/2025-10-25-WebServer/패키지 정보 업데이트.png)

[아파치 웹 서버 설치]
![아파치 웹 서버 설치](/image/2025-10-25-WebServer/아파치 웹 서버 설치.png)

[MariaDB 설치]
![MariaDB 설치](/image/2025-10-25-WebServer/MariaDB 설치.png)

[PHP 모듈 설치]
![PHP 모듈 설치](/image/2025-10-25-WebServer/PHP 모듈 설치.png)

[패키지 정보를 확인하여 취약한 버전이 설치되어 있는지 점검]
![패키지 정보 확인하여 취약한 버전 있는지 확인](/image/2025-10-25-WebServer/패키지 정보 확인하여 취약한 버전 있는지 확인.png)

## 2. 웹 서비스와 MariaDB 시작
[웹 서비스 및 MariaDB 시작]
![웹 서비스 및 MariaDB 시작](/image/2025-10-25-WebServer/웹 서비스 및 MariaDB 시작.png)

## 3. 방화벽 정책 추가 [우분투에서 방화벽은 기본으로 비활성화 되어 있는 상태이므로 방화벽 상태를 확인한 후 활성화되도록 설정한다]
[방화벽 상태 확인]
![방화벽 상태 확인](/image/2025-10-25-WebServer/방화벽 상태 확인.png)
활성화 되어 있는 것을 확인 완료

[HTTP 기본 포트인 TCP 80번 포트 허용]

![HTTP 기본 포트인 TCP 80번 포트 허용](/image/2025-10-25-WebServer/HTTP 기본 포트인 TCP 80번 포트 허용.png)

## 4. 웹 브라우저를 켠 뒤 주소창에 설정한 실습 서버 IP(192.168.100.11)를 입력하면 웹 서버에 정상적으로 접속되는지 확인할 수 있다.

![웹 브라우저로 실습 서버 IP 접속 여부 확인](/image/2025-10-25-WebServer/웹 브라우저로 실습 서버 IP 접속 여부 확인.png)

# 웹 해킹 실습을 위한 예제 설치하기
웹 서버를 구축했으니 이제 웹 해킹 실습을 위한 예제를 설치할 것이다.

## 우분투
## 1. 예제 설치
![예제 다운로드](/image/2025-10-25-WebServer/예제 다운로드.png)

[예제 다운로드]
![예제다운다운](/image/2025-10-25-WebServer/예제다운다운.png)

[압축 해제]
![압축 해제](/image/2025-10-25-WebServer/압축 해제.png)

[예제 경로로 이동]
![예제 경로로 이동](/image/2025-10-25-WebServer/예제 경로로 이동.png)

[데이터베이스에 실습 데이터 복원]
![데이터베이스에 실습 데이터 복원](/image/2025-10-25-WebServer/데이터베이스에 실습 데이터 복원.png)

[MariaDB 설치 후 root 로그인 방식 변경]
![MariaDB 설치 후 root 로그인 방식 변경](/image/2025-10-25-WebServer/MariaDB 설치 후 root 로그인 방식 변경.png)

**MariaDB 10.4 이상부터는 `mysql.user`가 “테이블이 아니라 VIEW”이다.**

## **✅ 올바른 해결 방법 (정석)**

### **1️⃣ `ALTER USER` 사용해야 함**

MariaDB / MySQL 최신 버전에서는 **무조건 이 방식** 👇
```c
ALTERUSER'root'@'localhost'
IDENTIFIED VIA mysql_native_password
USING PASSWORD('새비밀번호');
```