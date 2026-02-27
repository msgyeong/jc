/**
 * 전역 에러 핸들러 미들웨어
 */
function errorHandler(err, req, res, next) {
    console.error('Error:', err);

    // 에러 상태 코드 (기본 500)
    const statusCode = err.statusCode || 500;

    // 에러 메시지
    const message = err.message || '서버 오류가 발생했습니다.';

    // 개발 환경에서는 스택 추적 포함
    const response = {
        success: false,
        message: message
    };

    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
}

/**
 * 404 Not Found 핸들러
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        message: '요청한 리소스를 찾을 수 없습니다.'
    });
}

module.exports = {
    errorHandler,
    notFoundHandler
};
