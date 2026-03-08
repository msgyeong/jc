import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/member_service.dart';

/// 회원 목록
final memberListProvider = StateNotifierProvider<MemberListNotifier,
    AsyncValue<List<Map<String, dynamic>>>>(
  (ref) => MemberListNotifier(),
);

class MemberListNotifier
    extends StateNotifier<AsyncValue<List<Map<String, dynamic>>>> {
  MemberListNotifier() : super(const AsyncValue.loading()) {
    load();
  }

  String _searchQuery = '';

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      List<Map<String, dynamic>> members;
      if (_searchQuery.isNotEmpty) {
        members = await MemberService.search(_searchQuery);
      } else {
        final result = await MemberService.getList();
        members = result['members'] as List<Map<String, dynamic>>;
      }
      state = AsyncValue.data(members);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> search(String query) async {
    _searchQuery = query.trim();
    await load();
  }
}

/// 회원 상세
final memberDetailProvider =
    FutureProvider.family<Map<String, dynamic>?, String>((ref, id) async {
  return MemberService.getById(id);
});
