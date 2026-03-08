import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../models/post_model.dart';
import '../../models/comment_model.dart';
import '../../providers/post_list_provider.dart';
import '../../services/post_service.dart';
import '../../services/session_service.dart';
import '../../theme/app_theme.dart';

class PostDetailScreen extends ConsumerStatefulWidget {
  const PostDetailScreen({super.key, required this.postId});
  final String postId;

  @override
  ConsumerState<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends ConsumerState<PostDetailScreen> {
  int? _currentUserId;
  String? _currentUserRole;
  bool _liked = false;
  int _likesCount = 0;

  @override
  void initState() {
    super.initState();
    _loadCurrentUser();
  }

  Future<void> _loadCurrentUser() async {
    final id = await SessionService.getUserId();
    final role = await SessionService.getUserRole();
    if (mounted) setState(() {
      _currentUserId = id;
      _currentUserRole = role;
    });
  }

  bool get _isAdmin =>
      _currentUserRole != null &&
      ['super_admin', 'admin'].contains(_currentUserRole);

  @override
  Widget build(BuildContext context) {
    final postAsync = ref.watch(postDetailProvider(widget.postId));

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('게시글'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          postAsync.whenOrNull(
            data: (post) {
              if (post == null) return null;
              final isAuthor =
                  _currentUserId?.toString() == post.authorId;
              if (!isAuthor && !_isAdmin) return null;
              return PopupMenuButton<String>(
                onSelected: (v) => _onMenuAction(v, post),
                itemBuilder: (_) => [
                  if (isAuthor)
                    const PopupMenuItem(
                        value: 'edit', child: Text('수정')),
                  const PopupMenuItem(
                      value: 'delete', child: Text('삭제')),
                ],
              );
            },
          ) ?? const SizedBox.shrink(),
        ],
      ),
      body: postAsync.when(
        data: (post) {
          if (post == null) {
            return const Center(child: Text('게시글을 찾을 수 없습니다.'));
          }
          // Initialize like state from post
          if (_likesCount == 0 && !_liked) {
            _liked = post.userHasLiked;
            _likesCount = post.likesCount;
          }
          return _buildBody(post);
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('오류: $err')),
      ),
    );
  }

  Widget _buildBody(PostModel post) {
    return Column(
      children: [
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(postDetailProvider(widget.postId));
              ref.invalidate(postCommentsProvider(widget.postId));
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  if (post.isPinned)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        children: [
                          Icon(Icons.push_pin,
                              size: 16, color: AppTheme.accentColor),
                          const SizedBox(width: 4),
                          Text('고정 공지',
                              style: TextStyle(
                                  color: AppTheme.accentColor,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  Text(post.title,
                      style: Theme.of(context).textTheme.headlineSmall),
                  const SizedBox(height: 8),
                  // Author + date
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 16,
                        backgroundImage: post.authorImage != null
                            ? NetworkImage(post.authorImage!)
                            : null,
                        child: post.authorImage == null
                            ? Text(
                                (post.authorName ?? '?')[0],
                                style: const TextStyle(fontSize: 14),
                              )
                            : null,
                      ),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(post.authorName ?? '알 수 없음',
                              style: Theme.of(context).textTheme.titleSmall),
                          Text(
                            DateFormat('yyyy.MM.dd HH:mm')
                                .format(post.createdAt),
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                      const Spacer(),
                      Icon(Icons.visibility_outlined,
                          size: 16, color: AppTheme.textSecondary),
                      const SizedBox(width: 4),
                      Text('${post.views}',
                          style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                  const Divider(height: 24),
                  // Content
                  Text(post.content,
                      style: Theme.of(context).textTheme.bodyLarge),
                  // Images
                  if (post.images != null && post.images!.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    ...post.images!.map((url) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(url,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) =>
                                    const SizedBox.shrink()),
                          ),
                        )),
                  ],
                  const SizedBox(height: 16),
                  // Like button
                  _buildLikeButton(),
                  const Divider(height: 24),
                  // Comments
                  _CommentSection(postId: widget.postId),
                ],
              ),
            ),
          ),
        ),
        _CommentInput(
          postId: widget.postId,
          onCommentAdded: () {
            ref.invalidate(postCommentsProvider(widget.postId));
            ref.invalidate(postDetailProvider(widget.postId));
          },
        ),
      ],
    );
  }

  Widget _buildLikeButton() {
    return InkWell(
      onTap: _toggleLike,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          border: Border.all(
            color: _liked ? AppTheme.errorColor : AppTheme.dividerColor,
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _liked ? Icons.favorite : Icons.favorite_border,
              size: 20,
              color: _liked ? AppTheme.errorColor : AppTheme.textSecondary,
            ),
            const SizedBox(width: 4),
            Text(
              '공감 $_likesCount',
              style: TextStyle(
                color: _liked ? AppTheme.errorColor : AppTheme.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _toggleLike() async {
    try {
      final result = await PostService.toggleLike(widget.postId);
      setState(() {
        _liked = result['liked'] as bool;
        _likesCount = result['likes_count'] as int;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('공감 처리 실패: $e')),
        );
      }
    }
  }

  void _onMenuAction(String action, PostModel post) {
    if (action == 'edit') {
      context.push('/home/board/${post.id}/edit');
    } else if (action == 'delete') {
      _confirmDelete(post);
    }
  }

  void _confirmDelete(PostModel post) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('게시글 삭제'),
        content: const Text('이 게시글을 삭제하시겠습니까?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: const Text('취소')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await PostService.delete(post.id);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('게시글이 삭제되었습니다.')),
                  );
                  // Refresh both lists
                  ref.read(noticePostListProvider.notifier).load();
                  ref.read(generalPostListProvider.notifier).load();
                  context.pop();
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('삭제 실패: $e')),
                  );
                }
              }
            },
            child: Text('삭제', style: TextStyle(color: AppTheme.errorColor)),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Comment Section
// ---------------------------------------------------------------------------

class _CommentSection extends ConsumerWidget {
  const _CommentSection({required this.postId});
  final String postId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final commentsAsync = ref.watch(postCommentsProvider(postId));

    return commentsAsync.when(
      data: (comments) {
        if (comments.isEmpty) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Center(
              child: Text('댓글이 없습니다.',
                  style: TextStyle(color: AppTheme.textSecondary)),
            ),
          );
        }

        // Organize: top-level comments + replies
        final topLevel =
            comments.where((c) => !c.isReply).toList();
        final replies = comments.where((c) => c.isReply).toList();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('댓글 ${comments.length}',
                style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            ...topLevel.map((comment) {
              final childReplies = replies
                  .where((r) => r.parentCommentId == comment.id)
                  .toList();
              return _CommentItem(
                comment: comment,
                replies: childReplies,
                postId: postId,
              );
            }),
          ],
        );
      },
      loading: () =>
          const Center(child: CircularProgressIndicator(strokeWidth: 2)),
      error: (err, _) => Text('댓글 로딩 실패: $err'),
    );
  }
}

class _CommentItem extends ConsumerStatefulWidget {
  const _CommentItem({
    required this.comment,
    required this.replies,
    required this.postId,
  });

  final CommentModel comment;
  final List<CommentModel> replies;
  final String postId;

  @override
  ConsumerState<_CommentItem> createState() => _CommentItemState();
}

class _CommentItemState extends ConsumerState<_CommentItem> {
  bool _showReplyInput = false;
  int? _currentUserId;
  String? _currentUserRole;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final id = await SessionService.getUserId();
    final role = await SessionService.getUserRole();
    if (mounted) setState(() {
      _currentUserId = id;
      _currentUserRole = role;
    });
  }

  bool get _isAdmin =>
      _currentUserRole != null &&
      ['super_admin', 'admin'].contains(_currentUserRole);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildComment(widget.comment, isReply: false),
        ...widget.replies
            .map((r) => _buildComment(r, isReply: true)),
        if (_showReplyInput)
          Padding(
            padding: const EdgeInsets.only(left: 40),
            child: _CommentInput(
              postId: widget.postId,
              parentCommentId: widget.comment.id,
              isReply: true,
              onCommentAdded: () {
                setState(() => _showReplyInput = false);
                ref.invalidate(postCommentsProvider(widget.postId));
                ref.invalidate(postDetailProvider(widget.postId));
              },
              onCancel: () => setState(() => _showReplyInput = false),
            ),
          ),
      ],
    );
  }

  Widget _buildComment(CommentModel comment, {required bool isReply}) {
    final dateStr = DateFormat('MM.dd HH:mm').format(comment.createdAt);
    final canDelete =
        _currentUserId?.toString() == comment.authorId || _isAdmin;

    return Padding(
      padding: EdgeInsets.only(left: isReply ? 40 : 0, bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: isReply ? 14 : 16,
            backgroundImage: comment.authorImage != null
                ? NetworkImage(comment.authorImage!)
                : null,
            child: comment.authorImage == null
                ? Text((comment.authorName ?? '?')[0],
                    style: TextStyle(fontSize: isReply ? 11 : 13))
                : null,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(comment.authorName ?? '알 수 없음',
                        style: const TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 13)),
                    const SizedBox(width: 6),
                    Text(dateStr,
                        style: TextStyle(
                            fontSize: 11, color: AppTheme.textSecondary)),
                  ],
                ),
                const SizedBox(height: 2),
                Text(comment.content,
                    style: const TextStyle(fontSize: 14)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    if (!isReply)
                      GestureDetector(
                        onTap: () =>
                            setState(() => _showReplyInput = !_showReplyInput),
                        child: Text('답글',
                            style: TextStyle(
                                fontSize: 12,
                                color: AppTheme.primaryColor,
                                fontWeight: FontWeight.w500)),
                      ),
                    if (canDelete) ...[
                      const SizedBox(width: 12),
                      GestureDetector(
                        onTap: () => _deleteComment(comment),
                        child: Text('삭제',
                            style: TextStyle(
                                fontSize: 12,
                                color: AppTheme.errorColor)),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteComment(CommentModel comment) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('댓글 삭제'),
        content: const Text('이 댓글을 삭제하시겠습니까?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('취소')),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text('삭제',
                  style: TextStyle(color: AppTheme.errorColor))),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await PostService.deleteComment(
          postId: widget.postId, commentId: comment.id);
      ref.invalidate(postCommentsProvider(widget.postId));
      ref.invalidate(postDetailProvider(widget.postId));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('댓글 삭제 실패: $e')));
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Comment Input
// ---------------------------------------------------------------------------

class _CommentInput extends StatefulWidget {
  const _CommentInput({
    required this.postId,
    required this.onCommentAdded,
    this.parentCommentId,
    this.isReply = false,
    this.onCancel,
  });

  final String postId;
  final String? parentCommentId;
  final bool isReply;
  final VoidCallback onCommentAdded;
  final VoidCallback? onCancel;

  @override
  State<_CommentInput> createState() => _CommentInputState();
}

class _CommentInputState extends State<_CommentInput> {
  final _controller = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: widget.isReply ? 8 : 16,
        vertical: 8,
      ),
      decoration: widget.isReply
          ? null
          : BoxDecoration(
              color: AppTheme.surfaceColor,
              border: Border(
                  top: BorderSide(color: AppTheme.dividerColor)),
            ),
      child: Row(
        children: [
          if (widget.isReply && widget.onCancel != null)
            IconButton(
              icon: const Icon(Icons.close, size: 18),
              onPressed: widget.onCancel,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
          Expanded(
            child: TextField(
              controller: _controller,
              decoration: InputDecoration(
                hintText: widget.isReply ? '답글 입력...' : '댓글 입력...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: BorderSide(color: AppTheme.dividerColor),
                ),
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 10),
                isDense: true,
              ),
              maxLines: null,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _submit(),
            ),
          ),
          const SizedBox(width: 8),
          _sending
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(strokeWidth: 2))
              : IconButton(
                  icon: Icon(Icons.send, color: AppTheme.primaryColor),
                  onPressed: _submit,
                ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _sending) return;

    setState(() => _sending = true);
    try {
      await PostService.createComment(
        postId: widget.postId,
        content: text,
        parentCommentId: widget.parentCommentId,
      );
      _controller.clear();
      widget.onCommentAdded();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('댓글 등록 실패: $e')));
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }
}
