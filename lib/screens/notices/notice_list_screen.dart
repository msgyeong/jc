import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../models/notice_model.dart';
import '../../providers/notice_list_provider.dart';
import '../../theme/app_theme.dart';

/// 공지사항 목록 (고정 공지 우선, N배지, 작성 버튼)
class NoticeListScreen extends ConsumerWidget {
  const NoticeListScreen({super.key});

  static const int newDays = 3;

  static bool isNew(DateTime createdAt) {
    return DateTime.now().difference(createdAt).inDays < newDays;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listAsync = ref.watch(noticeListProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('공지사항'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: listAsync.when(
        data: (notices) {
          if (notices.isEmpty) {
            return const Center(
              child: Text('등록된 공지가 없습니다.'),
            );
          }
          return RefreshIndicator(
            onRefresh: () => ref.read(noticeListProvider.notifier).load(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: notices.length,
              itemBuilder: (context, index) {
                final notice = notices[index];
                return _NoticeCard(notice: notice);
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('목록을 불러올 수 없습니다.', style: TextStyle(color: AppTheme.errorColor)),
              const SizedBox(height: 8),
              Text(err.toString()),
            ],
          ),
        ),
      ),
      floatingActionButton: _buildFab(context),
    );
  }

  Widget? _buildFab(BuildContext context) {
    return FloatingActionButton(
      onPressed: () => context.push('/home/notices/create'),
      child: const Icon(Icons.add),
    );
  }
}

class _NoticeCard extends StatelessWidget {
  const _NoticeCard({required this.notice});

  final NoticeModel notice;

  @override
  Widget build(BuildContext context) {
    final isNew = NoticeListScreen.isNew(notice.createdAt);
    final dateStr = DateFormat('yyyy.MM.dd').format(notice.createdAt);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => context.push('/home/notices/${notice.id}'),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  if (notice.isPinned)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Icon(
                        Icons.push_pin,
                        size: 18,
                        color: AppTheme.accentColor,
                      ),
                    ),
                  Expanded(
                    child: Text(
                      notice.title,
                      style: Theme.of(context).textTheme.titleMedium,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (isNew)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.errorColor,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'N',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Text(
                    dateStr,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                  ),
                  if (notice.hasAttendance) ...[
                    const SizedBox(width: 8),
                    const Icon(Icons.how_to_vote, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      '참석조사',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                    ),
                  ],
                  const Spacer(),
                  if (notice.commentsCount > 0)
                    Text(
                      '💬 ${notice.commentsCount}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  if (notice.likesCount > 0) ...[
                    const SizedBox(width: 8),
                    Text(
                      '❤️ ${notice.likesCount}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
