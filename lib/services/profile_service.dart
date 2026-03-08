import 'api_client.dart';

/// 내 프로필 API (Railway backend)
class ProfileService {
  /// 내 프로필 조회
  static Future<Map<String, dynamic>> getProfile() async {
    final res = await ApiClient.get('/api/profile');
    if (!res.success) {
      throw Exception(res.message ?? '프로필 조회 실패');
    }
    final profile = res.data['profile'] as Map<String, dynamic>;
    return _normalize(profile);
  }

  /// 프로필 수정
  static Future<void> updateProfile({
    String? name,
    String? phone,
    String? address,
    String? birthDate,
    String? gender,
    String? company,
    String? position,
    String? department,
    String? workPhone,
  }) async {
    final res = await ApiClient.put('/api/profile', body: {
      'name': name,
      'phone': phone,
      'address': address,
      'birth_date': birthDate,
      'gender': gender,
      'company': company,
      'position': position,
      'department': department,
      'work_phone': workPhone,
    });
    if (!res.success) {
      throw Exception(res.message ?? '프로필 수정 실패');
    }
  }

  /// 프로필 이미지 변경
  static Future<void> updateProfileImage(String imageUrl) async {
    final res = await ApiClient.put('/api/profile/image', body: {
      'profile_image': imageUrl,
    });
    if (!res.success) {
      throw Exception(res.message ?? '프로필 이미지 변경 실패');
    }
  }

  /// 비밀번호 변경
  static Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final res = await ApiClient.put('/api/profile/password', body: {
      'current_password': currentPassword,
      'new_password': newPassword,
    });
    if (!res.success) {
      throw Exception(res.message ?? '비밀번호 변경 실패');
    }
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
