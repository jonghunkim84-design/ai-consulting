import { useState, useRef, useEffect, Fragment } from "react";
import { supabase } from './supabase.js'

const C={blue:"#185FA5",blueBg:"#E6F1FB",blueLt:"#B5D4F4",teal:"#0F6E56",tealBg:"#E1F5EE",tealLt:"#9FE1CB",purple:"#534AB7",purpleBg:"#EEEDFE",success:"#3B6D11",successBg:"#EAF3DE",warn:"#854F0B",warnBg:"#FAEEDA",danger:"#A32D2D",dangerBg:"#FCEBEB",gray:"#5F5E5A",grayBg:"#F1EFE8"};
const INDUSTRIES=["카페/베이커리","식당/요식업","소매/유통","서비스업(미용/학원)","제조/가공업","기타"];
const SIZES=["1인(사장님 혼자)","2~5인","5~10인","10인 이상"];
const AI_LEVELS=["초급(처음)","중급(ChatGPT 써봤음)","고급(API/자동화 경험)"];
const PAIN_TYPES=["반복업무 자동화","정보 부족/분석","고객 응대 자동화"];
const BUDGETS=["무료~10만원","10~50만원","50~200만원","200만원+"];
const TIMELINES=["1주 이내","2~4주","1~3개월","3개월+"];
const HYPO={"카페/베이커리":["재고 수기 관리","발주 타이밍 놓침","SNS 포스팅 시간 없음","매출 분석 안됨"],"식당/요식업":["예약 전화 놓침","메뉴 원가 파악 안됨","직원 스케줄 복잡","단골 관리 없음"],"소매/유통":["재고 파악 어려움","가격 비교 귀찮음","매출 데이터 없음","반품 처리 번거로움"],"서비스업(미용/학원)":["예약 관리 복잡","재방문율 낮음","홍보 방법 모름","출석/이력 관리 번거로움"],"제조/가공업":["납기 관리 어려움","원자재 재고 파악 안됨","견적서 작성 오래 걸림","품질 불량 추적 안됨"],"기타":["반복 업무 많음","데이터 정리 안됨","고객 응대 부담","비용 파악 안됨"]};
// ── UI 텍스트 상수 (CHATBOT_MANUAL과 렌더 코드가 동일 소스 참조) ──
const CL_D1=["고객 기본 정보 입력 완료","AI 자동 조사 실행 완료","직접 수집 정보 입력 완료","가설 Pain Point 2개 이상 선택","인터뷰 질문지 생성 완료"];
const CL_D2=["인사 및 자기소개 완료","분위기 완화 완료","AI 친숙도 확인","기대 수준 정렬","편한 분위기 형성"];
const CL_D5=["요약 문서 고객 전달","고객 컨펌 수령","다음 미팅 일정 확정"];
const CL_DG3=["스마트폰 운영 가능","기존 도구 연동 검토","예산 범위 내","고객 혼자 운영 가능","2주 내 MVP 가능"];
const CL_DG4=[["제안 솔루션(TO-BE) 내용 확인","시스템 개요, 기능, 기술스택 포함 여부"],["구축 범위 In/Out-Scope 명확히 기재","고객이 기대하는 것과 차이 없는지"],["추진 일정(WBS) 현실적인지 검토","고객 일정과 맞는지"],["사업비 항목별 내역 정확한지 확인","유지보수 비용 포함 여부"],["기대 효과 수치 근거 있는지 확인","ROI 계산 포함 여부"]];
const CL_DG5=["제안서 전달 완료","솔루션 방향 합의","일정 및 비용 합의","착수 조건 확정"];
const CL_DG5_OBJ=["비용이 부담돼요","어렵게 느껴져요","나중에 생각해볼게요","직접 못 쓸 것 같아요"];
const CL_B3=["MVP 사용법 안내 완료","1주차 파일럿 + 중간 피드백","버그/불편 수정 완료","2주차 파일럿 + 최종 피드백","고객 만족도 확인"];
const CL_B4=[["최종 사용 설명서 전달","1페이지+스크린샷"],["사용법 영상 1개 전달","3분 이내"],["계정 정리 문서 전달","공유 노션"],["고객 혼자 1회 실습","옆에서 보조"],["30일 A/S 채널 안내","카카오 오픈채팅"]];
const BTN_D1_NEXT="준비 완료 → 아이스브레이킹 →";
const BTN_D3_NEXT="완료 → AI 분석 →";
const BTN_D5_NEXT="✓ Discovery 완료 → Diagnosis →";
const BTN_DG1_BACK="← Discovery로";
const BTN_DG2_NEXT="제안서 초안 완료 → 실현 가능성 평가 →";
const BTN_DG3_NEXT="평가 완료 → 제안서 최종 확인 →";
const BTN_DG3_REGEN="🔄 선택한 권고 사항 반영 → 제안서 재생성";
const BTN_DG4_NEXT="제안서 완료 → 발표 & 컨펌 →";
const BTN_DG5_NEXT="✓ Diagnosis 완료 → Build →";
const BTN_B1_NEXT="착수 완료 → MVP 구현 →";
const BTN_B1_BACK="← Diagnosis로";
const BTN_B2_NEXT="MVP 완료 → 파일럿 →";
const BTN_B3_NEXT="파일럿 완료 → 이관 →";
const BTN_B4_COMPLETE="🎉 프로젝트 완료 확정";

const CHATBOT_MANUAL={
  home:`
[홈 화면]
- 신규 고객 추가: 우측 상단 [+ 신규 고객 등록] 버튼 클릭 → 기본 정보 입력 후 등록
- 고객 컨설팅 화면 이동: 고객 카드 클릭
- 고객 삭제: 고객 카드 우측 [✕] 버튼 클릭 → 확인창 확인
- 단계별 색상: Discovery=파란색, Diagnosis=청록색, Build=보라색
- 진행률 바: 카드 우측에 완료 퍼센트(%) 및 바 표시
- 로그아웃: 우측 상단 [🔒 로그아웃] 버튼 클릭
  `,
  "0-1":`
[Phase 0 Step 1 — 사전 준비]
- AI 사전조사 실행: 고객명·업종 입력 후 [🔍 AI 자동 사전 조사 실행] 버튼 클릭 → 업종 특성·트렌드·예상 Pain Point 자동 생성
- 빠른 입력 태그: [네이버 플레이스] [SNS 분석] [경쟁사 정보] [지인 정보] 버튼 클릭 → 직접 수집 정보 텍스트 영역에 태그 자동 삽입
- 가설 Pain Point 선택: 업종별 태그 클릭으로 선택/해제 (복수 선택 가능)
- 인터뷰 질문지 생성: [✨ 인터뷰 질문지 자동 생성] 버튼 클릭 → 맞춤형 질문지 자동 작성
- 질문지 복사: [📋 질문지 복사] 버튼 클릭 → 클립보드 복사
- 질문지 재생성: [🔄 재생성] 버튼 클릭
- 사전 준비 체크리스트: "${CL_D1.join(" / ")}" 각 항목 클릭으로 완료 처리
- 다음 Step 이동: [${BTN_D1_NEXT}] 버튼 클릭
  `,
  "0-2":`
[Phase 0 Step 2 — 아이스브레이킹]
- AI 친숙도 선택: 화면 내 AI 친숙도 태그 클릭으로 선택
- 특이사항 메모 입력: "특이사항..." 텍스트 영역에 자유 입력 → 자동 저장
- 체크리스트: "${CL_D2.join(" / ")}" 각 항목 클릭으로 완료/취소
- 다음 Step 이동: [완료 →] 버튼 클릭
- 이전 Step 이동: [← 이전] 버튼 클릭
  `,
  "0-3":`
[Phase 0 Step 3 — 현황 인터뷰]
- 고객 답변 직접 입력: Q1·Q2·Q3 텍스트 영역에 직접 입력, 추가 탐색 메모 텍스트 영역에 예산·도구·직원 관련 내용 입력
- 녹음 파일 업로드(STT): "녹음 파일 업로드" 패널의 점선 업로드 영역 클릭 → MP3/M4A/WAV 파일 선택 → Whisper가 텍스트 변환 후 Q1~Q3 자동 입력
- 자동 입력 확인: AI가 자동 입력한 Q1~Q3 항목에 [🤖 자동입력] 배지 표시 → 텍스트 영역 클릭으로 직접 수정 가능
- STT 결과 복사: 변환 완료 후 우측 [📋 복사] 버튼 클릭
- 다음 Step 이동: [${BTN_D3_NEXT}] 버튼 클릭
- 이전 Step 이동: [← 이전] 버튼 클릭
  `,
  "0-4":`
[Phase 0 Step 4 — AI 분석]
- Pain Point 자동 도출: [✨ AI 분석 실행] 버튼 클릭 → 인터뷰 내용 기반 Pain Point 카드 자동 생성
- Pain Point 수정: 카드 내 제목 입력란·유형 태그·현재 영향 입력란 클릭 후 직접 수정
- Pain Point 추가: "Pain Point 편집" 패널 하단 [+ 추가] 버튼 클릭 → 빈 카드 추가
- 다음 Step 이동: [완료 →] 버튼 클릭
- 이전 Step 이동: [← 이전] 버튼 클릭
  `,
  "0-5":`
[Phase 0 Step 5 — 확정 & 전달]
- Pain Point 요약 문서 복사: [📋 복사] 버튼 클릭 → 클립보드 복사 (고객 전달용)
- 완료 체크리스트: "${CL_D5.join(" / ")}" 각 항목 클릭으로 완료 처리
- Phase 1 이동: [${BTN_D5_NEXT}] 버튼 클릭
- 이전 Step 이동: [← 이전] 버튼 클릭
  `,
  "1-1":`
[Phase 1 Step 1 — 문제 재확인]
- Discovery 결과 확인: 상단 "Discovery 결과" 패널에 Phase 0에서 확정된 Pain Point 자동 표시
- 추가 파악 내용 입력: "추가 파악 내용" 텍스트 영역에 2차 미팅 추가 내용 입력
- 예산·의사결정 메모 입력: "예산·의사결정 메모" 텍스트 영역에 예산 범위·의사결정자 메모 입력
- AI 추가 확인 포인트 생성: [🤖 AI 추가 확인 포인트] 버튼 클릭 → Discovery 결과 기반 추가 확인사항 자동 생성
- 다음 Step 이동: [완료 →] 버튼 클릭
- 이전 Step 이동: [${BTN_DG1_BACK}] 버튼 클릭
  `,
  "1-2":`
[Phase 1 Step 2 — 솔루션 설계]
- 예산 범위 선택: "예산 범위" 드롭다운 클릭 후 항목 선택
- 희망 일정 선택: "희망 일정" 드롭다운 클릭 후 항목 선택
- AI 솔루션 생성: [✨ AI 솔루션 3개 자동 생성] 버튼 클릭 → 솔루션 카드 3개 자동 생성
- 솔루션 선택: 솔루션 카드 클릭으로 선택/해제 (복수 선택 가능, 선택 시 테두리 강조)
- 통합 합성: 2개 이상 선택 후 [🔀 선택 솔루션 통합 합성] 버튼 클릭 → 통합 솔루션 자동 생성
- 제안서 초안 자동 생성: 솔루션 선택 후 [✨ 제안서 초안 자동 생성 (6개 항목)] 버튼 클릭 → 6개 항목 제안서 자동 작성
- 제안서 복사: [📋 복사] 버튼 클릭 → 클립보드 복사
- 제안서 재생성: [🔄 재생성] 버튼 클릭
- 다음 Step 이동: [${BTN_DG2_NEXT}] 버튼 클릭 (솔루션 미선택 또는 제안서 미생성 시 비활성)
- 이전 Step 이동: [← 이전] 버튼 클릭
  `,
  "1-3":`
[Phase 1 Step 3 — 실현 가능성]
- 제안서 초안 참조: 상단 "STEP 2 제안서 초안 요약" 패널에서 내용 확인
- AI 실현 가능성 평가: 솔루션별 [🤖 AI 실현 가능성 평가] 버튼 클릭 → 강점·리스크·성공조건·권고사항 자동 생성
- 실현 가능성 체크: 솔루션별 체크박스 5개 클릭 ("${CL_DG3.join(" / ")}")
- 공통 리스크 메모 입력: "공통 리스크 메모" 텍스트 영역에 입력
- 반영 권고 사항 선택: "반영할 권고 사항" 체크박스 클릭으로 제안서에 반영할 항목 선택
- 제안서 재생성: [${BTN_DG3_REGEN}] 버튼 클릭 → STEP 2 제안서가 권고 사항 반영 버전으로 업데이트
- 다음 Step 이동: [${BTN_DG3_NEXT}] 버튼 클릭
- 이전 Step 이동: [← 이전] 버튼 클릭
  `,
  "1-4":`
[Phase 1 Step 4 — 제안서 최종 확인]
- 제안서 직접 편집: "최종 제안서 확인 & 편집" 패널의 텍스트 영역 클릭 후 직접 수정
- 전체 복사: [📋 전체 복사] 버튼 클릭 → 클립보드 복사
- STEP 2에서 재생성: [← STEP 2에서 재생성] 버튼 클릭 → STEP 2 화면으로 이동
- STEP 3에서 권고 반영: [← STEP 3에서 권고 반영] 버튼 클릭 → STEP 3 화면으로 이동
- 제안서 완료 체크리스트: "${CL_DG4.map(([t])=>t).join(" / ")}" 각 항목 클릭
- 다음 Step 이동: [${BTN_DG4_NEXT}] 버튼 클릭
- 이전 Step 이동: [← 이전] 버튼 클릭
  `,
  "1-5":`
[Phase 1 Step 5 — 발표 & 컨펌]
- 반론 빠른 선택: ${CL_DG5_OBJ.map(t=>`[${t}]`).join(" ")} 태그 클릭 → 반론 텍스트 자동 입력
- 반론 직접 입력: "고객 반론 입력..." 텍스트 영역에 직접 입력
- AI 대응 답변 생성: [🤖 AI 대응 답변] 버튼 클릭 → 반론 대응 스크립트 200자 이내 자동 생성
- 컨펌 체크리스트: "${CL_DG5.join(" / ")}" 각 항목 클릭으로 완료 처리
- 계약 메모 입력: "착수금, 일정, 특이사항..." 텍스트 영역에 입력
- Phase 2 이동: [${BTN_DG5_NEXT}] 버튼 클릭
- 이전 Step 이동: [← 이전] 버튼 클릭
  `,
  "2-1":`
[Phase 2 Step 1 — 개발 착수 Agile PM]
- 솔루션 착수 요약 확인: 상단 패널에서 고객명·솔루션명 확인 (읽기 전용)
- 도구·기간·비용 수정: "🔧 사용 도구 / ⏱ 예상 기간 / 💰 예상 비용" 입력란 클릭 후 직접 수정
- Diagnosis 솔루션 수정: [← Diagnosis STEP 2에서 솔루션 수정하기] 링크 클릭
- AI 프로젝트 플랜 자동생성: [✨ AI 프로젝트 플랜 자동 생성] 버튼 클릭 → 스프린트·태스크 자동 생성
- 탭 전환: 상단 탭 [📋 보드] [📅 간트] [📉 번다운] [👥 리소스] [🔀 프로세스] 클릭으로 뷰 전환
- 📋 보드 — 태스크 상태 변경: 태스크 카드 하단 [→진행중] [→완료] [→보류] 버튼 클릭
- 📋 보드 — 태스크 삭제: 태스크 카드 우측 상단 [✕] 버튼 클릭
- 📋 보드 — 태스크 상세 편집: 태스크 제목 클릭 → 담당자·우선순위·상태·포인트 수정
- 📋 보드 — 스프린트 접기/펼치기: 스프린트 헤더 우측 [▲/▼] 버튼 클릭
- 📋 보드 — 스프린트 추가: [+ 스프린트 추가] 버튼 클릭
- 📅 간트 — 스프린트 펼치기: 스프린트 이름 왼쪽 [▶] 클릭 → 태스크 바 표시 (시작일·마감일 설정된 태스크만 표시)
- 📅 간트 — 담당자 배정: 태스크 바 클릭 → 담당자 배정 모달 → 담당자 선택 후 저장 (부하율% 및 ⚠️ 과부하 표시)
- 📅 간트 — 주의사항: 스프린트 보드에서 태스크에 시작일·마감일을 입력해야 태스크 바가 나타남
- 📉 번다운 — 자동 표시: 스프린트 시작일/종료일 입력 시 이상선(점선) vs 실제 진행선 차트 자동 표시
- 🔀 프로세스 — 태스크 의존관계 시각화: 스프린트 선택 후 태스크 간 선행/후행 관계 다이어그램 확인, 태스크 클릭 시 상세 정보 표시
- 👥 리소스 — 담당자 추가: [+ 담당자 추가] 버튼 클릭
- 다음 Step 이동: [${BTN_B1_NEXT}] 버튼 클릭
- 이전 Step 이동: [${BTN_B1_BACK}] 버튼 클릭
  `,
  "2-2":`
[Phase 2 Step 2 — MVP 구현]
- 스프린트 보드 관리: Step 1과 동일한 Agile PM 보드 사용 (태스크 상태 변경·편집·추가)
- 개발 메모 입력: "개발 메모 & 이슈" 패널의 "개발 메모, 이슈..." 텍스트 영역에 자유 입력
- AI 개발 조언 생성: [🤖 AI 개발 조언] 버튼 클릭 → 모듈별 구현 순서·기술 리스크·MVP 범위·도구별 사전 준비사항 자동 생성
- 다음 Step 이동: [${BTN_B2_NEXT}] 버튼 클릭
- 이전 Step 이동: [← 이전] 버튼 클릭
  `,
  "2-3":`
[Phase 2 Step 3 — 파일럿 테스트]
- 파일럿 체크리스트: "${CL_B3.join(" / ")}" 각 항목 클릭으로 완료 처리
- 피드백 기록 입력: "고객 피드백 내용..." 텍스트 영역에 입력
- AI 사용 설명서 생성: [✨ AI 사용 설명서 생성] 버튼 클릭 → 고객용 스마트폰 기준 설명서 자동 작성
- 설명서 직접 편집: 생성된 설명서 텍스트 영역 클릭 후 직접 수정
- 설명서 복사: [📋 복사] 버튼 클릭 → 클립보드 복사
- 다음 Step 이동: [${BTN_B3_NEXT}] 버튼 클릭
- 이전 Step 이동: [← 이전] 버튼 클릭
  `,
  "2-4":`
[Phase 2 Step 4 — 이관 & 완료]
- 이관 체크리스트: "${CL_B4.map(([t])=>t).join(" / ")}" 각 항목 클릭으로 완료 처리
- AI 케이스 스터디 작성: [✨ AI 케이스 스터디 작성] 버튼 클릭 → 업종·Pain Point·솔루션·성과 기반 케이스 스터디 자동 생성
- 케이스 스터디 직접 편집: 생성된 텍스트 영역 클릭 후 직접 수정
- 케이스 스터디 복사: [📋 복사] 버튼 클릭 → 클립보드 복사
- 프로젝트 완료 확정: 이관 체크리스트 5개 모두 완료 후 [${BTN_B4_COMPLETE}] 버튼 클릭
- 이전 Step 이동: [← 이전] 버튼 클릭
  `,
  default:`
[시스템 공통]
- 체크리스트: 각 항목 클릭으로 완료/취소 처리 (체크리스트 완료 전에도 다음 Step 이동 가능)
- 다음 Step 이동: 화면 하단 오른쪽 버튼 클릭
- 이전 Step 이동: 화면 하단 [← 이전] 버튼 클릭
- Phase 간 이동: 상단 Phase 탭 클릭 (완료된 Phase만 이동 가능)
- 입력 내용 자동 저장: 별도 저장 버튼 없이 입력 즉시 저장
- 로그아웃: 우측 상단 [🔒 로그아웃] 버튼 클릭
  `,
};
const FAQ_BUTTONS={
  home:["새 고객 등록 방법","고객 삭제 방법","단계별 색상 의미"],
  "0-1":["AI 사전조사 사용법","인터뷰 질문지 생성","가설 Pain Point란?"],
  "0-3":["STT 사용법","Q1~Q3 자동입력 방법","🤖 배지 의미"],
  "1-2":["솔루션 통합 합성이란?","AI 솔루션 생성 방법","예산 입력 방법"],
  "2-1":["프로젝트 플랜 자동생성","간트차트 사용법","담당자 배정 방법"],
  "2-2":["AI 개발 조언이란?","MVP 체크리스트 작성법","개발 조언 활용법"],
  default:["현재 화면 설명","다음 단계로 이동 방법","저장은 어떻게 하나요?"],
};
const SPRINT_STATUS=["백로그","진행중","완료","보류"];
const ROLES=["컨설턴트(본인)","고객(사장님)","외주 개발자","기타"];
const PRIORITY=["긴급","높음","보통","낮음"];
const STATUS_COLOR={"백로그":{bg:"var(--color-background-secondary)",c:"var(--color-text-secondary)"},"진행중":{bg:"#E6F1FB",c:"#185FA5"},"완료":{bg:"#EAF3DE",c:"#3B6D11"},"보류":{bg:"#FAEEDA",c:"#854F0B"}};
const PRI_C={"긴급":{bg:"#FCEBEB",c:"#A32D2D"},"높음":{bg:"#FAEEDA",c:"#854F0B"},"보통":{bg:"#E6F1FB",c:"#185FA5"},"낮음":{bg:"#F1EFE8",c:"#5F5E5A"}};

async function claude(sys,usr,maxTok=1500,retries=2){
  for(let i=0;i<=retries;i++){
    try{
      const r=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:maxTok,system:sys,messages:[{role:"user",content:usr}]})});
      if(!r.ok){const d=await r.json();const msg=typeof d.error==="string"?d.error:(d.error?.message||JSON.stringify(d.error)||`HTTP ${r.status}`);throw new Error(msg);}
      const d=await r.json();
      const text=d.content?.[0]?.text||d.text||"";
      if(!text)throw new Error("빈 응답");
      return text;
    }catch(e){
      if(i===retries)throw e;
      await new Promise(res=>setTimeout(res,1000*(i+1)));
    }
  }
}

// ── UI 원자 컴포넌트 ──
const FL=({c,mt=12,req,opt})=><div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:4,marginTop:mt,fontWeight:500,display:"flex",alignItems:"center",gap:5}}>{c}{req&&<span style={{fontSize:10,background:"#FCEBEB",color:"#A32D2D",padding:"1px 5px",borderRadius:4,fontWeight:600}}>필수</span>}{opt&&<span style={{fontSize:10,background:"var(--color-background-secondary)",color:"var(--color-text-secondary)",padding:"1px 5px",borderRadius:4}}>선택</span>}</div>;
const Inp=({value,onChange,placeholder,style={},req})=>{const mt=req&&!value;return <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",fontSize:13,padding:"8px 10px",borderRadius:8,border:`1.5px solid ${mt?"#FFB3B3":"#C5C5C5"}`,background:mt?"#FFF5F5":"var(--color-background-primary)",color:"var(--color-text-primary)",boxSizing:"border-box",fontFamily:"inherit",...style}}/>;};
const TA=({value,onChange,placeholder,rows=4,req})=>{const mt=req&&!value;return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{width:"100%",fontSize:13,padding:"8px 10px",borderRadius:8,border:`1.5px solid ${mt?"#FFB3B3":"#C5C5C5"}`,background:mt?"#FFF5F5":"var(--color-background-primary)",color:"var(--color-text-primary)",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}}/>;};
const Sel=({value,onChange,options,placeholder,req})=>{const mt=req&&!value;return <select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",fontSize:13,padding:"8px 10px",borderRadius:8,border:`1.5px solid ${mt?"#FFB3B3":"#C5C5C5"}`,background:mt?"#FFF5F5":"var(--color-background-primary)",color:"var(--color-text-primary)",boxSizing:"border-box",fontFamily:"inherit"}}><option value="">{placeholder||"선택"}</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>;};

function Btn({children,onClick,v="def",disabled,sm,style={}}){
  const vs={def:{background:"transparent",color:"var(--color-text-primary)",border:"0.5px solid var(--color-border-secondary)"},blue:{background:C.blue,color:"#fff",border:`1px solid ${C.blue}`},teal:{background:C.teal,color:"#fff",border:`1px solid ${C.teal}`},purple:{background:C.purple,color:"#fff",border:`1px solid ${C.purple}`},success:{background:C.success,color:"#fff",border:`1px solid ${C.success}`},ghost:{background:"var(--color-background-secondary)",color:"var(--color-text-secondary)",border:"0.5px solid var(--color-border-tertiary)"},danger:{background:C.danger,color:"#fff",border:`1px solid ${C.danger}`}};
  return <button onClick={disabled?undefined:onClick} style={{padding:sm?"5px 10px":"8px 16px",borderRadius:8,fontSize:sm?12:13,cursor:disabled?"not-allowed":"pointer",display:"inline-flex",alignItems:"center",gap:6,fontFamily:"inherit",opacity:disabled?0.5:1,...vs[v],...style}}>{children}</button>;
}
function Tag({label,selected,color=C.blue,bg=C.blueBg,brd=C.blueLt,onClick}){return <span onClick={onClick} style={{padding:"4px 11px",borderRadius:20,fontSize:12,cursor:"pointer",border:`0.5px solid ${selected?brd:"var(--color-border-secondary)"}`,background:selected?bg:"var(--color-background-primary)",color:selected?color:"var(--color-text-secondary)",display:"inline-block",margin:"2px"}}>{label}</span>;}
function Chip({label,color=C.blue,bg=C.blueBg}){return <span style={{display:"inline-flex",padding:"2px 8px",borderRadius:10,fontSize:11,background:bg,color,margin:"0 2px",fontWeight:500}}>{label}</span>;}
function Panel({title,icon,children,accent,bl,style={}}){return <div style={{background:accent||"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderLeft:bl?`4px solid ${bl}`:undefined,borderRadius:12,padding:"1.1rem 1.25rem",marginBottom:"1rem",...style}}>{title&&<div style={{fontSize:14,fontWeight:500,marginBottom:12,display:"flex",alignItems:"center",gap:7}}>{icon&&<span style={{fontSize:16}}>{icon}</span>}{title}</div>}{children}</div>;}
function ChkItem({label,sub,checked,onChange}){return <label onClick={onChange} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"9px 12px",borderRadius:8,border:`0.5px solid ${checked?"var(--color-border-success)":"var(--color-border-tertiary)"}`,background:checked?"var(--color-background-success)":"var(--color-background-primary)",cursor:"pointer",marginBottom:6}}><input type="checkbox" checked={checked} onChange={onChange} onClick={e=>e.stopPropagation()} style={{marginTop:2,accentColor:C.blue,flexShrink:0}}/><div><div style={{fontSize:13,textDecoration:checked?"line-through":"none",opacity:checked?0.6:1}}>{label}</div>{sub&&<div style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:2}}>{sub}</div>}</div></label>;}
function AIBox({loading,result,error,onRetry,color=C.teal}){
  if(loading) return <div style={{display:"flex",alignItems:"center",gap:8,padding:14,color:"var(--color-text-secondary)",fontSize:13,marginTop:10,background:"var(--color-background-secondary)",borderRadius:8}}>⟳ AI 분석 중...</div>;
  if(error) return <div style={{borderLeft:`3px solid ${C.danger}`,background:C.dangerBg,borderRadius:"0 8px 8px 0",padding:"12px 14px",marginTop:10,fontSize:13,color:C.danger}}>⚠ 분석 실패. <button onClick={onRetry} style={{color:C.blue,background:"none",border:"none",cursor:"pointer",fontSize:13,textDecoration:"underline"}}>다시 시도</button></div>;
  if(!result) return null;
  return <div style={{borderLeft:`3px solid ${color}`,background:"var(--color-background-secondary)",borderRadius:"0 8px 8px 0",padding:"12px 14px",marginTop:10,fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap"}}><div style={{fontSize:12,fontWeight:500,color,marginBottom:6}}>✦ AI 완료</div>{result}</div>;
}
function InfoBanner({phase,step,color,bg,children}){return <div style={{background:bg,border:`0.5px solid ${color}30`,borderRadius:10,padding:"10px 14px",marginBottom:"1rem"}}><div style={{fontSize:12,color,fontWeight:500,marginBottom:3}}>{phase} · {step}</div><div style={{fontSize:13}}>{children}</div></div>;}

const EmptyAIResult=({icon="✦",message,subMessage,onAction,actionLabel})=>(
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"40px 24px",background:"var(--bg-subtle)",borderRadius:"var(--radius-lg)",border:"1.5px dashed var(--border-default)",textAlign:"center",gap:12}}>
    <div style={{width:52,height:52,background:"linear-gradient(135deg,var(--phase-discovery-light),var(--phase-diagnosis-light))",borderRadius:"var(--radius-xl)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{icon}</div>
    <p style={{fontSize:"var(--text-sm)",fontWeight:"var(--font-semibold)",color:"var(--text-secondary)",margin:0}}>{message}</p>
    {subMessage&&<p style={{fontSize:"var(--text-xs)",color:"var(--text-tertiary)",margin:0,lineHeight:"var(--leading-relaxed)"}}>{subMessage}</p>}
    {onAction&&<button className="btn-ai" onClick={onAction} style={{marginTop:4}}>{actionLabel}</button>}
  </div>
);

// ── 신규 기능 1: 사전조사 패널 ──
function ResearchPanel({cl,upd}){
  const [sL,setSL]=useState(false);
  const [qL,setQL]=useState(false);
  const [direct,setDirect]=useState(cl.directInfo||"");
  const [copied,setCopied]=useState(false);

  const runSearch=async()=>{
    if(!cl.name||!cl.industry){alert("고객명과 업종을 먼저 입력하세요.");return;}
    setSL(true);
    try{
      const r=await claude(
        "소상공인 AI 컨설턴트. 업체 사전 조사 리포트 작성.\n반드시 아래 형식으로:\n[업체 기본 정보]\n• 예상 운영 형태:\n• 주요 고객층:\n• 경쟁 환경:\n\n[업종 트렌드 & 디지털화 수준]\n•\n•\n\n[예상 Pain Point Top 3]\n1.\n2.\n3.\n\n[첫 미팅 주의사항]\n•",
        `상호명:${cl.name} / 업종:${cl.industry} / 지역:${cl.region||"미입력"} / 규모:${cl.size||"미입력"}\n추가정보:${direct||"없음"}`
      );
      upd({researchResult:r,directInfo:direct});
    }catch(e){alert("조사 실패. 다시 시도해 주세요.");}
    setSL(false);
  };

  const genQ=async()=>{
    if(!cl.researchResult&&!direct&&!(cl.hypothesis||[]).length){alert("사전 조사 또는 직접 입력 정보가 필요합니다.");return;}
    setQL(true);
    try{
      const r=await claude(
        "소상공인 첫 미팅 인터뷰 질문지 작성.\n형식:\n[필수 질문 - 반드시 물어볼 것]\nQ1. (하루 일과)\nQ2. (시간/실수 낭비)\nQ3. (걱정/고민)\n\n[심화 질문 - 상황에 따라 선택]\nQ4. (업종 특화)\nQ5. (Pain Point 검증)\nQ6. (예산/의사결정)\n\n[현장 팁]\n• 이 고객에게 특히 주의할 점",
        `상호:${cl.name} / 업종:${cl.industry}\n사전조사:${cl.researchResult||"없음"}\n직접수집:${direct||"없음"}\n가설PP:${(cl.hypothesis||[]).join(",")||"없음"}`
      );
      upd({interviewQ:r,directInfo:direct});
    }catch(e){alert("생성 실패.");}
    setQL(false);
  };

  const copy=()=>{navigator.clipboard.writeText(cl.interviewQ||"").then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});};

  return <>
    {/* ① AI 자동 조사 */}
    <Panel title="① AI 자동 사전 조사" icon="🔍">
      <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:12}}>고객명·업종 기반으로 AI가 업종 특성, 트렌드, 예상 Pain Point를 정리합니다.</div>
      <button className="btn-ai" onClick={sL?undefined:runSearch} disabled={sL}>{sL?"⟳ 조사 중...":"🔍 AI 자동 사전 조사 실행"}</button>
      {sL&&<AIBox loading={true}/>}
      {cl.researchResult&&!sL&&(
        <div style={{borderLeft:`3px solid ${C.blue}`,background:"var(--color-background-secondary)",borderRadius:"0 8px 8px 0",padding:"12px 14px",marginTop:10,fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap"}}>
          <div style={{fontSize:12,fontWeight:500,color:C.blue,marginBottom:6}}>✦ 사전 조사 완료</div>
          {cl.researchResult}
        </div>
      )}
    </Panel>

    {/* ② 직접 입력 */}
    <Panel title="② 직접 수집 정보 입력" icon="✍️">
      <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:8}}>네이버 플레이스, SNS, 지인 정보 등 직접 조사한 내용을 자유롭게 입력하세요.</div>
      <TA value={direct} onChange={setDirect} rows={5} placeholder="예: 네이버 플레이스 별점 4.2점 리뷰 87개. 인스타 팔로워 320명. 경쟁 카페 3곳 반경 200m. 최근 키오스크 도입 고려 중..."/>
      <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
        {["[네이버 플레이스] ","[SNS 분석] ","[경쟁사 정보] ","[지인 정보] "].map(t=><Btn key={t} sm v="ghost" onClick={()=>setDirect(d=>d+t)}>{t.trim()}</Btn>)}
      </div>
    </Panel>

    {/* ③ 가설 Pain Point */}
    <Panel title="③ 가설 Pain Point 선택" icon="💡">
      <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:8}}>업종별 자동 추천 — 복수 선택 가능</div>
      <div>{cl.industry?(HYPO[cl.industry]||HYPO["기타"]).map(h=><Tag key={h} label={h} selected={(cl.hypothesis||[]).includes(h)} onClick={()=>upd({hypothesis:(cl.hypothesis||[]).includes(h)?(cl.hypothesis||[]).filter(x=>x!==h):[...(cl.hypothesis||[]),h]})}/>):<span style={{fontSize:12,color:"var(--color-text-secondary)"}}>업종을 먼저 선택하세요</span>}</div>
      {(cl.hypothesis||[]).length>0&&<div style={{marginTop:8,padding:"6px 10px",background:C.blueBg,borderRadius:8,fontSize:12,color:C.blue}}>선택: {(cl.hypothesis||[]).join(" · ")}</div>}
    </Panel>

    {/* ④ 질문지 생성 */}
    <Panel title="④ 인터뷰 질문지 자동 생성" icon="📋">
      <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:10}}>사전 조사 + 직접 입력 + 가설 Pain Point를 종합해서 맞춤형 질문지를 생성합니다.</div>
      <button className="btn-ai" onClick={qL?undefined:genQ} disabled={qL}>{qL?"⟳ 질문지 생성 중...":"✨ 인터뷰 질문지 자동 생성"}</button>
      {qL&&<AIBox loading={true} color={C.blue}/>}
      {cl.interviewQ&&!qL&&<>
        <TA value={cl.interviewQ} onChange={v=>upd({interviewQ:v})} rows={14} style={{marginTop:10}}/>
        <div style={{display:"flex",gap:8,marginTop:8}}><Btn onClick={copy}>{copied?"✓ 복사됨":"📋 질문지 복사"}</Btn><Btn v="ghost" onClick={genQ} disabled={qL}>🔄 재생성</Btn></div>
      </>}
    </Panel>
  </>;
}

// ── 신규 기능 2: 솔루션 다중 선택 + 통합 합성 ──
function SolutionPanel({cl,upd,aiGet,runAI}){
  const [mergeL,setMergeL]=useState(false);
  const validPPs=(cl.painPoints||[]).filter(p=>p.title);
  const selected=cl.selectedSols||[];

  const toggle=(i)=>{const cur=cl.selectedSols||[];const next=cur.includes(i)?cur.filter(x=>x!==i):[...cur,i];upd({selectedSols:next,selectedSol:next[0]??null});};

  const merge=async()=>{
    if(selected.length<2){alert("2개 이상 선택해 주세요.");return;}
    setMergeL(true);
    const chosen=selected.map(i=>(cl.solutions||[])[i]).filter(Boolean);
    try{
      const r=await claude(
        "소상공인 AI 솔루션 통합 합성. 형식:\n[통합 솔루션명]\n[핵심 개요] 2줄\n[구성 요소] 각 솔루션 통합 방식\n[사용 도구] 전체 목록\n[예상 기간] 통합 기준\n[예상 비용] 통합 기준\n[기대 효과] 수치 포함\n[구현 순서] 단계별",
        `고객:${cl.name} 업종:${cl.industry}\nPP:${validPPs.map(p=>p.title).join(",")}\n선택솔루션:\n${chosen.map((s,i)=>`${i+1}.${s.title}(${s.type})-${s.desc}/도구:${s.tool}`).join("\n")}`
      );
      upd({mergedSolution:{title:`통합 솔루션 (${chosen.length}개 합성)`,desc:r,components:chosen}});
    }catch(e){alert("합성 실패.");}
    setMergeL(false);
  };

  return <>
    <Panel title="고객 조건" icon="⚖️">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><FL c="예산 범위" mt={0} req/><Sel value={cl.budget||""} onChange={v=>upd({budget:v})} options={BUDGETS} placeholder="예산 선택" req/></div>
        <div><FL c="희망 일정" mt={0} req/><Sel value={cl.timeline||""} onChange={v=>upd({timeline:v})} options={TIMELINES} placeholder="일정 선택" req/></div>
      </div>
    </Panel>

    <Panel title="AI 솔루션 자동 설계 (3안) — 복수 선택 가능" icon="⚙️">
      <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:10}}>여러 개 선택 → 아래에서 하나의 통합 솔루션으로 합성됩니다.</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{validPPs.map((p,i)=><Chip key={i} label={`#${i+1} ${p.title}`} color={C.teal} bg={C.tealBg}/>)}</div>
      <button className="btn-ai" onClick={aiGet("dg_sol").loading||!validPPs.length?undefined:()=>runAI("dg_sol",
        "소상공인 Pain Point용 AI 솔루션 3개. 순수 JSON만 출력.\n{\"solutions\":[{\"rank\":1,\"title\":\"명\",\"type\":\"유형\",\"desc\":\"설명1줄\",\"why\":\"이유1줄\",\"tool\":\"도구\",\"effort\":\"기간\",\"cost\":\"비용\"}]}",
        `고객:${cl.name} 업종:${cl.industry} AI친숙도:${cl.aiLevel||""}\nPP:${validPPs.map(p=>`${p.title}(${p.type})`).join(",")}\n예산:${cl.budget||""} 일정:${cl.timeline||""}`
      )} disabled={aiGet("dg_sol").loading||!validPPs.length}>
        {aiGet("dg_sol").loading?"⟳ 설계 중...":"✨ AI 솔루션 3개 자동 생성"}
      </button>
      {aiGet("dg_sol").result&&!aiGet("dg_sol").error&&(()=>{
        let p=null;try{p=JSON.parse(aiGet("dg_sol").result.replace(/```json|```/g,"").trim());}catch{}
        if(p?.solutions&&!(cl.solutions||[]).every(s=>s.title)){setTimeout(()=>upd({solutions:p.solutions.map(s=>({title:s.title||"",type:s.type||"",desc:s.desc||"",why:s.why||"",tool:s.tool||"",effort:s.effort||"",cost:s.cost||""}))}),0);}
        return <div style={{fontSize:12,color:C.teal,marginTop:8,fontWeight:500}}>✦ 생성 완료 — 카드를 클릭해서 선택하세요 (복수 선택 가능)</div>;
      })()}
    </Panel>

    {/* 솔루션 카드 - 다중 선택 */}
    {(cl.solutions||[]).length===0&&!aiGet("dg_sol").loading&&(
      <EmptyAIResult icon="⚡" message="AI 솔루션이 아직 생성되지 않았습니다" subMessage="Pain Point를 입력한 뒤 위 버튼으로 솔루션을 자동 생성하세요"/>
    )}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:"1rem"}}>
      {(cl.solutions||[]).slice(0,3).map((sol,i)=>{
        const isSel=selected.includes(i);
        return <div key={i} onClick={()=>toggle(i)} className={`solution-card${isSel?" selected":""}`}>
          {isSel&&<div style={{position:"absolute",top:-1,left:8,background:"var(--phase-diagnosis)",color:"#fff",fontSize:10,padding:"2px 8px",borderRadius:"0 0 6px 6px",fontWeight:500}}>✓ 선택 {selected.indexOf(i)+1}</div>}
          <div style={{fontSize:11,fontWeight:500,color:"var(--phase-diagnosis)",marginBottom:4,marginTop:isSel?8:0}}>옵션 {i+1}</div>
          <div style={{fontSize:13,fontWeight:500,marginBottom:6}}>{sol.title||<span style={{color:"var(--color-text-secondary)"}}>솔루션 {i+1}</span>}</div>
          {sol.type&&<Chip label={sol.type} color={C.teal} bg={C.tealBg}/>}
          {sol.desc&&<div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:6,lineHeight:1.5}}>{sol.desc}</div>}
          {sol.tool&&<div style={{fontSize:11,marginTop:6}}>🔧 {sol.tool}</div>}
          <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap"}}>
            {sol.effort&&<span style={{fontSize:11,background:C.warnBg,color:C.warn,padding:"2px 6px",borderRadius:6}}>⏱ {sol.effort}</span>}
            {sol.cost&&<span style={{fontSize:11,background:C.purpleBg,color:C.purple,padding:"2px 6px",borderRadius:6}}>💰 {sol.cost}</span>}
          </div>
          {sol.why&&<div style={{fontSize:11,color:C.teal,marginTop:8,fontStyle:"italic",lineHeight:1.5}}>→ {sol.why}</div>}
        </div>;
      })}
    </div>

    {/* 선택 현황 + 통합 합성 */}
    {selected.length>0&&<Panel title="선택 솔루션 통합" icon="🔗" accent={C.tealBg}>
      <div style={{fontSize:13,marginBottom:12}}>
        <span style={{fontWeight:500,color:C.teal}}>{selected.length}개 선택:</span>{" "}
        {selected.map(i=>(cl.solutions||[])[i]?.title).filter(Boolean).join(" + ")}
      </div>
      {selected.length>=2&&<Btn v="teal" onClick={merge} disabled={mergeL}>{mergeL?"⟳ 통합 합성 중...":"🔗 통합 솔루션 자동 합성"}</Btn>}
      {mergeL&&<AIBox loading={true} color={C.teal}/>}
      {cl.mergedSolution&&!mergeL&&<div style={{borderLeft:`3px solid ${C.teal}`,background:"var(--color-background-primary)",borderRadius:"0 8px 8px 0",padding:"12px 14px",marginTop:10,fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap"}}>
        <div style={{fontSize:12,fontWeight:500,color:C.teal,marginBottom:6}}>✦ 통합 솔루션</div>
        <div style={{fontWeight:500,fontSize:14,marginBottom:8}}>{cl.mergedSolution.title}</div>
        {cl.mergedSolution.desc}
      </div>}
    </Panel>}
  </>;
}

// ── 신규 기능 3: Agile PM (스프린트 보드 + 간트 + 번다운 + 리소스) ──
const newTask=(sid)=>({id:Date.now()+Math.random(),sid,title:"",assignee:"컨설턴트(본인)",priority:"보통",status:"백로그",pts:3,dependencies:[],startDate:null,dueDate:null,manualDates:false,input:[],output:[],description:""});
const newSprint=(n)=>({id:Date.now()+Math.random(),num:n,name:`Sprint ${n}`,goal:"",start:"",end:"",tasks:[]});

function PMResources({pm,updPM}){
  const [popup,setPopup]=useState(null);
  const res=pm.resources||[];
  const allTasks=pm.sprints.flatMap(s=>s.tasks||[]);
  const updRes=(id,patch)=>updPM({resources:res.map(r=>r.id===id?{...r,...patch}:r)});
  const byName={};allTasks.forEach(t=>{if(!byName[t.assignee])byName[t.assignee]=[];byName[t.assignee].push(t);});

  // ── 날짜별 히트맵 ──
  const tasksWithDates=allTasks.filter(t=>t.startDate&&t.dueDate);
  const namedRes=res.filter(r=>r.name);
  const heatmapVisible=tasksWithDates.length>0&&namedRes.length>0;
  const heatmapDates=[];
  if(heatmapVisible){
    const dts=tasksWithDates.flatMap(t=>[new Date(t.startDate),new Date(t.dueDate)]);
    const hStart=new Date(Math.min(...dts)); const hEnd=new Date(Math.max(...dts));
    const d=new Date(hStart);
    while(d<=hEnd&&heatmapDates.length<28){heatmapDates.push(new Date(d));d.setDate(d.getDate()+1);}
  }
  const todayHeat=new Date();todayHeat.setHours(0,0,0,0);
  const getHeatColor=(day,name)=>{
    const wd=day.getDay();if(wd===0||wd===6)return"#E0E0E0";
    const ts=allTasks.filter(t=>t.assignee===name&&t.startDate&&t.dueDate&&new Date(t.startDate)<=day&&new Date(t.dueDate)>=day);
    if(!ts.length)return"#D1E7DD";
    if(ts.some(t=>t.status!=="완료"&&new Date(t.dueDate)<todayHeat))return C.danger;
    const pts=ts.reduce((a,t)=>a+(t.pts||0),0);
    return pts>=3?"#F97316":pts>=1?"#EAB308":"#D1E7DD";
  };

  return <div style={{position:"relative"}}>
    {popup&&<>
      <div style={{position:"fixed",inset:0,zIndex:99}} onClick={()=>setPopup(null)}/>
      <div style={{position:"fixed",top:popup.y,left:popup.x,background:"var(--color-background-primary)",border:"1px solid var(--color-border-secondary)",borderRadius:8,padding:"10px 14px",zIndex:100,boxShadow:"0 4px 12px rgba(0,0,0,0.12)",maxWidth:260,fontSize:12}}>
        <div style={{fontWeight:500,marginBottom:6}}>{popup.date} · {popup.name}</div>
        {popup.tasks.length===0
          ?<div style={{color:"var(--color-text-secondary)"}}>태스크 없음</div>
          :popup.tasks.map(t=><div key={t.id} style={{marginBottom:3,display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:10,padding:"1px 5px",borderRadius:4,background:STATUS_COLOR[t.status]?.bg,color:STATUS_COLOR[t.status]?.c}}>{t.status}</span>{t.title||"(없음)"} ({t.pts}pt)</div>)}
        <button onClick={()=>setPopup(null)} style={{marginTop:6,fontSize:11,color:C.blue,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>닫기</button>
      </div>
    </>}

    {heatmapVisible&&<Panel title="날짜별 부하 히트맵" icon="🗓️" style={{marginBottom:8}}>
      <div style={{overflowX:"auto"}}>
        <table style={{borderCollapse:"collapse",fontSize:11,minWidth:400}}>
          <thead><tr>
            <th style={{textAlign:"left",padding:"2px 8px 4px 0",fontWeight:500,color:"var(--color-text-secondary)",minWidth:80}}>담당자</th>
            {heatmapDates.map((d,i)=><th key={i} style={{padding:"1px 1px 4px",fontWeight:400,color:d.getDay()===0||d.getDay()===6?"#AAA":"var(--color-text-secondary)",minWidth:22,textAlign:"center"}}>
              <div>{d.getDate()}</div>
              {(i===0||d.getDate()===1)&&<div style={{fontSize:9}}>{d.toLocaleDateString('ko-KR',{month:'short'})}</div>}
            </th>)}
          </tr></thead>
          <tbody>{namedRes.map(r=><tr key={r.id}>
            <td style={{padding:"2px 8px 2px 0",fontWeight:500,whiteSpace:"nowrap"}}>{r.name}</td>
            {heatmapDates.map((d,i)=>{
              const color=getHeatColor(d,r.name);
              const dayStr=d.toLocaleDateString('ko-KR',{month:'short',day:'numeric'});
              const dayTs=allTasks.filter(t=>t.assignee===r.name&&t.startDate&&t.dueDate&&new Date(t.startDate)<=d&&new Date(t.dueDate)>=d);
              return <td key={i} style={{padding:1}}><div onClick={e=>{e.stopPropagation();setPopup({x:e.clientX+8,y:e.clientY+8,name:r.name,date:dayStr,tasks:dayTs});}} style={{width:20,height:16,background:color,borderRadius:2,cursor:"pointer"}} title={`${r.name} ${dayStr}: ${dayTs.length}개`}/></td>;
            })}
          </tr>)}</tbody>
        </table>
      </div>
      <div style={{display:"flex",gap:10,marginTop:8,fontSize:11,flexWrap:"wrap"}}>
        {[["#D1E7DD","비어있음/낮음"],["#EAB308","보통(1~2pt)"],["#F97316","높음(3pt+)"],[C.danger,"기한초과"],["#E0E0E0","주말"]].map(([c,l])=><div key={l} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:12,height:10,background:c,borderRadius:2}}/>{l}</div>)}
      </div>
    </Panel>}

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div style={{fontSize:13,fontWeight:500}}>리소스 ({res.length}명)</div>
      <Btn sm v="ghost" onClick={()=>updPM({resources:[...res,{id:Date.now(),name:"",role:"컨설턴트(본인)",avail:100}]})}>+ 추가</Btn>
    </div>
    {res.map(r=>{
      const tasks=byName[r.name]||[];
      const aPts=tasks.reduce((a,t)=>a+(t.pts||0),0);
      const dPts2=tasks.filter(t=>t.status==="완료").reduce((a,t)=>a+(t.pts||0),0);
      const load=pm.velocity>0?Math.round(aPts/pm.velocity*100):0;
      const lc=load>100?C.danger:load>80?C.warn:C.success;
      return <div key={r.id} style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:10,padding:"12px",marginBottom:10}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px",gap:8,marginBottom:8}}>
          <div><FL c="이름" mt={0}/><Inp value={r.name} onChange={v=>updRes(r.id,{name:v})} placeholder="담당자 이름"/></div>
          <div><FL c="역할" mt={0}/><Sel value={r.role} onChange={v=>updRes(r.id,{role:v})} options={ROLES}/></div>
          <div><FL c="가용률%" mt={0}/><input type="number" value={r.avail} min={0} max={100} onChange={e=>updRes(r.id,{avail:Number(e.target.value)})} style={{width:"100%",padding:"8px 6px",borderRadius:8,border:"1.5px solid #C5C5C5",background:"var(--color-background-primary)",color:"var(--color-text-primary)",fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/></div>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",marginBottom:6}}>
          <span style={{fontSize:12}}>할당 <strong>{aPts}pt</strong></span>
          <span style={{fontSize:12}}>완료 <strong style={{color:C.success}}>{dPts2}pt</strong></span>
          <span style={{fontSize:12}}>부하 <strong style={{color:lc}}>{load}%</strong></span>
          {load>100&&<span style={{fontSize:11,background:C.dangerBg,color:C.danger,padding:"2px 8px",borderRadius:10}}>⚠ 과부하</span>}
        </div>
        <div style={{height:6,background:"var(--color-background-secondary)",borderRadius:3,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${Math.min(load,100)}%`,background:lc,borderRadius:3}}/>
        </div>
        {tasks.length>0&&<div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:4}}>{tasks.map(t=><span key={t.id} style={{fontSize:11,padding:"2px 7px",borderRadius:10,background:STATUS_COLOR[t.status]?.bg||"var(--color-background-secondary)",color:STATUS_COLOR[t.status]?.c||"var(--color-text-secondary)"}}>{t.title||"(없음)"}({t.pts}pt)</span>)}</div>}
        {res.length>1&&<button onClick={()=>updPM({resources:res.filter(r2=>r2.id!==r.id)})} style={{marginTop:8,fontSize:11,color:C.danger,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>삭제</button>}
      </div>;
    })}
    <Panel title="팀 속도 (Velocity)" icon="⚡" style={{marginTop:8}}>
      <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:8}}>스프린트당 처리 가능한 스토리 포인트 기준값</div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <input type="range" min={5} max={100} step={5} value={pm.velocity} onChange={e=>updPM({velocity:Number(e.target.value)})} style={{flex:1}}/>
        <span style={{fontSize:14,fontWeight:500,color:C.purple,minWidth:48}}>{pm.velocity}pt</span>
      </div>
    </Panel>
  </div>;
}

function PMBoard({pm,updSprints,updPM}){
  const [collapsed,setCollapsed]=useState({});
  const toggleSprint=si=>setCollapsed(c=>({...c,[si]:!c[si]}));
  const resNames=(pm.resources||[]).filter(r=>r.name).map(r=>r.name);
  const assigneeOpts=resNames.length?resNames:ROLES;
  const allTasksFlat=pm.sprints.flatMap(s=>(s.tasks||[]).map(t=>({...t,sprintName:s.name})));
  const today=new Date();today.setHours(0,0,0,0);
  const overdueTasks=allTasksFlat.filter(t=>t.dueDate&&t.status!=="완료"&&new Date(t.dueDate)<today);

  const getTransitiveDependents=(taskId,tasks)=>{
    const deps=new Set();let changed=true;
    while(changed){changed=false;for(const t of tasks){if(!deps.has(String(t.id))&&(t.dependencies??[]).some(d=>String(d)===String(taskId)||deps.has(String(d)))){deps.add(String(t.id));changed=true;}}}
    return deps;
  };

  const getDepsText=(task)=>{
    const ids=task.dependencies??[];if(!ids.length)return null;
    const dts=ids.map(id=>allTasksFlat.find(t=>String(t.id)===String(id))).filter(Boolean);
    if(!dts.length)return null;
    const shown=dts.slice(0,2).map(t=>t.title||"(없음)");const extra=dts.length-2;
    return"선행: "+shown.join(", ")+(extra>0?` 외 ${extra}개`:"");
  };

  const getDueDisplay=(task)=>{
    if(!task.dueDate)return null;
    const due=new Date(task.dueDate);const diff=Math.round((due-today)/86400000);
    const label=`${due.getMonth()+1}/${due.getDate()}`;
    if(task.status==="완료")return{text:`📅 ${label}`,style:{fontSize:10,color:"var(--color-text-secondary)",textDecoration:"line-through",marginBottom:3}};
    if(diff<0)return{text:`🔴 ${label} 초과`,style:{fontSize:10,background:C.dangerBg,color:C.danger,borderRadius:4,padding:"1px 5px",display:"inline-block",marginBottom:3,fontWeight:600}};
    if(diff<=2)return{text:`⚠️ ${label}`,style:{fontSize:10,color:C.warn,fontWeight:500,marginBottom:3}};
    return{text:`📅 ${label}`,style:{fontSize:10,color:"var(--color-text-secondary)",marginBottom:3}};
  };

  const updTask=(si,taskId,patch)=>updSprints(ss=>ss.map((sp2,i)=>i===si?{...sp2,tasks:(sp2.tasks||[]).map(t=>t.id===taskId?{...t,...patch}:t)}:sp2));

  return <div>
    {overdueTasks.length>0&&<div style={{background:C.dangerBg,border:`1px solid ${C.danger}`,borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:12,color:C.danger,cursor:"pointer"}} onClick={()=>document.getElementById("overdue-anchor")?.scrollIntoView({behavior:"smooth"})}>
      <strong>🔴 기한 초과 태스크 {overdueTasks.length}건</strong> — {overdueTasks.slice(0,3).map(t=>`${t.title||"(없음)"} (${t.assignee}, ${t.dueDate?.slice(5).replace("-","/")})`).join(", ")}{overdueTasks.length>3?` 외 ${overdueTasks.length-3}건`:""}
    </div>}

    {pm.sprints.map((sp,si)=>{
      const isCollapsed=!!collapsed[si];
      const doneCnt=(sp.tasks||[]).filter(t=>t.status==="완료").length;
      const totalCnt=(sp.tasks||[]).length;
      return <div key={sp.id} style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:"1rem",marginBottom:"1rem"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:isCollapsed?0:10,flexWrap:"wrap"}}>
        <button onClick={()=>toggleSprint(si)} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:C.purple,padding:"0 2px",lineHeight:1,flexShrink:0}}>{isCollapsed?"▶":"▼"}</button>
        <span onClick={()=>toggleSprint(si)} style={{fontSize:14,fontWeight:500,color:C.purple,cursor:"pointer"}}>{sp.name}</span>
        {isCollapsed
          ?<span style={{fontSize:12,color:"var(--color-text-secondary)",flex:1}}>{sp.goal&&`${sp.goal} · `}{totalCnt}개 태스크 ({doneCnt}/{totalCnt} 완료){sp.start&&sp.end?` · ${sp.start}~${sp.end}`:""}</span>
          :<><Inp value={sp.goal} onChange={v=>updSprints(ss=>ss.map((s,i)=>i===si?{...s,goal:v}:s))} placeholder="스프린트 목표" style={{flex:1,minWidth:120,fontSize:12}}/>
          <input type="date" value={sp.start} onChange={e=>{const v=e.target.value;updSprints(ss=>ss.map((s,i)=>i===si?{...s,start:v}:s));}} style={{fontSize:12,padding:"4px 8px",borderRadius:6,border:"1.5px solid #C5C5C5",background:"var(--color-background-primary)",color:"var(--color-text-primary)"}}/>
          <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>~</span>
          <input type="date" value={sp.end} onChange={e=>{const v=e.target.value;updSprints(ss=>ss.map((s,i)=>i===si?{...s,end:v}:s));}} style={{fontSize:12,padding:"4px 8px",borderRadius:6,border:"1.5px solid #C5C5C5",background:"var(--color-background-primary)",color:"var(--color-text-primary)"}}/></>
        }
      </div>
      {!isCollapsed&&<>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
        {SPRINT_STATUS.map((st,stIdx)=>{
          const tasks=(sp.tasks||[]).filter(t=>t.status===st);
          const sc=STATUS_COLOR[st]||{bg:"var(--color-background-secondary)",c:"var(--color-text-secondary)"};
          return <div key={st} style={{background:"var(--color-background-secondary)",borderRadius:8,padding:8,minHeight:100,position:"relative"}}>
            {stIdx>0&&<div style={{position:"absolute",left:-5,top:8,bottom:8,width:0,borderLeft:"1px dashed #DEDEDE"}}/>}
            <div style={{fontSize:11,fontWeight:500,color:sc.c,background:sc.bg,padding:"2px 8px",borderRadius:10,display:"inline-block",marginBottom:8}}>{st}({tasks.length})</div>
            {tasks.map(task=>{
              const isOD=task.dueDate&&task.status!=="완료"&&new Date(task.dueDate)<today;
              const dueDisp=getDueDisplay(task);const depsText=getDepsText(task);
              return <div id={isOD?"overdue-anchor":undefined} key={task.id} style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderLeft:isOD?`3px solid ${C.danger}`:"0.5px solid var(--color-border-tertiary)",borderRadius:6,padding:"7px",marginBottom:5}}>
                <div style={{fontSize:12,fontWeight:500,marginBottom:3}}>{task.title||"(제목없음)"}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:10,background:PRI_C[task.priority]?.bg,color:PRI_C[task.priority]?.c,padding:"1px 5px",borderRadius:6}}>{task.priority}</span>
                  <span style={{fontSize:11,color:"var(--color-text-secondary)"}}>{task.pts}pt</span>
                </div>
                <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:3}}>{task.assignee}</div>
                {depsText&&<div style={{fontSize:10,color:"var(--color-text-secondary)",marginBottom:3}}>{depsText}</div>}
                {dueDisp&&<div style={dueDisp.style}>{dueDisp.text}</div>}
                <div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:4}}>
                  {SPRINT_STATUS.filter(s=>s!==st).map(s=><button key={s} onClick={()=>updTask(si,task.id,{status:s})} style={{fontSize:9,padding:"1px 4px",borderRadius:4,border:"0.5px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontFamily:"inherit"}}>→{s}</button>)}
                  <button onClick={()=>updSprints(ss=>ss.map((sp2,i)=>i===si?{...sp2,tasks:(sp2.tasks||[]).filter(t=>t.id!==task.id)}:sp2))} style={{fontSize:9,padding:"1px 4px",borderRadius:4,border:`0.5px solid ${C.danger}`,background:"transparent",cursor:"pointer",color:C.danger,fontFamily:"inherit"}}>✕</button>
                </div>
              </div>;
            })}
            <button onClick={()=>{const t=prompt("태스크 제목:");if(!t)return;updSprints(ss=>ss.map((sp2,i)=>i===si?{...sp2,tasks:[...(sp2.tasks||[]),{...newTask(sp.id),title:t,status:st}]}:sp2));}} style={{width:"100%",padding:"4px",border:"0.5px dashed var(--color-border-secondary)",borderRadius:6,background:"transparent",cursor:"pointer",fontSize:11,color:"var(--color-text-secondary)",fontFamily:"inherit",marginTop:4}}>+ 추가</button>
          </div>;
        })}
      </div>

      {(sp.tasks||[]).length>0&&<details style={{marginTop:8}}><summary style={{fontSize:12,color:C.purple,cursor:"pointer"}}>태스크 상세 편집 ({sp.tasks.length}개)</summary>
        <div style={{marginTop:8}}>{(sp.tasks||[]).map(task=>{
          const otherTasks=allTasksFlat.filter(t=>String(t.id)!==String(task.id));
          const blocked=getTransitiveDependents(task.id,allTasksFlat);
          const curDeps=(task.dependencies??[]).map(String);
          return <div key={task.id} style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:8,padding:"8px 10px",marginBottom:6}}>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 60px",gap:5,marginBottom:5,alignItems:"center"}}>
              <Inp value={task.title} onChange={v=>updTask(si,task.id,{title:v})} placeholder="태스크 제목" style={{fontSize:12}}/>
              <Sel value={task.assignee} onChange={v=>updTask(si,task.id,{assignee:v})} options={assigneeOpts}/>
              <Sel value={task.priority} onChange={v=>updTask(si,task.id,{priority:v})} options={PRIORITY}/>
              <Sel value={task.status} onChange={v=>updTask(si,task.id,{status:v})} options={SPRINT_STATUS}/>
              <input type="number" value={task.pts} min={1} max={13} onChange={e=>updTask(si,task.id,{pts:Number(e.target.value)})} style={{width:"100%",padding:"6px",borderRadius:6,border:"1.5px solid #C5C5C5",background:"var(--color-background-primary)",color:"var(--color-text-primary)",fontSize:12,fontFamily:"inherit"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:8,alignItems:"start"}}>
              <div>
                <FL c="선행 태스크" mt={0}/>
                <div style={{maxHeight:90,overflowY:"auto",border:"1.5px solid #C5C5C5",borderRadius:8,padding:"4px 6px",background:"var(--color-background-primary)"}}>
                  {otherTasks.length===0&&<div style={{fontSize:11,color:"var(--color-text-secondary)",padding:"3px 0"}}>다른 태스크 없음</div>}
                  {otherTasks.map(ot=>{
                    const sid=String(ot.id);const isBlocked=blocked.has(sid);const isChecked=curDeps.includes(sid);
                    return <label key={sid} style={{display:"flex",alignItems:"center",gap:5,padding:"2px 0",cursor:isBlocked?"not-allowed":"pointer",opacity:isBlocked?0.4:1}}>
                      <input type="checkbox" checked={isChecked} disabled={isBlocked} onChange={e=>{const next=e.target.checked?[...curDeps,sid]:curDeps.filter(d=>d!==sid);updTask(si,task.id,{dependencies:next});}} style={{accentColor:C.purple}}/>
                      <span style={{fontSize:11}}>{ot.sprintName} › {ot.title||"(없음)"}</span>
                    </label>;
                  })}
                </div>
              </div>
              <div>
                <FL c={<span>시작일{task.manualDates&&<span style={{marginLeft:3,fontSize:10}}>✏️</span>}</span>} mt={0}/>
                <input type="date" value={task.startDate||""} onChange={e=>updTask(si,task.id,{startDate:e.target.value||null,manualDates:true})} style={{width:"100%",fontSize:12,padding:"7px 8px",borderRadius:8,border:"1.5px solid #C5C5C5",background:"var(--color-background-primary)",color:"var(--color-text-primary)",boxSizing:"border-box"}}/>
              </div>
              <div>
                <FL c={<span>마감일{task.manualDates&&<span style={{marginLeft:3,fontSize:10}}>✏️</span>}</span>} mt={0}/>
                <input type="date" value={task.dueDate||""} onChange={e=>updTask(si,task.id,{dueDate:e.target.value||null,manualDates:true})} style={{width:"100%",fontSize:12,padding:"7px 8px",borderRadius:8,border:"1.5px solid #C5C5C5",background:"var(--color-background-primary)",color:"var(--color-text-primary)",boxSizing:"border-box"}}/>
              </div>
            </div>
          </div>;
        })}</div>
      </details>}

      <div style={{display:"flex",gap:8,marginTop:8}}>
        <Btn sm v="ghost" onClick={()=>updSprints(ss=>ss.map((sp2,i)=>i===si?{...sp2,tasks:[...(sp2.tasks||[]),newTask(sp.id)]}:sp2))}>+ 태스크</Btn>
        {si===pm.sprints.length-1&&<Btn sm v="ghost" onClick={()=>updPM({sprints:[...pm.sprints,newSprint(pm.sprints.length+1)]})}>+ 스프린트</Btn>}
        {pm.sprints.length>1&&si===pm.sprints.length-1&&<Btn sm v="ghost" style={{color:C.danger,borderColor:C.danger}} onClick={()=>updPM({sprints:pm.sprints.slice(0,-1)})}>삭제</Btn>}
      </div>
      </>}
    </div>;})}
  </div>;
}

function PMGantt({pm,updSprints,updPM}){
  const [expanded,setExpanded]=useState({});
  const [assignModal,setAssignModal]=useState(null);
  const [selAssignee,setSelAssignee]=useState("");
  const [showAddRes,setShowAddRes]=useState(false);
  const [newResName,setNewResName]=useState("");
  const allTasksFlat=pm.sprints.flatMap(s=>s.tasks||[]);
  const taskCount={};allTasksFlat.forEach(t=>{taskCount[t.assignee]=(taskCount[t.assignee]||0)+1;});
  const totalTasks=Math.max(1,allTasksFlat.length);
  const getLoad=name=>Math.round((taskCount[name]||0)/totalTasks*100);
  const resNames=(pm.resources||[]).filter(r=>r.name).map(r=>r.name);
  const assigneeOpts=resNames.length?[...resNames,"미배정"]:["미배정",...ROLES];
  const getConflicts=(assignee,task)=>{
    if(!task.startDate||!task.dueDate||!assignee||assignee==="미배정")return[];
    return allTasksFlat.filter(t=>t.id!==task.id&&t.assignee===assignee&&t.startDate&&t.dueDate&&t.startDate<=task.dueDate&&t.dueDate>=task.startDate);
  };
  const conflicts=assignModal?getConflicts(selAssignee,assignModal.task):[];
  const saveAssignee=()=>{
    if(!updSprints||!assignModal)return;
    const taskId=assignModal.task.id;
    updSprints(sprints=>sprints.map(sp=>({...sp,tasks:(sp.tasks||[]).map(t=>t.id===taskId?{...t,assignee:selAssignee}:t)})));
    setAssignModal(null);
  };
  const swd=pm.sprints.filter(s=>s.start&&s.end);
  if(!swd.length) return <div style={{padding:"2rem",textAlign:"center",color:"var(--color-text-secondary)",fontSize:13}}>스프린트에 시작일/종료일을 입력하면 간트차트가 표시됩니다.</div>;
  const allD=swd.flatMap(s=>[new Date(s.start),new Date(s.end)]);
  swd.forEach(s=>(s.tasks||[]).forEach(t=>{if(t.startDate)allD.push(new Date(t.startDate));if(t.dueDate)allD.push(new Date(t.dueDate));}));
  const mn=new Date(Math.min(...allD)),mx=new Date(Math.max(...allD));
  const tot=Math.max(1,(mx-mn)/86400000+1);
  const today=new Date();today.setHours(0,0,0,0);
  const todayL=Math.min(100,Math.max(0,(today-mn)/86400000/tot*100));
  const allAssignees=[...new Set(swd.flatMap(s=>(s.tasks||[]).map(t=>t.assignee).filter(Boolean)))];
  const TASK_COLS=["#185FA5","#0F6E56","#534AB7","#854F0B","#A32D2D","#5F5E5A"];
  const aColor={};allAssignees.forEach((a,i)=>{aColor[a]=TASK_COLS[i%TASK_COLS.length];});
  const SPRINT_COLS=[C.blue,C.teal,C.purple,C.warn];
  const xLabels=[];
  {const d=new Date(mn);while(d<=mx){xLabels.push({date:new Date(d),pct:(d-mn)/86400000/tot*100});d.setDate(d.getDate()+7);}
   xLabels.push({date:new Date(mx),pct:100});}
  const filteredLabels=xLabels.filter((l,i)=>i===0||l.pct-xLabels[i-1].pct>8);
  const toggle=(id)=>setExpanded(e=>({...e,[id]:!e[id]}));
  return <><div style={{overflowX:"auto"}}><div style={{minWidth:480}}>
    <div style={{display:"flex",marginBottom:8}}>
      <div style={{width:170,flexShrink:0,fontSize:12,fontWeight:500,color:"var(--color-text-secondary)"}}>스프린트 / 태스크</div>
      <div style={{flex:1,position:"relative",height:16}}><div style={{position:"absolute",left:`${todayL}%`,top:-2,fontSize:10,color:C.danger,fontWeight:500,transform:"translateX(-50%)"}}>오늘</div></div>
    </div>
    {swd.map((s,i)=>{
      const l=Math.max(0,(new Date(s.start)-mn)/86400000/tot*100);
      const w=Math.max(1,(new Date(s.end)-new Date(s.start))/86400000/tot*100);
      const done=(s.tasks||[]).filter(t=>t.status==="완료").length;
      const col=SPRINT_COLS[i%SPRINT_COLS.length];
      const isOpen=expanded[s.id];
      const taskBars=(s.tasks||[]).filter(t=>t.startDate&&t.dueDate);
      return <div key={s.id}>
        <div style={{display:"flex",alignItems:"center",marginBottom:4}}>
          <div style={{width:170,flexShrink:0,fontSize:12,fontWeight:500,paddingRight:8,display:"flex",alignItems:"center",gap:4}}>
            <button onClick={()=>toggle(s.id)} style={{fontSize:10,background:"none",border:"none",cursor:"pointer",padding:"0 3px",color:"var(--color-text-secondary)",fontFamily:"inherit",flexShrink:0}}>{isOpen?"▼":"▶"}</button>
            <div style={{overflow:"hidden"}}>{s.name}<div style={{fontSize:11,color:"var(--color-text-secondary)",fontWeight:400}}>{done}/{(s.tasks||[]).length} 완료</div></div>
          </div>
          <div style={{flex:1,position:"relative",height:28,background:"var(--color-background-secondary)",borderRadius:4}}>
            <div style={{position:"absolute",left:`${todayL}%`,top:0,bottom:0,borderLeft:`1.5px dashed ${C.danger}`,zIndex:2}}/>
            <div style={{position:"absolute",left:`${l}%`,width:`${w}%`,top:4,height:20,background:col,borderRadius:4,display:"flex",alignItems:"center",paddingLeft:6,minWidth:4}}>
              {w>12&&<span style={{fontSize:11,color:"#fff",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden"}}>{s.goal||s.name}</span>}
            </div>
          </div>
        </div>
        {isOpen&&taskBars.map(task=>{
          const tl=Math.max(0,(new Date(task.startDate)-mn)/86400000/tot*100);
          const tw=Math.max(0.5,(new Date(task.dueDate)-new Date(task.startDate))/86400000/tot*100+1/tot*100);
          const isOD=new Date(task.dueDate)<today&&task.status!=="완료";
          const tCol=isOD?C.danger:(aColor[task.assignee]||C.gray);
          const depTitles=(task.dependencies??[]).map(id=>(s.tasks||[]).find(t=>String(t.id)===String(id))?.title).filter(Boolean);
          return <div key={task.id} style={{display:"flex",alignItems:"center",marginBottom:3}}>
            <div style={{width:170,flexShrink:0,paddingRight:8,paddingLeft:20}}>
              <div style={{fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.title||"(없음)"}</div>
              {depTitles.length>0&&<div style={{fontSize:9,color:"var(--color-text-secondary)"}}>선행: {depTitles.join(", ")}</div>}
            </div>
            <div style={{flex:1,position:"relative",height:18,background:"var(--color-background-secondary)",borderRadius:3}}>
              <div style={{position:"absolute",left:`${todayL}%`,top:0,bottom:0,borderLeft:`1px dashed ${C.danger}`,opacity:0.5,zIndex:2}}/>
              <div onClick={()=>{setAssignModal({task});setSelAssignee(task.assignee||"미배정");}} title={`${task.title} · ${task.assignee} · ${task.startDate}~${task.dueDate}${depTitles.length?` · 선행: ${depTitles.join(", ")}`:""} (클릭: 담당자 배정)`} style={{position:"absolute",left:`${tl}%`,width:`${tw}%`,top:2,height:14,background:tCol,borderRadius:3,opacity:0.85,minWidth:3,cursor:"pointer"}}/>
            </div>
          </div>;
        })}
        {isOpen&&taskBars.length===0&&<div style={{paddingLeft:20,fontSize:11,color:"var(--color-text-secondary)",marginBottom:4}}>시작일/마감일이 설정된 태스크 없음</div>}
      </div>;
    })}
    <div style={{display:"flex",marginTop:6}}>
      <div style={{width:170,flexShrink:0}}/>
      <div style={{flex:1,position:"relative",height:16}}>
        {filteredLabels.map((l,i)=><span key={i} style={{position:"absolute",left:`${Math.min(l.pct,98)}%`,transform:i===filteredLabels.length-1?"translateX(-100%)":i>0?"translateX(-50%)":"none",fontSize:10,color:"var(--color-text-secondary)",whiteSpace:"nowrap"}}>{l.date.toLocaleDateString('ko-KR',{month:'short',day:'numeric'})}</span>)}
      </div>
    </div>
    <div style={{display:"flex",gap:12,marginTop:6,flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.danger}}><div style={{width:14,borderTop:`2px dashed ${C.danger}`}}/>오늘</div>
      {SPRINT_COLS.slice(0,swd.length).map((c,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}><div style={{width:14,height:8,background:c,borderRadius:2}}/>{swd[i]?.name}</div>)}
      {allAssignees.length>0&&<>{allAssignees.map(a=><div key={a} style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}><div style={{width:10,height:10,background:aColor[a],borderRadius:2,opacity:0.85}}/>{a}</div>)}<div style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}><div style={{width:10,height:10,background:C.danger,borderRadius:2}}/>기한초과</div></>}
    </div>
    <div style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:6}}>💡 태스크 바를 클릭하면 담당자를 배정할 수 있습니다.</div>
  </div></div>
  {assignModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setAssignModal(null)}>
    <div style={{background:"#ffffff",borderRadius:12,padding:"1.25rem",width:370,maxWidth:"92vw",maxHeight:"80vh",overflowY:"auto",boxShadow:"0 8px 32px rgba(0,0,0,0.18)"}} onClick={e=>e.stopPropagation()}>
      <div style={{fontSize:13,fontWeight:500,marginBottom:4,color:"#111"}}>{assignModal.task.title||"(없음)"} — 담당자 배정</div>
      <div style={{fontSize:12,color:"#6b7280",marginBottom:12}}>현재 담당자: {assignModal.task.assignee||"미배정"}</div>
      <div style={{fontSize:11,fontWeight:500,color:"#6b7280",marginBottom:6}}>담당자 선택</div>
      {assigneeOpts.map(opt=>{
        const load=getLoad(opt);
        const isOverload=load>90;
        const isCurrent=opt===assignModal.task.assignee;
        const isSel=opt===selAssignee;
        return <div key={opt} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,marginBottom:4,border:`1.5px solid ${isSel?"#374151":"#e5e7eb"}`,background:isSel?"#f3f4f6":"#fff"}}>
          <div onClick={()=>setSelAssignee(opt)} style={{display:"flex",alignItems:"center",gap:8,flex:1,cursor:"pointer"}}>
            <div style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${isSel?"#111":"#9ca3af"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {isSel&&<div style={{width:6,height:6,borderRadius:"50%",background:"#111"}}/>}
            </div>
            <span style={{flex:1,fontSize:12,color:"#111"}}>{opt}</span>
            {opt!=="미배정"&&<span style={{fontSize:11,color:isOverload?C.danger:"#6b7280"}}>{load}%{isOverload?" ⚠️과부하":""}</span>}
            {isCurrent&&<span style={{fontSize:10,color:C.success,marginLeft:4}}>✅현재</span>}
          </div>
          {opt!=="미배정"&&updPM&&<button onClick={()=>{if(!window.confirm(`"${opt}" 담당자를 삭제할까요?`))return;updPM({resources:(pm.resources||[]).filter(r=>r.name!==opt)});if(selAssignee===opt)setSelAssignee("미배정");}} style={{fontSize:11,color:"#ef4444",background:"none",border:"none",cursor:"pointer",padding:"0 2px",flexShrink:0,lineHeight:1}}>✕</button>}
        </div>;
      })}
      {/* 담당자 추가 */}
      {showAddRes
        ?<div style={{marginTop:8,border:"1px solid #e5e7eb",borderRadius:8,overflow:"hidden"}}>
            <div style={{padding:"6px 10px",background:"#f9fafb",fontSize:11,fontWeight:500,color:"#6b7280",borderBottom:"1px solid #e5e7eb"}}>리소스 목록에서 선택</div>
            {ROLES.filter(r=>!resNames.includes(r)).map(r=>(
              <div key={r} onClick={()=>{if(updPM){updPM({resources:[...(pm.resources||[]),{id:Date.now(),name:r,role:r,avail:100}]});setSelAssignee(r);}setShowAddRes(false);}} style={{padding:"8px 12px",fontSize:12,color:"#111",cursor:"pointer",borderBottom:"1px solid #f3f4f6",background:"#fff"}} onMouseEnter={e=>e.currentTarget.style.background="#f3f4f6"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>{r}</div>
            ))}
            <div style={{padding:"6px 10px",background:"#f9fafb",borderTop:"1px solid #e5e7eb"}}>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <input autoFocus value={newResName} onChange={e=>setNewResName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){const n=newResName.trim();if(n&&updPM){updPM({resources:[...(pm.resources||[]),{id:Date.now(),name:n,role:n,avail:100}]});setSelAssignee(n);}setNewResName("");setShowAddRes(false);}if(e.key==="Escape"){setNewResName("");setShowAddRes(false);}}} placeholder="직접 입력..." style={{flex:1,padding:"4px 8px",border:"1px solid #d1d5db",borderRadius:6,fontSize:12,fontFamily:"inherit",outline:"none"}}/>
                <button onClick={()=>{const n=newResName.trim();if(n&&updPM){updPM({resources:[...(pm.resources||[]),{id:Date.now(),name:n,role:n,avail:100}]});setSelAssignee(n);}setNewResName("");setShowAddRes(false);}} style={{padding:"4px 10px",borderRadius:6,border:"none",background:C.purple,color:"#fff",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>추가</button>
                <button onClick={()=>{setNewResName("");setShowAddRes(false);}} style={{padding:"4px 8px",borderRadius:6,border:"1px solid #d1d5db",background:"#fff",cursor:"pointer",fontSize:12,fontFamily:"inherit",color:"#374151"}}>닫기</button>
              </div>
            </div>
          </div>
        :<button onClick={()=>setShowAddRes(true)} style={{width:"100%",marginTop:6,padding:"7px",border:"1.5px dashed #d1d5db",borderRadius:8,background:"transparent",cursor:"pointer",fontSize:12,color:"#6b7280",fontFamily:"inherit",textAlign:"center"}}>+ 담당자 추가</button>
      }
      {conflicts.length>0&&<div style={{marginTop:10,padding:"8px 10px",background:"#fffbeb",borderRadius:8,fontSize:11,color:"#92400e"}}>
        <div style={{fontWeight:500,marginBottom:4}}>⚠️ 병렬 태스크 충돌</div>
        {conflicts.map(t=><div key={t.id}>{selAssignee}: {t.title}와 기간 겹침 ({t.startDate}~{t.dueDate})</div>)}
      </div>}
      <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"flex-end"}}>
        <button onClick={()=>{setAssignModal(null);setShowAddRes(false);setNewResName("");}} style={{padding:"6px 14px",borderRadius:6,border:"1px solid #d1d5db",background:"#fff",cursor:"pointer",fontSize:12,fontFamily:"inherit",color:"#374151"}}>취소</button>
        <button onClick={saveAssignee} style={{padding:"6px 14px",borderRadius:6,border:"none",background:C.purple,color:"#fff",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>저장</button>
      </div>
    </div>
  </div>}
  </>;
}

function PMProcess({pm}){
  const [selSprint,setSelSprint]=useState("all");
  const [selTask,setSelTask]=useState(null);
  const SP_COLS=[{border:"#3B82F6",bg:"#EFF6FF"},{border:"#10B981",bg:"#ECFDF5"},{border:"#8B5CF6",bg:"#F5F3FF"},{border:"#F59E0B",bg:"#FEF3C7"}];
  const GRAY={border:"#9CA3AF",bg:"#F9FAFB"};
  const sprints=pm.sprints||[];
  const allTaskMap={};
  sprints.forEach((sp,si)=>(sp.tasks||[]).forEach(t=>{allTaskMap[String(t.id)]={...t,_si:si};}));
  let displayTasks;
  const spF=selSprint==="all"?null:parseInt(selSprint);
  if(spF===null){
    displayTasks=sprints.flatMap((sp,si)=>(sp.tasks||[]).map(t=>({...t,_si:si,_sn:sp.name,_sc:SP_COLS[si%SP_COLS.length]})));
  }else{
    displayTasks=(sprints[spF]?.tasks||[]).map(t=>({...t,_si:spF,_sn:sprints[spF].name,_sc:SP_COLS[spF%SP_COLS.length]}));
  }
  const dtMap={};displayTasks.forEach(t=>{dtMap[String(t.id)]=t;});
  // 컬럼 계산 (CPM)
  const colOf={};
  const getCol=(id,vis=new Set())=>{
    if(colOf[id]!==undefined)return colOf[id];
    if(vis.has(id)){colOf[id]=0;return 0;}
    vis.add(id);
    const t=dtMap[id];
    if(!t){colOf[id]=0;return 0;}
    const deps=(t.dependencies||[]).map(String).filter(d=>dtMap[d]);
    if(!deps.length){colOf[id]=0;return 0;}
    const c=Math.max(...deps.map(d=>getCol(d,new Set(vis))))+1;
    colOf[id]=c;return c;
  };
  displayTasks.forEach(t=>getCol(String(t.id)));
  const byCol={};
  displayTasks.forEach(t=>{const c=colOf[String(t.id)]||0;(byCol[c]=byCol[c]||[]).push(t);});
  const NW=160,NH=72,HGAP=80,VGAP=50,PAD=16;
  const maxCol=Object.keys(byCol).length?Math.max(...Object.keys(byCol).map(Number)):0;
  const maxRows=Object.values(byCol).length?Math.max(...Object.values(byCol).map(a=>a.length)):1;
  const svgW=Math.max((maxCol+1)*(NW+HGAP)-HGAP+PAD*2,320);
  const svgH=Math.max(maxRows*(NH+VGAP)-VGAP+PAD*2,120);
  const nodePos={};
  Object.entries(byCol).forEach(([col,group])=>{
    const cn=parseInt(col);
    const totalH=group.length*NH+(group.length-1)*VGAP;
    const sy=(svgH-totalH)/2;
    group.forEach((t,i)=>{nodePos[String(t.id)]={x:PAD+cn*(NW+HGAP),y:sy+i*(NH+VGAP)};});
  });
  const wrapTitle=title=>{
    if(!title)return['(없음)'];
    if(title.length<=22)return[title];
    const bp=title.lastIndexOf(' ',22);
    if(bp>4)return[title.slice(0,bp),title.slice(bp+1,bp+23)+(title.length>bp+23?'…':'')];
    return[title.slice(0,22),title.slice(22,44)+(title.length>44?'…':'')];
  };
  const crossDeps=spF!==null?displayTasks.filter(t=>(t.dependencies||[]).some(d=>{const dt=allTaskMap[String(d)];return dt&&dt._si!==spF;})):[];
  const selTaskData=selTask?displayTasks.find(t=>String(t.id)===selTask):null;
  if(!displayTasks.length)return<div style={{padding:"2rem",textAlign:"center",color:"var(--color-text-secondary)",fontSize:13}}>태스크가 없습니다. AI 플랜을 먼저 생성해 주세요.</div>;
  return<div>
    {/* 컨트롤 */}
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
      <span style={{fontSize:12,fontWeight:500,color:"var(--color-text-secondary)"}}>표시 범위</span>
      <select value={selSprint} onChange={e=>{setSelSprint(e.target.value);setSelTask(null);}} style={{padding:"4px 10px",border:"1px solid var(--color-border-secondary)",borderRadius:6,fontSize:12,fontFamily:"inherit",background:"var(--color-background-primary)",color:"var(--color-text-primary)"}}>
        <option value="all">전체 시스템 프로세스</option>
        {sprints.map((sp,i)=><option key={i} value={String(i)}>{sp.name}</option>)}
      </select>
      <span style={{fontSize:11,color:"var(--color-text-secondary)"}}>노드 클릭 → Input/Output 확인</span>
    </div>
    {/* 범례 */}
    <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:10}}>
      {sprints.slice(0,4).map((sp,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}><div style={{width:13,height:13,borderRadius:3,background:SP_COLS[i%SP_COLS.length].bg,border:`1.5px solid ${SP_COLS[i%SP_COLS.length].border}`}}/><span style={{color:"var(--color-text-secondary)"}}>{sp.name}</span></div>)}
      <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}><div style={{width:13,height:13,borderRadius:3,background:GRAY.bg,border:`1.5px solid ${GRAY.border}`}}/><span style={{color:"var(--color-text-secondary)"}}>미배정</span></div>
    </div>
    {/* 플로우차트 */}
    <div style={{overflowX:"auto",border:"1px solid var(--color-border-tertiary)",borderRadius:8,background:"#fafafa"}}>
      <svg width={svgW} height={svgH} style={{display:"block"}}>
        <defs>
          <marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L0,8 L8,4 z" fill="#9ca3af"/>
          </marker>
        </defs>
        {/* 화살표 */}
        {displayTasks.map(task=>{
          const toP=nodePos[String(task.id)];if(!toP)return null;
          return(task.dependencies||[]).map(String).map(depId=>{
            const frP=nodePos[depId];if(!frP)return null;
            const x1=frP.x+NW,y1=frP.y+NH/2,x2=toP.x,y2=toP.y+NH/2,cx=(x1+x2)/2;
            return<path key={`${depId}-${task.id}`} d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`} fill="none" stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#arr)"/>;
          });
        })}
        {/* 이전 스프린트 인디케이터 */}
        {crossDeps.map(task=>{
          const toP=nodePos[String(task.id)];if(!toP)return null;
          return<g key={`cs-${task.id}`}>
            <line x1={toP.x-70} y1={toP.y+NH/2} x2={toP.x-2} y2={toP.y+NH/2} stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 2" markerEnd="url(#arr)"/>
            <text x={toP.x-74} y={toP.y+NH/2-4} textAnchor="end" fontSize="9" fill="#9ca3af">◀ 이전 스프린트</text>
          </g>;
        })}
        {/* 노드 */}
        {displayTasks.map(task=>{
          const p=nodePos[String(task.id)];if(!p)return null;
          const isAsgn=task.assignee&&task.assignee!=="미배정";
          const col=isAsgn?task._sc:GRAY;
          const isSel=String(task.id)===selTask;
          const lines=wrapTitle(task.title);
          const ty1=lines.length>1?p.y+20:p.y+28;
          return<g key={task.id} onClick={()=>setSelTask(isSel?null:String(task.id))} style={{cursor:"pointer"}}>
            <rect x={p.x} y={p.y} width={NW} height={NH} rx={6} fill={col.bg} stroke={col.border} strokeWidth={isSel?2.5:1.5}/>
            {isSel&&<rect x={p.x-1} y={p.y-1} width={NW+2} height={NH+2} rx={7} fill="none" stroke={col.border} strokeWidth="1" opacity="0.3"/>}
            <text x={p.x+NW/2} y={ty1} textAnchor="middle" fontSize="11" fontWeight="500" fill="#111">{lines[0]}</text>
            {lines[1]&&<text x={p.x+NW/2} y={p.y+36} textAnchor="middle" fontSize="11" fill="#111">{lines[1]}</text>}
            <text x={p.x+NW/2} y={p.y+NH-10} textAnchor="middle" fontSize="9" fill={col.border}>{task._sn}</text>
          </g>;
        })}
      </svg>
    </div>
    {/* 상세 패널 */}
    {selTaskData&&<div style={{marginTop:12,border:"1px solid var(--color-border-secondary)",borderRadius:10,overflow:"hidden",fontSize:13}}>
      <div style={{padding:"10px 14px",background:"var(--color-background-secondary)",borderBottom:"1px solid var(--color-border-tertiary)",fontWeight:500,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span>📋 {selTaskData.title}</span>
        <button onClick={()=>setSelTask(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"var(--color-text-secondary)",lineHeight:1}}>✕</button>
      </div>
      {selTaskData.description&&<div style={{padding:"10px 14px",borderBottom:"1px solid var(--color-border-tertiary)",fontSize:12,lineHeight:1.6}}>
        <div style={{fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:4}}>설명</div>
        {selTaskData.description}
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
        <div style={{padding:"10px 14px",borderRight:"1px solid var(--color-border-tertiary)",borderBottom:"1px solid var(--color-border-tertiary)"}}>
          <div style={{fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:6}}>Input</div>
          {(selTaskData.input??[]).length?(selTaskData.input??[]).map((x,i)=><div key={i} style={{fontSize:12,marginBottom:3}}>• {x}</div>):<div style={{fontSize:12,color:"#9ca3af"}}>-</div>}
        </div>
        <div style={{padding:"10px 14px",borderBottom:"1px solid var(--color-border-tertiary)"}}>
          <div style={{fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:6}}>Output</div>
          {(selTaskData.output??[]).length?(selTaskData.output??[]).map((x,i)=><div key={i} style={{fontSize:12,marginBottom:3}}>• {x}</div>):<div style={{fontSize:12,color:"#9ca3af"}}>-</div>}
        </div>
      </div>
      <div style={{padding:"8px 14px",background:"var(--color-background-secondary)",fontSize:11,color:"var(--color-text-secondary)",display:"flex",gap:16,flexWrap:"wrap"}}>
        <span>담당자: {selTaskData.assignee||"미배정"}</span>
        <span>우선순위: {selTaskData.priority||"보통"}</span>
        <span>SP: {selTaskData.pts||0}</span>
        <span>상태: {selTaskData.status||"백로그"}</span>
      </div>
    </div>}
  </div>;
}

function PMPanel({cl,upd}){
  const [view,setView]=useState("board");
  const [planL,setPlanL]=useState(false);
  const pm=cl.pm||{sprints:[newSprint(1)],resources:[{id:1,name:"컨설턴트(본인)",role:"컨설턴트(본인)",avail:100}],velocity:20,pjName:cl.name+" AI 솔루션"};
  const updPM=p=>upd({pm:{...cl.pm,...p}});
  const updSprints=fn=>upd({pm:{...cl.pm,sprints:fn((cl.pm||{}).sprints||[newSprint(1)])}});

  // ── AI 프로젝트 플랜 자동 생성 ──
  const genPlan=async()=>{
    setPlanL(true);
    const validPPs=(cl.painPoints||[]).filter(p=>p.title);
    const chosenSols=(cl.selectedSols||[]).map(i=>(cl.solutions||[])[i]).filter(Boolean);
    const solDesc=cl.mergedSolution?cl.mergedSolution.title:chosenSols.map(s=>s.title).join("+");
    const tools=(cl.buildTool)||(chosenSols.map(s=>s.tool).filter(Boolean).join(", "))||"미정";
    const effort=(cl.buildEffort)||(chosenSols[0]?.effort)||cl.timeline||"2~4주";
    try{
      const todayStr=new Date().toISOString().split("T")[0];

      // 8-3: 스프린트 일정 산출 (기존 날짜 우선, 없으면 기간 기반 균등 배분)
      const addCalDays=(base,n)=>{const d=new Date(base);d.setDate(d.getDate()+n);return d.toISOString().split("T")[0];};
      const effortDays={"1주 이내":7,"2~4주":21,"1~3개월":60,"3개월+":90}[effort]||42;
      const existingSprints=cl.pm?.sprints||[];
      const numSprints=Math.max(2,Math.min(3,Math.round(effortDays/14)));
      const spDur=Math.floor(effortDays/numSprints);
      const preSprintSchedules=Array.from({length:numSprints},(_,i)=>{
        const ex=existingSprints[i];
        if(ex?.start&&ex?.end)return{name:ex.name||`Sprint ${i+1}`,startDate:ex.start,endDate:ex.end};
        const s=addCalDays(todayStr,i*spDur);
        const e=i===numSprints-1?addCalDays(todayStr,effortDays-1):addCalDays(todayStr,(i+1)*spDur-1);
        return{name:`Sprint ${i+1}`,startDate:s,endDate:e};
      });
      const sprintScheduleStr=preSprintSchedules.map(s=>`- ${s.name}: ${s.startDate} ~ ${s.endDate}`).join("\n");

      const r=await claude(
        `당신은 Agile PM 전문가입니다. 소상공인 AI 솔루션 개발 프로젝트 플랜을 생성하세요.
반드시 순수 JSON만 출력 (마크다운 백틱 없이, 설명 없이, JSON만):
{"projectName":"프로젝트명","sprints":[{"name":"Sprint 1","goal":"목표","tasks":[{"id":"t1","title":"태스크명","assignee":"컨설턴트(본인)","priority":"보통","status":"백로그","pts":3,"dependencies":[],"startDate":"YYYY-MM-DD","dueDate":"YYYY-MM-DD","input":["필요 자료1","필요 자료2"],"output":["산출물1","산출물2"],"description":"태스크 수행 방법 한 문장 설명"}]}],"resources":[{"name":"컨설턴트(본인)","role":"컨설턴트(본인)"}],"velocity":20}
규칙: 스프린트 ${numSprints}개, 태스크 스프린트당 4~6개, pts 1~5
의존관계: 병렬 실행 가능한 태스크는 dependencies:[], 순차 실행 필요한 태스크는 선행 태스크 id 배열
각 태스크에 반드시 포함: input(시작에 필요한 자료·선행결과·접근권한, 1~3개), output(완료시 산출물, 1~3개), description(수행방법 한 문장)

스프린트 일정 (반드시 준수):
${sprintScheduleStr}

태스크 날짜 계산 규칙 (스프린트 범위 우선):
1. 각 태스크의 startDate와 dueDate는 반드시 소속 스프린트의 startDate~endDate 범위 안에 있어야 한다
2. 선행 태스크 없음: 스프린트 startDate부터 시작
3. 선행 태스크 있고 같은 스프린트 내: 선행 태스크 dueDate + 1영업일
4. 선행 태스크가 이전 스프린트 소속: 현재 스프린트 startDate부터 시작
5. dueDate = startDate + (pts - 1)영업일. 단 스프린트 endDate를 초과할 수 없다
6. 주말(토·일) 건너뜀
7. 같은 담당자 병렬 태스크는 겹치지 않게 순차 배치
8. 스프린트 내 포인트 합이 기간을 초과하면 마지막 태스크 dueDate를 스프린트 endDate로 클램핑`,
        `고객:${cl.name||"고객"} 업종:${cl.industry||"미정"} AI친숙도:${cl.aiLevel||"초급"}
Pain Point:${validPPs.map(p=>p.title).join(", ")||"미입력"}
솔루션:${solDesc||"AI 솔루션"} 도구:${tools} 예상기간:${effort}
예산:${cl.budget||"미정"}`,
        6000
      );
      let parsed=null;
      // JSON 자동 복구: 빠진 쉼표 삽입 + 후행 쉼표 제거
      const repairJSON=str=>{
        let out='',i=0;const n=str.length;
        const needsComma=ch=>ch==='"'||ch==='{'||ch==='['||ch==='-'||/[0-9tf]/.test(ch);
        const addCommaIfNeeded=()=>{
          const rest=str.slice(i);const m=rest.match(/^(\s*)/);const ws=m?m[1]:'';
          const after=str[i+ws.length];
          if(after&&needsComma(after)&&!ws.includes(',')&&!ws.includes(':')){out+=',';}
        };
        while(i<n){
          if(str[i]==='"'){
            let j=i+1;
            while(j<n){if(str[j]==='\\'&&j+1<n){j+=2;continue;}if(str[j]==='"'){j++;break;}j++;}
            out+=str.slice(i,j);i=j;
            addCommaIfNeeded();continue;
          }
          if(str[i]==='}'||str[i]===']'){out+=str[i++];addCommaIfNeeded();continue;}
          // number / bool / null
          if(str[i]==='-'||/[0-9]/.test(str[i])){
            let j=i;while(j<n&&/[0-9.\-+eE]/.test(str[j]))j++;
            out+=str.slice(i,j);i=j;addCommaIfNeeded();continue;
          }
          if(str.startsWith('true',i)||str.startsWith('false',i)||str.startsWith('null',i)){
            const w=str.startsWith('true',i)?4:str.startsWith('false',i)?5:4;
            out+=str.slice(i,i+w);i+=w;addCommaIfNeeded();continue;
          }
          out+=str[i++];
        }
        return out.replace(/,(\s*[}\]])/g,'$1');
      };
      // 균형 괄호 기반 JSON 추출
      const extractJSON=txt=>{
        const s=txt.indexOf('{');if(s===-1)return null;
        let depth=0,inStr=false,esc=false;
        for(let i=s;i<txt.length;i++){
          const c=txt[i];
          if(esc){esc=false;continue;}
          if(c==='\\'&&inStr){esc=true;continue;}
          if(c==='"'){inStr=!inStr;continue;}
          if(inStr)continue;
          if(c==='{')depth++;
          else if(c==='}'){depth--;if(depth===0){try{return JSON.parse(txt.slice(s,i+1));}catch(e){try{return JSON.parse(repairJSON(txt.slice(s,i+1)));}catch{return null;}}}}
        }
        return null;
      };
      // 1차: 백틱 제거 후 전체 파싱
      const cleaned=r.replace(/```json\n?|```\n?/g,"").trim();
      try{parsed=JSON.parse(cleaned);}catch{}
      // 2차: 복구 후 파싱
      if(!parsed?.sprints){try{parsed=JSON.parse(repairJSON(cleaned));}catch{}}
      // 3차: 균형 괄호 추출
      if(!parsed?.sprints)parsed=extractJSON(cleaned)||extractJSON(r);
      if(parsed?.sprints){
        const sprints=parsed.sprints.map((sp,i)=>{
          // 스프린트 바 날짜는 preSprintSchedules 기준으로 고정 (AI daysFromStart 무시)
          const pre=preSprintSchedules[i]||preSprintSchedules[preSprintSchedules.length-1];
          const spStart=pre.startDate;const spEnd=pre.endDate;
          // 8-4: 태스크 날짜를 스프린트 범위로 클램핑
          const clampedTasks=(sp.tasks||[]).map(t=>{
            let sd=t.startDate||spStart;let dd=t.dueDate||spEnd;
            console.log(`[clamp] sprint${i+1} spStart=${spStart} spEnd=${spEnd} task="${t.title?.slice(0,15)}" sd=${sd} dd=${dd}`);
            if(sd<spStart)sd=spStart;if(sd>spEnd)sd=spEnd;
            if(dd<spStart)dd=spStart;if(dd>spEnd)dd=spEnd;
            if(sd>dd)sd=dd;
            console.log(`[clamp] → sd=${sd} dd=${dd}`);
            return{
              id:t.id||(Date.now()+Math.random()),sid:0,
              title:t.title||"",assignee:t.assignee||"컨설턴트(본인)",
              priority:t.priority||"보통",status:t.status||"백로그",pts:t.pts||3,
              dependencies:(t.dependencies||[]).map(String),
              startDate:sd,dueDate:dd,manualDates:false,
              input:Array.isArray(t.input)?t.input:[],
              output:Array.isArray(t.output)?t.output:[],
              description:t.description||""
            };
          });
          return{id:Date.now()+Math.random(),num:i+1,name:sp.name||`Sprint ${i+1}`,goal:sp.goal||"",start:spStart,end:spEnd,tasks:clampedTasks};
        });
        const aiResources=(parsed.resources||[]).map((r,i)=>({id:Date.now()+i,name:r.name||"",role:r.role||"컨설턴트(본인)",avail:100}));
        const existingResources=cl.pm?.resources||[];
        const resources=existingResources.length?existingResources:(aiResources.length?aiResources:[{id:1,name:"컨설턴트(본인)",role:"컨설턴트(본인)",avail:100}]);
        upd({pm:{
          ...cl.pm,
          sprints,
          resources,
          velocity:parsed.velocity||20,
          pjName:parsed.projectName||cl.name+" AI 솔루션"
        }});
      } else {
        alert("플랜 생성 실패 — AI 응답을 파싱할 수 없습니다. 다시 시도해 주세요.");
      }
    }catch(e){ console.error(e); alert("오류: "+e.message); }
    setPlanL(false);
  };

  const allTasks=pm.sprints.flatMap(s=>s.tasks||[]);
  const doneTasks=allTasks.filter(t=>t.status==="완료");
  const totalPts=allTasks.reduce((a,t)=>a+(t.pts||0),0);
  const donePts=doneTasks.reduce((a,t)=>a+(t.pts||0),0);
  const prog=totalPts>0?Math.round(donePts/totalPts*100):0;


  // 번다운 차트 (전체 스프린트 기간)
  const Burndown=()=>{
    const spWithDates=pm.sprints.filter(s=>s.start&&s.end);
    if(!spWithDates.length) return <div style={{padding:"2rem",textAlign:"center",color:"var(--color-text-secondary)",fontSize:13}}>스프린트에 시작일/종료일을 입력하면 번다운 차트가 표시됩니다.</div>;
    const allD=spWithDates.flatMap(s=>[new Date(s.start),new Date(s.end)]);
    const start=new Date(Math.min(...allD));start.setHours(0,0,0,0);
    const end=new Date(Math.max(...allD));end.setHours(0,0,0,0);
    const today=new Date();today.setHours(0,0,0,0);
    const totalDays=Math.max(1,Math.round((end-start)/86400000));
    const elapsed=Math.min(totalDays,Math.max(0,Math.round((today-start)/86400000)));
    const tPts=allTasks.reduce((a,t)=>a+(t.pts||0),0);
    const dPts=doneTasks.reduce((a,t)=>a+(t.pts||0),0);
    const remainPts=tPts-dPts;
    const completedPct=tPts>0?Math.round(dPts/tPts*100):0;
    const avgBurndown=elapsed>0?(dPts/elapsed).toFixed(1):"0.0";
    const tasksRemaining=allTasks.length-doneTasks.length;
    // SVG
    const W=600,H=230,P={t:16,r:24,b:44,l:44};
    const IW=W-P.l-P.r,IH=H-P.t-P.b;
    const px=d=>P.l+d/totalDays*IW;
    const py=p=>P.t+IH-(p/Math.max(tPts,1))*IH;
    // Ideal trend
    const idealPath=`M${px(0)} ${py(tPts)} L${px(totalDays)} ${py(0)}`;
    // Remaining area & line (linear approx: tPts→remainPts over elapsed days)
    const actualPts=Array.from({length:elapsed+1},(_,i)=>({d:i,p:i===0?tPts:remainPts+(tPts-remainPts)*(1-i/Math.max(elapsed,1))}));
    const areaPath=elapsed>0
      ?actualPts.map((pt,i)=>`${i===0?"M":"L"}${px(pt.d)} ${py(pt.p)}`).join(" ")+` L${px(elapsed)} ${py(0)} L${px(0)} ${py(0)} Z`
      :"";
    const linePath=actualPts.map((pt,i)=>`${i===0?"M":"L"}${px(pt.d)} ${py(pt.p)}`).join(" ");
    // Total scope (flat line)
    const scopePath=`M${px(0)} ${py(tPts)} L${px(totalDays)} ${py(tPts)}`;
    // Y ticks
    const yTicks=[0,0.25,0.5,0.75,1].map(r=>({y:P.t+IH*r,v:Math.round(tPts*(1-r))}));
    // X-axis: Fridays only
    const fridays=[];
    {const d=new Date(start);const dow=d.getDay();if(dow!==5)d.setDate(d.getDate()+(5-dow+7)%7);
     while(d<=end){fridays.push({date:new Date(d),dn:Math.round((d-start)/86400000)});d.setDate(d.getDate()+7);}}
    const todayX=px(elapsed);
    return <div>
      {/* 상단 헤더 */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div>
          <div style={{fontSize:14,fontWeight:600,color:"var(--color-text-primary)",marginBottom:2}}>{pm.pjName||"프로젝트"} Sprint Burndown</div>
          <div style={{fontSize:11,color:"var(--color-text-secondary)"}}>{start.toLocaleDateString("ko-KR",{month:"numeric",day:"numeric"})} – {end.toLocaleDateString("ko-KR",{month:"numeric",day:"numeric"})}</div>
        </div>
        <div style={{display:"flex",gap:20,alignItems:"flex-start"}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:"var(--color-text-secondary)"}}>Tasks Remaining</div>
            <div style={{fontSize:30,fontWeight:700,lineHeight:1,color:"var(--color-text-primary)"}}>{tasksRemaining}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:"var(--color-text-secondary)"}}>Total Scope</div>
            <div style={{fontSize:30,fontWeight:700,lineHeight:1,color:"var(--color-text-primary)"}}>{tPts}</div>
          </div>
        </div>
      </div>
      {/* 중단 통계 */}
      <div style={{display:"flex",gap:28,marginBottom:10}}>
        <div><span style={{fontSize:11,color:C.blue}}>Completed</span><span style={{fontSize:28,fontWeight:700,color:"var(--color-text-primary)",marginLeft:6}}>{completedPct}%</span></div>
        <div><span style={{fontSize:11,color:"var(--color-text-secondary)"}}>Average burndown</span><span style={{fontSize:28,fontWeight:700,color:"var(--color-text-primary)",marginLeft:6}}>{avgBurndown}</span></div>
      </div>
      {/* 차트 */}
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%"}}>
        {/* 그리드 & Y축 */}
        {yTicks.map(({y,v})=><g key={v}>
          <line x1={P.l} y1={y} x2={P.l+IW} y2={y} stroke="#e5e7eb" strokeWidth="0.5"/>
          <text x={P.l-6} y={y+4} textAnchor="end" fontSize="10" fill="#9ca3af">{v}</text>
        </g>)}
        {/* Remaining 면적 */}
        {areaPath&&<path d={areaPath} fill="#2563eb" fillOpacity="0.85"/>}
        {/* Remaining 선 */}
        {linePath&&<path d={linePath} fill="none" stroke="#1d4ed8" strokeWidth="1.5"/>}
        {/* Total Scope */}
        <path d={scopePath} fill="none" stroke="#f97316" strokeWidth="2"/>
        {/* Ideal Trend */}
        <path d={idealPath} fill="none" stroke="#9ca3af" strokeWidth="1.5"/>
        {/* 축 */}
        <line x1={P.l} y1={P.t} x2={P.l} y2={P.t+IH} stroke="#d1d5db" strokeWidth="0.5"/>
        <line x1={P.l} y1={P.t+IH} x2={P.l+IW} y2={P.t+IH} stroke="#d1d5db" strokeWidth="0.5"/>
        {/* 오늘 선 */}
        {elapsed>0&&elapsed<totalDays&&<>
          <line x1={todayX} y1={P.t} x2={todayX} y2={P.t+IH} stroke={C.danger} strokeWidth="1" strokeDasharray="4 2"/>
          <text x={todayX} y={P.t-4} textAnchor="middle" fontSize="9" fill={C.danger}>오늘</text>
        </>}
        {/* X축 금요일 레이블 */}
        {fridays.map(({date,dn})=><g key={dn}>
          <line x1={px(dn)} y1={P.t+IH} x2={px(dn)} y2={P.t+IH+4} stroke="#d1d5db" strokeWidth="0.5"/>
          <text x={px(dn)} y={P.t+IH+16} textAnchor="middle" fontSize="9" fill="#9ca3af">
            {date.toLocaleDateString("ko-KR",{month:"numeric",day:"numeric"})}
          </text>
        </g>)}
      </svg>
      {/* 범례 */}
      <div style={{display:"flex",gap:16,marginTop:6,fontSize:11,alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:12,height:12,background:"#2563eb",borderRadius:2}}/><span style={{color:"var(--color-text-secondary)"}}>Remaining</span></div>
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:16,height:2,background:"#f97316"}}/><span style={{color:"var(--color-text-secondary)"}}>Total Scope</span></div>
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:16,height:2,background:"#9ca3af"}}/><span style={{color:"var(--color-text-secondary)"}}>Ideal Trend</span></div>
      </div>
    </div>;
  };

  return <div>
    {/* AI 프로젝트 플랜 자동 생성 */}
    <Panel title="AI 프로젝트 플랜 자동 생성" icon="🤖" accent={C.purpleBg}>
      <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:12,lineHeight:1.6}}>
        Diagnosis에서 확정된 솔루션·Pain Point·도구·기간을 바탕으로<br/>
        스프린트 계획 · 태스크 목록 · 일정 · 리소스를 AI가 자동으로 생성합니다.
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
        {(cl.selectedSols||[]).map(i=>(cl.solutions||[])[i]).filter(Boolean).map((s,i)=>(
          <span key={i} style={{fontSize:12,background:C.purpleBg,color:C.purple,padding:"3px 10px",borderRadius:10,border:`0.5px solid ${C.purpleLt}`}}>🔧 {s.title}</span>
        ))}
        {cl.mergedSolution&&<span style={{fontSize:12,background:C.tealBg,color:C.teal,padding:"3px 10px",borderRadius:10}}>통합 솔루션 적용</span>}
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <button className="btn-ai" onClick={planL?undefined:genPlan} disabled={planL}>
          {planL?"⟳ AI 플랜 생성 중...":"✨ AI 프로젝트 플랜 자동 생성"}
        </button>
        {allTasks.length>0&&<span style={{fontSize:12,color:C.success,fontWeight:500}}>✓ 플랜 생성됨 ({allTasks.length}개 태스크)</span>}
      </div>
      {planL&&<div style={{display:"flex",alignItems:"center",gap:8,padding:14,color:"var(--color-text-secondary)",fontSize:13,marginTop:10,background:"var(--color-background-secondary)",borderRadius:8}}>⟳ 솔루션 정보를 분석해서 스프린트와 태스크를 생성하고 있습니다...</div>}
    </Panel>

    {/* 프로젝트 개요 */}
    <Panel title="프로젝트 개요" icon="📊">
      <div style={{marginBottom:10}}><FL c="프로젝트명" mt={0}/><Inp value={pm.pjName||""} onChange={v=>updPM({pjName:v})} placeholder="프로젝트명"/></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        {[["전체 태스크",allTasks.length+"개",C.blue,C.blueBg],["완료",doneTasks.length+"개",C.success,C.successBg],["진행중",allTasks.filter(t=>t.status==="진행중").length+"개",C.warn,C.warnBg],["진행률",prog+"%",C.purple,C.purpleBg]].map(([l,v,c,bg])=><div key={l} style={{background:bg,borderRadius:8,padding:"8px 12px"}}><div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:2}}>{l}</div><div style={{fontSize:15,fontWeight:500,color:c}}>{v}</div></div>)}
      </div>
      <div style={{marginTop:10,height:5,background:"var(--color-background-secondary)",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${prog}%`,background:C.purple,borderRadius:3,transition:"width 0.4s"}}/>
      </div>
    </Panel>
    {/* 뷰 탭 */}
    <div style={{display:"flex",border:"0.5px solid var(--color-border-tertiary)",borderRadius:10,overflow:"hidden",marginBottom:"1rem"}}>
      {[["board","📋 보드"],["gantt","📅 간트"],["burndown","📉 번다운"],["resources","👥 리소스"],["process","🔀 프로세스"]].map(([v,l])=><button key={v} onClick={()=>setView(v)} style={{flex:1,minWidth:0,padding:"8px 2px",fontSize:12,border:"none",borderRight:"0.5px solid var(--color-border-tertiary)",background:view===v?C.purpleBg:"transparent",color:view===v?C.purple:"var(--color-text-secondary)",cursor:"pointer",fontFamily:"inherit",fontWeight:view===v?500:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l}</button>)}
    </div>
    {view==="board"&&allTasks.length===0&&!planL&&(
      <EmptyAIResult icon="📋" message="프로젝트 플랜이 없습니다" subMessage="위 버튼으로 AI 플랜을 생성하면 스프린트와 태스크가 자동으로 생성됩니다" onAction={genPlan} actionLabel="✨ AI 프로젝트 플랜 자동 생성"/>
    )}
    {view==="board"&&<PMBoard pm={pm} updSprints={updSprints} updPM={updPM}/>}
    {view==="gantt"&&<PMGantt pm={pm} updSprints={updSprints} updPM={updPM}/>}
    {view==="burndown"&&<Burndown/>}
    {view==="resources"&&<PMResources pm={pm} updPM={updPM}/>}
    {view==="process"&&<PMProcess pm={pm}/>}
  </div>;
}

// ── 데이터 초기화 ──
const PHASES=[
  {id:0,key:"discovery",label:"Discovery",sub:"고객 발굴 & Pain Point 확정",color:C.blue,bg:C.blueBg,steps:["사전 준비","아이스브레이킹","현황 인터뷰","AI 분석","확정 & 전달"]},
  {id:1,key:"diagnosis",label:"Diagnosis",sub:"솔루션 설계 & 제안서 작성",color:C.teal,bg:C.tealBg,steps:["문제 재확인","솔루션 설계","실현 가능성","제안서 작성","발표 & 컨펌"]},
  {id:2,key:"build",label:"Build",sub:"구현 & 이관",color:C.purple,bg:C.purpleBg,steps:["개발 착수","MVP 구현","파일럿 테스트","이관 & 완료"]},
];

const initClient=()=>({
  id:Date.now(),name:"",industry:"",size:"",region:"",aiLevel:"",
  status:"discovery",phase:0,step:0,phasesDone:[false,false,false],
  updatedAt:new Date().toISOString(),
  hypothesis:[],directInfo:"",researchResult:"",interviewQ:"",
  prepCheck:{},iceCheck:{},iceMemo:"",
  notes:{q1:"",q2:"",q3:"",extra:""},audioFileName:"",transcribing:false,transcript:"",
  painPoints:[{title:"",type:"",impact:"",solution:""}],finalCheck:{},
  reconfirmNotes:"",additionalPP:"",reconfirmCheck:{},
  budget:"",timeline:"",
  solutions:[{title:"",type:"",desc:"",why:"",tool:"",effort:"",cost:""}],
  selectedSol:null,selectedSols:[],mergedSolution:null,
  feasCheck:{},riskNote:"",selectedRecommendations:"",recOptions:{},proposalDraft:"",proposalText:"",propCheck:{},
  presentCheck:{},objection:"",contractNote:"",
  testNotes:"",manualText:"",buildCheck:{},handoverCheck:{},caseStudy:"",
  buildTool:"",buildEffort:"",buildCost:"",
  pm:{sprints:[newSprint(1)],resources:[{id:1,name:"컨설턴트(본인)",role:"컨설턴트(본인)",avail:100}],velocity:20,pjName:""},
});

// ── 비밀번호 보호 화면 ──
function PasswordScreen({passwordInput,setPasswordInput,passwordError,handleLogin}){
  return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--color-background-secondary)",fontFamily:"var(--font-sans)"}}>
    <div style={{width:360,padding:"40px",borderRadius:16,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",background:"var(--color-background-primary)",textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>🤖</div>
      <div style={{fontSize:20,fontWeight:600,marginBottom:8}}>AI 컨설팅 시스템</div>
      <div style={{color:"var(--color-text-secondary)",marginBottom:32,fontSize:14}}>접근하려면 비밀번호를 입력하세요.</div>
      <input
        type="password"
        value={passwordInput}
        onChange={e=>{setPasswordInput(e.target.value);}}
        onKeyDown={e=>{if(e.key==="Enter")handleLogin();}}
        placeholder="비밀번호"
        autoFocus
        style={{width:"100%",padding:"12px 16px",borderRadius:8,border:`1.5px solid ${passwordError?"#EF4444":"#C5C5C5"}`,marginBottom:passwordError?8:16,fontSize:15,boxSizing:"border-box",fontFamily:"var(--font-sans)",outline:"none",background:"var(--color-background-primary)",color:"var(--color-text-primary)"}}
      />
      {passwordError&&<div style={{color:"#EF4444",fontSize:13,marginBottom:14}}>❌ 비밀번호가 올바르지 않습니다.</div>}
      <button onClick={handleLogin} style={{width:"100%",padding:"12px",borderRadius:8,background:C.blue,color:"#fff",fontWeight:600,fontSize:15,border:"none",cursor:"pointer",fontFamily:"var(--font-sans)"}}>입장하기</button>
    </div>
  </div>;
}

// ── 메인 앱 ──
function ChatbotWidget({contextKey}){
  const [open,setOpen]=useState(false);
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const endRef=useRef(null);

  useEffect(()=>{setMessages([]);},[contextKey]);
  useEffect(()=>{if(endRef.current)endRef.current.scrollIntoView({behavior:"smooth"});},[messages,loading]);

  const stripMd=t=>t
    .replace(/\*\*\*(.+?)\*\*\*/g,'$1')
    .replace(/\*\*(.+?)\*\*/g,'$1')
    .replace(/\*(.+?)\*/g,'$1')
    .replace(/^#{1,6}\s+/gm,'')
    .replace(/^\s*\*\s+/gm,'')
    .replace(/`(.+?)`/g,'$1')
    .trim();

  const send=async(text)=>{
    const msg=(text||input).trim();
    if(!msg)return;
    setInput("");
    setMessages(prev=>[...prev,{role:"user",text:msg}]);
    setLoading(true);
    const manualContext=CHATBOT_MANUAL[contextKey]||CHATBOT_MANUAL.default||"";
    const recent=messages.slice(-6).map(m=>({role:m.role,content:m.text}));
    const sys=`당신은 AI 컨설팅 시스템의 사용 도우미입니다.
아래 [시스템 매뉴얼]에 있는 내용만을 바탕으로 답변하세요.
매뉴얼에 없는 내용은 "이 시스템 사용법 관련 질문만 답변드릴 수 있어요." 라고 안내하세요.
답변은 간결하고 친절하게, 3~5문장 이내로 작성하세요.
한국어로 답변하세요.

[현재 사용자 위치]
${contextKey==="home"?"홈 화면":`Phase ${parseInt(contextKey)} Step ${contextKey.split("-")[1]}`}

[시스템 매뉴얼]
${manualContext}`;
    try{
      const r=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:500,system:sys,messages:[...recent,{role:"user",content:msg}]})});
      const d=await r.json();
      console.log("[Chatbot] API response:", d);
      const answer=d.text||d.content?.[0]?.text||d.error||"답변을 가져오지 못했습니다.";
      setMessages(prev=>[...prev,{role:"assistant",text:answer}]);
    }catch(e){
      console.error("[Chatbot] fetch error:", e);
      setMessages(prev=>[...prev,{role:"assistant",text:"오류가 발생했습니다. 다시 시도해주세요."}]);
    }finally{setLoading(false);}
  };

  const faqs=FAQ_BUTTONS[contextKey]||FAQ_BUTTONS.default;

  return <>
    {open&&<div style={{position:"fixed",right:24,bottom:88,width:360,height:500,borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.18)",background:"#ffffff",border:"0.5px solid #e5e7eb",display:"flex",flexDirection:"column",zIndex:1000,fontFamily:"inherit"}}>
      {/* 헤더 */}
      <div style={{padding:"12px 16px",borderBottom:"0.5px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"space-between",borderRadius:"12px 12px 0 0",background:C.blue,color:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,fontWeight:500,fontSize:14}}>
          <span>🤖</span><span>AI 사용 도우미</span>
        </div>
        <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#fff",fontSize:18,lineHeight:1,padding:0}}>✕</button>
      </div>
      {/* 메시지 영역 */}
      <div style={{flex:1,overflowY:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:8,background:"#ffffff"}}>
        <div style={{alignSelf:"flex-start",background:"#F3F4F6",color:"#111827",borderRadius:"8px 8px 8px 0",padding:"8px 12px",fontSize:13,maxWidth:"85%",lineHeight:1.6}}>
          안녕하세요! 시스템 사용 관련 궁금한 점을 물어보세요. 😊
        </div>
        {messages.length===0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:4}}>
          {faqs.map((f,i)=><button key={i} onClick={()=>send(f)} style={{padding:"5px 10px",borderRadius:16,fontSize:12,background:C.blueBg,color:C.blue,border:`0.5px solid ${C.blueLt}`,cursor:"pointer",fontFamily:"inherit"}}>{f}</button>)}
        </div>}
        {messages.map((m,i)=><div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",background:m.role==="user"?C.blue:"#F3F4F6",color:m.role==="user"?"#fff":"#111827",borderRadius:m.role==="user"?"8px 8px 0 8px":"8px 8px 8px 0",padding:"8px 12px",fontSize:13,maxWidth:"85%",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{m.role==="assistant"?stripMd(m.text):m.text}</div>)}
        {loading&&<div style={{alignSelf:"flex-start",background:"#F3F4F6",borderRadius:"8px 8px 8px 0",padding:"8px 14px",fontSize:18,color:"#6b7280",letterSpacing:2}}>···</div>}
        <div ref={endRef}/>
      </div>
      {/* 입력창 */}
      <div style={{padding:"10px 12px",borderTop:"0.5px solid #e5e7eb",display:"flex",gap:8,alignItems:"center",background:"#f9fafb",borderRadius:"0 0 12px 12px"}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="질문을 입력하세요..." style={{flex:1,padding:"8px 12px",borderRadius:8,border:"0.5px solid #d1d5db",fontSize:13,fontFamily:"inherit",background:"#ffffff",color:"#111827",outline:"none"}}/>
        <button onClick={()=>send()} disabled={loading||!input.trim()} style={{width:36,height:36,borderRadius:8,background:C.blue,color:"#fff",border:"none",cursor:loading||!input.trim()?"not-allowed":"pointer",opacity:loading||!input.trim()?0.5:1,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>➤</button>
      </div>
    </div>}
    {/* 플로팅 버튼 */}
    <button onClick={()=>setOpen(o=>!o)} style={{position:"fixed",right:24,bottom:24,width:52,height:52,borderRadius:"50%",background:C.blue,color:"#fff",border:"none",cursor:"pointer",fontSize:22,zIndex:1001,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}>
      {open?"✕":"💬"}
    </button>
  </>;
}

export default function App(){
  const [isAuthenticated,setIsAuthenticated]=useState(()=>sessionStorage.getItem('ai_consulting_auth')==='true');
  const [passwordInput,setPasswordInput]=useState('');
  const [passwordError,setPasswordError]=useState(false);
  const [clients,setClients]=useState([]);
  const [activeId,setActiveId]=useState(null);
  const [view,setView]=useState("home");
  const [aiSt,setAiSt]=useState({});
  const [copied,setCopied]=useState("");
  const [sttToast,setSttToast]=useState("");
  const [dbLoading,setDbLoading]=useState(true);
  const fileRef=useRef();

  const handleLogin=()=>{
    if(passwordInput===import.meta.env.VITE_APP_PASSWORD){
      sessionStorage.setItem('ai_consulting_auth','true');
      setIsAuthenticated(true);
      setPasswordError(false);
    }else{
      setPasswordError(true);
      setPasswordInput('');
    }
  };
  const handleLogout=()=>{
    sessionStorage.removeItem('ai_consulting_auth');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  // ── Supabase 연동 ──
  useEffect(()=>{
    supabase.from('clients')
      .select('id, data')
      .order('created_at',{ascending:false})
      .then(({data,error})=>{
        if(!error&&data) setClients(data.map(row=>({...row.data,id:row.id})));
        setDbLoading(false);
      });
  },[]);

  const saveClient = (client) => {
    const row={
      id:client.id,
      name:client.name||'',
      industry:client.industry||'',
      size:client.size||'',
      region:client.region||'',
      ai_level:client.aiLevel||'',
      status:client.status||'discovery',
      phase:client.phase||0,
      step:client.step||0,
      phases_done:client.phasesDone||[false,false,false],
      data:client,
    };
    supabase.from('clients').upsert(row,{onConflict:'id'})
      .then(({error})=>{if(error)console.error('저장 실패:',error);});
  };

  const deleteClient = async (id) => {
    const {error}=await supabase.from('clients').delete().eq('id',id);
    if(error)console.error('삭제 실패:',error);
  };

  const active=clients.find(c=>c.id===activeId);
  const upd = p => {
    setClients(cs => {
      const next = cs.map(c => {
        if(c.id!==activeId) return c;
        const updated={...c,...p,updatedAt:new Date().toISOString()};
        saveClient(updated);
        return updated;
      });
      return next;
    });
  };
  const updN=(k,p)=>setClients(cs=>cs.map(c=>c.id===activeId?{...c,[k]:{...c[k],...p}}:c));
  const aiGet=k=>aiSt[k]||{loading:false,result:null,error:false};
  const aiSet=(k,p)=>setAiSt(a=>({...a,[k]:{...a[k],...p}}));
  const runAI=async(k,sys,usr)=>{aiSet(k,{loading:true,result:null,error:false});try{aiSet(k,{loading:false,result:await claude(sys,usr),error:false});}catch{aiSet(k,{loading:false,result:null,error:true});}};

  const addClient = async () => {
    const c=initClient();
    const row={id:c.id,name:c.name||'',industry:c.industry||'',size:c.size||'',region:c.region||'',ai_level:c.aiLevel||'',status:c.status||'discovery',phase:c.phase||0,step:c.step||0,phases_done:c.phasesDone||[false,false,false],data:c};
    await supabase.from('clients').insert(row);
    setClients(cs=>[...cs,c]);
    setActiveId(c.id);
    setView("client");
  };
  const pc=ph=>[C.blue,C.teal,C.purple][ph]||C.blue;
  const pb=ph=>[C.blueBg,C.tealBg,C.purpleBg][ph]||C.blueBg;

  const next=ns=>{
    if(!active)return;
    const max=PHASES[active.phase].steps.length-1;
    if(ns>max){
      const nd=[...active.phasesDone];nd[active.phase]=true;
      const np=active.phase+1;
      if(np<PHASES.length)upd({phasesDone:nd,phase:np,step:0,status:PHASES[np].key});
      else upd({phasesDone:nd,status:"complete"});
    }else upd({step:ns});
  };

  const copyT=(t,k)=>{navigator.clipboard.writeText(t).then(()=>{setCopied(k);setTimeout(()=>setCopied(""),2000);});};
  const chosenSol=active?(active.selectedSols?.length>0?(active.mergedSolution||active.solutions[active.selectedSols[0]]):(active.selectedSol!=null?active.solutions[active.selectedSol]:null)):null;
  const validPPs=(active?.painPoints||[]).filter(p=>p.title);
  const effectiveTool=(active?.buildTool)||chosenSol?.tool||"";
  const effectiveEffort=(active?.buildEffort)||chosenSol?.effort||"";
  const effectiveCost=(active?.buildCost)||chosenSol?.cost||"";

  // 비밀번호 화면
  if(!isAuthenticated) return <PasswordScreen passwordInput={passwordInput} setPasswordInput={setPasswordInput} passwordError={passwordError} handleLogin={handleLogin}/>;

  // 로딩 화면
  if(dbLoading) return <div style={{maxWidth:760,margin:"0 auto",padding:"3rem 0",textAlign:"center",color:"var(--color-text-secondary)",fontFamily:"var(--font-sans)"}}><div style={{fontSize:32,marginBottom:12}}>⟳</div><div style={{fontSize:14}}>데이터 불러오는 중...</div></div>;

  // 홈
  if(view==="home") return <div style={{maxWidth:760,margin:"0 auto",padding:"1rem 0",fontFamily:"var(--font-sans)"}}>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:"1.5rem",paddingBottom:"1rem",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
      <div style={{width:46,height:46,borderRadius:12,background:C.blueBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🤝</div>
      <div style={{flex:1}}>
        <div style={{fontSize:18,fontWeight:500}}>AI 컨설팅 시스템 v3</div>
        <div style={{fontSize:13,color:"var(--color-text-secondary)",marginTop:2}}>Discovery · Diagnosis · Build & Handover 통합 관리</div>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <Btn v="blue" onClick={addClient}>+ 신규 고객 등록</Btn>
        <Btn v="ghost" sm onClick={handleLogout}>🔒 로그아웃</Btn>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:"1.5rem"}}>
      {PHASES.map(p=><div key={p.id} style={{background:p.bg,border:`0.5px solid ${p.color}30`,borderRadius:12,padding:"12px 14px"}}>
        <div style={{fontSize:12,fontWeight:500,color:p.color,marginBottom:4}}>Phase {p.id}</div>
        <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>{p.label}</div>
        <div style={{fontSize:11,color:"var(--color-text-secondary)",lineHeight:1.5}}>{p.sub}</div>
      </div>)}
    </div>
    {clients.length===0?(
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"64px 24px",textAlign:"center",gap:16}}>
        <div style={{width:72,height:72,background:"var(--phase-discovery-light)",borderRadius:"var(--radius-xl)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,marginBottom:8}}>🤝</div>
        <h3 style={{fontSize:"var(--text-lg)",fontWeight:"var(--font-semibold)",color:"var(--text-primary)",margin:0}}>첫 번째 고객을 등록해보세요</h3>
        <p style={{fontSize:"var(--text-sm)",color:"var(--text-tertiary)",lineHeight:"var(--leading-relaxed)",maxWidth:320,margin:0}}>+ 신규 고객 등록 버튼을 눌러 고객 정보를 입력하면<br/>Discovery 단계부터 시작합니다.</p>
        <button className="btn-primary" onClick={addClient} style={{marginTop:8}}>+ 신규 고객 등록</button>
      </div>
    ):clients.map(c=>{
      const ph=PHASES[c.phase]||PHASES[0];const col=pc(c.phase);const bg=pb(c.phase);
      const completedSteps=c.phasesDone.reduce((acc,done,i)=>acc+(done?PHASES[i].steps.length:(c.phase===i?c.step:0)),0);
      const prg=c.status==="complete"?100:Math.round(completedSteps/14*100);
      return <div key={c.id} onClick={()=>{setActiveId(c.id);setView("client");}}
        className={`client-card phase-${ph.key}`}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:10,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{c.status==="complete"?"🏆":["🔍","🔬","🔨"][c.phase]}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:14,fontWeight:600,color:"var(--text-primary)"}}>{c.name||"(이름 미입력)"}</span>
              {c.industry&&<Chip label={c.industry} color={col} bg={bg}/>}
              <span className={`phase-badge ${ph.key}`}>{c.status==="complete"?"✓ 완료":ph.label}</span>
            </div>
            <div style={{fontSize:12,color:"var(--text-tertiary)"}}>{c.status==="complete"?"전체 완료":`${ph.steps[c.step]||""}`}</div>
            {c.updatedAt&&<div style={{fontSize:11,color:"var(--text-disabled)",marginTop:3}}>{new Date(c.updatedAt).toLocaleDateString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})} 수정</div>}
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:13,fontWeight:600,color:col,marginBottom:2}}>{prg}%</div>
            <div className="progress-bar-track" style={{width:64}}>
              <div className={`progress-bar-fill ${ph.key}`} style={{width:`${prg}%`}}/>
            </div>
          </div>
          <button
            onClick={e=>{e.stopPropagation();if(window.confirm(`${c.name||"이 고객"}을 삭제할까요?`)){deleteClient(c.id);setClients(cs=>cs.filter(x=>x.id!==c.id));}}}
            style={{fontSize:11,color:C.danger,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",marginLeft:8,flexShrink:0}}
          >✕</button>
        </div>
      </div>;
    })}
    <ChatbotWidget contextKey="home"/>
  </div>;

  if(!active) return null;
  const ph=PHASES[active.phase]||PHASES[0];
  const col=pc(active.phase),bg=pb(active.phase),steps=ph.steps;
  const completedSteps2=active.phasesDone.reduce((acc,done,i)=>acc+(done?PHASES[i].steps.length:(active.phase===i?active.step:0)),0);
  const prg2=active.status==="complete"?100:Math.round(completedSteps2/14*100);

  return <div style={{maxWidth:760,margin:"0 auto",padding:"1rem 0",fontFamily:"var(--font-sans)"}}>
    {/* 상단 네비 */}
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:"1rem"}}>
      <button onClick={()=>setView("home")} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"var(--color-text-secondary)",fontFamily:"inherit",padding:0}}>← 목록</button>
      <span style={{color:"var(--color-text-secondary)"}}>·</span>
      <span style={{fontSize:13,fontWeight:500}}>{active.name||"신규 고객"}</span>
      <span style={{marginLeft:"auto",fontSize:12,color:col,fontWeight:500}}>{prg2}% 완료</span>
      <Btn v="ghost" sm onClick={handleLogout}>🔒 로그아웃</Btn>
    </div>
    {/* Phase 표시 */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:"1.25rem"}}>
      {PHASES.map(p=>{const ia=active.phase===p.id,id=active.phasesDone[p.id],pc2=pc(p.id),pb2=pb(p.id);
        return <div key={p.id} onClick={()=>{if(id||ia)upd({phase:p.id,step:0,status:p.key});}} style={{borderRadius:10,padding:"10px 12px",background:id||ia?pb2:"var(--color-background-secondary)",border:`${ia?"2px":"0.5px"} solid ${ia||id?pc2+"50":"var(--color-border-tertiary)"}`,opacity:!ia&&!id?0.5:1,cursor:id||ia?"pointer":"default"}}>
          <div style={{fontSize:11,color:pc2,fontWeight:500}}>Phase {p.id}</div>
          <div style={{fontSize:13,fontWeight:500,marginTop:2}}>{p.label}</div>
          {id&&<div style={{fontSize:11,color:pc2,marginTop:2}}>✓ 완료</div>}
          {ia&&!id&&<div style={{fontSize:11,color:pc2,marginTop:2}}>{p.steps[active.step]}</div>}
        </div>;
      })}
    </div>
    {/* Step 바 */}
    {(()=>{
      const PCOL=["#2563EB","#7C3AED","#059669"];
      const PLIGHT=["#EFF6FF","#F5F3FF","#ECFDF5"];
      const phaseColor=PCOL[active.phase]||PCOL[0];
      const phaseLightColor=PLIGHT[active.phase]||PLIGHT[0];
      return (
        <div style={{display:"flex",alignItems:"center",background:"transparent",padding:"12px 0",marginBottom:"1.25rem"}}>
          {steps.map((s,i)=>{
            const ia=active.step===i&&!active.phasesDone[active.phase];
            const id=i<active.step||active.phasesDone[active.phase];
            const circleStyle=ia
              ?{background:phaseColor,color:"#fff",border:`2px solid ${phaseColor}`,boxShadow:`0 0 0 3px ${phaseLightColor}`}
              :id
              ?{background:phaseLightColor,color:phaseColor,border:`2px solid ${phaseColor}`}
              :{background:"transparent",color:"var(--text-disabled)",border:"2px dashed var(--border-default)"};
            const labelStyle=ia
              ?{color:phaseColor,fontWeight:600}
              :id
              ?{color:"var(--text-tertiary)",fontWeight:400}
              :{color:"var(--text-disabled)",fontWeight:400};
            return (
              <Fragment key={i}>
                <div onClick={()=>upd({step:i})} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,minWidth:56,cursor:"pointer"}}>
                  <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,transition:"all 0.25s ease",...circleStyle}}>
                    {id?"✓":i+1}
                  </div>
                  <span style={{fontSize:10,textAlign:"center",lineHeight:1.3,transition:"color 0.25s ease",maxWidth:52,...labelStyle}}>{s}</span>
                </div>
                {i<steps.length-1&&(
                  <div style={{flex:1,marginBottom:22,transition:"all 0.25s ease",...(id?{height:2,background:phaseColor}:{height:0,borderTop:"2px dashed var(--border-default)"})}}/>
                )}
              </Fragment>
            );
          })}
        </div>
      );
    })()}

    {/* ═══ PHASE 1 DISCOVERY ═══ */}
    {active.phase===0&&<>
      {/* D1 사전 준비 */}
      {active.step===0&&<>
        <InfoBanner phase="Discovery" step="STEP 1" color={C.blue} bg={C.blueBg}>AI 자동 조사 + 직접 입력 → 맞춤형 인터뷰 질문지 자동 생성</InfoBanner>
        <Panel title="고객 기본 정보" icon="🏪">
          <FL c="상호명 / 고객명" mt={0} req/><Inp value={active.name} onChange={v=>upd({name:v})} placeholder="예: 종로 스윗베이커리" req/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><FL c="업종" req/><Sel value={active.industry} onChange={v=>upd({industry:v,hypothesis:[]})} options={INDUSTRIES} req/></div>
            <div><FL c="규모" opt/><Sel value={active.size} onChange={v=>upd({size:v})} options={SIZES}/></div>
            <div><FL c="지역" opt/><Inp value={active.region} onChange={v=>upd({region:v})} placeholder="예: 서울 마포구"/></div>
            <div><FL c="AI 친숙도" opt/><Sel value={active.aiLevel} onChange={v=>upd({aiLevel:v})} options={AI_LEVELS}/></div>
          </div>
        </Panel>
        <ResearchPanel cl={active} upd={upd}/>
        <Panel title="사전 준비 체크리스트" icon="✅">
          {CL_D1.map((t,i)=><ChkItem key={i} label={t} checked={!!active.prepCheck[i]} onChange={()=>updN("prepCheck",{[i]:!active.prepCheck[i]})}/>)}
        </Panel>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:"0.5rem"}}><Btn v="blue" onClick={()=>next(1)}>{BTN_D1_NEXT}</Btn></div>
      </>}

      {/* D2 아이스브레이킹 */}
      {active.step===1&&<>
        <InfoBanner phase="Discovery" step="STEP 2" color={C.blue} bg={C.blueBg}>미팅 첫 10~15분 — AI 얘기는 아직 하지 마세요.</InfoBanner>
        <Panel title="오프닝 스크립트" icon="💬">
          {[["추천 오프닝",'"안녕하세요, 먼저 충분히 들을게요. 요즘 사업하시면서 어떤 부분이 제일 피부로 느껴지세요?"'],["AI 친숙도 파악",'"혹시 ChatGPT나 클로드 같은 거 써보신 적 있으세요?"'],["기대 수준 정렬",'"오늘은 충분히 들을게요. 어떤 도움이 가능한지 다음에 알려드릴게요."']].map(([l,t])=><div key={l} style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:8,padding:"10px 12px",marginBottom:8,background:"var(--color-background-secondary)"}}><div style={{fontSize:11,fontWeight:500,color:C.blue,marginBottom:4}}>{l}</div><div style={{fontSize:13}}>{t}</div></div>)}
          <div style={{height:1,background:"var(--color-border-tertiary)",margin:"12px 0"}}/>
          <FL c="실제 확인한 AI 친숙도" mt={0}/>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:4}}>{AI_LEVELS.map(l=><Tag key={l} label={l} selected={active.aiLevel===l} onClick={()=>upd({aiLevel:l})}/>)}</div>
          <FL c="특이사항 메모"/><TA value={active.iceMemo} onChange={v=>upd({iceMemo:v})} placeholder="특이사항..." rows={3}/>
        </Panel>
        <Panel title="체크리스트" icon="✅">
          {CL_D2.map((t,i)=><ChkItem key={i} label={t} checked={!!active.iceCheck[i]} onChange={()=>updN("iceCheck",{[i]:!active.iceCheck[i]})}/>)}
        </Panel>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({step:0})}>← 이전</Btn><Btn v="blue" onClick={()=>next(2)}>완료 →</Btn></div>
      </>}

      {/* D3 현황 인터뷰 */}
      {active.step===2&&<>
        <InfoBanner phase="Discovery" step="STEP 3" color={C.blue} bg={C.blueBg}>핵심 40~50분 — 80% 듣고 20% 말하기</InfoBanner>
        {active.interviewQ&&<Panel title="생성된 질문지 참고" icon="📋" accent={C.blueBg}>
          <div style={{fontSize:12,color:C.blue,marginBottom:6}}>Step 1에서 생성된 맞춤형 질문지</div>
          <div style={{fontSize:12,lineHeight:1.7,whiteSpace:"pre-wrap",color:"var(--color-text-secondary)",maxHeight:180,overflowY:"auto",background:"var(--color-background-primary)",borderRadius:8,padding:"10px 12px"}}>{active.interviewQ}</div>
        </Panel>}
        <Panel title="핵심 3질문 메모" icon="❓">
          {[["1","하루 일과를 말씀해 주세요. 아침부터 문 닫을 때까지 어떻게 흘러가나요?","q1"],["2","시간이 제일 많이 걸리는 일, 실수가 잦은 일은 뭔가요?","q2"],["3","자다가 걱정되는 일, 월말에 골치 아픈 일이 있나요?","q3"]].map(([n,q,k])=><div key={k} style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:8,padding:"10px 12px",marginBottom:10,background:"var(--color-background-secondary)"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}><div style={{fontSize:11,fontWeight:500,color:C.warn}}>Q{n}</div>{active.notesAutoFilled?.[k]&&<span style={{fontSize:10,background:C.blue,color:"#fff",padding:"1px 6px",borderRadius:8,lineHeight:1.4}}>🤖 자동입력</span>}</div><div style={{fontSize:13,marginBottom:8,lineHeight:1.5}}>"{q}"</div><TA value={active.notes[k]} onChange={v=>{updN("notes",{[k]:v});if(active.notesAutoFilled?.[k])updN("notesAutoFilled",{[k]:false});}} placeholder="고객 답변 메모..." rows={3}/></div>)}
          <FL c="추가 탐색 메모"/><TA value={active.notes.extra} onChange={v=>updN("notes",{extra:v})} placeholder="예산, 도구, 직원 관련..." rows={3}/>
        </Panel>
        <Panel title="녹음 파일 업로드" icon="🎙">
          {!active.audioFileName?<div onClick={()=>fileRef.current?.click()} style={{border:"1.5px dashed var(--color-border-secondary)",borderRadius:12,padding:"1.5rem",textAlign:"center",cursor:"pointer",background:"var(--color-background-secondary)"}}><div style={{fontSize:28,marginBottom:6}}>⬆</div><div style={{fontSize:13,color:"var(--color-text-secondary)"}}>녹음 파일 업로드 (MP3, M4A, WAV)</div></div>:<div style={{display:"flex",alignItems:"center",gap:10,padding:12,background:C.successBg,borderRadius:8}}><span style={{fontSize:20}}>🎵</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:C.success}}>{active.audioFileName}</div></div><button onClick={()=>upd({audioFileName:""})} style={{background:"none",border:"none",cursor:"pointer",fontSize:16}}>✕</button></div>}
          {active.transcribing && (
            <div style={{display:"flex",alignItems:"center",gap:8,padding:12,
              background:"#f9fafb",borderRadius:8,marginTop:8,fontSize:13,color:"#6b7280"}}>
              ⟳ {active.transcribing==="claude"?"고객 답변 정리 중...":"음성 파일 변환 중..."}
            </div>
          )}
          {active.extractedQuestions && !active.transcribing && (
            <div style={{marginTop:10}}>
              <div style={{fontSize:12,fontWeight:500,color:"#111",marginBottom:6}}>
                📝 인터뷰 고객 답변 정리
              </div>
              <div style={{borderTop:"1px solid var(--color-border-tertiary)",borderBottom:"1px solid var(--color-border-tertiary)",padding:"10px 0",fontSize:13,lineHeight:1.9,whiteSpace:"pre-wrap",maxHeight:200,overflowY:"auto",color:"var(--color-text-primary)"}}>
                {active.extractedQuestions}
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6}}>
                <div style={{fontSize:11,color:"var(--color-text-secondary)"}}>※ AI가 고객 답변 핵심 내용만 추출·정제한 결과입니다.</div>
                <button onClick={()=>{navigator.clipboard.writeText(active.extractedQuestions);setCopied("stt");setTimeout(()=>setCopied(""),2000);}} style={{fontSize:11,padding:"2px 8px",border:"0.5px solid var(--color-border-secondary)",borderRadius:6,background:"transparent",cursor:"pointer",fontFamily:"inherit"}}>{copied==="stt"?"✓ 복사됨":"📋 복사"}</button>
              </div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="audio/*,video/*" style={{display:"none"}}
            onChange={async e => {
              const file = e.target.files[0]
              if (!file) return
              upd({ audioFileName: file.name, transcribing: "whisper", transcript: '', extractedQuestions: '' })

              try {
                const formData = new FormData()
                const ext = file.name.split('.').pop() || 'mp3'
                formData.append('audio', file, `audio.${ext}`)

                const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
                const data = await res.json()

                if (data.error) {
                  upd({ transcribing: false })
                  alert('변환 실패: ' + data.error)
                  return
                }

                upd({ transcribing: "claude" })
                await new Promise(r => setTimeout(r, 100))

                const raw = data.raw || data.text || ''
                const questions = data.summary || raw
                const { q1Match, q2Match, q3Match } = data

                const currentNotes = active.notes || {}
                const newNotes = { ...currentNotes }
                const autoFilled = { ...(active.notesAutoFilled || {}) }
                let anyFilled = false
                if (q1Match && !currentNotes.q1) { newNotes.q1 = q1Match; autoFilled.q1 = true; anyFilled = true }
                if (q2Match && !currentNotes.q2) { newNotes.q2 = q2Match; autoFilled.q2 = true; anyFilled = true }
                if (q3Match && !currentNotes.q3) { newNotes.q3 = q3Match; autoFilled.q3 = true; anyFilled = true }

                upd({ transcript: raw, extractedQuestions: questions, transcribing: false, notes: newNotes, notesAutoFilled: autoFilled })

                if (anyFilled) {
                  setSttToast("Q1~Q3 핵심 질문이 자동으로 입력되었습니다.")
                  setTimeout(() => setSttToast(""), 3000)
                }
              } catch (err) {
                upd({ transcribing: false })
                alert('변환 중 오류 발생: ' + err.message)
              }
            }}
          />
        </Panel>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({step:1})}>← 이전</Btn><Btn v="blue" onClick={()=>next(3)}>{BTN_D3_NEXT}</Btn></div>
      </>}

      {/* D4 AI 분석 */}
      {active.step===3&&<>
        <Panel title="AI Pain Point 분석" icon="🤖">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[["고객",active.name],["업종",active.industry],["AI 친숙도",active.aiLevel],["녹음파일",active.audioFileName||"없음"]].map(([l,v])=><div key={l} style={{background:"var(--color-background-secondary)",borderRadius:8,padding:"8px 12px"}}><div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:2}}>{l}</div><div style={{fontSize:13,fontWeight:500}}>{v||"미입력"}</div></div>)}
          </div>
          <button className="btn-ai" onClick={aiGet("d_an").loading?undefined:()=>runAI("d_an","소상공인 인터뷰 분석. 순수 JSON만 출력.\n{\"painPoints\":[{\"rank\":1,\"title\":\"제목\",\"type\":\"반복업무자동화|정보부족분석|고객응대자동화\",\"impact\":\"영향1줄\",\"solution\":\"솔루션방향1줄\"}],\"summary\":\"요약2줄\",\"nextAction\":\"권고1줄\"}",
            `고객:${active.name} 업종:${active.industry} AI친숙도:${active.aiLevel}\n가설:${(active.hypothesis||[]).join(",")}\nQ1:${active.notes.q1}\nQ2:${active.notes.q2}\nQ3:${active.notes.q3}\n추가:${active.notes.extra}\n${active.transcript?"[녹음 파일 변환 텍스트]\n"+active.transcript:""}`
          )} disabled={aiGet("d_an").loading}>{aiGet("d_an").loading?"⟳ 분석 중...":"✨ AI 분석 실행"}</button>
          {(()=>{const a=aiGet("d_an");if(a.loading)return <AIBox loading={true} color={C.blue}/>;if(a.error)return <AIBox error={true} color={C.blue}/>;if(a.result){let p=null;try{p=JSON.parse(a.result.replace(/```json|```/g,"").trim());}catch{}if(p?.painPoints){if(active.painPoints.every(pp=>!pp.title))setTimeout(()=>upd({painPoints:p.painPoints.map(pp=>({title:pp.title||"",type:pp.type||"",impact:pp.impact||"",solution:pp.solution||""}))}),0);return <div style={{borderLeft:`3px solid ${C.blue}`,background:"var(--color-background-secondary)",borderRadius:"0 8px 8px 0",padding:"12px 14px",marginTop:10,fontSize:13,lineHeight:1.8}}><div style={{fontSize:12,fontWeight:500,color:C.blue,marginBottom:8}}>✦ AI 분석 완료</div>{p.summary&&<div style={{marginBottom:10,paddingBottom:10,borderBottom:"0.5px solid var(--color-border-tertiary)"}}>{p.summary}</div>}{p.painPoints.map((pp,i)=><div key={i} style={{marginBottom:8,padding:"8px 10px",background:"var(--color-background-primary)",borderRadius:8}}><div style={{fontSize:12,fontWeight:500,marginBottom:2}}>#{pp.rank} {pp.title} <Chip label={pp.type} color={C.blue} bg={C.blueBg}/></div><div style={{fontSize:12,color:"var(--color-text-secondary)"}}>영향: {pp.impact}</div><div style={{fontSize:12,color:C.success}}>→ {pp.solution}</div></div>)}{p.nextAction&&<div style={{fontSize:12,color:C.warn,marginTop:6}}>→ {p.nextAction}</div>}</div>;}return <AIBox loading={false} result={a.result} error={false} color={C.blue}/>;}return null;})()}
        </Panel>
        <Panel title="Pain Point 편집" icon="📋">
          {(active.painPoints||[]).every(pp=>!pp.title)&&!aiGet("d_an").loading&&(
            <EmptyAIResult icon="🔍" message="AI 분석 결과가 없습니다" subMessage="위 버튼으로 AI 분석을 실행하면 Pain Point가 자동으로 채워집니다"/>
          )}
          {(active.painPoints||[]).map((pp,i)=><div key={i} style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:8,padding:"12px",marginBottom:10,position:"relative"}}>
            <div style={{position:"absolute",top:8,right:10,fontSize:11,background:C.blueBg,color:C.blue,padding:"2px 8px",borderRadius:10}}>#{i+1}</div>
            <FL c="제목" mt={0} req/><Inp value={pp.title} onChange={v=>upd({painPoints:active.painPoints.map((p,j)=>j===i?{...p,title:v}:p)})} placeholder="예: 재고 수기 관리" req/>
            <FL c="유형" opt/><div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:4}}>{PAIN_TYPES.map(t=><Tag key={t} label={t} selected={pp.type===t} onClick={()=>upd({painPoints:active.painPoints.map((p,j)=>j===i?{...p,type:t}:p)})}/>)}</div>
            <FL c="현재 영향" opt/><Inp value={pp.impact} onChange={v=>upd({painPoints:active.painPoints.map((p,j)=>j===i?{...p,impact:v}:p)})} placeholder="예: 하루 1시간 낭비"/>
          </div>)}
          <Btn onClick={()=>upd({painPoints:[...(active.painPoints||[]),{title:"",type:"",impact:"",solution:""}]})}>+ 추가</Btn>
        </Panel>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({step:2})}>← 이전</Btn><Btn v="blue" onClick={()=>next(4)}>완료 →</Btn></div>
      </>}

      {/* D5 확정 & 전달 */}
      {active.step===4&&<>
        <Panel title="Pain Point 요약 문서" icon="📄">
          <div style={{background:"var(--color-background-secondary)",borderRadius:8,padding:"14px 16px",fontSize:13,lineHeight:1.8}}>
            <div style={{fontSize:12,fontWeight:500,color:C.blue,marginBottom:6}}>고객 현황 요약</div>
            <div>• 상호: <strong>{active.name||"미입력"}</strong> / 업종: {active.industry||"미입력"} / 규모: {active.size||"미입력"}</div>
            <div>• AI 친숙도: <Chip label={active.aiLevel||"미확인"}/></div>
            <div style={{height:1,background:"var(--color-border-tertiary)",margin:"10px 0"}}/>
            <div style={{fontSize:12,fontWeight:500,color:C.blue,marginBottom:6}}>확인된 Pain Point</div>
            {validPPs.length?validPPs.map((pt,i)=><div key={i} style={{padding:"8px 10px",borderRadius:8,border:"0.5px solid var(--color-border-tertiary)",marginBottom:6,background:"var(--color-background-primary)"}}><div style={{fontSize:13,fontWeight:500}}>#{i+1} {pt.title} <Chip label={pt.type}/></div>{pt.impact&&<div style={{fontSize:12,color:"var(--color-text-secondary)"}}>영향: {pt.impact}</div>}</div>):<div style={{fontSize:13,color:"var(--color-text-secondary)"}}>Pain Point 미입력</div>}
          </div>
          <Btn onClick={()=>copyT(validPPs.map((pt,i)=>`#${i+1} ${pt.title}\n영향: ${pt.impact}`).join("\n\n"),"sum")} style={{marginTop:10}}>{copied==="sum"?"✓ 복사됨":"📋 복사"}</Btn>
        </Panel>
        <Panel title="완료 체크리스트" icon="✅">
          {CL_D5.map((t,i)=><ChkItem key={i} label={t} checked={!!active.finalCheck[i]} onChange={()=>updN("finalCheck",{[i]:!active.finalCheck[i]})}/>)}
        </Panel>
        <div style={{marginTop:14}}><Btn v="blue" onClick={()=>next(5)}>{BTN_D5_NEXT}</Btn></div>
        <div style={{marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({step:3})}>← 이전</Btn></div>
      </>}
    </>}

    {/* ═══ PHASE 2 DIAGNOSIS ═══ */}
    {active.phase===1&&<>
      {active.step===0&&<>
        <InfoBanner phase="Diagnosis" step="STEP 1" color={C.teal} bg={C.tealBg}>Discovery 결과를 재확인하고 예산·의사결정 구조를 파악합니다.</InfoBanner>
        <Panel title="Discovery 결과" icon="📥" accent={C.tealBg}>
          {validPPs.length?validPPs.map((pt,i)=><div key={i} style={{padding:"8px 10px",borderRadius:8,border:"0.5px solid var(--color-border-tertiary)",marginBottom:6,background:"var(--color-background-primary)"}}><div style={{fontSize:13,fontWeight:500}}>#{i+1} {pt.title} <Chip label={pt.type} color={C.teal} bg={C.tealBg}/></div><div style={{fontSize:12,color:"var(--color-text-secondary)"}}>영향: {pt.impact}</div></div>):<div style={{fontSize:13,color:"var(--color-text-secondary)"}}>Pain Point 없음 — Discovery 재확인 필요</div>}
        </Panel>
        <Panel title="2차 미팅 재확인" icon="🔎">
          <FL c="추가 파악 내용" mt={0} opt/><TA value={active.additionalPP} onChange={v=>upd({additionalPP:v})} placeholder="2차 미팅 추가 내용..." rows={3}/>
          <FL c="예산·의사결정 메모" opt/><TA value={active.reconfirmNotes} onChange={v=>upd({reconfirmNotes:v})} placeholder="예산 범위, 의사결정자..." rows={3}/>
          <Btn v="teal" onClick={()=>runAI("dg_rc","Discovery 결과 Diagnosis 재검토. 추가 확인 포인트 200자 이내.",`고객:${active.name} 업종:${active.industry} PP:${validPPs.map(p=>p.title).join(",")}\n추가:${active.additionalPP}`)} disabled={aiGet("dg_rc").loading} style={{marginTop:10}}>{aiGet("dg_rc").loading?"⟳ 분석 중...":"🤖 AI 추가 확인 포인트"}</Btn>
          <AIBox loading={aiGet("dg_rc").loading} result={aiGet("dg_rc").result} error={aiGet("dg_rc").error} color={C.teal}/>
        </Panel>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({phase:0,step:4,status:"discovery"})}>{BTN_DG1_BACK}</Btn><Btn v="teal" onClick={()=>next(1)}>완료 →</Btn></div>
      </>}

      {/* DG2 솔루션 설계 */}
      {active.step===1&&<>
        <InfoBanner phase="Diagnosis" step="STEP 2" color={C.teal} bg={C.tealBg}>
          솔루션 선택 → 제안서 초안 자동 생성 → STEP 3 실현 가능성 평가 순서로 진행하세요.
        </InfoBanner>
        <SolutionPanel cl={active} upd={upd} aiGet={aiGet} runAI={runAI}/>

        {/* 제안서 초안 자동 생성 — STEP 3 실현 가능성 평가 전에 필요 */}
        {(active.selectedSols||[]).length>0&&<>
          <Panel title="제안서 초안 자동 생성" icon="📋" bl={C.teal}>
            <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:12,lineHeight:1.6}}>
              선택된 솔루션을 바탕으로 제안서 초안을 생성합니다.<br/>
              이 내용을 바탕으로 STEP 3에서 실현 가능성을 평가할 수 있습니다.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              {[["고객",active.name],["솔루션",chosenSol?.title||"미선택"],["예산",active.budget||"미입력"],["일정",active.timeline||"미입력"]].map(([l,v])=>(
                <div key={l} style={{background:"var(--color-background-secondary)",borderRadius:8,padding:"8px 12px"}}>
                  <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:2}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:500}}>{v||"미입력"}</div>
                </div>
              ))}
            </div>
            {!active.proposalDraft&&!aiGet("dg_proposal_draft").loading&&!aiGet("dg_proposal_draft").error&&(
              <EmptyAIResult icon="📄" message="제안서 초안이 없습니다" subMessage="솔루션을 선택한 뒤 아래 버튼으로 제안서 초안을 자동 생성하세요"/>
            )}
            <button className="btn-ai" onClick={aiGet("dg_proposal_draft").loading||!chosenSol?.title?undefined:async()=>{
              aiSet("dg_proposal_draft",{loading:true,result:null,error:false});
              try{
                const solDesc=(active.mergedSolution?.title)||(active.selectedSols||[]).map(i=>(active.solutions||[])[i]?.title).filter(Boolean).join(" + ")||"미선택";
                const tools=(active.selectedSols||[]).map(i=>(active.solutions||[])[i]?.tool).filter(Boolean).join(", ")||"미정";
                const r=await claude(
                  `당신은 IT 컨설턴트입니다. 소상공인 고객을 위한 AI 솔루션 제안서 초안을 작성하세요.

⚠️ 분량 규칙 (반드시 준수):
- 각 항목은 불릿 포인트 3~5줄 이내로 간결하게 작성
- 전체 분량이 A4 2페이지를 넘지 않도록 작성
- 불필요한 수식어·반복 설명 금지

반드시 아래 6개 항목을 모두 포함하세요:

[1. 제안 솔루션 (TO-BE)]
• 시스템 개요 (1줄)
• 주요 기능 3가지 이내
• 사용 기술/도구

[2. 구축 범위]
• 포함 범위 (In-Scope) 핵심만
• 제외 범위 (Out-of-Scope) 핵심만

[3. 추진 일정 (WBS)]
• 단계별 일정 요약 (착수~오픈)
• 주요 마일스톤 2~3개

[4. 추진 조직 및 역할]
• 제안사 역할 요약
• 고객사 협조 사항 요약

[5. 사업비 (견적)]
• 주요 비용 항목 및 금액
• 유지보수 조건

[6. 기대 효과]
• 정량적 효과 (수치 포함)
• ROI 요약`,
                  `고객: ${active.name||"미입력"} / 업종: ${active.industry||"미입력"} / 규모: ${active.size||"미입력"}
AI친숙도: ${active.aiLevel||"미입력"}
핵심 Pain Point: ${validPPs.map((p,i)=>`#${i+1} ${p.title}(영향:${p.impact})`).join(" / ")||"미입력"}
제안 솔루션: ${solDesc}
사용 도구/기술: ${tools}
예산 범위: ${active.budget||"미정"} / 구축 기간: ${active.timeline||"미정"}`,
                  2000
                );
                upd({proposalDraft:r});
                aiSet("dg_proposal_draft",{loading:false,result:"완료",error:false});
              }catch(e){
                aiSet("dg_proposal_draft",{loading:false,result:null,error:true});
              }
            }} disabled={aiGet("dg_proposal_draft").loading||!chosenSol?.title}>
              {aiGet("dg_proposal_draft").loading?"⟳ 제안서 초안 생성 중...":"✨ 제안서 초안 자동 생성 (6개 항목)"}
            </button>
            {aiGet("dg_proposal_draft").error&&<AIBox loading={false} result={null} error={true} color={C.teal}/>}
            {(active.proposalDraft||aiGet("dg_proposal_draft").loading)&&!aiGet("dg_proposal_draft").error&&(
              aiGet("dg_proposal_draft").loading
                ?<div style={{display:"flex",alignItems:"center",gap:8,padding:14,color:"var(--color-text-secondary)",fontSize:13,marginTop:10,background:"var(--color-background-secondary)",borderRadius:8}}>⟳ 6개 항목 제안서를 작성하고 있습니다...</div>
                :<>
                  <div style={{fontSize:12,color:C.teal,fontWeight:500,marginTop:10,marginBottom:6}}>✦ 제안서 초안 완성 — 내용을 확인하고 STEP 3으로 진행하세요</div>
                  <TA value={active.proposalDraft||""} onChange={v=>upd({proposalDraft:v})} rows={20}/>
                  <div style={{display:"flex",gap:8,marginTop:8}}>
                    <Btn onClick={()=>{navigator.clipboard.writeText(active.proposalDraft||"");}}> 📋 복사</Btn>
                    <Btn v="ghost" onClick={async()=>{
                      aiSet("dg_proposal_draft",{loading:true,result:null,error:false});
                      const solDesc=(active.mergedSolution?.title)||(active.selectedSols||[]).map(i=>(active.solutions||[])[i]?.title).filter(Boolean).join(" + ")||"미선택";
                      const tools=(active.selectedSols||[]).map(i=>(active.solutions||[])[i]?.tool).filter(Boolean).join(", ")||"미정";
                      try{
                        const r=await claude("IT 컨설턴트. 소상공인 AI 솔루션 제안서 초안. 각 항목 3~5줄 이내, 전체 A4 2페이지 이내로 간결하게 작성. [1.제안솔루션(TO-BE)] [2.구축범위] [3.추진일정WBS] [4.추진조직및역할] [5.사업비견적] [6.기대효과ROI] 6개 항목 모두 포함.",
                          `고객:${active.name} 업종:${active.industry} PP:${validPPs.map(p=>p.title).join(",")} 솔루션:${solDesc} 도구:${tools} 예산:${active.budget} 일정:${active.timeline}`,
                          2000
                        );
                        upd({proposalDraft:r});
                        aiSet("dg_proposal_draft",{loading:false,result:"완료",error:false});
                      }catch{aiSet("dg_proposal_draft",{loading:false,result:null,error:true});}
                    }} disabled={aiGet("dg_proposal_draft").loading}>🔄 재생성</Btn>
                  </div>
                </>
            )}
          </Panel>
        </>}

        <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}>
          <Btn v="ghost" onClick={()=>upd({step:0})}>← 이전</Btn>
          <Btn v="teal" onClick={()=>next(2)} disabled={!(active.selectedSols||[]).length||!active.proposalDraft}>
            {!(active.selectedSols||[]).length?"솔루션을 선택하세요":!active.proposalDraft?"제안서 초안을 먼저 생성하세요":BTN_DG2_NEXT}
          </Btn>
        </div>
      </>}

      {/* DG3 실현 가능성 */}
      {active.step===2&&(()=>{
        const selSols=(active.selectedSols||[]).map(i=>(active.solutions||[])[i]).filter(Boolean);
        const hasMerged=!!active.mergedSolution;
        const evalTargets=hasMerged
          ?[{...active.mergedSolution,isMerged:true}]
          :selSols.length>0?selSols:[chosenSol].filter(Boolean);
        return <>
          <InfoBanner phase="Diagnosis" step="STEP 3" color={C.teal} bg={C.tealBg}>
            STEP 2에서 생성된 제안서 초안을 바탕으로 실현 가능성을 평가합니다.
          </InfoBanner>

          {/* 제안서 초안 요약 참조 */}
          {active.proposalDraft&&(
            <Panel title="STEP 2 제안서 초안 요약" icon="📋" accent={C.tealBg}>
              <div style={{fontSize:12,color:C.teal,marginBottom:8,fontWeight:500}}>
                아래 제안서 내용을 참고해서 실현 가능성을 평가하세요.
              </div>
              <div style={{background:"var(--color-background-primary)",borderRadius:8,padding:"12px 14px",fontSize:12,lineHeight:1.8,whiteSpace:"pre-wrap",maxHeight:200,overflowY:"auto",color:"var(--color-text-secondary)"}}>
                {active.proposalDraft}
              </div>
            </Panel>
          )}
          {!active.proposalDraft&&(
            <div style={{padding:"12px 14px",background:C.warnBg,borderRadius:8,fontSize:13,color:C.warn,marginBottom:"1rem",display:"flex",alignItems:"center",gap:8}}>
              <span>⚠</span>
              <div>
                <div style={{fontWeight:500,marginBottom:2}}>제안서 초안이 없습니다</div>
                <div style={{fontSize:12}}>STEP 2로 돌아가서 제안서 초안을 먼저 생성해 주세요.</div>
              </div>
              <Btn sm v="teal" onClick={()=>upd({step:1})} style={{marginLeft:"auto"}}>← STEP 2로</Btn>
            </div>
          )}

          {/* 선택 솔루션 전체 표시 */}
          <Panel title="평가 대상 솔루션" icon="🎯" accent={C.tealBg}>
            {evalTargets.length===0
              ?<div style={{fontSize:13,color:"var(--color-text-secondary)"}}>STEP 2에서 솔루션을 선택해 주세요.</div>
              :evalTargets.map((sol,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",borderRadius:8,border:`0.5px solid ${C.tealLt}`,background:"var(--color-background-primary)",marginBottom:8}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:C.teal,color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:500}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,marginBottom:4}}>{sol.title||"(제목없음)"}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {sol.type&&<Chip label={sol.type} color={C.teal} bg={C.tealBg}/>}
                    {sol.tool&&<span style={{fontSize:11,color:"var(--color-text-secondary)"}}>🔧 {sol.tool}</span>}
                    {sol.effort&&<span style={{fontSize:11,background:C.warnBg,color:C.warn,padding:"2px 6px",borderRadius:6}}>⏱ {sol.effort}</span>}
                    {sol.cost&&<span style={{fontSize:11,background:C.purpleBg,color:C.purple,padding:"2px 6px",borderRadius:6}}>💰 {sol.cost}</span>}
                    {sol.isMerged&&<span style={{fontSize:11,background:C.tealBg,color:C.teal,padding:"2px 8px",borderRadius:6,fontWeight:500}}>통합 솔루션</span>}
                  </div>
                </div>
              </div>)
            }
          </Panel>

          {/* 솔루션별 AI 실현 가능성 평가 */}
          {evalTargets.map((sol,i)=>{
            const aiKey=`dg_fs_${i}`;
            return <Panel key={i} title={`솔루션 ${i+1} 실현 가능성 평가`} icon="🔍" bl={C.teal}>
              <div style={{fontSize:13,fontWeight:500,color:C.teal,marginBottom:10}}>{sol.title}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
                {CL_DG3.map((lbl,j)=>(["체크",lbl,!!active.feasCheck[`${i}_${j}`],`${i}_${j}`])).map(([,label,checked,key])=>(
                  <label key={key} onClick={()=>updN("feasCheck",{[key]:!active.feasCheck[key]})}
                    style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",borderRadius:8,
                      border:`0.5px solid ${checked?"var(--color-border-success)":"var(--color-border-tertiary)"}`,
                      background:checked?"var(--color-background-success)":"var(--color-background-primary)",cursor:"pointer"}}>
                    <input type="checkbox" checked={checked} onChange={()=>{}} onClick={e=>e.stopPropagation()} style={{accentColor:C.teal}}/>
                    <span style={{fontSize:12,textDecoration:checked?"line-through":"none",opacity:checked?0.6:1}}>{label}</span>
                  </label>
                ))}
              </div>
              <Btn v="teal" sm onClick={()=>runAI(aiKey,
                "소상공인 AI 솔루션 실현 가능성 평가. 제안서 초안을 참고해서 아래 4가지를 간결하게:\n✅ 강점(1~2줄)\n⚠️ 리스크(1~2줄)\n💡 성공 조건(1줄)\n📌 권고(1줄)",
                `솔루션:${sol.title}(${sol.type||""}) 도구:${sol.tool||""}\n기간:${sol.effort||""} 비용:${sol.cost||""}\n고객:${active.name} AI친숙도:${active.aiLevel}\n예산:${active.budget} 리스크메모:${active.riskNote||"없음"}\n\n[제안서 초안 참조]\n${(active.proposalDraft||"없음").substring(0,800)}`
              )} disabled={aiGet(aiKey).loading}>
                {aiGet(aiKey).loading?"⟳ 평가 중...":"🤖 AI 실현 가능성 평가"}
              </Btn>
              <AIBox loading={aiGet(aiKey).loading} result={aiGet(aiKey).result} error={aiGet(aiKey).error} onRetry={()=>runAI(aiKey,"","")} color={C.teal}/>
            </Panel>;
          })}

          {/* 공통 리스크 메모 */}
          <Panel title="공통 리스크 메모" icon="⚠️">
            <TA value={active.riskNote} onChange={v=>upd({riskNote:v})} placeholder="전체 솔루션에 공통으로 적용되는 리스크나 제약 조건..." rows={3}/>
          </Panel>

          {/* 권고 사항 선택 → 제안서 반영 */}
          <Panel title="권고 사항 선택 → 제안서 반영" icon="✅" bl={C.teal}>
            <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:12,lineHeight:1.6}}>
              위 AI 평가에서 나온 권고 사항을 직접 입력하거나 선택해서 제안서 초안에 반영할 수 있습니다.
            </div>
            <FL c="반영할 권고 사항 (AI 평가 결과에서 복사해서 입력)" mt={0}/>
            <TA
              value={active.selectedRecommendations||""}
              onChange={v=>upd({selectedRecommendations:v})}
              placeholder={`예:\n• 초기 2주는 재고 수기 병행 운영 권장\n• 카카오 알림톡 사전 채널 개설 필요\n• 포스 API 연동 가능 여부 사전 확인 필요`}
              rows={5}
            />
            <FL c="제안서에 반영할 항목 선택"/>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:4}}>
              {[
                ["rec_risk","⚠️ 리스크 완화 방안을 구축 범위에 추가"],
                ["rec_schedule","📅 권고 일정 조정 사항을 WBS에 반영"],
                ["rec_cost","💰 추가 비용 항목을 사업비에 반영"],
                ["rec_role","👤 고객사 협조 사항을 추진 조직에 추가"],
                ["rec_effect","📊 성공 조건을 기대 효과 ROI에 반영"],
              ].map(([key,label])=>(
                <label key={key} onClick={()=>updN("recOptions",{[key]:!active.recOptions?.[key]})}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,
                    border:`0.5px solid ${active.recOptions?.[key]?"var(--color-border-success)":"var(--color-border-tertiary)"}`,
                    background:active.recOptions?.[key]?"var(--color-background-success)":"var(--color-background-primary)",
                    cursor:"pointer"}}>
                  <input type="checkbox" checked={!!active.recOptions?.[key]} onChange={()=>{}} onClick={e=>e.stopPropagation()} style={{accentColor:C.teal}}/>
                  <span style={{fontSize:13,textDecoration:active.recOptions?.[key]?"line-through":"none",opacity:active.recOptions?.[key]?0.6:1}}>{label}</span>
                </label>
              ))}
            </div>
            {(active.selectedRecommendations||Object.values(active.recOptions||{}).some(Boolean))&&(
              <div style={{marginTop:14}}>
                <Btn v="teal" onClick={async()=>{
                  aiSet("dg_proposal_revised",{loading:true,result:null,error:false});
                  const solDesc=(active.mergedSolution?.title)||(active.selectedSols||[]).map(i=>(active.solutions||[])[i]?.title).filter(Boolean).join(" + ")||"미선택";
                  const tools=(active.selectedSols||[]).map(i=>(active.solutions||[])[i]?.tool).filter(Boolean).join(", ")||"미정";
                  const selectedOpts=Object.entries(active.recOptions||{}).filter(([,v])=>v).map(([k])=>({
                    rec_risk:"리스크 완화 방안 → 구축 범위 반영",
                    rec_schedule:"일정 조정 → WBS 반영",
                    rec_cost:"추가 비용 항목 → 사업비 반영",
                    rec_role:"고객사 협조 사항 → 추진 조직 반영",
                    rec_effect:"성공 조건 → 기대 효과 ROI 반영",
                  }[k])).filter(Boolean);
                  try{
                    const r=await claude(
                      `당신은 IT 컨설턴트입니다. 기존 제안서 초안에 권고 사항을 반영해서 제안서를 개선하세요.

⚠️ 분량 규칙 (반드시 준수):
- 각 항목은 불릿 포인트 3~5줄 이내로 간결하게 작성
- 전체 분량이 A4 2페이지를 넘지 않도록 작성

반드시 아래 6개 항목을 모두 포함하세요:
[1. 제안 솔루션 (TO-BE)] 시스템 개요(1줄), 주요 기능 3가지 이내, 사용 기술
[2. 구축 범위] In-Scope 핵심만, Out-of-Scope 핵심만
[3. 추진 일정 (WBS)] 단계별 일정 요약, 마일스톤 2~3개
[4. 추진 조직 및 역할] 역할 요약, 고객사 협조 사항 요약
[5. 사업비 (견적)] 주요 비용 항목, 유지보수 조건
[6. 기대 효과] 정량적 효과(수치 포함), ROI 요약`,
                      `고객:${active.name} 업종:${active.industry} 규모:${active.size}
PP:${validPPs.map(p=>`${p.title}(영향:${p.impact})`).join(" / ")||"미입력"}
솔루션:${solDesc} 도구:${tools}
예산:${active.budget} 일정:${active.timeline}

[기존 제안서 초안]
${(active.proposalDraft||"없음").substring(0,600)}

[반영할 권고 사항]
${active.selectedRecommendations||"없음"}

[반영 항목]
${selectedOpts.join("\n")||"없음"}

위 권고 사항과 반영 항목을 적극적으로 제안서에 녹여서 개선해주세요.`,
                      2000
                    );
                    upd({proposalDraft:r});
                    aiSet("dg_proposal_revised",{loading:false,result:"완료",error:false});
                  }catch{
                    aiSet("dg_proposal_revised",{loading:false,result:null,error:true});
                  }
                }} disabled={aiGet("dg_proposal_revised").loading}>
                  {aiGet("dg_proposal_revised").loading?"⟳ 권고 사항 반영해서 재생성 중...":BTN_DG3_REGEN}
                </Btn>
                {aiGet("dg_proposal_revised").loading&&(
                  <div style={{display:"flex",alignItems:"center",gap:8,padding:12,color:"var(--color-text-secondary)",fontSize:13,marginTop:10,background:"var(--color-background-secondary)",borderRadius:8}}>
                    ⟳ 권고 사항을 반영해서 제안서를 개선하고 있습니다...
                  </div>
                )}
                {aiGet("dg_proposal_revised").result==="완료"&&!aiGet("dg_proposal_revised").loading&&(
                  <div style={{fontSize:12,color:C.success,fontWeight:500,marginTop:8}}>
                    ✓ 제안서가 업데이트되었습니다. STEP 4에서 최종 확인하세요.
                  </div>
                )}
                {aiGet("dg_proposal_revised").error&&<AIBox loading={false} result={null} error={true} color={C.teal}/>}
              </div>
            )}
          </Panel>

          <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}>
            <Btn v="ghost" onClick={()=>upd({step:1})}>← 이전</Btn>
            <Btn v="teal" onClick={()=>next(3)}>{BTN_DG3_NEXT}</Btn>
          </div>
        </>;
      })()}

      {/* DG4 제안서 최종 확인 & 전달 */}
      {active.step===3&&<>
        <InfoBanner phase="Diagnosis" step="STEP 4" color={C.teal} bg={C.tealBg}>
          STEP 2~3을 거쳐 완성된 제안서를 최종 확인하고 고객에게 전달하세요.
        </InfoBanner>
        <Panel title="최종 제안서 확인 & 편집" icon="📝">
          {active.proposalDraft
            ?<>
              <div style={{fontSize:12,color:C.teal,marginBottom:8}}>
                {aiGet("dg_proposal_revised").result==="완료"
                  ?"✦ 권고 사항이 반영된 개선 버전입니다."
                  :"✦ STEP 2에서 생성된 제안서 초안입니다."}
              </div>
              <TA value={active.proposalDraft} onChange={v=>upd({proposalDraft:v})} rows={20}/>
              <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
                <Btn onClick={()=>copyT(active.proposalDraft,"proposal_final")}>{copied==="proposal_final"?"✓ 복사됨":"📋 전체 복사"}</Btn>
                <Btn v="ghost" onClick={()=>upd({step:1})}>← STEP 2에서 재생성</Btn>
                <Btn v="ghost" onClick={()=>upd({step:2})}>← STEP 3에서 권고 반영</Btn>
              </div>
            </>
            :<div style={{padding:"2rem",textAlign:"center",color:"var(--color-text-secondary)",fontSize:13}}>
              <div style={{fontSize:24,marginBottom:8}}>📋</div>
              <div style={{marginBottom:12}}>제안서 초안이 없습니다.</div>
              <Btn v="teal" onClick={()=>upd({step:1})}>← STEP 2로 돌아가기</Btn>
            </div>
          }
        </Panel>
        <Panel title="제안서 완료 체크리스트" icon="✅">
          {CL_DG4.map(([t,s],i)=>(
            <ChkItem key={i} label={t} sub={s} checked={!!active.propCheck?.[i]} onChange={()=>updN("propCheck",{[i]:!active.propCheck?.[i]})}/>
          ))}
        </Panel>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}>
          <Btn v="ghost" onClick={()=>upd({step:2})}>← 이전</Btn>
          <Btn v="teal" onClick={()=>next(4)}>{BTN_DG4_NEXT}</Btn>
        </div>
      </>}

      {/* DG5 발표 & 컨펌 */}
      {active.step===4&&<>
        <InfoBanner phase="Diagnosis" step="STEP 5" color={C.teal} bg={C.tealBg}>제안서를 발표하고 최종 컨펌을 받습니다.</InfoBanner>
        <Panel title="반론 대응 AI 도우미" icon="💬">
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>{CL_DG5_OBJ.map(q=><Tag key={q} label={q} selected={active.objection===q} color={C.teal} bg={C.tealBg} brd={C.tealLt} onClick={()=>upd({objection:active.objection===q?"":q})}/>)}</div>
          <TA value={active.objection} onChange={v=>upd({objection:v})} placeholder="고객 반론 입력..." rows={2}/>
          <Btn v="teal" onClick={()=>runAI("dg_ob","고객 반론 대응 답변 200자 이내.",`반론:${active.objection}\n솔루션:${chosenSol?.title}`)} disabled={aiGet("dg_ob").loading||!active.objection} style={{marginTop:10}}>{aiGet("dg_ob").loading?"⟳ 생성 중...":"🤖 AI 대응 답변"}</Btn>
          <AIBox loading={aiGet("dg_ob").loading} result={aiGet("dg_ob").result} error={aiGet("dg_ob").error} color={C.teal}/>
        </Panel>
        <Panel title="컨펌 체크리스트" icon="✅">
          {CL_DG5.map((t,i)=><ChkItem key={i} label={t} checked={!!active.presentCheck[i]} onChange={()=>updN("presentCheck",{[i]:!active.presentCheck[i]})}/>)}
        </Panel>
        <Panel title="계약 메모" icon="📋"><TA value={active.contractNote} onChange={v=>upd({contractNote:v})} placeholder="착수금, 일정, 특이사항..." rows={3}/></Panel>
        <div style={{marginTop:14}}><Btn v="teal" onClick={()=>next(5)}>{BTN_DG5_NEXT}</Btn></div>
        <div style={{marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({step:3})}>← 이전</Btn></div>
      </>}
    </>}

    {/* ═══ PHASE 3 BUILD ═══ */}
    {active.phase===2&&<>
      {/* B1 개발 착수 + Agile PM */}
      {active.step===0&&<>
        <InfoBanner phase="Build" step="STEP 1" color={C.purple} bg={C.purpleBg}>Agile 방식으로 프로젝트를 계획하고 착수합니다.</InfoBanner>
        <Panel title="솔루션 착수 요약" icon="🚀" accent={C.purpleBg}>
          {/* 솔루션 미선택 경고 */}
          {!chosenSol?.title&&(
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.warnBg,borderRadius:8,marginBottom:12,fontSize:13,color:C.warn}}>
              <span style={{fontSize:18}}>⚠</span>
              <div>
                <div style={{fontWeight:500,marginBottom:2}}>선택된 솔루션이 없습니다</div>
                <div style={{fontSize:12}}>Diagnosis STEP 2에서 솔루션을 선택하거나, 아래에서 직접 입력하세요.</div>
              </div>
            </div>
          )}
          {/* 읽기 전용 — Diagnosis에서 넘어온 값 */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[["고객",active.name],["솔루션",chosenSol?.title]].map(([l,v])=>(
              <div key={l} style={{background:"var(--color-background-primary)",borderRadius:8,padding:"8px 12px"}}>
                <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:2}}>{l}</div>
                <div style={{fontSize:13,fontWeight:500,color:v?"var(--color-text-primary)":C.warn}}>{v||"미입력"}</div>
              </div>
            ))}
          </div>
          {/* 직접 편집 가능 항목 */}
          <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:8,fontWeight:500}}>
            도구 · 기간 · 비용 — 직접 확인 후 수정하세요
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[
              ["🔧 사용 도구","buildTool",chosenSol?.tool||"","예: Make.com, Claude API"],
              ["⏱ 예상 기간","buildEffort",chosenSol?.effort||"","예: 보통(1~2주)"],
              ["💰 예상 비용","buildCost",chosenSol?.cost||"","예: 10~50만원"],
            ].map(([label,key,defaultVal,ph])=>(
              <div key={key}>
                <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:4}}>{label}</div>
                <Inp
                  value={active[key]!==undefined && active[key]!==null ? active[key] : defaultVal}
                  onChange={v=>upd({[key]:v})}
                  placeholder={ph}
                  style={{fontSize:12,background:"var(--color-background-primary)",
                    border:`0.5px solid ${(!active[key]&&!defaultVal)?C.warn:"var(--color-border-secondary)"}`,
                  }}
                />
              </div>
            ))}
          </div>
          {/* Pain Point 요약 */}
          {validPPs.length>0&&(
            <div style={{marginTop:12,padding:"8px 12px",background:"var(--color-background-primary)",borderRadius:8}}>
              <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:4}}>해결할 Pain Point</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {validPPs.map((p,i)=><Chip key={i} label={`#${i+1} ${p.title}`} color={C.purple} bg={C.purpleBg}/>)}
              </div>
            </div>
          )}
          {/* Diagnosis로 돌아가기 링크 */}
          <div style={{marginTop:10,fontSize:12,color:C.teal}}>
            <button onClick={()=>upd({phase:1,step:1,status:"diagnosis"})}
              style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:C.teal,fontFamily:"inherit",textDecoration:"underline",padding:0}}>
              ← Diagnosis STEP 2에서 솔루션 수정하기
            </button>
          </div>
        </Panel>
        <PMPanel cl={active} upd={upd}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({phase:1,step:4,status:"diagnosis"})}>{BTN_B1_BACK}</Btn><Btn v="purple" onClick={()=>next(1)}>{BTN_B1_NEXT}</Btn></div>
      </>}

      {/* B2 MVP 구현 */}
      {active.step===1&&<>
        <InfoBanner phase="Build" step="STEP 2" color={C.purple} bg={C.purpleBg}>MVP를 구현하고 프로젝트를 관리합니다.</InfoBanner>
        <PMPanel cl={active} upd={upd}/>
        <Panel title="개발 메모 & 이슈" icon="📝"><TA value={active.testNotes||""} onChange={v=>upd({testNotes:v})} placeholder="개발 메모, 이슈..." rows={4}/></Panel>
        <Panel title="AI 개발 조언" icon="🤖">
          <Btn v="purple" onClick={()=>{
            const sprintPlan=(active.pm?.sprints||[]).length
              ?(active.pm.sprints.map(s=>`${s.name}: ${(s.tasks||[]).map(t=>t.title).join(", ")}`).join("\n"))
              :"스프린트 정보 없음";
            const sys=`아래는 고객사에 확정된 AI 솔루션 제안 내용이다.\n이 제안서 내용은 절대 그대로 출력하지 마라.\n\n이 솔루션을 실제로 MVP 구현할 때 필요한 개발 조언을 아래 4가지 항목으로 작성하라.\n\n출력 형식 (아래 4개 항목을 반드시 포함):\n\n1. 모듈별 구현 순서 및 기술적 주의사항\n각 모듈/기능을 구현할 때 개발자가 알아야 할 순서, 의존관계, 기술적 제약사항을 구체적으로 작성.\n(예: API 사전 신청 필요 여부, 할당량 제한, 데이터 포맷 파싱 방법 등)\n\n2. 예상 기술 리스크 및 대응 방법\n구현 중 발생할 수 있는 기술적 문제와 각각의 대응 방법을 작성.\n(예: POS 기기 모델별 데이터 추출 방식 차이, 외부 API 변경 가능성 등)\n\n3. MVP 범위 정의\n전체 기능 중 MVP 단계에서 반드시 구현해야 할 핵심 기능과 이후 단계로 미룰 기능을 구분.\nMVP 판단 기준: 고객이 실제 업무에 바로 사용 가능한 최소 기능 세트.\n\n4. 도구·API별 사전 준비사항\n사용할 도구와 API 각각에 대해 개발 시작 전 준비해야 할 항목 목록.\n(예: 계정 생성, 비즈니스 채널 신청, 테스트 데이터 준비, 권한 설정 등)\n\n조언은 이 고객사의 솔루션에 맞게 구체적으로 작성하라. 일반론은 최소화할 것.`;
            const usr=`[확정 솔루션 제안서]\n${active.proposalDraft||"제안서 정보 없음"}\n\n[사용 도구 및 기술]\n${effectiveTool||"도구 정보 없음"}\n\n[프로젝트 전체 기간]\n${effectiveEffort||"기간 정보 없음"}\n\n[스프린트 구성]\n${sprintPlan}`;
            aiSet("b_rv",{loading:true,result:null,error:false});
            claude(sys,usr,4000).then(r=>aiSet("b_rv",{loading:false,result:r,error:false})).catch(()=>aiSet("b_rv",{loading:false,result:null,error:true}));
          }} disabled={aiGet("b_rv").loading}>{aiGet("b_rv").loading?"⟳ 분석 중...":"🤖 AI 개발 조언"}</Btn>
          <AIBox loading={aiGet("b_rv").loading} result={aiGet("b_rv").result} error={aiGet("b_rv").error} color={C.purple}/>
        </Panel>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({step:0})}>← 이전</Btn><Btn v="purple" onClick={()=>next(2)}>{BTN_B2_NEXT}</Btn></div>
      </>}

      {/* B3 파일럿 테스트 */}
      {active.step===2&&<>
        <InfoBanner phase="Build" step="STEP 3" color={C.purple} bg={C.purpleBg}>고객과 함께 2주 파일럿을 진행합니다.</InfoBanner>
        <Panel title="파일럿 체크리스트" icon="🧪">
          {CL_B3.map((t,i)=><ChkItem key={i} label={t} checked={!!active.buildCheck[`p${i}`]} onChange={()=>updN("buildCheck",{[`p${i}`]:!active.buildCheck[`p${i}`]})}/>)}
        </Panel>
        <Panel title="피드백 기록" icon="📋"><TA value={active.testNotes||""} onChange={v=>upd({testNotes:v})} placeholder="고객 피드백 내용..." rows={4}/></Panel>

        <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({step:1})}>← 이전</Btn><Btn v="purple" onClick={()=>next(3)}>{BTN_B3_NEXT}</Btn></div>
      </>}

      {/* B4 이관 & 완료 */}
      {active.step===3&&<>
        <InfoBanner phase="Build" step="STEP 4" color={C.purple} bg={C.purpleBg}>최종 이관 — 고객이 혼자 운영할 수 있도록 넘겨주세요.</InfoBanner>
        <Panel title="이관 체크리스트" icon="🎁">
          {CL_B4.map(([t,s],i)=><ChkItem key={i} label={t} sub={s} checked={!!active.handoverCheck[i]} onChange={()=>updN("handoverCheck",{[i]:!active.handoverCheck[i]})}/>)}
        </Panel>
        <Panel title="케이스 스터디 기록" icon="📚">
          <button className="btn-ai" onClick={aiGet("b_cs").loading?undefined:async()=>{aiSet("b_cs",{loading:true,result:null,error:false});try{const r=await claude("AI 컨설팅 케이스 스터디.\n[케이스 스터디]\n업종/규모:\n핵심 문제:\n적용 솔루션:\n사용 도구:\n구현 기간:\n주요 성과:\n고객 피드백:\n핵심 인사이트:",`고객:${active.name} 업종:${active.industry}\nPP:${validPPs.map(p=>p.title).join(",")}\n솔루션:${chosenSol?.title}`);upd({caseStudy:r});aiSet("b_cs",{loading:false,result:"완료",error:false});}catch{aiSet("b_cs",{loading:false,result:null,error:true});}}} disabled={aiGet("b_cs").loading}>{aiGet("b_cs").loading?"⟳ 작성 중...":"✨ AI 케이스 스터디 작성"}</button>
          {active.caseStudy&&<><TA value={active.caseStudy} onChange={v=>upd({caseStudy:v})} rows={10} style={{marginTop:10}}/><Btn onClick={()=>copyT(active.caseStudy,"cs")} style={{marginTop:8}}>{copied==="cs"?"✓ 복사됨":"📋 복사"}</Btn></>}
        </Panel>
        <Panel title="프로젝트 최종 완료" icon="🏆" style={{background:[0,1,2,3,4].every(i=>active.handoverCheck[i])?C.successBg:undefined}}>
          <Btn v="success" onClick={()=>{next(4);upd({status:"complete"});}}>{BTN_B4_COMPLETE}</Btn>
        </Panel>
        <div style={{marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({step:2})}>← 이전</Btn></div>
      </>}
    </>}

    {active.status==="complete"&&<Panel title="🎉 프로젝트 완료!" style={{background:C.successBg,border:`1px solid ${C.success}40`}}>
      <div style={{fontSize:13,lineHeight:1.8,marginBottom:16}}><strong>{active.name}</strong> 고객의 AI 컨설팅 프로젝트가 모두 완료되었습니다.</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Btn v="success" onClick={()=>setView("home")}>← 고객 목록으로</Btn><Btn v="blue" onClick={addClient}>+ 신규 고객 등록</Btn></div>
    </Panel>}
    {sttToast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#1a1a2e",color:"#fff",padding:"10px 20px",borderRadius:20,fontSize:13,zIndex:9999,pointerEvents:"none",whiteSpace:"nowrap"}}>{sttToast}</div>}
    <ChatbotWidget contextKey={`${active.phase}-${active.step+1}`}/>
  </div>;
}
