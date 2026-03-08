import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/api_client.dart';

/// 참석 현황 데이터
class AttendanceState {
  const AttendanceState({
    this.attending = 0,
    this.notAttending = 0,
    this.undecided = 0,
    this.myStatus = 'undecided',
    this.attendees = const [],
  });

  final int attending;
  final int notAttending;
  final int undecided;
  final String myStatus;
  final List<Map<String, dynamic>> attendees;
}

/// 공지 참석 현황
final noticeAttendanceProvider = FutureProvider.family<AttendanceState, String>(
  (ref, noticeId) async {
    final res = await ApiClient.get('/api/notices/$noticeId/attendance');
    if (!res.success) {
      throw Exception(res.message ?? '참석 현황 조회 실패');
    }
    final summary = res.data['summary'] as Map<String, dynamic>;
    final attendees = (res.data['attendees'] as List<dynamic>?)
            ?.map((e) => Map<String, dynamic>.from(e as Map))
            .toList() ??
        [];
    return AttendanceState(
      attending: summary['attending'] as int? ?? 0,
      notAttending: summary['not_attending'] as int? ?? 0,
      undecided: summary['undecided'] as int? ?? 0,
      myStatus: res.data['myStatus'] as String? ?? 'undecided',
      attendees: attendees,
    );
  },
);

/// 참석 상태 변경
Future<bool> updateAttendance(String noticeId, String status) async {
  final res = await ApiClient.post(
    '/api/notices/$noticeId/attendance',
    body: {'status': status},
  );
  return res.success;
}
