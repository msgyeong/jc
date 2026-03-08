import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../providers/notice_list_provider.dart';
import '../providers/schedule_list_provider.dart';
import '../services/session_service.dart';
import '../theme/app_theme.dart';

/// 홈 탭 - 최근 공지사항 & 다가오는 일정 대시보드
class HomeTabScreen extends ConsumerWidget {
  const HomeTabScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final noticesAsync = ref.watch(noticeListProvider);
    final schedulesAsync = ref.watch(scheduleListProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('영등포 청년회의소'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.read(noticeListProvider.notifier).load();
          ref.read(scheduleListProvider.notifier).load();
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _GreetingCard(),
            const SizedBox(height: 20),
            _SectionHeader(
              title: '최근 공지사항',
              onMore: () => context.go('/home/notices'),
            ),
            const SizedBox(height: 8),
            noticesAsync.when(
              data: (notices) {
                if (notices.isEmpty) {
                  return const _EmptyCard(message: '등록된 공지가 없습니다.');
                }
                final recent = notices.take(3).toList();
                return Column(
                  children: recent.map((notice) {
                    final dateStr = DateFormat('MM/dd').format(notice.createdAt);
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: notice.isPinned
                            ? Icon(Icons.push_pin,
                                size: 20, color: AppTheme.accentColor)
                            : null,
                        title: Text(
                          notice.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        subtitle: Text(dateStr),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () =>
                            context.push('/home/notices/${notice.id}'),
                      ),
                    );
                  }).toList(),
                );
              },
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
              ),
              error: (e, _) => _EmptyCard(message: '공지 로딩 실패'),
            ),
            const SizedBox(height: 20),
            _SectionHeader(
              title: '다가오는 일정',
              onMore: () => context.go('/home/schedule'),
            ),
            const SizedBox(height: 8),
            schedulesAsync.when(
              data: (schedules) {
                if (schedules.isEmpty) {
                  return const _EmptyCard(message: '등록된 일정이 없습니다.');
                }
                final upcoming = schedules.take(3).toList();
                return Column(
                  children: upcoming.map((s) {
                    final startRaw = s['start_date'] as String?;
                    String dateStr = '';
                    if (startRaw != null) {
                      try {
                        dateStr = DateFormat('MM/dd (E)', 'ko_KR')
                            .format(DateTime.parse(startRaw));
                      } catch (_) {
                        dateStr = startRaw.substring(0, 10);
                      }
                    }
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: const Icon(Icons.event,
                            color: AppTheme.primaryColor),
                        title: Text(
                          s['title'] as String? ?? '',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        subtitle: Text(
                          [dateStr, s['location'] as String? ?? '']
                              .where((e) => e.isNotEmpty)
                              .join(' | '),
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () =>
                            context.push('/home/schedule/${s['id']}'),
                      ),
                    );
                  }).toList(),
                );
              },
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
              ),
              error: (e, _) => const _EmptyCard(message: '일정 로딩 실패'),
            ),
          ],
        ),
      ),
    );
  }
}

class _GreetingCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return FutureBuilder<String?>(
      future: SessionService.getUserName(),
      builder: (context, snapshot) {
        final name = snapshot.data ?? '회원';
        return Card(
          color: AppTheme.primaryColor,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '안녕하세요, $name님',
                        style: Theme.of(context)
                            .textTheme
                            .titleLarge
                            ?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '영등포 청년회의소에 오신 것을 환영합니다.',
                        style: Theme.of(context)
                            .textTheme
                            .bodyMedium
                            ?.copyWith(color: Colors.white70),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.groups, size: 48, color: Colors.white24),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, this.onMore});
  final String title;
  final VoidCallback? onMore;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: Theme.of(context)
              .textTheme
              .titleMedium
              ?.copyWith(fontWeight: FontWeight.bold),
        ),
        if (onMore != null)
          TextButton(
            onPressed: onMore,
            child: const Text('더보기'),
          ),
      ],
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Text(
            message,
            style: const TextStyle(color: AppTheme.textSecondary),
          ),
        ),
      ),
    );
  }
}
