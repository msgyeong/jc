import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_state_provider.dart';
import '../theme/app_theme.dart';

/// PRD 기준: assets/images/jc_logo_slash.png
/// 프로젝트 asset 경로: image/slash/jc_logo_slash.png
const _logoAsset = 'image/slash/jc_logo_slash.png';

/// 인증 상태 확인 최대 대기 시간
const _maxAuthWait = Duration(seconds: 3);

/// 스플래시 화면
/// 로고 표시 후 인증 상태 확인(최대 3초), 로그인/홈/승인대기로 전환합니다.
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  bool _hasNavigated = false;
  bool _timeoutReached = false;
  bool _timeoutNavigationScheduled = false;
  Timer? _timeoutTimer;

  @override
  void initState() {
    super.initState();
    _timeoutTimer = Timer(_maxAuthWait, () {
      if (!mounted) return;
      setState(() => _timeoutReached = true);
    });
  }

  @override
  void dispose() {
    _timeoutTimer?.cancel();
    super.dispose();
  }

  void _navigateOnce(String path) {
    if (_hasNavigated) return;
    _hasNavigated = true;
    _timeoutTimer?.cancel();
    if (!mounted) return;
    context.go(path);
  }

  @override
  Widget build(BuildContext context) {
    final authAsync = ref.watch(authStatusStreamProvider);

    ref.listen<AsyncValue<AuthStatus>>(authStatusStreamProvider, (_, next) {
      next.whenData((status) {
        if (_hasNavigated) return;
        if (status == AuthStatus.authenticated) {
          _navigateOnce('/home');
          return;
        }
        if (status == AuthStatus.pendingApproval) {
          _navigateOnce('/pending-approval');
          return;
        }
        if (status != AuthStatus.initial && status != AuthStatus.loading) {
          _navigateOnce('/login');
        }
      });
    });

    // 최대 3초 경과 시 미인증으로 간주하고 로그인으로 (한 번만 스케줄)
    if (_timeoutReached &&
        !_hasNavigated &&
        !_timeoutNavigationScheduled) {
      final status = authAsync.valueOrNull;
      if (status == null ||
          status == AuthStatus.initial ||
          status == AuthStatus.loading) {
        _timeoutNavigationScheduled = true;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _navigateOnce('/login');
        });
      }
    }

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(
                _logoAsset,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => const Icon(
                  Icons.image_not_supported_outlined,
                  size: 120,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 32),
              const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
