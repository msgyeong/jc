import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../providers/schedule_list_provider.dart';
import '../../services/session_service.dart';
import '../../theme/app_theme.dart';

const _categoryLabels = <String, String>{
  'event': '행사',
  'meeting': '정기회의',
  'training': '교육',
  'holiday': '공휴일',
  'other': '기타',
};

const _categoryColors = <String, Color>{
  'event': Color(0xFF1F4FD8),
  'meeting': Color(0xFF059669),
  'training': Color(0xFFF59E0B),
  'holiday': Color(0xFFDC2626),
  'other': Color(0xFF6B7280),
};

/// 일정 목록
class ScheduleListScreen extends ConsumerWidget {
  const ScheduleListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listAsync = ref.watch(scheduleListProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('일정'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: listAsync.when(
        data: (schedules) {
          if (schedules.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.event_busy, size: 64, color: Colors.grey.shade300),
                  const SizedBox(height: 12),
                  const Text(
                    '등록된 일정이 없습니다.',
                    style: TextStyle(color: AppTheme.textSecondary),
                  ),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () => ref.read(scheduleListProvider.notifier).load(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: schedules.length,
              itemBuilder: (context, index) {
                final s = schedules[index];
                return _ScheduleCard(schedule: s);
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('일정을 불러올 수 없습니다.',
                  style: TextStyle(color: AppTheme.errorColor)),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => ref.read(scheduleListProvider.notifier).load(),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FutureBuilder<String?>(
        future: SessionService.getUserRole(),
        builder: (context, snapshot) {
          final role = snapshot.data;
          if (role == 'admin' || role == 'super_admin') {
            return FloatingActionButton(
              onPressed: () => context.push('/home/schedule/create'),
              child: const Icon(Icons.add),
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }
}

class _ScheduleCard extends StatelessWidget {
  const _ScheduleCard({required this.schedule});
  final Map<String, dynamic> schedule;

  @override
  Widget build(BuildContext context) {
    final startRaw = schedule['start_date'] as String?;
    final endRaw = schedule['end_date'] as String?;
    final location = schedule['location'] as String? ?? '';
    final category = schedule['category'] as String? ?? '';
    final categoryLabel = _categoryLabels[category] ?? category;
    final categoryColor = _categoryColors[category] ?? AppTheme.primaryColor;

    String dateStr = '';
    String timeStr = '';
    if (startRaw != null) {
      try {
        final start = DateTime.parse(startRaw);
        dateStr = DateFormat('MM.dd (E)', 'ko_KR').format(start);
        if (start.hour != 0 || start.minute != 0) {
          timeStr = DateFormat('HH:mm').format(start);
        }
        if (endRaw != null) {
          final end = DateTime.parse(endRaw);
          if (start.year != end.year ||
              start.month != end.month ||
              start.day != end.day) {
            dateStr += ' ~ ${DateFormat('MM.dd (E)', 'ko_KR').format(end)}';
          }
        }
      } catch (_) {
        dateStr = startRaw;
      }
    }

    final isPast = startRaw != null &&
        DateTime.tryParse(startRaw)?.isBefore(DateTime.now()) == true;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => context.push('/home/schedule/${schedule['id']}'),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isPast
                      ? Colors.grey.shade200
                      : categoryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.event,
                  color: isPast ? Colors.grey : categoryColor,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (categoryLabel.isNotEmpty)
                      Container(
                        margin: const EdgeInsets.only(bottom: 4),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: categoryColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          categoryLabel,
                          style: TextStyle(fontSize: 11, color: categoryColor),
                        ),
                      ),
                    Text(
                      schedule['title'] as String? ?? '',
                      style:
                          Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: isPast ? Colors.grey : null,
                              ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      [dateStr, timeStr, location]
                          .where((e) => e.isNotEmpty)
                          .join(' | '),
                      style:
                          Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppTheme.textSecondary,
                              ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppTheme.textSecondary),
            ],
          ),
        ),
      ),
    );
  }
}
