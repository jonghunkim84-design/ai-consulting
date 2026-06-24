# AI 컨설팅 시스템

소상공인 AI 도입 컨설팅을 위한 전 단계 관리 도구입니다. 고객 발굴부터 Pain Point 분석, 솔루션 설계, 제안서 작성, Agile 프로젝트 관리까지 하나의 앱에서 처리합니다.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프론트엔드 | React 19, Vite 8 (단일 파일 `src/App.jsx`) |
| 백엔드 API | Vercel Serverless Functions (`/api/claude`, `/api/transcribe`) |
| AI | Claude API (Anthropic) — 분석·생성, Whisper (OpenAI) — 음성→텍스트 |
| DB | Supabase (PostgreSQL + JSONB) |
| 배포 | Vercel (GitHub `main` 브랜치 자동 배포) |

---

## 시스템 구조

```
ai-consulting/
├── src/
│   ├── App.jsx          # 전체 UI + 로직 (단일 파일)
│   └── supabase.js      # Supabase 클라이언트
├── api/
│   ├── claude.js        # Claude API 프록시 (Vercel Function)
│   └── transcribe.js    # Whisper STT 프록시 (Vercel Function)
├── public/
└── package.json
```

---

## 환경 변수

### Vercel 대시보드 설정

```
ANTHROPIC_API_KEY=         # Claude API 키
OPENAI_API_KEY=            # Whisper STT 키
VITE_SUPABASE_URL=         # Supabase 프로젝트 URL
VITE_SUPABASE_ANON_KEY=    # Supabase anon key
```

---

## Supabase 데이터 구조

테이블명: `clients`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | bigint PK | 클라이언트 ID (타임스탬프 기반) |
| `name` | text | 고객 상호명 |
| `industry` | text | 업종 |
| `size` | text | 사업 규모 |
| `region` | text | 지역 |
| `ai_level` | text | AI 친숙도 |
| `status` | text | 현재 단계 (`discovery` / `diagnosis` / `build`) |
| `phase` | int | 페이즈 번호 (0~2) |
| `step` | int | 스텝 번호 |
| `phases_done` | bool[] | 각 페이즈 완료 여부 [P0, P1, P2] |
| `data` | jsonb | 전체 클라이언트 객체 (전 필드 포함) |
| `created_at` | timestamptz | 생성 시각 |

---

## 주요 기능

### 홈 화면
- 전체 고객 목록 카드 (업종, 단계, 마지막 수정 시각 표시)
- 새 고객 추가 / 고객 삭제
- 진행 단계별 색상 구분 (Discovery · Diagnosis · Build)

---

### Phase 0 — Discovery (고객 발굴 & Pain Point 확정)

**Step 1 · 사전 준비**
- AI 사전 조사: 업체명·업종 기반으로 업종 특성, 트렌드, 예상 Pain Point, 첫 미팅 주의사항 자동 생성
- 직접 수집 정보 입력: 네이버 플레이스, SNS, 지인 정보 등 자유 메모
- 가설 Pain Point 선택: 업종별 템플릿 태그 선택
- 인터뷰 질문지 AI 생성: 필수 질문 + 심화 질문 + 현장 팁 자동 작성 (클립보드 복사)
- 사전 준비 체크리스트

**Step 2 · 아이스브레이킹**
- 아이스브레이킹 진행 체크리스트 + 메모

**Step 3 · 현황 인터뷰**
- 인터뷰 Q&A 노트 (Q1~Q3 + 기타)
- 음성 녹음 → STT: 브라우저 녹음 후 Whisper API로 텍스트 변환
- 인터뷰 체크리스트

**Step 4 · AI 분석**
- Pain Point AI 분석: 인터뷰 내용 기반 Pain Point 도출 (제목, 유형, 영향도, 해결 방향)
- Pain Point 직접 편집 (추가 / 삭제 / 수정)

**Step 5 · 확정 & 전달**
- 최종 Pain Point 확정 체크리스트 + 완료 처리

---

### Phase 1 — Diagnosis (솔루션 설계 & 제안서 작성)

**Step 1 · 문제 재확인**
- Pain Point 재확인 노트 + 추가 Pain Point 입력
- 재확인 체크리스트

**Step 2 · 솔루션 설계**
- AI 솔루션 생성: Pain Point 기반 AI 솔루션 자동 설계 (제목, 유형, 설명, 이유, 도구, 공수, 비용)
- 복수 솔루션 선택 + 통합 합성 (Merged Solution 자동 생성)
- 예산 / 기간 / 도구 / 공수 직접 입력

**Step 3 · 실현 가능성**
- 실현 가능성 체크리스트 + 리스크 메모

**Step 4 · 제안서 작성**
- AI 권장사항 생성: 솔루션별 도입 효과·우선순위 자동 작성
- 제안서 초안 AI 생성: 각 항목 3~5줄, A4 2페이지 이내 분량 제한
- 제안서 직접 편집 (자유 텍스트)
- 제안서 클립보드 복사

**Step 5 · 발표 & 컨펌**
- 발표 체크리스트 + 이의 처리 메모 + 계약 노트

---

### Phase 2 — Build (구현 & 이관)

**Step 1 · 개발 착수 — Agile PM**

AI 프로젝트 플랜 자동 생성:
- Diagnosis 확정 솔루션·Pain Point·도구·기간 기반 스프린트 계획 자동 생성
- 스프린트 2~3개, 태스크 스프린트당 4~6개 자동 배분

스프린트 보드 (Kanban):
- 4개 컬럼: 백로그 / 진행중 / 완료 / 보류
- 태스크 카드: 제목, 우선순위 배지, 스토리 포인트, 담당자
- 상태 이동 버튼 + 태스크 삭제
- 태스크 상세 편집: 제목(텍스트 입력), 담당자, 우선순위, 상태, 포인트
- 담당자 목록: 리소스에 등록된 이름 기준 (미등록 시 기본 역할 목록)
- 스프린트 추가 / 삭제

간트차트:
- 전체 스프린트 기간 가로 바 차트
- 오늘 날짜 빨간 점선 표시
- x축: 시작일 / 중간일 / 종료일 날짜 레이블

번다운 차트:
- 전체 스프린트 기간 기준 (Sprint 1만이 아닌 모든 스프린트 포함)
- 이상선(점선) vs 실제선 SVG 차트
- 오늘 기준 잔여 포인트 시각화
- x축: 전체 프로젝트 시작일~종료일

리소스 관리:
- 담당자별 이름, 역할, 가용률(%) 등록
- 이름 기준 태스크 자동 매칭 → 할당 포인트, 완료 포인트, 부하율(%) 표시
- 과부하 경고 배지
- 팀 속도(Velocity) 슬라이더

**Step 2 · MVP 구현**
- MVP 완료 체크리스트

**Step 3 · 파일럿 테스트**
- 테스트 결과 메모

**Step 4 · 이관 & 완료**
- 사용 매뉴얼 작성
- 핸드오버 체크리스트
- 사례 연구(Case Study) 메모

---

### AI 사용 도우미 챗봇 (전 화면 공통)

화면 우측 하단 💬 버튼을 클릭하면 챗봇 패널이 열립니다.

- **위치 인식**: 현재 머물고 있는 Phase·Step에 맞는 매뉴얼만 컨텍스트로 사용하여 시스템 사용법 범위 안에서만 답변
- **FAQ 버튼**: 챗봇 열릴 때 현재 위치 기반 자주 묻는 질문 최대 3개 버튼 제공, 클릭 시 자동 전송
- **대화 히스토리**: 최근 6개 메시지를 컨텍스트로 유지하며 연속 대화 지원
- **자동 초기화**: Phase·Step 이동 시 대화 히스토리 초기화
- **범위 제한**: 매뉴얼에 없는 내용은 시스템 사용법 관련 질문임을 안내

---

## UX / 공통

- **AI 사용 도우미**: 전 화면 우측 하단 플로팅 챗봇 — Phase·Step별 매뉴얼 기반 답변
- **진행률 바**: 완료된 페이즈 스텝 수 기준 정확 계산 (전체 14스텝)
- **마지막 수정 시각**: 저장 시마다 `updatedAt` 자동 갱신, 홈 카드에 표시
- **필수 입력 표시**: `req` prop → 미입력 시 빨간 테두리 + 분홍 배경
- **선택 입력 표시**: `opt` prop → 회색 배지
- **입력 필드 스타일**: 모든 input/textarea/select — 회색(#C5C5C5) 1.5px 라운드 테두리
- **AI 재시도**: 실패 시 최대 2회 자동 재시도 (1s, 2s 딜레이)
- **다크/라이트 모드**: CSS 변수 기반 (`var(--color-*)`)

---

## 로컬 개발

```bash
npm install
npm run dev
```

`.env.local` 파일 생성:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

> Claude / Whisper API 호출은 Vercel Function을 통해 프록시되므로 로컬에서는 `ANTHROPIC_API_KEY`와 `OPENAI_API_KEY`를 직접 노출하지 않습니다. 로컬 테스트 시 `vercel dev`를 사용하세요.

---

## 배포

`main` 브랜치에 `git push`하면 Vercel이 자동으로 빌드 & 배포합니다.

```bash
git add .
git commit -m "메시지"
git push origin main
```
