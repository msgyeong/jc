import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../models/auth/member_model.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/pending_approval_screen.dart';
import '../screens/auth/signup_screen.dart';
import '../screens/splash_screen.dart';
import '../screens/profile_tab_screen.dart';
import '../screens/tab_placeholder_screen.dart';
import '../services/session_service.dart';
import '../services/supabase_service.dart';
import '../widgets/main_navigation.dart';

// ---------------------------------------------------------------------------
// 인증 상태 (라우터 리다이렉트용)
// ---------------------------------------------------------------------------

/// 라우터 인증 가드에서 사용하는 인증 상태
enum AuthStatus {
  /// 초기 (세션 확인 전)
  initial,

  /// 세션 확인 중 (회원 정보 조회 중)
  loading,

  /// 미인증
  unauthenticated,

  /// 승인된 회원 (정상 로그인)
  authenticated,

  /// 가입 대기 (승인 진행중)
  pendingApproval,

  /// 가입 거절
  rejected,

  /// 정지
  suspended,

  /// 탈퇴
  withdrawn,
}

/// 인증 상태 변경 시 GoRouter가 redirect를 다시 평가하도록 하는 Listenable
final ValueNotifier<AuthStatus> authStatusNotifier =
    ValueNotifier<AuthStatus>(AuthStatus.initial);

/// 인증 상태 스트림 (Riverpod Provider에서 구독 시 리스너가 시작됨)
/// Supabase 초기화 후 구독해야 합니다.
Stream<AuthStatus> getAuthStatusStream() async* {
  yield await _updateAuthStatus();
  await for (final _ in SupabaseService.client.auth.onAuthStateChange) {
    yield await _updateAuthStatus();
  }
}

Future<AuthStatus> _updateAuthStatus() async {
  final session = SupabaseService.client.auth.currentSession;
  if (session == null) {
    authStatusNotifier.value = AuthStatus.unauthenticated;
    return AuthStatus.unauthenticated;
  }

  authStatusNotifier.value = AuthStatus.loading;

  try {
    final member = await _fetchMemberByAuthUserId(session.user.id);
    if (member == null) {
      authStatusNotifier.value = AuthStatus.unauthenticated;
      return AuthStatus.unauthenticated;
    }
    if (member.withdrawnAt != null) {
      authStatusNotifier.value = AuthStatus.withdrawn;
      return AuthStatus.withdrawn;
    }
    if (member.isSuspended) {
      authStatusNotifier.value = AuthStatus.suspended;
      return AuthStatus.suspended;
    }
    if (!member.isApproved &&
        member.rejectionReason != null &&
        member.rejectionReason!.isNotEmpty) {
      authStatusNotifier.value = AuthStatus.rejected;
      return AuthStatus.rejected;
    }
    if (!member.isApproved) {
      authStatusNotifier.value = AuthStatus.pendingApproval;
      return AuthStatus.pendingApproval;
    }
    authStatusNotifier.value = AuthStatus.authenticated;
    return AuthStatus.authenticated;
  } catch (_) {
    // 토큰 만료·네트워크 오류 등: 무효 세션 제거 → 로그인 화면 리다이렉트
    await SessionService.signOutOnSessionInvalid();
    authStatusNotifier.value = AuthStatus.unauthenticated;
    return AuthStatus.unauthenticated;
  }
}

Future<MemberModel?> _fetchMemberByAuthUserId(String authUserId) async {
  final res = await SupabaseService.client
      .from('members')
      .select()
      .eq('auth_user_id', authUserId)
      .maybeSingle();

  if (res == null) return null;
  return MemberModel.fromJson(Map<String, dynamic>.from(res));
}

// ---------------------------------------------------------------------------
// 인증 필요 라우트
// ---------------------------------------------------------------------------

/// 인증(승인된 회원)이 필요한 경로인지 여부
bool _isAuthRequired(String location) {
  if (location == '/home') return true;
  if (location.startsWith('/home/')) return true;
  return false;
}

/// 인증 없이 접근 가능한 공개 경로인지 여부
bool _isPublicRoute(String location) {
  return location == '/login' ||
      location == '/signup' ||
      location == '/pending-approval';
}

// ---------------------------------------------------------------------------
// GoRouter 설정
// ---------------------------------------------------------------------------

final _rootNavigatorKey = GlobalKey<NavigatorState>();

GoRouter createAppRouter() {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    refreshListenable: authStatusNotifier,
    initialLocation: '/',
    redirect: (BuildContext context, GoRouterState state) {
      final status = authStatusNotifier.value;
      final location = state.matchedLocation;

      // 초기/로딩: 루트는 그대로 두고 스플래시 등에서 처리 가능
      if (status == AuthStatus.initial || status == AuthStatus.loading) {
        return null;
      }

      // 루트 경로: 인증 여부에 따라 리다이렉트
      if (location == '/') {
        if (status == AuthStatus.authenticated) return '/home';
        return '/login';
      }

      // 인증 필요 라우트 접근 시
      if (_isAuthRequired(location)) {
        if (status != AuthStatus.authenticated) {
          if (status == AuthStatus.pendingApproval) return '/pending-approval';
          if (status == AuthStatus.rejected ||
              status == AuthStatus.suspended ||
              status == AuthStatus.withdrawn) {
            return '/login';
          }
          return '/login';
        }
      }

      // 이미 로그인된 상태에서 로그인/회원가입/승인대기 화면 접근 시 홈으로
      if (status == AuthStatus.authenticated && _isPublicRoute(location)) {
        return '/home';
      }

      return null;
    },
    routes: <RouteBase>[
      GoRoute(
        path: '/',
        builder: (BuildContext context, GoRouterState state) =>
            const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (BuildContext context, GoRouterState state) => LoginScreen(
          onLoginSuccess: () => context.go('/home'),
          onPendingApproval: () => context.go('/pending-approval'),
          onForgotPassword: () {
            // TODO: 비밀번호 찾기 라우트 추가 후 연결
            // context.go('/forgot-password');
          },
          onSignUp: () => context.go('/signup'),
        ),
      ),
      GoRoute(
        path: '/signup',
        builder: (BuildContext context, GoRouterState state) => SignupScreen(
          onSignupComplete: () => context.go('/pending-approval'),
          onCancel: () => context.go('/login'),
        ),
      ),
      GoRoute(
        path: '/pending-approval',
        builder: (BuildContext context, GoRouterState state) =>
            PendingApprovalScreen(
          onConfirm: () => context.go('/login'),
        ),
      ),
      ShellRoute(
        builder: (BuildContext context, GoRouterState state, Widget child) =>
            MainNavigation(
          currentPath: state.matchedLocation,
          child: child,
        ),
        routes: <RouteBase>[
          GoRoute(
            path: '/home',
            builder: (_, __) =>
                const TabPlaceholderScreen(title: '홈'),
            routes: <RouteBase>[
              GoRoute(
                path: 'board',
                builder: (_, __) =>
                    const TabPlaceholderScreen(title: '게시판'),
              ),
              GoRoute(
                path: 'schedule',
                builder: (_, __) =>
                    const TabPlaceholderScreen(title: '일정'),
              ),
              GoRoute(
                path: 'members',
                builder: (_, __) =>
                    const TabPlaceholderScreen(title: '회원'),
              ),
              GoRoute(
                path: 'profile',
                builder: (_, __) => const ProfileTabScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
