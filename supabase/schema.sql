-- AI 컨설팅 시스템 Supabase 스키마
-- 사용법: Supabase 대시보드 → SQL Editor에 전체 내용 붙여넣기 → Run

-- 기존 테이블 있으면 삭제 후 재생성
DROP TABLE IF EXISTS public.clients;

-- clients 테이블 생성
CREATE TABLE public.clients (
  id          bigint PRIMARY KEY,                                     -- 클라이언트 ID (Date.now() 타임스탬프)
  name        text,                                                   -- 고객 상호명
  industry    text,                                                   -- 업종
  size        text,                                                   -- 사업 규모
  region      text,                                                   -- 지역
  ai_level    text,                                                   -- AI 친숙도
  status      text        DEFAULT 'discovery',                        -- 현재 단계 (discovery/diagnosis/build)
  phase       integer     DEFAULT 0,                                  -- 페이즈 번호 (0=Discovery, 1=Diagnosis, 2=Build)
  step        integer     DEFAULT 0,                                  -- 스텝 번호 (0-based)
  phases_done boolean[]   DEFAULT ARRAY[false, false, false],        -- 각 페이즈 완료 여부 [P0, P1, P2]
  data        jsonb       DEFAULT '{}'::jsonb,                       -- 전체 클라이언트 데이터 (JSONB)
  created_at  timestamptz DEFAULT now(),                              -- 생성 시각
  updated_at  timestamptz DEFAULT now()                               -- 마지막 수정 시각 (트리거로 자동 갱신)
);

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 등록
CREATE TRIGGER clients_set_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS clients_status_idx     ON public.clients(status);
CREATE INDEX IF NOT EXISTS clients_created_at_idx ON public.clients(created_at DESC);

-- RLS(Row Level Security) 비활성화 (인증 없이 사용)
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;

-- 완료 메시지
DO $$ BEGIN
  RAISE NOTICE 'AI 컨설팅 시스템 스키마 적용 완료. clients 테이블이 생성되었습니다.';
END $$;
