-- 기존 정책이 있으면 삭제 후 재생성 (재실행 시 충돌 방지)
DROP POLICY IF EXISTS "프로필 사진 조회 - 로그인 사용자" ON storage.objects;
DROP POLICY IF EXISTS "프로필 사진 업로드 - 본인 폴더만" ON storage.objects;
DROP POLICY IF EXISTS "프로필 사진 수정 - 본인 파일만" ON storage.objects;
DROP POLICY IF EXISTS "프로필 사진 삭제 - 본인 파일만" ON storage.objects;

-- 1. SELECT: 로그인한 사용자는 profiles 버킷 내 모든 파일 조회 가능
CREATE POLICY "프로필 사진 조회 - 로그인 사용자"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'profiles'
    AND auth.role() = 'authenticated'
  );

-- 2. INSERT: 본인 폴더에만 업로드 가능 (경로 첫 번째 폴더가 auth.uid())
CREATE POLICY "프로필 사진 업로드 - 본인 폴더만"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profiles'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. UPDATE: 본인 폴더 내 파일만 수정 가능
CREATE POLICY "프로필 사진 수정 - 본인 파일만"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profiles'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. DELETE: 본인 폴더 내 파일만 삭제 가능
CREATE POLICY "프로필 사진 삭제 - 본인 파일만"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profiles'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );