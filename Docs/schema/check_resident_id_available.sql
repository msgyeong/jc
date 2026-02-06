-- ============================================
-- RPC: 회원가입 시 주민등록번호 중복 확인 (anon 호출 가능)
-- ============================================
-- 사용: Supabase SQL Editor에서 새 쿼리로 붙여넣은 뒤 Run
-- ============================================

CREATE OR REPLACE FUNCTION public.check_resident_id_available(p_resident_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN length(regexp_replace(trim(p_resident_id), '[^0-9]', '', 'g')) <> 13
    THEN true
    ELSE NOT EXISTS (
      SELECT 1 FROM public.members
      WHERE regexp_replace(resident_id, '[^0-9]', '', 'g') =
            regexp_replace(trim(p_resident_id), '[^0-9]', '', 'g')
    )
  END;
$$;

COMMENT ON FUNCTION public.check_resident_id_available(text) IS
  '회원가입 화면 주민번호 중복 확인. true=사용 가능, false=이미 등록된 번호.';

GRANT EXECUTE ON FUNCTION public.check_resident_id_available(text) TO anon;
