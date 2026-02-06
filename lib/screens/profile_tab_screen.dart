import 'package:flutter/material.dart';

import '../services/supabase_service.dart';
import '../theme/app_theme.dart';

/// 내 프로필 탭 화면
/// 우측 상단 로그아웃 버튼으로 테스트(01) 및 일상 사용 지원
class ProfileTabScreen extends StatelessWidget {
  const ProfileTabScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('내 프로필'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: '로그아웃',
            onPressed: () => _signOut(context),
          ),
        ],
      ),
      body: const Center(
        child: Text('내 프로필 (플레이스홀더)'),
      ),
    );
  }

  Future<void> _signOut(BuildContext context) async {
    await SupabaseService.client.auth.signOut();
    // onAuthStateChange → authStatusNotifier 갱신 → GoRouter 리다이렉트로 로그인 화면 이동
  }
}
