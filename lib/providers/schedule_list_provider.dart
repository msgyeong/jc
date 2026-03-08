import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/schedule_service.dart';

/// 일정 목록
final scheduleListProvider = StateNotifierProvider<ScheduleListNotifier,
    AsyncValue<List<Map<String, dynamic>>>>(
  (ref) => ScheduleListNotifier(),
);

class ScheduleListNotifier
    extends StateNotifier<AsyncValue<List<Map<String, dynamic>>>> {
  ScheduleListNotifier() : super(const AsyncValue.loading()) {
    load();
  }

  Future<void> load({bool upcomingOnly = false}) async {
    state = const AsyncValue.loading();
    try {
      final list = await ScheduleService.getList(upcomingOnly: upcomingOnly);
      state = AsyncValue.data(list);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

/// 일정 상세
final scheduleDetailProvider =
    FutureProvider.family<Map<String, dynamic>?, String>((ref, id) async {
  return ScheduleService.getById(id);
});
