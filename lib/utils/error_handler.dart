import 'package:supabase_flutter/supabase_flutter.dart';

/// 에러 타입 정의
enum AppErrorType {
  network,
  authentication,
  authorization,
  validation,
  server,
  unknown,
}

/// 앱 에러 클래스
class AppError {
  final AppErrorType type;
  final String message;
  final Object? originalError;

  const AppError({
    required this.type,
    required this.message,
    this.originalError,
  });

  @override
  String toString() => message;
}

/// 전역 에러 핸들러
/// Supabase 에러 및 네트워크 에러를 사용자 친화적 메시지로 변환합니다.
class ErrorHandler {
  /// 에러를 AppError로 변환
  static AppError handleError(Object error) {
    if (error is AppError) {
      return error;
    }

    // Supabase 에러 처리
    if (error is AuthException) {
      return _handleAuthException(error);
    }

    if (error is PostgrestException) {
      return _handlePostgrestException(error);
    }

    if (error is StorageException) {
      return _handleStorageException(error);
    }

    // 네트워크 에러 처리
    if (error.toString().contains('SocketException') ||
        error.toString().contains('Network') ||
        error.toString().contains('connection')) {
      return AppError(
        type: AppErrorType.network,
        message: '네트워크 연결을 확인해주세요.',
        originalError: error,
      );
    }

    // 알 수 없는 에러
    return AppError(
      type: AppErrorType.unknown,
      message: '알 수 없는 오류가 발생했습니다.',
      originalError: error,
    );
  }

  /// AuthException 처리
  static AppError _handleAuthException(AuthException error) {
    final code = error.statusCode ?? '';
    final msg = error.message.toLowerCase();

    // 이메일 발송 제한 (429, over_email_send_rate_limit)
    if (code == 429 ||
        code == '429' ||
        (msg.contains('after') && msg.contains('seconds'))) {
      return const AppError(
        type: AppErrorType.server,
        message: '이메일 발송 제한으로 약 1분 후에 다시 시도해 주세요.',
        originalError: null,
      );
    }

    // 이메일 중복: Auth에서 명시적으로 반환하는 경우만 (회원가입 시 기존 이메일)
    if (code == 'user_already_exists' ||
        msg.contains('already registered')) {
      return const AppError(
        type: AppErrorType.validation,
        message: '이미 등록된 이메일입니다. 다른 이메일을 사용해주세요.',
      );
    }

    // 로그인 실패: Invalid login credentials 등 한글 안내
    if (code == 'invalid_credentials' ||
        (msg.contains('invalid') && msg.contains('credential')) ||
        msg.contains('invalid login credential')) {
      return const AppError(
        type: AppErrorType.authentication,
        message:
            '등록되지 않은 이메일이거나 비밀번호가 맞지 않아요. '
            '다시 한 번 확인해 주세요.',
      );
    }

    switch (code) {
      case 'email_not_confirmed':
        return const AppError(
          type: AppErrorType.authentication,
          message: '이메일 인증이 완료되지 않았습니다.',
        );
      case 'user_not_found':
        return const AppError(
          type: AppErrorType.authentication,
          message: '사용자를 찾을 수 없습니다.',
        );
      case 'weak_password':
        return const AppError(
          type: AppErrorType.validation,
          message: '비밀번호가 너무 약합니다. 더 강력한 비밀번호를 사용해주세요.',
        );
      case 'invalid_email':
        return const AppError(
          type: AppErrorType.validation,
          message: '유효하지 않은 이메일 형식입니다.',
        );
      default:
        return AppError(
          type: AppErrorType.authentication,
          message: error.message.isNotEmpty
              ? error.message
              : '인증 오류가 발생했습니다.',
          originalError: error,
        );
    }
  }

  /// PostgrestException 처리
  static AppError _handlePostgrestException(PostgrestException error) {
    if (error.code == 'PGRST301' || error.code == '42501') {
      return AppError(
        type: AppErrorType.authorization,
        message: '접근 권한이 없습니다.',
        originalError: error,
      );
    }

    if (error.code == '23505') {
      return AppError(
        type: AppErrorType.validation,
        message: '이미 존재하는 데이터입니다.',
        originalError: error,
      );
    }

    return AppError(
      type: AppErrorType.server,
      message: error.message.isNotEmpty
          ? error.message
          : '서버 오류가 발생했습니다.',
      originalError: error,
    );
  }

  /// StorageException 처리
  static AppError _handleStorageException(StorageException error) {
    if (error.statusCode == '404') {
      return AppError(
        type: AppErrorType.server,
        message: '파일을 찾을 수 없습니다.',
        originalError: error,
      );
    }

    return AppError(
      type: AppErrorType.server,
      message: error.message.isNotEmpty
          ? error.message
          : '파일 업로드 중 오류가 발생했습니다.',
      originalError: error,
    );
  }

  /// 사용자 친화적 에러 메시지 반환
  static String getUserFriendlyMessage(AppError error) {
    return error.message;
  }
}
