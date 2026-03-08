import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'providers/auth_state_provider.dart';
import 'routes/app_router.dart';
import 'theme/app_theme.dart';
import 'widgets/session_observer.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await dotenv.load(fileName: '.env');

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
    ref.watch(authStatusStreamProvider);

    return MaterialApp.router(
      title: 'JC',
      theme: AppTheme.lightTheme,
      routerConfig: router,
    );
  }
}
