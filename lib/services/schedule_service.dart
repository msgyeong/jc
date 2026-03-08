import 'api_client.dart';

/// 일정 API (Railway backend)
class ScheduleService {
  /// 일정 목록
  static Future<List<Map<String, dynamic>>> getList({
    bool upcomingOnly = false,
  }) async {
    final query = upcomingOnly ? '?upcoming=true' : '';
    final res = await ApiClient.get('/api/schedules$query');
    if (!res.success) {
      throw Exception(res.message ?? '일정 목록 조회 실패');
    }
    final schedules = res.data['schedules'] as List<dynamic>;
    return schedules
        .map((e) => _normalize(e as Map<String, dynamic>))
        .toList();
  }

  /// 일정 상세
  static Future<Map<String, dynamic>?> getById(String id) async {
    final res = await ApiClient.get('/api/schedules/$id');
    if (!res.success) return null;
    final schedule = res.data['schedule'] as Map<String, dynamic>?;
    if (schedule == null) return null;
    return _normalize(schedule);
  }

  /// 일정 작성
  static Future<String> create({
    required String title,
    required String startDate,
    String? endDate,
    String? location,
    String? description,
    String? category,
  }) async {
    final res = await ApiClient.post('/api/schedules', body: {
      'title': title,
      'start_date': startDate,
      'end_date': endDate,
      'location': location,
      'description': description,
      'category': category,
    });
    if (!res.success) {
      throw Exception(res.message ?? '일정 작성 실패');
    }
    return res.data['scheduleId'].toString();
  }

  /// 일정 수정
  static Future<void> update({
    required String id,
    required String title,
    required String startDate,
    String? endDate,
    String? location,
    String? description,
    String? category,
  }) async {
    final res = await ApiClient.put('/api/schedules/$id', body: {
      'title': title,
      'start_date': startDate,
      'end_date': endDate,
      'location': location,
      'description': description,
      'category': category,
    });
    if (!res.success) {
      throw Exception(res.message ?? '일정 수정 실패');
    }
  }

  /// 일정 삭제
  static Future<void> delete(String id) async {
    final res = await ApiClient.delete('/api/schedules/$id');
    if (!res.success) {
      throw Exception(res.message ?? '일정 삭제 실패');
    }
  }

  static Map<String, dynamic> _normalize(Map<String, dynamic> raw) {
    return {
      'id': raw['id'].toString(),
      'title': raw['title'] ?? '',
      'start_date': raw['start_date'],
      'end_date': raw['end_date'],
      'location': raw['location'],
      'description': raw['description'] ?? '',
      'category': raw['category'],
      'views': raw['views'] ?? 0,
      'created_at': raw['created_at'],
      'updated_at': raw['updated_at'],
      'author_id': (raw['author_id'] ?? '').toString(),
      'author_name': raw['author_name'],
      'author_image': raw['author_image'],
    };
  }
}
