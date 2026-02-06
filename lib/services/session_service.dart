import 'dart:developer' as developer;

import 'supabase_service.dart';

/// 세션 관리 서비스
/// - Supabase 세션 갱신(토큰 만료 전/만료 시 refresh)
/// - 장기 미사용 시 자동 로그아웃
/// - 세션 만료/무효 시 signOut → 로그인 화면 리다이렉트(GoRouter 인증 가드)
class SessionService {
  SessionService._();

  /// 장기 미사용으로 간주하는 시간 (앱이 백그라운드에 있던 시간)
  static const Duration inactivityTimeout = Duration(minutes: 30);

  static DateTime? _lastBackgroundAt;

  /// 앱이 백그라운드로 갈 때 호출 (마지막 활동 시각 저장)
  static void onAppBackground() {
    _lastBackgroundAt = DateTime.now();
  }

  /// 앱이 포그라운드로 돌아올 때 호출
  /// - 세션 갱신 필요 시 refreshSession
  /// - 장기 미사용 시 signOut
  static Future<void> onAppResumed() async {
    await refreshSessionIfNeeded();

    if (_lastBackgroundAt != null &&
        DateTime.now().difference(_lastBackgroundAt!) > inactivityTimeout) {
      developer.log(
        'SessionService: 장기 미사용으로 로그아웃 (${inactivityTimeout.inMinutes}분 초과)',
      );
      await signOutOnSessionInvalid();
      _lastBackgroundAt = null;
    }
  }

  /// 토큰 만료 처리: 세션이 있으나 만료(또는 곧 만료) 시 갱신 시도,
  /// 실패 시 로그아웃하여 로그인 화면으로 리다이렉트됩니다.
  static Future<void> refreshSessionIfNeeded() async {
    final session = SupabaseService.client.auth.currentSession;
    if (session == null) return;

    if (session.isExpired) {
      try {
        await SupabaseService.client.auth.refreshSession();
      } catch (e) {
        developer.log('SessionService: 세션 갱신 실패, 로그아웃', error: e);
        await signOutOnSessionInvalid();
      }
    }
  }

  /// 세션 무효(만료·갱신 실패 등) 시 로그아웃
  /// onAuthStateChange가 발생하여 인증 상태가 갱신되고,
  /// GoRouter 리다이렉트로 로그인 화면으로 이동합니다.
  static Future<void> signOutOnSessionInvalid() async {
    await SupabaseService.client.auth.signOut();
  }
}
