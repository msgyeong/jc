import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/notice_model.dart';
import '../services/notice_service.dart';

/// 공지사항 목록 상태
class NoticeListState {
  const NoticeListState({
    this.notices = const [],
    this.loading = false,
    this.error,
  });

  final List<NoticeModel> notices;
  final bool loading;
  final String? error;

  NoticeListState copyWith({
    List<NoticeModel>? notices,
    bool? loading,
    String? error,
  }) =>
      NoticeListState(
        notices: notices ?? this.notices,
        loading: loading ?? this.loading,
        error: error,
      );
}

/// 공지사항 목록 (고정 공지 우선)
final noticeListProvider =
    StateNotifierProvider<NoticeListNotifier, AsyncValue<List<NoticeModel>>>(
  (ref) => NoticeListNotifier(),
);

class NoticeListNotifier extends StateNotifier<AsyncValue<List<NoticeModel>>> {
  NoticeListNotifier() : super(const AsyncValue.loading()) {
    load();
  }

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      final list = await NoticeService.getList(page: 1, limit: 50);
      state = AsyncValue.data(list);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}
