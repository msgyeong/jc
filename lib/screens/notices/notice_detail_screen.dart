import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../providers/notice_detail_provider.dart';
import '../../providers/notice_list_provider.dart';
import '../../services/notice_service.dart';
import '../../services/session_service.dart';
import '../../theme/app_theme.dart';

/// 현재 사용자 ID Provider (캐시)
final _currentUserIdProvider = FutureProvider<int?>((ref) async {
  return SessionService.getUserId();
});

/// 공지사항 상세 (제목, 작성자, 본문, 공감, 참석조사, 댓글, 수정/삭제)
class NoticeDetailScreen extends ConsumerWidget {
  const NoticeDetailScreen({super.key, required this.noticeId});

  final String noticeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncNotice = ref.watch(noticeDetailProvider(noticeId));
    final asyncUserId = ref.watch(_currentUserIdProvider);
    final userId = asyncUserId.valueOrNull;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('공지사항'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          asyncNotice.whenOrNull(
            data: (notice) {
              if (notice == null) return null;
              final isAuthor =
                  userId != null && notice.authorId == userId.toString();
              if (!isAuthor) return null;
              return PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert),
                onSelected: (value) {
                  if (value == 'edit') {
                    context.push('/home/notices/${noticeId}/edit');
                  } else if (value == 'delete') {
                    _confirmDelete(context, ref, noticeId);
                  }
                },
                itemBuilder: (_) => [
                  const PopupMenuItem(
                    value: 'edit',
                    child: Text('수정'),
                  ),
                  const PopupMenuItem(
                    value: 'delete',
                    child: Text('삭제'),
                  ),
                ],
              );
            },
          ) ?? const SizedBox.shrink(),
        ],
      ),
      body: asyncNotice.when(
        data: (notice) {
          if (notice == null) {
            return const Center(child: Text('공지를 찾을 수 없습니다.'));
          }
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  notice.title,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Text(
                      notice.authorName ?? '작성자',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      DateFormat('yyyy.MM.dd HH:mm').format(notice.createdAt),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  notice.content,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                if (notice.likesCount > 0 || notice.commentsCount > 0) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      if (notice.likesCount > 0)
                        Text('${notice.likesCount}'),
                      if (notice.commentsCount > 0) ...[
                        const SizedBox(width: 16),
                        Text('${notice.commentsCount}'),
                      ],
                    ],
                  ),
                ],
                if (notice.attendanceSurveyEnabled) ...[
                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 8),
                  Text(
                    '참석자 조사',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    '참석/불참/미정 선택 (추후 연동)',
                    style: TextStyle(color: AppTheme.textSecondary),
                  ),
                ],
                const SizedBox(height: 24),
                const Divider(),
                const SizedBox(height: 8),
                Text(
                  '댓글',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                const Text(
                  '댓글 목록 (추후 연동)',
                  style: TextStyle(color: AppTheme.textSecondary),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Text('오류: $e', style: const TextStyle(color: AppTheme.errorColor)),
        ),
      ),
    );
  }

  static void _confirmDelete(
    BuildContext context,
    WidgetRef ref,
    String id,
  ) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('삭제'),
        content: const Text('이 공지를 삭제할까요?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('취소'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('삭제'),
          ),
        ],
      ),
    );
    if (ok == true && context.mounted) {
      try {
        await NoticeService.delete(id);
        ref.invalidate(noticeListProvider);
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
