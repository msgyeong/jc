import 'dart:async';
import 'dart:developer' as developer;

import 'package:shared_preferences/shared_preferences.dart';

/// 세션 관리 서비스
/// JWT 토큰 기반 세션 관리 (Railway API)
class SessionService {
  SessionService._();

  static const String _tokenKey = 'auth_token';
  static const String _userIdKey = 'auth_user_id';
  static const String _userEmailKey = 'auth_user_email';
  static const String _userNameKey = 'auth_user_name';
  static const String _userRoleKey = 'auth_user_role';
  static const String _userStatusKey = 'auth_user_status';
  static const String _userImageKey = 'auth_user_image';

  static const Duration inactivityTimeout = Duration(minutes: 30);
  static DateTime? _lastBackgroundAt;

  /// 인증 상태 변경 알림 스트림
  static final StreamController<bool> _authStateController =
      StreamController<bool>.broadcast();
  static Stream<bool> get authStateStream => _authStateController.stream;

  // -- 토큰 관리 --

  /// JWT 토큰 저장
  static Future<void> saveSession({
    required String token,
    required int userId,
    required String email,
    required String name,
    required String role,
    required String status,
    String? profileImage,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setInt(_userIdKey, userId);
    await prefs.setString(_userEmailKey, email);
    await prefs.setString(_userNameKey, name);
    await prefs.setString(_userRoleKey, role);
    await prefs.setString(_userStatusKey, status);
    if (profileImage != null) {
      await prefs.setString(_userImageKey, profileImage);
    }
    _authStateController.add(true);
  }

  /// JWT 토큰 조회
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  /// 로그인 여부 확인
  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  /// 현재 사용자 ID
  static Future<int?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt(_userIdKey);
  }

  /// 현재 사용자 이름
  static Future<String?> getUserName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userNameKey);
  }

  /// 현재 사용자 역할
  static Future<String?> getUserRole() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userRoleKey);
  }

  /// 현재 사용자 상태
  static Future<String?> getUserStatus() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userStatusKey);
  }

  /// 현재 사용자 이메일
  static Future<String?> getUserEmail() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userEmailKey);
  }

  /// 로그아웃 (로컬 토큰 삭제)
  static Future<void> signOut() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userIdKey);
    await prefs.remove(_userEmailKey);
    await prefs.remove(_userNameKey);
    await prefs.remove(_userRoleKey);
    await prefs.remove(_userStatusKey);
    await prefs.remove(_userImageKey);
    _authStateController.add(false);
  }

  // -- 앱 라이프사이클 --

  /// 앱이 백그라운드로 갈 때 호출
  static void onAppBackground() {
    _lastBackgroundAt = DateTime.now();
  }

  /// 앱이 포그라운드로 돌아올 때 호출
  static Future<void> onAppResumed() async {
    if (_lastBackgroundAt != null &&
        DateTime.now().difference(_lastBackgroundAt!) > inactivityTimeout) {
      developer.log(
        'SessionService: 장기 미사용으로 로그아웃 (${inactivityTimeout.inMinutes}분 초과)',
      );
      await signOut();
      _lastBackgroundAt = null;
    }
  }
}
