import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/profile_service.dart';

/// 내 프로필
final profileProvider =
    AsyncNotifierProvider<ProfileNotifier, Map<String, dynamic>?>(
  ProfileNotifier.new,
);

class ProfileNotifier extends AsyncNotifier<Map<String, dynamic>?> {
  @override
  Future<Map<String, dynamic>?> build() async {
    return ProfileService.getProfile();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ProfileService.getProfile());
  }

  Future<bool> updateProfile({
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
    try {
      await ProfileService.updateProfile(
        name: name,
        phone: phone,
        address: address,
        birthDate: birthDate,
        gender: gender,
        company: company,
        position: position,
        department: department,
        workPhone: workPhone,
      );
      await refresh();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> updateImage(String imageUrl) async {
    try {
      await ProfileService.updateProfileImage(imageUrl);
      await refresh();
      return true;
    } catch (_) {
      return false;
    }
  }
}
