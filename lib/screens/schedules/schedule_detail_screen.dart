import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../providers/schedule_list_provider.dart';
import '../../services/schedule_service.dart';
import '../../services/session_service.dart';
import '../../theme/app_theme.dart';

const _categoryLabels = <String, String>{
  'event': '행사',
  'meeting': '정기회의',
  'training': '교육',
  'holiday': '공휴일',
  'other': '기타',
};

/// 현재 사용자 정보 Provider
final _currentUserProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final id = await SessionService.getUserId();
  final role = await SessionService.getUserRole();
  return {'id': id, 'role': role};
});

/// 일정 상세 화면
class ScheduleDetailScreen extends ConsumerWidget {
  const ScheduleDetailScreen({super.key, required this.scheduleId});
  final String scheduleId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncSchedule = ref.watch(scheduleDetailProvider(scheduleId));
    final asyncUser = ref.watch(_currentUserProvider);
    final userId = asyncUser.valueOrNull?['id'];
    final userRole = asyncUser.valueOrNull?['role'] as String? ?? '';

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('일정 상세'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          asyncSchedule.whenOrNull(
                data: (schedule) {
                  if (schedule == null) return null;
                  final isAuthor = userId != null &&
                      schedule['author_id'] == userId.toString();
                  final isAdmin = userRole == 'admin' || userRole == 'super_admin';
                  if (!isAuthor && !isAdmin) return null;
                  return Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit_outlined),
                        tooltip: '수정',
                        onPressed: () =>
                            context.push('/home/schedule/$scheduleId/edit'),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline),
                        tooltip: '삭제',
                        onPressed: () => _confirmDelete(context, ref),
                      ),
                    ],
                  );
                },
              ) ??
              const SizedBox.shrink(),
        ],
      ),
      body: asyncSchedule.when(
        data: (schedule) {
          if (schedule == null) {
            return const Center(child: Text('일정을 찾을 수 없습니다.'));
          }
          return _buildBody(context, schedule);
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Text('오류: $e',
              style: const TextStyle(color: AppTheme.errorColor)),
        ),
      ),
    );
  }

  Widget _buildBody(BuildContext context, Map<String, dynamic> schedule) {
    final startRaw = schedule['start_date'] as String?;
    final endRaw = schedule['end_date'] as String?;
    final location = schedule['location'] as String? ?? '';
    final description = schedule['description'] as String? ?? '';
    final category = schedule['category'] as String? ?? '';
    final authorName = schedule['author_name'] as String? ?? '';
    final createdRaw = schedule['created_at'] as String?;

    final categoryLabel = _categoryLabels[category] ?? category;

    String dateStr = '';
    String timeStr = '';
    if (startRaw != null) {
      try {
        final start = DateTime.parse(startRaw);
        dateStr = DateFormat('yyyy년 MM월 dd일 (E)', 'ko_KR').format(start);
        if (start.hour != 0 || start.minute != 0) {
          timeStr = DateFormat('HH:mm').format(start);
        }
        if (endRaw != null) {
          final end = DateTime.parse(endRaw);
          if (!start.isAtSameMomentAs(end)) {
            dateStr +=
                ' ~ ${DateFormat('yyyy년 MM월 dd일 (E)', 'ko_KR').format(end)}';
          }
          if (end.hour != 0 || end.minute != 0) {
            final endTimeStr = DateFormat('HH:mm').format(end);
            timeStr = timeStr.isNotEmpty
                ? '$timeStr ~ $endTimeStr'
                : endTimeStr;
          }
        }
      } catch (_) {
        dateStr = startRaw;
      }
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (categoryLabel.isNotEmpty)
            Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(categoryLabel,
                  style: const TextStyle(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  )),
            ),
          Text(
            schedule['title'] as String? ?? '',
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 20),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  if (dateStr.isNotEmpty)
                    _InfoRow(icon: Icons.calendar_today, label: '일시', value: dateStr),
                  if (timeStr.isNotEmpty)
                    _InfoRow(icon: Icons.access_time, label: '시간', value: timeStr),
                  if (location.isNotEmpty)
                    _InfoRow(
                        icon: Icons.location_on, label: '장소', value: location),
                  if (authorName.isNotEmpty)
                    _InfoRow(
                        icon: Icons.person, label: '작성자', value: authorName),
                  if (createdRaw != null)
                    _InfoRow(
                      icon: Icons.edit_calendar,
                      label: '등록일',
                      value: DateFormat('yyyy.MM.dd HH:mm')
                          .format(DateTime.parse(createdRaw)),
                    ),
                ],
              ),
            ),
          ),
          if (description.isNotEmpty) ...[
            const SizedBox(height: 16),
            Card(
              child: SizedBox(
                width: double.infinity,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    description,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('삭제'),
        content: const Text('이 일정을 삭제할까요?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('취소'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.errorColor),
            child: const Text('삭제'),
          ),
        ],
      ),
    );
    if (ok == true && context.mounted) {
      try {
        await ScheduleService.delete(scheduleId);
        ref.invalidate(scheduleListProvider);
        if (context.mounted) context.pop();
      } catch (_) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('삭제에 실패했습니다.')),
          );
        }
      }
    }
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });
  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: AppTheme.textSecondary),
          const SizedBox(width: 8),
          SizedBox(
            width: 48,
            child: Text(
              label,
              style: const TextStyle(color: AppTheme.textSecondary),
            ),
          ),
          Expanded(
            child: Text(value, style: Theme.of(context).textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}
