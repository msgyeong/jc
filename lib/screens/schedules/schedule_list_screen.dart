import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../providers/schedule_list_provider.dart';
import '../../services/session_service.dart';
import '../../theme/app_theme.dart';

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
            return const Center(child: Text('등록된 일정이 없습니다.'));
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
          child: Text('일정을 불러올 수 없습니다.',
              style: TextStyle(color: AppTheme.errorColor)),
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

    String dateStr = '';
    if (startRaw != null) {
      try {
        final start = DateTime.parse(startRaw);
        dateStr = DateFormat('yyyy.MM.dd (E)', 'ko_KR').format(start);
        if (endRaw != null) {
          final end = DateTime.parse(endRaw);
          if (!start.isAtSameMomentAs(end)) {
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
        borderRadius: BorderRadius.circular(8),
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
                      : AppTheme.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.event,
                  color: isPast ? Colors.grey : AppTheme.primaryColor,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (category.isNotEmpty)
                      Container(
                        margin: const EdgeInsets.only(bottom: 4),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.secondaryColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          category,
                          style: TextStyle(
                            fontSize: 11,
                            color: AppTheme.secondaryColor,
                          ),
                        ),
                      ),
                    Text(
                      schedule['title'] as String? ?? '',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: isPast ? Colors.grey : null,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      [dateStr, location]
                          .where((e) => e.isNotEmpty)
                          .join(' | '),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
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
