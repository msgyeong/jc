import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Supabase 클라이언트 서비스
/// 환경 변수에서 URL과 Anon Key를 읽어 Supabase를 초기화합니다.
class SupabaseService {
  static SupabaseClient? _client;

  /// Supabase 클라이언트 인스턴스 반환
  static SupabaseClient get client {
    if (_client == null) {
      throw Exception(
        'Supabase가 초기화되지 않았습니다. '
        'SupabaseService.initialize()를 먼저 호출하세요.',
      );
    }
    return _client!;
  }

  /// Supabase 초기화
  /// 앱 시작 시 main() 함수에서 호출해야 합니다.
  static Future<void> initialize() async {
    try {
      // .env 파일 로드 (pubspec.yaml assets에 .env 등록 필요)
      await dotenv.load(fileName: '.env');

      final supabaseUrl = dotenv.env['SUPABASE_URL'];
      final supabaseAnonKey = dotenv.env['SUPABASE_ANON_KEY'];

      if (supabaseUrl == null || supabaseAnonKey == null) {
        throw Exception(
          '환경 변수가 설정되지 않았습니다. '
          '프로젝트 루트에 .env 파일을 만들고 '
          'SUPABASE_URL, SUPABASE_ANON_KEY를 설정하세요.',
        );
      }

      // Supabase 초기화 (자동 토큰 갱신 활성화)
      await Supabase.initialize(
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
        authOptions: const FlutterAuthClientOptions(
          autoRefreshToken: true,
        ),
      );

      _client = Supabase.instance.client;
    } catch (e) {
      throw Exception('Supabase 초기화 실패: $e');
    }
  }

  /// 현재 인증된 사용자 반환
  static User? get currentUser => _client?.auth.currentUser;

  /// 인증 상태 스트림
  static Stream<AuthState> get authStateChanges =>
      _client?.auth.onAuthStateChange ?? const Stream.empty();
}
