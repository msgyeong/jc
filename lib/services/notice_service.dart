import '../models/notice_model.dart';
import 'supabase_service.dart';

/// 공지사항 API (Supabase notices 테이블)
class NoticeService {
  static const String _table = 'notices';

  /// 공지사항 목록 (고정 공지 우선, 최신순)
  static Future<List<NoticeModel>> getList({
    int page = 1,
    int limit = 20,
  }) async {
    final from = (page - 1) * limit;
    final res = await SupabaseService.client
        .from(_table)
        .select()
        .order('is_pinned', ascending: false)
        .order('created_at', ascending: false)
        .range(from, from + limit - 1);

    return (res as List<dynamic>)
        .map((e) => NoticeModel.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  /// 공지사항 상세 조회
  static Future<NoticeModel?> getById(String id) async {
    final res = await SupabaseService.client
        .from(_table)
        .select()
        .eq('id', id)
        .maybeSingle();
    if (res == null) return null;
    return NoticeModel.fromJson(Map<String, dynamic>.from(res));
  }

  /// 조회수 증가 (상세 진입 시 호출)
  static Future<void> incrementViews(String id) async {
    final row = await SupabaseService.client
        .from(_table)
        .select('views')
        .eq('id', id)
        .maybeSingle();
    if (row == null) return;
    final views = ((row['views'] as num?)?.toInt() ?? 0) + 1;
    await SupabaseService.client
        .from(_table)
        .update({'views': views}).eq('id', id);
  }

  /// 공지사항 작성 (권한은 RLS에서 확인)
  static Future<String> create({
    required String authorId,
    required String title,
    required String content,
    bool isPinned = false,
    bool hasAttendance = false,
  }) async {
    final res = await SupabaseService.client.from(_table).insert({
      'author_id': authorId,
      'title': title,
      'content': content,
      'is_pinned': isPinned,
      'has_attendance': hasAttendance,
    }).select('id').single();
    return res['id'] as String;
  }

  /// 공지사항 수정 (작성자/관리자만 RLS에서 허용)
  static Future<void> update({
    required String id,
    required String title,
    required String content,
    bool isPinned = false,
    bool hasAttendance = false,
  }) async {
    await SupabaseService.client.from(_table).update({
      'title': title,
      'content': content,
      'is_pinned': isPinned,
      'has_attendance': hasAttendance,
      'updated_at': DateTime.now().toUtc().toIso8601String(),
    }).eq('id', id);
  }

  /// 공지사항 삭제 (작성자/관리자만 RLS에서 허용)
  static Future<void> delete(String id) async {
    await SupabaseService.client.from(_table).delete().eq('id', id);
  }
}
