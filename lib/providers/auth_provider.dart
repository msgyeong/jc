import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/api_client.dart';
import '../services/session_service.dart';
import '../utils/error_handler.dart';

// ---------------------------------------------------------------------------
// 로그인 결과 타입 (상태별 리다이렉트/메시지용)
// ---------------------------------------------------------------------------

class LoginSuccess {
  const LoginSuccess();
}

class LoginPendingApproval {
  const LoginPendingApproval();
}

class LoginRejected {
  const LoginRejected(this.reason);
  final String? reason;
}

class LoginSuspended {
  const LoginSuspended();
}

class LoginWithdrawn {
  const LoginWithdrawn();
}

class LoginFailure {
  const LoginFailure(this.message);
  final String message;
}

class LoginValidationError {
  const LoginValidationError({
    this.emailError,
    this.passwordError,
  });
  final String? emailError;
  final String? passwordError;
}

typedef LoginResult = Object;

// ---------------------------------------------------------------------------
// 유효성 검증
// ---------------------------------------------------------------------------

final _emailRegex = RegExp(
  r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
);

(bool ok, LoginValidationError? error) _validateLogin(
  String email,
  String password,
) {
  final trimmedEmail = email.trim();
  String? emailError;
  String? passwordError;

  if (trimmedEmail.isEmpty) {
    emailError = '이메일을 입력해주세요.';
  } else if (!_emailRegex.hasMatch(trimmedEmail)) {
    emailError = '올바른 이메일 형식이 아닙니다.';
  }

  if (password.isEmpty) {
    passwordError = '비밀번호를 입력해주세요.';
  } else if (password.length < 8) {
    passwordError = '비밀번호는 8자 이상 입력해주세요.';
  }

  if (emailError != null || passwordError != null) {
    return (false, LoginValidationError(
      emailError: emailError,
      passwordError: passwordError,
    ));
  }
  return (true, null);
}

// ---------------------------------------------------------------------------
// Auth Notifier
// ---------------------------------------------------------------------------

typedef AuthLoginState = AsyncValue<LoginResult?>;

class AuthNotifier extends Notifier<AuthLoginState> {
  @override
  AuthLoginState build() => const AsyncValue.data(null);

  /// 로그인 시도 (유효성 검증 -> Railway API 호출)
  Future<void> login(
    String email,
    String password,
    bool rememberMe,
  ) async {
    final (valid, validationError) = _validateLogin(email, password);
    if (!valid && validationError != null) {
      state = AsyncValue.data(validationError);
      return;
    }

    state = const AsyncValue.loading();

    try {
      final res = await ApiClient.post('/api/auth/login', body: {
        'email': email.trim(),
        'password': password,
      });

      if (!res.success) {
        final status = res.data['status'] as String?;

        if (status == 'pending') {
          state = const AsyncValue.data(LoginPendingApproval());
          return;
        }
        if (status == 'suspended') {
          state = const AsyncValue.data(LoginSuspended());
          return;
        }

        state = AsyncValue.data(
          LoginFailure(res.message ?? '로그인에 실패했습니다.'),
        );
        return;
      }

      // 로그인 성공 - 토큰 및 사용자 정보 저장
      final token = res.data['token'] as String;
      final user = res.data['user'] as Map<String, dynamic>;

      await SessionService.saveSession(
        token: token,
        userId: user['id'] as int,
        email: user['email'] as String,
        name: user['name'] as String,
        role: user['role'] as String,
        status: user['status'] as String,
        profileImage: user['profile_image'] as String?,
      );

      state = const AsyncValue.data(LoginSuccess());
    } catch (e) {
      state = AsyncValue.data(
        LoginFailure(ErrorHandler.handleError(e).message),
      );
    }
  }

  void clearResult() {
    state = const AsyncValue.data(null);
  }
}

final authNotifierProvider =
    NotifierProvider<AuthNotifier, AuthLoginState>(AuthNotifier.new);
