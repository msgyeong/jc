import 'dart:developer' as developer;
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/api_client.dart';
import '../utils/error_handler.dart';

// ---------------------------------------------------------------------------
// 회원가입 결과 타입
// ---------------------------------------------------------------------------

class SignupSuccess {
  const SignupSuccess({this.emailConfirmationRequired = false});
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
  String? addressDetail;
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
  String graduationDate;
  String schoolName;

  EducationData({
    required this.graduationDate,
    required this.schoolName,
  });
}

class CareerData {
  String careerDate;
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

  Map<String, String> validateStep1Data() => validateStep1(_data);
  Map<String, String> validateStep2Data() => validateStep2(_data);
  Map<String, String> validateStep5Data() => validateStep5(_data);

  Future<void> uploadProfilePhoto(File photo) async {
    _data.profilePhoto = photo;
  }

  /// 회원가입 제출
  Future<void> submit() async {
    if (state.isLoading) return;

    final errors = _validateSignupData(_data);
    if (errors.isNotEmpty) {
      state = AsyncValue.data(SignupValidationError(errors));
      return;
    }

    state = const AsyncValue.loading();

    try {
      // 프로필 사진 업로드
      String? profileImageUrl;
      if (_data.profilePhoto != null) {
        final uploadRes = await ApiClient.uploadFile(
          '/api/upload',
          file: _data.profilePhoto!,
        );
        if (uploadRes.success) {
          profileImageUrl = uploadRes.data['url'] as String?;
        }
      }

      // 주소 결합
      final fullAddress = _data.addressDetail != null &&
              _data.addressDetail!.isNotEmpty
          ? '${_data.address} ${_data.addressDetail}'
          : _data.address!;

      // 학력/경력 정보를 문자열로 변환 (API가 문자열 형태로 받음)
      final educationStr = _data.educations
          .map((e) => '${e.graduationDate} ${e.schoolName}')
          .join('\n');
      final careerStr = _data.careers
          .map((c) => '${c.careerDate} ${c.careerDescription}')
          .join('\n');

      // 가족 정보를 문자열로 변환
      final familyParts = <String>[];
      if (_data.isMarried == true) {
        familyParts.add('기혼');
        if (_data.spouseName != null) familyParts.add('배우자: ${_data.spouseName}');
        if (_data.spouseContact != null) familyParts.add('배우자 연락처: ${_data.spouseContact}');
      } else {
        familyParts.add('미혼');
      }
      if (_data.hasChildren == true) {
        familyParts.add('자녀 있음');
      }
      final familyStr = familyParts.join('\n');

      // 회원가입 API 호출
      final res = await ApiClient.post('/api/auth/signup', body: {
        'email': _data.email!.trim(),
        'password': _data.password!,
        'name': _data.name!.trim(),
        'phone': _data.phone,
        'address': fullAddress,
        'ssn': _data.residentId,
        'profile_image': profileImageUrl,
        'hobbies': _data.hobby,
        'education': educationStr.isNotEmpty ? educationStr : null,
        'career': careerStr.isNotEmpty ? careerStr : null,
        'family': familyStr.isNotEmpty ? familyStr : null,
        'company': _data.companyName,
        'position': _data.companyPosition,
        'work_address': _data.companyAddress,
        'special_notes': _data.specialty,
      });

      if (!res.success) {
        state = AsyncValue.data(
          SignupFailure(res.message ?? '회원가입에 실패했습니다.'),
        );
        return;
      }

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

/// 이메일 사용 가능 여부 확인
final emailAvailabilityProvider =
    FutureProvider.family<bool?, String>((ref, emailToCheck) async {
  final trimmed = emailToCheck.trim();
  if (trimmed.isEmpty || !_emailRegex.hasMatch(trimmed)) return null;
  try {
    final res = await ApiClient.post('/api/auth/check-email', body: {
      'email': trimmed,
    });
    if (res.statusCode == 400) return false; // 이미 사용 중
    return true;
  } catch (_) {
    return null;
  }
});

/// 주민등록번호 중복 확인
final residentIdAvailabilityProvider =
    FutureProvider.family<bool?, String>((ref, residentIdToCheck) async {
  final digits = residentIdToCheck.replaceAll(RegExp(r'[^0-9]'), '');
  if (digits.length != 13) return null;
  // Railway API에 별도 엔드포인트가 없으므로 회원가입 시 서버에서 검증
  return null;
});

/// 휴대폰 번호 중복 확인
final phoneAvailabilityProvider =
    FutureProvider.family<bool?, String>((ref, phoneToCheck) async {
  final digits = phoneToCheck.replaceAll(RegExp(r'[^0-9]'), '');
  if (digits.length < 10) return null;
  // Railway API에 별도 엔드포인트가 없으므로 회원가입 시 서버에서 검증
  return null;
});

final signupNotifierProvider =
    NotifierProvider<SignupNotifier, SignupState>(SignupNotifier.new);
