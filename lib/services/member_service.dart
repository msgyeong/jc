import 'api_client.dart';

/// 회원 API (Railway backend)
class MemberService {
  /// 회원 목록 (페이지네이션)
  static Future<Map<String, dynamic>> getList({
    int page = 1,
    int limit = 50,
  }) async {
    final res =
        await ApiClient.get('/api/members?page=$page&limit=$limit');
    if (!res.success) {
      throw Exception(res.message ?? '회원 목록 조회 실패');
    }
    final members = (res.data['members'] as List<dynamic>)
        .map((e) => _normalize(e as Map<String, dynamic>))
        .toList();
    return {
      'members': members,
      'total': res.data['total'] ?? members.length,
    };
  }

  /// 회원 검색
  static Future<List<Map<String, dynamic>>> search(String query) async {
    final res =
        await ApiClient.get('/api/members/search?q=${Uri.encodeComponent(query)}');
    if (!res.success) {
      throw Exception(res.message ?? '회원 검색 실패');
    }
    final members = res.data['members'] as List<dynamic>;
    return members
        .map((e) => _normalize(e as Map<String, dynamic>))
        .toList();
  }

  /// 회원 상세
  static Future<Map<String, dynamic>?> getById(String id) async {
    final res = await ApiClient.get('/api/members/$id');
    if (!res.success) return null;
    final member = res.data['member'] as Map<String, dynamic>?;
    if (member == null) return null;
    return _normalize(member);
  }

  static Map<String, dynamic> _normalize(Map<String, dynamic> raw) {
    return {
      'id': raw['id'].toString(),
      'email': raw['email'] ?? '',
      'name': raw['name'] ?? '',
      'phone': raw['phone'] ?? '',
      'address': raw['address'] ?? '',
      'profile_image': raw['profile_image'],
      'role': raw['role'] ?? 'member',
      'status': raw['status'] ?? 'active',
      'birth_date': raw['birth_date'],
      'gender': raw['gender'],
      'company': raw['company'] ?? '',
      'position': raw['position'] ?? '',
      'department': raw['department'] ?? '',
      'work_phone': raw['work_phone'] ?? '',
      'created_at': raw['created_at'],
      'updated_at': raw['updated_at'],
    };
  }
}
