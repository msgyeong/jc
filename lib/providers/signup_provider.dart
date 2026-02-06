import 'dart:developer' as developer;
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/supabase_service.dart';
import '../utils/error_handler.dart';
import '../utils/image_uploader.dart';

// ---------------------------------------------------------------------------
// 회원가입 결과 타입
// ---------------------------------------------------------------------------

class SignupSuccess {
  const SignupSuccess({this.emailConfirmationRequired = false});
  /// 이메일 인증이 필요한 경우 true (세션 없이 사용자만 생성된 상태)
  final bool emailConfirmationRequired;
}

class SignupFailure {
  const SignupFailure(this.message);
  final String message;
}

class SignupValidationError {
  const SignupValidationError(this.errors);
  final Map<String, String> errors;
}

typedef SignupResult = Object;

// ---------------------------------------------------------------------------
// 회원가입 데이터
// ---------------------------------------------------------------------------

class SignupData {
  // Step 1: 로그인 정보
  String? email;
  String? password;
  String? passwordConfirm;

  // Step 2: 기본 정보
  File? profilePhoto;
  String? profilePhotoUrl;
  String? name;
  String? residentId;
  String? address;
  String? addressDetail; // 상세 주소 (선택)
  String? phone;

  // Step 3: 직장 정보 (선택)
  String? companyName;
  String? companyPosition;
  String? companyAddress;
  String? jobType;

  // Step 4: 학력/경력 정보
  List<EducationData> educations = [];
  List<CareerData> careers = [];

  // Step 5: 가족 정보
  bool? isMarried;
  String? spouseName;
  String? spouseContact;
  String? spouseBirthdate;
  bool? hasChildren;

  // Step 6: 기타 정보
  String? hobby;
  String? specialty;
  String? recommender;
}

class EducationData {
  String graduationDate; // 6자리
  String schoolName;

  EducationData({
    required this.graduationDate,
    required this.schoolName,
  });
}

class CareerData {
  String careerDate; // 6자리
  String careerDescription;

  CareerData({
    required this.careerDate,
    required this.careerDescription,
  });
}

// ---------------------------------------------------------------------------
// 유효성 검증
// ---------------------------------------------------------------------------

final _emailRegex = RegExp(
  r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
);

/// 필드 키를 한글 이름으로 변환
String getFieldDisplayName(String key) {
  const fieldNames = {
    'email': '이메일',
    'password': '비밀번호',
    'passwordConfirm': '비밀번호 확인',
    'profilePhoto': '프로필 사진',
    'name': '성명',
    'residentId': '주민등록번호',
    'address': '주소',
    'phone': '휴대폰',
    'isMarried': '혼인 유무',
    'spouseName': '배우자명',
    'hasChildren': '자녀 유무',
  };
  return fieldNames[key] ?? key;
}

/// Step 1 (로그인 정보) 검증
Map<String, String> validateStep1(SignupData data) {
  final errors = <String, String>{};

  if (data.email == null || data.email!.trim().isEmpty) {
    errors['email'] = '이메일을 입력해주세요.';
  } else if (!_emailRegex.hasMatch(data.email!.trim())) {
    errors['email'] = '올바른 이메일 형식이 아닙니다.';
  }

  if (data.password == null || data.password!.isEmpty) {
    errors['password'] = '비밀번호를 입력해주세요.';
  } else if (data.password!.length < 8) {
    errors['password'] = '비밀번호는 8자 이상 입력해주세요.';
  }

  if (data.passwordConfirm == null || data.passwordConfirm!.isEmpty) {
    errors['passwordConfirm'] = '비밀번호 확인을 입력해주세요.';
  } else if (data.password != data.passwordConfirm) {
    errors['passwordConfirm'] = '비밀번호가 일치하지 않습니다.';
  }

  return errors;
}

/// Step 2 (기본 정보) 검증
Map<String, String> validateStep2(SignupData data) {
  final errors = <String, String>{};

  if (data.profilePhoto == null && data.profilePhotoUrl == null) {
    errors['profilePhoto'] = '프로필 사진을 선택해주세요.';
  }

  if (data.name == null || data.name!.trim().isEmpty) {
    errors['name'] = '성명을 입력해주세요.';
  }

  if (data.residentId == null || data.residentId!.isEmpty) {
    errors['residentId'] = '주민등록번호를 입력해주세요.';
  } else {
    final digits = data.residentId!.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length != 13) {
      errors['residentId'] = '주민등록번호 13자리를 입력해주세요.';
    }
  }

  if (data.address == null || data.address!.trim().isEmpty) {
    errors['address'] = '주소를 입력해주세요.';
  }

  if (data.phone == null || data.phone!.isEmpty) {
    errors['phone'] = '휴대폰 번호를 입력해주세요.';
  } else {
    final digits = data.phone!.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length != 11) {
      errors['phone'] = '휴대폰 번호 11자리를 입력해주세요.';
    }
  }

  return errors;
}

/// Step 5 (가족 정보) 검증
Map<String, String> validateStep5(SignupData data) {
  final errors = <String, String>{};

  if (data.isMarried == null) {
    errors['isMarried'] = '혼인 유무를 선택해주세요.';
  } else if (data.isMarried == true) {
    if (data.spouseName == null || data.spouseName!.trim().isEmpty) {
      errors['spouseName'] = '배우자명을 입력해주세요.';
    }
  }

  if (data.hasChildren == null) {
    errors['hasChildren'] = '자녀 유무를 선택해주세요.';
  }

  return errors;
}

/// 전체 데이터 검증 (최종 제출 시)
Map<String, String> _validateSignupData(SignupData data) {
  final errors = <String, String>{};
  errors.addAll(validateStep1(data));
  errors.addAll(validateStep2(data));
  errors.addAll(validateStep5(data));
  return errors;
}

// ---------------------------------------------------------------------------
// Signup Notifier
// ---------------------------------------------------------------------------

typedef SignupState = AsyncValue<SignupResult?>;

class SignupNotifier extends Notifier<SignupState> {
  final SignupData _data = SignupData();

  @override
  SignupState build() => const AsyncValue.data(null);

  SignupData get data => _data;

  /// Step 1 검증 (로그인 정보)
  Map<String, String> validateStep1Data() => validateStep1(_data);

  /// Step 2 검증 (기본 정보)
  Map<String, String> validateStep2Data() => validateStep2(_data);

  /// Step 5 검증 (가족 정보)
  Map<String, String> validateStep5Data() => validateStep5(_data);

  /// 프로필 사진 업로드
  Future<void> uploadProfilePhoto(File photo) async {
    try {
      _data.profilePhoto = photo;
      // Storage 업로드는 최종 제출 시 수행
    } catch (e) {
      // 에러 처리
    }
  }

  /// 회원가입 제출
  Future<void> submit() async {
    // 중복 제출 방지
    if (state.isLoading) return;

    // 유효성 검증
    final errors = _validateSignupData(_data);
    if (errors.isNotEmpty) {
      state = AsyncValue.data(SignupValidationError(errors));
      return;
    }

    state = const AsyncValue.loading();

    try {
      // 1. Supabase Auth 사용자 생성 (먼저 수행 → RLS에서 auth.uid() 필요)
      final authResponse =
          await SupabaseService.client.auth.signUp(
        email: _data.email!.trim(),
        password: _data.password!,
      );

      if (authResponse.user == null) {
        state = const AsyncValue.data(
          SignupFailure('회원가입에 실패했습니다.'),
        );
        return;
      }

      final userId = authResponse.user!.id;
      final hasSession = authResponse.session != null;

      // 세션이 있을 때만 새로고침 (이메일 인증 필요 시 signUp 직후에는 세션 없음)
      if (hasSession) {
        await SupabaseService.client.auth.refreshSession();
      }

      // 이메일 인증이 필요한데 세션이 없으면, 프로필/DB 저장은 RLS로 불가 → 성공만 반환
      if (!hasSession) {
        state = const AsyncValue.data(
          SignupSuccess(emailConfirmationRequired: true),
        );
        return;
      }

      // 2. 프로필 사진 업로드 (경로: profiles/{userId}/avatar.jpg)
      String? profilePhotoUrl;
      if (_data.profilePhoto != null) {
        const path = 'avatar.jpg';
        profilePhotoUrl = await ImageUploader.uploadToStorage(
          file: _data.profilePhoto!,
          bucket: 'profiles',
          path: '$userId/$path',
        );
      }

      // 주소 결합 (기본 주소 + 상세 주소)
      final fullAddress = _data.addressDetail != null &&
              _data.addressDetail!.isNotEmpty
          ? '${_data.address} ${_data.addressDetail}'
          : _data.address!;

      // 3. members 테이블 저장
      final memberData = {
        'auth_user_id': userId,
        'email': _data.email!.trim(),
        'name': _data.name!.trim(),
        'resident_id': _data.residentId,
        'address': fullAddress,
        'phone': _data.phone,
        'profile_photo_url': profilePhotoUrl,
        'company_name': _data.companyName,
        'company_position': _data.companyPosition,
        'company_address': _data.companyAddress,
        'job_type': _data.jobType,
        'hobby': _data.hobby,
        'specialty': _data.specialty,
        'recommender': _data.recommender,
        'is_approved': false,
      };

      final memberResponse = await SupabaseService.client
          .from('members')
          .insert(memberData)
          .select()
          .single();

      final memberId = memberResponse['id'] as String;

      // 4. educations 테이블 저장
      if (_data.educations.isNotEmpty) {
        final educationData = _data.educations
            .map((e) => {
                  'member_id': memberId,
                  'graduation_date': e.graduationDate,
                  'school_name': e.schoolName,
                })
            .toList();
        await SupabaseService.client.from('educations').insert(educationData);
      }

      // 5. careers 테이블 저장
      if (_data.careers.isNotEmpty) {
        final careerData = _data.careers
            .map((c) => {
                  'member_id': memberId,
                  'career_date': c.careerDate,
                  'career_description': c.careerDescription,
                })
            .toList();
        await SupabaseService.client.from('careers').insert(careerData);
      }

      // 6. families 테이블 저장
      final familyData = {
        'member_id': memberId,
        'is_married': _data.isMarried ?? false,
        'spouse_name': _data.spouseName,
        'spouse_contact': _data.spouseContact,
        'spouse_birthdate': _data.spouseBirthdate,
        'has_children': _data.hasChildren ?? false,
      };
      await SupabaseService.client.from('families').insert(familyData);

      // 7. 로그아웃 (승인 대기 상태이므로)
      await SupabaseService.client.auth.signOut();

      state = const AsyncValue.data(SignupSuccess());
    } catch (e, st) {
      developer.log('Signup submit error: $e');
      developer.log('Stack: $st');
      state = AsyncValue.data(
        SignupFailure(ErrorHandler.handleError(e).message),
      );
    }
  }

  void clearResult() {
    state = const AsyncValue.data(null);
  }
}

/// 회원가입 Step1: 이메일 사용 가능 여부 (입력창 아래 멘트용)
/// [emailToCheck]가 비어있거나 형식이 맞지 않으면 null 반환.
final emailAvailabilityProvider =
    FutureProvider.family<bool?, String>((ref, emailToCheck) async {
  final trimmed = emailToCheck.trim();
  if (trimmed.isEmpty || !_emailRegex.hasMatch(trimmed)) return null;
  try {
    final res = await SupabaseService.client.rpc(
      'check_email_available',
      params: {'p_email': trimmed},
    );
    return res as bool;
  } catch (_) {
    return null;
  }
});

/// 회원가입 Step2: 주민등록번호 중복 확인 (13자리 숫자만 전달)
final residentIdAvailabilityProvider =
    FutureProvider.family<bool?, String>((ref, residentIdToCheck) async {
  final digits = residentIdToCheck.replaceAll(RegExp(r'[^0-9]'), '');
  if (digits.length != 13) return null;
  try {
    final res = await SupabaseService.client.rpc(
      'check_resident_id_available',
      params: {'p_resident_id': digits},
    );
    return res as bool;
  } catch (_) {
    return null;
  }
});

/// 회원가입 Step2: 휴대폰 번호 중복 확인
final phoneAvailabilityProvider =
    FutureProvider.family<bool?, String>((ref, phoneToCheck) async {
  final digits = phoneToCheck.replaceAll(RegExp(r'[^0-9]'), '');
  if (digits.length < 10) return null;
  try {
    final res = await SupabaseService.client.rpc(
      'check_phone_available',
      params: {'p_phone': phoneToCheck.trim()},
    );
    return res as bool;
  } catch (_) {
    return null;
  }
});

final signupNotifierProvider =
    NotifierProvider<SignupNotifier, SignupState>(SignupNotifier.new);
