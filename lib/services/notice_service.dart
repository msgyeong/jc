import '../models/notice_model.dart';
import 'api_client.dart';

/// 공지사항 API (Railway backend)
class NoticeService {
  /// 공지사항 목록 (고정 공지 우선, 최신순)
  static Future<List<NoticeModel>> getList({
    int page = 1,
    int limit = 20,
  }) async {
    final res = await ApiClient.get('/api/notices?page=$page&limit=$limit');
    if (!res.success) {
      throw Exception(res.message ?? '공지사항 목록 조회 실패');
    }
    final notices = res.data['notices'] as List<dynamic>;
    return notices
        .map((e) => NoticeModel.fromJson(_normalizeNotice(e as Map<String, dynamic>)))
        .toList();
  }

  /// 공지사항 상세 조회 (조회수 자동 증가)
  static Future<NoticeModel?> getById(String id) async {
    final res = await ApiClient.get('/api/notices/$id');
    if (!res.success) return null;
    final notice = res.data['notice'] as Map<String, dynamic>?;
    if (notice == null) return null;
    return NoticeModel.fromJson(_normalizeNotice(notice));
  }

  /// 조회수 증가 (getById에서 자동 처리되므로 별도 호출 불필요)
  static Future<void> incrementViews(String id) async {
    // Railway API의 GET /api/notices/:id가 자동으로 조회수를 증가시킴
  }

  /// 공지사항 작성
  static Future<String> create({
    required String authorId,
    required String title,
    required String content,
    bool isPinned = false,
    bool hasAttendance = false,
  }) async {
    final res = await ApiClient.post('/api/notices', body: {
      'title': title,
      'content': content,
      'is_pinned': isPinned,
      'has_attendance': hasAttendance,
    });
    if (!res.success) {
      throw Exception(res.message ?? '공지사항 작성 실패');
    }
    return res.data['noticeId'].toString();
  }

  /// 공지사항 수정
  static Future<void> update({
    required String id,
    required String title,
    required String content,
    bool isPinned = false,
    bool hasAttendance = false,
  }) async {
    final res = await ApiClient.put('/api/notices/$id', body: {
      'title': title,
      'content': content,
      'is_pinned': isPinned,
      'has_attendance': hasAttendance,
    });
    if (!res.success) {
      throw Exception(res.message ?? '공지사항 수정 실패');
    }
  }

  /// 공지사항 삭제
  static Future<void> delete(String id) async {
    final res = await ApiClient.delete('/api/notices/$id');
    if (!res.success) {
      throw Exception(res.message ?? '공지사항 삭제 실패');
    }
  }

  /// API 응답 → NoticeModel JSON 변환
  /// Railway API는 snake_case + integer ID를 반환하므로 변환 처리
  static Map<String, dynamic> _normalizeNotice(Map<String, dynamic> raw) {
    return {
      'id': raw['id'].toString(),
      'author_id': (raw['author_id'] ?? '').toString(),
      'title': raw['title'] ?? '',
      'content': raw['content'] ?? '',
      'images': raw['images'],
      'is_pinned': raw['is_pinned'] ?? false,
      'has_attendance': raw['has_attendance'] ?? false,
      'views': raw['views'] ?? 0,
      'likes_count': raw['likes_count'] ?? 0,
      'comments_count': raw['comments_count'] ?? 0,
      'created_at': raw['created_at'],
      'updated_at': raw['updated_at'],
      'author_name': raw['author_name'],
      'author_image': raw['author_image'],
    };
  }
}
