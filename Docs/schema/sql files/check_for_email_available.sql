-- ============================================
-- RPC: 회원가입 시 이메일 사용 가능 여부 (anon 호출 가능)
-- members + auth.users 둘 다 조회 (Auth에만 있어도 "이미 사용 중"으로 표시)
-- ============================================
-- 사용: Supabase SQL Editor에서 새 쿼리로 붙여넣은 뒤 Run
-- ============================================

CREATE OR REPLACE FUNCTION public.check_email_available(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.members
    WHERE lower(trim(email)) = lower(trim(p_email))
  )
  AND NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = lower(trim(p_email))
  );
$$;

COMMENT ON FUNCTION public.check_email_available(text) IS
  '회원가입 화면에서 이메일 중복 확인용. members 및 auth.users 모두 확인. true=사용 가능, false=이미 사용 중.';

-- 회원가입 화면(비인증)에서 이메일 중복 확인 호출을 위해 anon 실행 허용
GRANT EXECUTE ON FUNCTION public.check_email_available(text) TO anon;
