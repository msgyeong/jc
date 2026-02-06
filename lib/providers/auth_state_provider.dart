import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../routes/app_router.dart' show AuthStatus, getAuthStatusStream;

export '../routes/app_router.dart' show AuthStatus;

// ---------------------------------------------------------------------------
// 인증 상태 Provider
// ---------------------------------------------------------------------------

/// 인증 상태 스트림 Provider
/// 루트 위젯에서 ref.watch로 구독하면 세션 변경 시 자동으로 갱신되며,
/// GoRouter 리다이렉트용 notifier도 동기화됩니다.
/// Supabase가 세션을 자동으로 유지(secure storage)하므로 별도 저장 없이
/// 앱 재시작 후에도 로그인 상태가 유지됩니다.
final authStatusStreamProvider = StreamProvider<AuthStatus>((ref) {
  return getAuthStatusStream();
});

/// 현재 인증 상태 (AsyncValue)
/// authStatusStreamProvider와 동일한 값을 편의용 별칭으로 제공합니다.
final authStatusProvider = authStatusStreamProvider;
