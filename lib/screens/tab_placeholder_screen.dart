import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// 탭별 플레이스홀더 화면
/// 각 탭(홈, 게시판, 일정, 회원, 내 프로필)의 상세 구현 전까지 사용합니다.
class TabPlaceholderScreen extends StatelessWidget {
  const TabPlaceholderScreen({
    super.key,
    required this.title,
  });

  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(title),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: Text('$title (플레이스홀더)'),
      ),
    );
  }
}
