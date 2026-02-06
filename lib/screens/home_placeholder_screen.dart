import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// 인증 후 홈 화면 플레이스홀더
/// 하단 탭 네비게이션 구조 적용 전까지 사용합니다.
class HomePlaceholderScreen extends StatelessWidget {
  const HomePlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('홈'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: const Center(
        child: Text('홈 화면 (플레이스홀더)'),
      ),
    );
  }
}
