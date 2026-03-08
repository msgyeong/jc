import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../screens/auth/login_screen.dart';
import '../screens/auth/pending_approval_screen.dart';
import '../screens/auth/signup_screen.dart';
import '../screens/splash_screen.dart';
import '../screens/profile_tab_screen.dart';
import '../screens/tab_placeholder_screen.dart';
import '../screens/notices/notice_list_screen.dart';
import '../screens/notices/notice_detail_screen.dart';
import '../screens/notices/notice_create_screen.dart';
import '../screens/notices/notice_edit_screen.dart';
import '../services/api_client.dart';
import '../services/session_service.dart';
import '../widgets/main_navigation.dart';

// ---------------------------------------------------------------------------
// 인증 상태 (라우터 리다이렉트용)
// ---------------------------------------------------------------------------

enum AuthStatus {
  initial,
  loading,
  unauthenticated,
  authenticated,
  pendingApproval,
  rejected,
  suspended,
  withdrawn,
}

final ValueNotifier<AuthStatus> authStatusNotifier =
    ValueNotifier<AuthStatus>(AuthStatus.initial);

/// 인증 상태 스트림 (Railway API JWT 기반)
Stream<AuthStatus> getAuthStatusStream() async* {
  // 초기 상태: 저장된 토큰 확인
  yield await _checkAuthStatus();

  // SessionService의 인증 상태 변경 이벤트 구독
  await for (final isLoggedIn in SessionService.authStateStream) {
    if (isLoggedIn) {
      yield await _checkAuthStatus();
    } else {
      authStatusNotifier.value = AuthStatus.unauthenticated;
      yield AuthStatus.unauthenticated;
    }
  }
}

Future<AuthStatus> _checkAuthStatus() async {
  final token = await SessionService.getToken();
  if (token == null || token.isEmpty) {
    authStatusNotifier.value = AuthStatus.unauthenticated;
    return AuthStatus.unauthenticated;
  }

  authStatusNotifier.value = AuthStatus.loading;

  try {
    // Railway API로 토큰 유효성 및 사용자 상태 확인
    final res = await ApiClient.get('/api/auth/me');

    if (!res.success) {
      await SessionService.signOut();
      authStatusNotifier.value = AuthStatus.unauthenticated;
      return AuthStatus.unauthenticated;
    }

    final user = res.data['user'] as Map<String, dynamic>;
    final status = user['status'] as String?;
    final role = user['role'] as String?;

    if (status == 'suspended') {
      authStatusNotifier.value = AuthStatus.suspended;
      return AuthStatus.suspended;
    }
    if (status == 'pending') {
      authStatusNotifier.value = AuthStatus.pendingApproval;
      return AuthStatus.pendingApproval;
    }
    if (status == 'withdrawn') {
      authStatusNotifier.value = AuthStatus.withdrawn;
      return AuthStatus.withdrawn;
    }

    // status == 'active' -> 인증됨
    authStatusNotifier.value = AuthStatus.authenticated;
    return AuthStatus.authenticated;
  } catch (_) {
    // 네트워크 오류 등: 저장된 상태로 판단
    final savedStatus = await SessionService.getUserStatus();
    if (savedStatus == 'active') {
      authStatusNotifier.value = AuthStatus.authenticated;
      return AuthStatus.authenticated;
    }
    authStatusNotifier.value = AuthStatus.unauthenticated;
    return AuthStatus.unauthenticated;
  }
}

// ---------------------------------------------------------------------------
// 인증 필요 라우트
// ---------------------------------------------------------------------------

bool _isAuthRequired(String location) {
  if (location == '/home') return true;
  if (location.startsWith('/home/')) return true;
  return false;
}

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

      if (status == AuthStatus.initial || status == AuthStatus.loading) {
        return null;
      }

      if (location == '/') {
        if (status == AuthStatus.authenticated) return '/home';
        return '/login';
      }

      if (_isAuthRequired(location)) {
        if (status != AuthStatus.authenticated) {
          if (status == AuthStatus.pendingApproval) return '/pending-approval';
          return '/login';
        }
      }

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
          onForgotPassword: () {},
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
                builder: (_, __) => const NoticeListScreen(),
              ),
              GoRoute(
                path: 'notices',
                builder: (_, __) => const NoticeListScreen(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'create',
                    builder: (_, __) => const NoticeCreateScreen(),
                  ),
                  GoRoute(
                    path: ':id',
                    builder: (c, state) {
                      final id = state.pathParameters['id']!;
                      return NoticeDetailScreen(noticeId: id);
                    },
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'edit',
                        builder: (c, state) {
                          final id = state.pathParameters['id']!;
                          return NoticeEditScreen(noticeId: id);
                        },
                      ),
                    ],
                  ),
                ],
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
