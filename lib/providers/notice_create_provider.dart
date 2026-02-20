import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/notice_service.dart';
import '../services/supabase_service.dart';
import 'notice_list_provider.dart';

/// 공지사항 작성 결과
typedef NoticeCreateResult = ({bool success, String? noticeId, String? error});

/// 공지사항 작성
final noticeCreateProvider =
    StateNotifierProvider<NoticeCreateNotifier, AsyncValue<NoticeCreateResult?>>(
  (ref) => NoticeCreateNotifier(ref),
);

class NoticeCreateNotifier extends StateNotifier<AsyncValue<NoticeCreateResult?>> {
  NoticeCreateNotifier(this._ref) : super(const AsyncValue.data(null));

  final Ref _ref;

  Future<NoticeCreateResult> submit({
    required String title,
    required String content,
    bool isPinned = false,
    bool hasAttendance = false,
  }) async {
    state = const AsyncValue.loading();
    final userId = SupabaseService.client.auth.currentUser?.id;
    if (userId == null) {
      state = const AsyncValue.data((
        success: false,
        noticeId: null,
        error: '로그인이 필요합니다.',
      ));
      return state.value!;
    }
    try {
      final id = await NoticeService.create(
        authorId: userId,
        title: title,
        content: content,
        isPinned: isPinned,
        hasAttendance: hasAttendance,
      );
      state = AsyncValue.data((success: true, noticeId: id, error: null));
      _ref.read(noticeListProvider.notifier).load();
      return state.value!;
    } catch (e) {
      final msg = e.toString().replaceFirst('Exception: ', '');
      state = AsyncValue.data((
        success: false,
        noticeId: null,
        error: msg,
      ));
      return state.value!;
    }
  }

  void reset() => state = const AsyncValue.data(null);
}
