# 콘텐츠 발행 체크리스트

[![Verify](https://github.com/huynsolm/content-publishing-checklist/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/huynsolm/content-publishing-checklist/actions/workflows/ci.yml)

브라우저 안에서 페이지 공개 전 점검 항목을 관리하는 정적 도구입니다. 데이터는 이 브라우저/기기의 `localStorage`에만 저장되므로, 기기를 옮기거나 브라우저 데이터를 지우기 전 JSON 백업을 내려받으세요.

## Run

```bash
npm test
npm run lint
npm start
```

Open `http://localhost:4173`. No dependencies, accounts, server, or database are required.

## Scope

Create releases with a page name and HTTPS/HTTP URL; optionally record a deadline, owner, and notes; complete the fixed eight checks; view readiness/progress; filter pending/ready releases; and delete releases. Cards sort dated releases before undated entries and include explicit Korean labels for overdue, due today, and due within six days. Download a versioned JSON backup to move or recover records, and restore only schema-validated backup files with Korean feedback.
