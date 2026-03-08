import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../routes/app_router.dart' show AuthStatus, getAuthStatusStream;

export '../routes/app_router.dart' show AuthStatus;

// ---------------------------------------------------------------------------
// 인증 상태 Provider
// ---------------------------------------------------------------------------

/// 인증 상태 스트림 Provider
/// 루트 위젯에서 ref.watch로 구독하면 세션 변경 시 자동으로 갱신되며,
/// GoRouter 리다이렉트용 notifier도 동기화됩니다.
final authStatusStreamProvider = StreamProvider<AuthStatus>((ref) {
  return getAuthStatusStream();
});

/// 현재 인증 상태 (AsyncValue)
final authStatusProvider = authStatusStreamProvider;
