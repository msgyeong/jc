import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../providers/notice_attendance_provider.dart';
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
                  _AttendanceSurvey(noticeId: noticeId),
                ],
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

  void _confirmDelete(
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

/// 참석자 조사 위젯
class _AttendanceSurvey extends ConsumerStatefulWidget {
  const _AttendanceSurvey({required this.noticeId});
  final String noticeId;

  @override
  ConsumerState<_AttendanceSurvey> createState() => _AttendanceSurveyState();
}

class _AttendanceSurveyState extends ConsumerState<_AttendanceSurvey> {
  bool _submitting = false;

  Future<void> _vote(String status) async {
    setState(() => _submitting = true);
    final ok = await updateAttendance(widget.noticeId, status);
    if (mounted) {
      setState(() => _submitting = false);
      if (ok) {
        ref.invalidate(noticeAttendanceProvider(widget.noticeId));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('참석 상태 변경에 실패했습니다.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final asyncAttendance =
        ref.watch(noticeAttendanceProvider(widget.noticeId));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('참석자 조사', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        asyncAttendance.when(
          data: (att) {
            return Column(
              children: [
                Row(
                  children: [
                    _VoteChip(
                      label: '참석',
                      count: att.attending,
                      selected: att.myStatus == 'attending',
                      color: AppTheme.successColor,
                      onTap: _submitting ? null : () => _vote('attending'),
                    ),
                    const SizedBox(width: 8),
                    _VoteChip(
                      label: '불참',
                      count: att.notAttending,
                      selected: att.myStatus == 'not_attending',
                      color: AppTheme.errorColor,
                      onTap: _submitting ? null : () => _vote('not_attending'),
                    ),
                    const SizedBox(width: 8),
                    _VoteChip(
                      label: '미정',
                      count: att.undecided,
                      selected: att.myStatus == 'undecided',
                      color: AppTheme.textSecondary,
                      onTap: _submitting ? null : () => _vote('undecided'),
                    ),
                  ],
                ),
                if (att.attendees.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  ...att.attendees.map((a) => Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(
                          children: [
                            Text(
                              a['user_name'] as String? ?? '',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _statusLabel(a['status'] as String? ?? ''),
                              style: TextStyle(
                                fontSize: 12,
                                color: _statusColor(a['status'] as String? ?? ''),
                              ),
                            ),
                          ],
                        ),
                      )),
                ],
              ],
            );
          },
          loading: () => const Center(
            child: Padding(
              padding: EdgeInsets.all(12),
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
          error: (e, _) => Text(
            '참석 현황을 불러올 수 없습니다.',
            style: TextStyle(color: AppTheme.errorColor),
          ),
        ),
      ],
    );
  }

  String _statusLabel(String status) {
    return switch (status) {
      'attending' => '참석',
      'not_attending' => '불참',
      _ => '미정',
    };
  }

  Color _statusColor(String status) {
    return switch (status) {
      'attending' => AppTheme.successColor,
      'not_attending' => AppTheme.errorColor,
      _ => AppTheme.textSecondary,
    };
  }
}

class _VoteChip extends StatelessWidget {
  const _VoteChip({
    required this.label,
    required this.count,
    required this.selected,
    required this.color,
    this.onTap,
  });
  final String label;
  final int count;
  final bool selected;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: selected ? color.withOpacity(0.15) : Colors.grey.shade100,
            borderRadius: BorderRadius.circular(8),
            border: selected ? Border.all(color: color, width: 1.5) : null,
          ),
          child: Column(
            children: [
              Text(
                label,
                style: TextStyle(
                  fontWeight: selected ? FontWeight.bold : FontWeight.normal,
                  color: selected ? color : AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '$count',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: selected ? color : AppTheme.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
