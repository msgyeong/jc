import 'package:flutter/material.dart';

import '../services/session_service.dart';

/// 앱 라이프사이클을 감지하여 세션 관리 서비스를 호출하는 위젯
/// - 앱이 백그라운드로 갈 때: 마지막 활동 시각 저장
/// - 앱이 포그라운드로 돌아올 때: 세션 갱신, 장기 미사용 시 로그아웃
class SessionObserver extends StatefulWidget {
  const SessionObserver({super.key, required this.child});

  final Widget child;

  @override
  State<SessionObserver> createState() => _SessionObserverState();
}

class _SessionObserverState extends State<SessionObserver>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
        SessionService.onAppBackground();
        break;
      case AppLifecycleState.resumed:
        SessionService.onAppResumed();
        break;
      default:
        break;
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
