import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'providers/auth_state_provider.dart';
import 'routes/app_router.dart';
import 'services/supabase_service.dart';
import 'theme/app_theme.dart';
import 'widgets/session_observer.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SupabaseService.initialize();

  final router = createAppRouter();

  runApp(
    ProviderScope(
      child: SessionObserver(
        child: MyApp(router: router),
      ),
    ),
  );
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key, required this.router});

  final GoRouter router;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // 인증 상태 스트림 구독 → 미인증 사용자 자동 리다이렉트(GoRouter)와 동기화
    ref.watch(authStatusStreamProvider);

    return MaterialApp.router(
      title: 'JC',
      theme: AppTheme.lightTheme,
      routerConfig: router,
    );
  }
}
