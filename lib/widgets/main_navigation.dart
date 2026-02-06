import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/app_theme.dart';

// ---------------------------------------------------------------------------
// 탭 구성 (홈, 게시판, 일정, 회원, 내 프로필)
// ---------------------------------------------------------------------------

/// 하단 탭 항목 정의
class MainTab {
  const MainTab({
    required this.path,
    required this.label,
    required this.icon,
    this.selectedIcon,
  });

  final String path;
  final String label;
  final IconData icon;
  final IconData? selectedIcon;

  static const home = MainTab(
    path: '/home',
    label: '홈',
    icon: Icons.home_outlined,
    selectedIcon: Icons.home,
  );

  static const board = MainTab(
    path: '/home/board',
    label: '게시판',
    icon: Icons.article_outlined,
    selectedIcon: Icons.article,
  );

  static const schedule = MainTab(
    path: '/home/schedule',
    label: '일정',
    icon: Icons.calendar_today_outlined,
    selectedIcon: Icons.calendar_today,
  );

  static const members = MainTab(
    path: '/home/members',
    label: '회원',
    icon: Icons.people_outline,
    selectedIcon: Icons.people,
  );

  static const profile = MainTab(
    path: '/home/profile',
    label: '내 프로필',
    icon: Icons.person_outline,
    selectedIcon: Icons.person,
  );

  static const List<MainTab> all = [
    home,
    board,
    schedule,
    members,
    profile,
  ];
}

// ---------------------------------------------------------------------------
// 하단 탭 네비게이션
// ---------------------------------------------------------------------------

/// 하단 탭 네비게이션 기본 구조
/// 인증된 사용자만 접근 가능하며(라우터 인증 가드), 탭별 child를 표시합니다.
class MainNavigation extends StatelessWidget {
  const MainNavigation({
    super.key,
    required this.currentPath,
    required this.child,
  });

  final String currentPath;
  final Widget child;

  int _selectedIndex(String path) {
    if (path == '/home' || path == '/home/') return 0;
    if (path.startsWith('/home/board')) return 1;
    if (path.startsWith('/home/schedule')) return 2;
    if (path.startsWith('/home/members')) return 3;
    if (path.startsWith('/home/profile')) return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final index = _selectedIndex(currentPath);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: index.clamp(0, MainTab.all.length - 1),
        onTap: (int i) {
          final tab = MainTab.all[i];
          if (tab.path != currentPath) context.go(tab.path);
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppTheme.primaryColor,
        unselectedItemColor: AppTheme.textSecondary,
        items: MainTab.all
            .map(
              (t) => BottomNavigationBarItem(
                icon: Icon(t.icon),
                activeIcon: Icon(t.selectedIcon ?? t.icon),
                label: t.label,
              ),
            )
            .toList(),
      ),
    );
  }
}
