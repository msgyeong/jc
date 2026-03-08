import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/post_model.dart';
import '../models/comment_model.dart';
import '../services/post_service.dart';

/// 공지 게시판 목록
final noticePostListProvider =
    StateNotifierProvider<PostListNotifier, AsyncValue<List<PostModel>>>(
  (ref) => PostListNotifier(category: 'notice'),
);

/// 일반 게시판 목록
final generalPostListProvider =
    StateNotifierProvider<PostListNotifier, AsyncValue<List<PostModel>>>(
  (ref) => PostListNotifier(category: 'general'),
);

class PostListNotifier extends StateNotifier<AsyncValue<List<PostModel>>> {
  PostListNotifier({required this.category})
      : super(const AsyncValue.loading()) {
    load();
  }

  final String category;

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      final list = await PostService.getList(page: 1, limit: 50, category: category);
      state = AsyncValue.data(list);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

/// 게시글 상세
final postDetailProvider =
    FutureProvider.family<PostModel?, String>((ref, id) async {
  return PostService.getById(id);
});

/// 댓글 목록
final postCommentsProvider =
    FutureProvider.family<List<CommentModel>, String>((ref, postId) async {
  return PostService.getComments(postId);
});
