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
/// API 에러 및 네트워크 에러를 사용자 친화적 메시지로 변환합니다.
class ErrorHandler {
  /// 에러를 AppError로 변환
  static AppError handleError(Object error) {
    if (error is AppError) {
      return error;
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

    // HTTP 상태 코드 기반 에러 처리
    final errorStr = error.toString();
    if (errorStr.contains('401') || errorStr.contains('Unauthorized')) {
      return AppError(
        type: AppErrorType.authentication,
        message: '인증이 만료되었습니다. 다시 로그인해주세요.',
        originalError: error,
      );
    }
    if (errorStr.contains('403') || errorStr.contains('Forbidden')) {
      return AppError(
        type: AppErrorType.authorization,
        message: '접근 권한이 없습니다.',
        originalError: error,
      );
    }
    if (errorStr.contains('404')) {
      return AppError(
        type: AppErrorType.server,
        message: '요청한 데이터를 찾을 수 없습니다.',
        originalError: error,
      );
    }
    if (errorStr.contains('409') || errorStr.contains('Conflict')) {
      return AppError(
        type: AppErrorType.validation,
        message: '이미 존재하는 데이터입니다.',
        originalError: error,
      );
    }
    if (errorStr.contains('422')) {
      return AppError(
        type: AppErrorType.validation,
        message: '입력 데이터를 확인해주세요.',
        originalError: error,
      );
    }
    if (errorStr.contains('429')) {
      return AppError(
        type: AppErrorType.server,
        message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        originalError: error,
      );
    }
    if (errorStr.contains('500') || errorStr.contains('Server')) {
      return AppError(
        type: AppErrorType.server,
        message: '서버 오류가 발생했습니다.',
        originalError: error,
      );
    }

    return AppError(
      type: AppErrorType.unknown,
      message: '알 수 없는 오류가 발생했습니다.',
      originalError: error,
    );
  }

  /// 사용자 친화적 에러 메시지 반환
  static String getUserFriendlyMessage(AppError error) {
    return error.message;
  }
}
