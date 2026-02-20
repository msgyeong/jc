import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/notice_model.dart';
import '../services/notice_service.dart';

/// 공지사항 상세 (id별)
final noticeDetailProvider =
    FutureProvider.family<NoticeModel?, String>((ref, id) async {
  await NoticeService.incrementViews(id);
  return NoticeService.getById(id);
});

/// 공지사항 상세 갱신용
final noticeDetailRefreshProvider = Provider<void Function(String id)>((ref) {
  return (String id) {
    ref.invalidate(noticeDetailProvider(id));
  };
});
