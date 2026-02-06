# Cursor 지시문: Storage 설계 및 회원가입 플로우 리팩토링

> **실행 조건**: 사용자가 "지시" 명령을 내리면 아래 작업을 순차적으로 수행한다.

---

## 1. 작업 개요

### 목적
- Storage RLS 정책과 호환되도록 회원가입 플로우 순서 변경
- 프로필 사진 경로를 `profiles/{auth.uid()}/avatar.jpg` 형태로 변경
- 버킷 이름을 `profiles`로 통일

### 변경 전 (현재)
1. 프로필 사진 업로드 (Auth 없음)
2. Auth 계정 생성 (`signUp`)
3. members INSERT

### 변경 후 (목표)
1. **Auth 계정 생성** (`signUp`) → 사용자 ID 획득
2. **프로필 사진 업로드** → `profiles/{userId}/avatar.jpg`
3. **members INSERT** → 회원 정보 저장

---

## 2. 수정 대상 파일

### 2-1. `lib/providers/signup_provider.dart`

#### 수정 내용
`submit()` 메서드의 순서를 다음과 같이 변경:

```dart
Future<void> submit() async {
  // ... 유효성 검증 생략 ...

  state = const AsyncValue.loading();

  try {
    // 1. Supabase Auth 사용자 생성 (먼저!)
    final authResponse = await SupabaseService.client.auth.signUp(
      email: _data.email!.trim(),
      password: _data.password!,
    );

    if (authResponse.user == null) {
      state = const AsyncValue.data(SignupFailure('회원가입에 실패했습니다.'));
      return;
    }

    final userId = authResponse.user!.id;

    // 2. 프로필 사진 업로드 (이제 userId가 있음)
    String? profilePhotoUrl;
    if (_data.profilePhoto != null) {
      final path = '$userId/avatar.jpg';  // 경로: {userId}/avatar.jpg
      profilePhotoUrl = await ImageUploader.uploadToStorage(
        file: _data.profilePhoto!,
        bucket: 'profiles',
        path: path,
      );
    }

    // 3. members 테이블 저장
    final memberData = {
      'auth_user_id': userId,
      'email': _data.email!.trim(),
      // ... 나머지 필드 ...
      'profile_photo_url': profilePhotoUrl,
      'is_approved': false,
    };

    final memberResponse = await SupabaseService.client
        .from('members')
        .insert(memberData)
        .select()
        .single();

    // 4. educations, careers, families 저장
    // ... 기존 코드 유지 ...

    state = const AsyncValue.data(SignupSuccess());
  } catch (e) {
    // 실패 시 처리 (필요하면 Auth 사용자 삭제 등 롤백)
    state = AsyncValue.data(SignupFailure(ErrorHandler.getMessage(e)));
  }
}
```

#### 주요 변경점
1. `signUp()`을 프로필 사진 업로드보다 **먼저** 호출
2. 업로드 경로를 `$userId/avatar.jpg`로 변경 (기존: `profile_${timestamp}.jpg`)
3. 버킷 이름 확인: `'profiles'`

---

### 2-2. `lib/utils/image_uploader.dart`

#### 수정 내용

1. **MIME 타입 동적 처리** (선택)

```dart
static Future<String> uploadToStorage({
  required File file,
  required String bucket,
  required String path,
  Function(double)? onProgress,
}) async {
  try {
    final fileSize = await file.length();
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (fileSize > maxSize) {
      throw Exception('파일 크기는 500MB를 초과할 수 없습니다.');
    }

    // MIME 타입 결정
    String contentType = 'image/jpeg';
    final extension = path.split('.').last.toLowerCase();
    if (extension == 'png') {
      contentType = 'image/png';
    } else if (extension == 'webp') {
      contentType = 'image/webp';
    }

    await _supabase.storage.from(bucket).uploadBinary(
          path,
          await file.readAsBytes(),
          fileOptions: FileOptions(
            upsert: true,
            contentType: contentType,
          ),
        );

    if (onProgress != null) {
      onProgress(1.0);
    }

    final publicUrl = _supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  } catch (e) {
    throw Exception('이미지 업로드 중 오류가 발생했습니다: $e');
  }
}
```

---

## 3. 실행 체크리스트

실행 시 아래 순서로 진행:

- [ ] `lib/providers/signup_provider.dart` 수정
  - [ ] `submit()` 메서드 순서 변경 (signUp → upload → insert)
  - [ ] 업로드 경로 변경 (`$userId/avatar.jpg`)
  - [ ] 버킷 이름 확인 (`profiles`)
- [ ] `lib/utils/image_uploader.dart` 수정
  - [ ] MIME 타입 동적 처리 (선택)
- [ ] 태스크 문서 업데이트
  - [ ] `Docs/tasks/01-project-setup-and-auth.md`에서 해당 항목 체크

---

## 4. 테스트 항목

리팩토링 후 확인 필요:

1. 회원가입 전체 플로우 정상 동작
2. 프로필 사진 업로드 성공 (Storage에 `profiles/{userId}/avatar.jpg` 경로로 저장)
3. 다른 회원 프로필 사진 조회 가능 (로그인 상태에서)
4. 비로그인 상태에서 프로필 사진 URL 접근 가능 (Public 버킷이므로)

---

## 5. 롤백 고려사항

회원가입 중 오류 발생 시:

- **Auth 생성 성공 + 업로드 실패**: 재시도 안내 또는 Auth 사용자 삭제
- **Auth + 업로드 성공 + members INSERT 실패**: 업로드된 파일 삭제 + Auth 사용자 삭제

현재 코드는 롤백을 하지 않으므로, 필요시 롤백 로직 추가 검토.

---

## 6. 관련 문서

- `Docs/schema/README.md` - Storage 설계
- `Docs/schema/schema.sql` - RLS 정책
- `Docs/prd/05-data-policy.md` - Storage 정책
- `Docs/tasks/01-project-setup-and-auth.md` - 태스크
