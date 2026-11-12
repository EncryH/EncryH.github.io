# AI · Security 기술 블로그

Linux, 네트워크, 웹 해킹, 패킷 분석 등 보안 전반의 실습 과정과 C언어 · 자료구조 학습, 개인 프로젝트 개발일지를 정리하는 블로그입니다. 단순 정리보다는 문제 해결 과정을 중심으로 기록합니다.


## 로컬 미리보기

Jekyll과 기존 게시물 주소를 유지한 화이트 톤의 개인 사이트입니다. 홈, 소개, 프로젝트, 글 목록을 제공하며 대표 프로젝트는 `_data/featured-projects.yml`에서 관리합니다. 글 원문은 기존 `_posts/`에 그대로 둡니다.

macOS에서 Homebrew Ruby를 사용하는 경우:

```sh
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
bundle install
bundle exec jekyll serve --safe --host 127.0.0.1 --port 4173
```

브라우저에서 `http://127.0.0.1:4173/`을 엽니다. 로컬 변경은 원격 push 전까지 공개 사이트에 반영되지 않습니다.
