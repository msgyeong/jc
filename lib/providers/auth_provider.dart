import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/auth/member_model.dart';
import '../services/supabase_service.dart';
import '../utils/error_handler.dart';

// ---------------------------------------------------------------------------
// 로그인 결과 타입 (상태별 리다이렉트/메시지용)
// ---------------------------------------------------------------------------

/// 로그인 성공 → 홈 등으로 이동
class LoginSuccess {
  const LoginSuccess();
}

/// 가입 대기 → 승인 진행중 화면으로 이동
class LoginPendingApproval {
  const LoginPendingApproval();
}

/// 거절됨 → 로그인 화면에 거절 사유 표시
class LoginRejected {
  const LoginRejected(this.reason);
  final String? reason;
}

/// 정지됨 → 로그인 화면에 안내 표시
class LoginSuspended {
  const LoginSuspended();
}

/// 탈퇴됨 → 로그인 화면에 안내 표시
class LoginWithdrawn {
  const LoginWithdrawn();
}

/// 인증 실패 등 → 로그인 화면에 메시지 표시
class LoginFailure {
  const LoginFailure(this.message);
  final String message;
}

/// 유효성 검증 실패 → 필드별 메시지 표시
class LoginValidationError {
  const LoginValidationError({
    this.emailError,
    this.passwordError,
  });
  final String? emailError;
  final String? passwordError;
}

/// 로그인 결과 (성공/대기/거절/정지/탈퇴/실패/유효성 오류)
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

/// 로그인 상태: idle(null), loading, 또는 결과(LoginResult)
typedef AuthLoginState = AsyncValue<LoginResult?>;

class AuthNotifier extends Notifier<AuthLoginState> {
  @override
  AuthLoginState build() => const AsyncValue.data(null);

  /// 로그인 시도 (유효성 검증 → Supabase Auth → 회원 상태 확인)
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
      await SupabaseService.client.auth.signInWithPassword(
        email: email.trim(),
        password: password,
      );

      final user = SupabaseService.currentUser;
      if (user == null) {
        state = const AsyncValue.data(
          LoginFailure('로그인 후 사용자 정보를 불러올 수 없습니다.'),
        );
        return;
      }

      final member = await _fetchMemberByAuthUserId(user.id);
      if (member == null) {
        await SupabaseService.client.auth.signOut();
        state = const AsyncValue.data(
          LoginFailure('회원 정보를 찾을 수 없습니다.'),
        );
        return;
      }

      // 상태별 결과 (상태별 리다이렉트는 화면/라우터에서 처리)
      if (member.withdrawnAt != null) {
        await SupabaseService.client.auth.signOut();
        state = const AsyncValue.data(LoginWithdrawn());
        return;
      }
      if (member.isSuspended) {
        await SupabaseService.client.auth.signOut();
        state = const AsyncValue.data(LoginSuspended());
        return;
      }
      if (!member.isApproved && member.rejectionReason != null &&
          member.rejectionReason!.isNotEmpty) {
        await SupabaseService.client.auth.signOut();
        state = AsyncValue.data(LoginRejected(member.rejectionReason));
        return;
      }
      if (!member.isApproved) {
        await SupabaseService.client.auth.signOut();
        state = const AsyncValue.data(LoginPendingApproval());
        return;
      }

      state = const AsyncValue.data(LoginSuccess());
    } on AuthException catch (e) {
      state = AsyncValue.data(
        LoginFailure(ErrorHandler.handleError(e).message),
      );
    } catch (e) {
      state = AsyncValue.data(
        LoginFailure(ErrorHandler.handleError(e).message),
      );
    }
  }

  /// auth_user_id로 members 한 건 조회
  Future<MemberModel?> _fetchMemberByAuthUserId(String authUserId) async {
    final res = await SupabaseService.client
        .from('members')
        .select()
        .eq('auth_user_id', authUserId)
        .maybeSingle();

    if (res == null) return null;
    return MemberModel.fromJson(Map<String, dynamic>.from(res));
  }

  /// 결과 초기화 (재시도 전 등)
  void clearResult() {
    state = const AsyncValue.data(null);
  }
}

final authNotifierProvider =
    NotifierProvider<AuthNotifier, AuthLoginState>(AuthNotifier.new);
