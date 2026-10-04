# 콘텐츠 발행 체크리스트

[![Verify](https://github.com/huynsolm/content-publishing-checklist/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/huynsolm/content-publishing-checklist/actions/workflows/ci.yml)

브라우저 안에서 페이지 공개 전 점검 항목을 관리하는 정적 MVP입니다. 데이터는 이 브라우저/기기의 `localStorage`에만 저장됩니다.

## Run

```bash
npm test
npm run lint
npm start
```

Open `http://localhost:4173`. No dependencies, accounts, server, or database are required.

## Scope

Create releases with a page name and HTTPS/HTTP URL; complete the fixed eight checks; view readiness/progress; filter pending/ready releases; and delete releases.
