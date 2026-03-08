import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/post_model.dart';
import '../../providers/post_list_provider.dart';
import '../../services/session_service.dart';

// ── 디자인 시스템 색상 ──────────────────────────────────
const _kPrimary = Color(0xFF1F4FD8);
const _kBackground = Color(0xFFF9FAFB);
const _kCardBg = Color(0xFFFFFFFF);
const _kText = Color(0xFF111827);
const _kSubText = Color(0xFF6B7280);
const _kError = Color(0xFFDC2626);

/// 게시판 메인 화면 (공지 게시판 / 일반 게시판 탭)
class BoardScreen extends ConsumerStatefulWidget {
  const BoardScreen({super.key});

  @override
  ConsumerState<BoardScreen> createState() => _BoardScreenState();
}

class _BoardScreenState extends ConsumerState<BoardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String? _userRole;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) setState(() {});
    });
    _loadUserRole();
  }

  Future<void> _loadUserRole() async {
    final role = await SessionService.getUserRole();
    if (mounted) setState(() => _userRole = role);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  bool get _isAdmin =>
      _userRole != null &&
      ['super_admin', 'admin'].contains(_userRole);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _kBackground,
      appBar: AppBar(
        title: const Text('게시판'),
        backgroundColor: _kPrimary,
        foregroundColor: Colors.white,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          labelStyle:
              const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
          unselectedLabelStyle:
              const TextStyle(fontSize: 15, fontWeight: FontWeight.w400),
          tabs: const [
            Tab(text: '공지 게시판'),
            Tab(text: '일반 게시판'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _PostListTab(
            provider: noticePostListProvider,
            category: 'notice',
          ),
          _PostListTab(
            provider: generalPostListProvider,
            category: 'general',
          ),
        ],
      ),
      floatingActionButton: _buildFab(),
    );
  }

  Widget? _buildFab() {
    final isNoticeTab = _tabController.index == 0;
    if (isNoticeTab && !_isAdmin) return null;

    return FloatingActionButton(
      backgroundColor: _kPrimary,
      foregroundColor: Colors.white,
      onPressed: () {
        final category = isNoticeTab ? 'notice' : 'general';
        context.push('/home/board/create?category=$category');
      },
      child: const Icon(Icons.edit),
    );
  }
}

// ─────────────────────────────────────────────────────────
// 게시글 목록 탭
// ─────────────────────────────────────────────────────────

class _PostListTab extends ConsumerWidget {
  const _PostListTab({
    required this.provider,
    required this.category,
  });

  final StateNotifierProvider<PostListNotifier, AsyncValue<List<PostModel>>>
      provider;
  final String category;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listAsync = ref.watch(provider);

    return listAsync.when(
      data: (posts) {
        if (posts.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.article_outlined, size: 48, color: _kSubText.withValues(alpha: 0.4)),
                const SizedBox(height: 12),
                Text(
                  category == 'notice'
                      ? '등록된 공지가 없습니다.'
                      : '등록된 게시글이 없습니다.',
                  style: const TextStyle(color: _kSubText, fontSize: 14),
                ),
              ],
            ),
          );
        }

        // 공지탭: pinned 게시글을 상단에 정렬
        final sorted = category == 'notice'
            ? [
                ...posts.where((p) => p.isPinned),
                ...posts.where((p) => !p.isPinned),
              ]
            : posts;

        return RefreshIndicator(
          color: _kPrimary,
          onRefresh: () => ref.read(provider.notifier).load(),
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: sorted.length,
            itemBuilder: (context, index) {
              return _PostCard(post: sorted[index]);
            },
          ),
        );
      },
      loading: () => const Center(
        child: CircularProgressIndicator(color: _kPrimary),
      ),
      error: (err, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: _kError),
            const SizedBox(height: 12),
            const Text('목록을 불러올 수 없습니다.',
                style: TextStyle(color: _kError, fontSize: 14)),
            const SizedBox(height: 4),
            Text(err.toString(),
                style: const TextStyle(fontSize: 12, color: _kSubText)),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () => ref.read(provider.notifier).load(),
              child: const Text('다시 시도',
                  style: TextStyle(color: _kPrimary)),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────
// 게시글 카드 위젯
// ─────────────────────────────────────────────────────────

class _PostCard extends StatelessWidget {
  const _PostCard({required this.post});

  final PostModel post;

  static const int _newDays = 3;

  @override
  Widget build(BuildContext context) {
    final isNew =
        DateTime.now().difference(post.createdAt).inDays < _newDays &&
            !post.readByCurrentUser;
    final hasImage = post.images != null && post.images!.isNotEmpty;

    return Padding(
      padding: const EdgeInsets.only(bottom: 6, top: 6),
      child: Material(
        color: _kCardBg,
        elevation: 1,
        shadowColor: Colors.black12,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: () => context.push('/home/board/${post.id}'),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── 상단: 프로필 + 작성자 + 시간 + N배지 ──
                Row(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: _kPrimary.withValues(alpha: 0.1),
                      backgroundImage: post.authorImage != null
                          ? NetworkImage(post.authorImage!)
                          : null,
                      child: post.authorImage == null
                          ? Text(
                              (post.authorName ?? '?')[0],
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: _kPrimary,
                              ),
                            )
                          : null,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      post.authorName ?? '알 수 없음',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: _kText,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '·',
                      style: TextStyle(
                        fontSize: 14,
                        color: _kSubText.withValues(alpha: 0.6),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _relativeTime(post.createdAt),
                      style: const TextStyle(fontSize: 12, color: _kSubText),
                    ),
                    const Spacer(),
                    if (isNew)
                      Container(
                        width: 18,
                        height: 18,
                        decoration: const BoxDecoration(
                          color: _kError,
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          'N',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 10),

                // ── 제목 + 썸네일 행 ──
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 고정 공지 라벨 + 제목
                          if (post.isPinned)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 2),
                              child: Row(
                                children: const [
                                  Icon(Icons.push_pin,
                                      size: 14, color: _kPrimary),
                                  SizedBox(width: 2),
                                  Text(
                                    '[고정]',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: _kPrimary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          Text(
                            post.title,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: _kText,
                              height: 1.3,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            post.content,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w400,
                              color: _kSubText,
                              height: 1.4,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    if (hasImage) ...[
                      const SizedBox(width: 12),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          post.images!.first,
                          width: 60,
                          height: 60,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              color: _kBackground,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.image,
                                size: 24, color: _kSubText),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 12),

                // ── 하단: 댓글/공감/조회 ──
                Row(
                  children: [
                    const Icon(Icons.chat_bubble_outline,
                        size: 16, color: _kSubText),
                    const SizedBox(width: 3),
                    Text(
                      '${post.commentsCount}',
                      style: const TextStyle(fontSize: 12, color: _kSubText),
                    ),
                    const SizedBox(width: 14),
                    const Icon(Icons.favorite_border,
                        size: 16, color: _kSubText),
                    const SizedBox(width: 3),
                    Text(
                      '${post.likesCount}',
                      style: const TextStyle(fontSize: 12, color: _kSubText),
                    ),
                    const SizedBox(width: 14),
                    const Icon(Icons.visibility_outlined,
                        size: 16, color: _kSubText),
                    const SizedBox(width: 3),
                    Text(
                      '${post.views}',
                      style: const TextStyle(fontSize: 12, color: _kSubText),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// 상대 시간 표시 (방금 전, N분 전, N시간 전, N일 전, yyyy.MM.dd)
  static String _relativeTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return '방금 전';
    if (diff.inMinutes < 60) return '${diff.inMinutes}분 전';
    if (diff.inHours < 24) return '${diff.inHours}시간 전';
    if (diff.inDays < 7) return '${diff.inDays}일 전';
    return '${dt.year}.${dt.month.toString().padLeft(2, '0')}.${dt.day.toString().padLeft(2, '0')}';
  }
}
