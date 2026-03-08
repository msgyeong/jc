import '../models/post_model.dart';
import '../models/comment_model.dart';
import 'api_client.dart';

/// 게시글 API (Railway backend)
class PostService {
  /// 게시글 목록 (카테고리별)
  static Future<List<PostModel>> getList({
    int page = 1,
    int limit = 20,
    String? category,
  }) async {
    var path = '/api/posts?page=$page&limit=$limit';
    if (category != null) path += '&category=$category';
    final res = await ApiClient.get(path);
    if (!res.success) {
      throw Exception(res.message ?? '게시글 목록 조회 실패');
    }
    final posts = res.data['posts'] as List<dynamic>;
    return posts
        .map((e) => PostModel.fromJson(_normalize(e as Map<String, dynamic>)))
        .toList();
  }

  /// 게시글 상세 조회
  static Future<PostModel?> getById(String id) async {
    final res = await ApiClient.get('/api/posts/$id');
    if (!res.success) return null;
    final post = res.data['post'] as Map<String, dynamic>?;
    if (post == null) return null;
    return PostModel.fromJson(_normalize(post));
  }

  /// 게시글 작성
  static Future<String> create({
    required String title,
    required String content,
    List<String>? images,
    String category = 'general',
    bool isPinned = false,
  }) async {
    final res = await ApiClient.post('/api/posts', body: {
      'title': title,
      'content': content,
      'images': images ?? [],
      'category': category,
      'is_pinned': isPinned,
    });
    if (!res.success) {
      throw Exception(res.message ?? '게시글 작성 실패');
    }
    return res.data['postId'].toString();
  }

  /// 게시글 수정
  static Future<void> update({
    required String id,
    required String title,
    required String content,
    List<String>? images,
    String category = 'general',
    bool isPinned = false,
  }) async {
    final res = await ApiClient.put('/api/posts/$id', body: {
      'title': title,
      'content': content,
      'images': images ?? [],
      'category': category,
      'is_pinned': isPinned,
    });
    if (!res.success) {
      throw Exception(res.message ?? '게시글 수정 실패');
    }
  }

  /// 게시글 삭제
  static Future<void> delete(String id) async {
    final res = await ApiClient.delete('/api/posts/$id');
    if (!res.success) {
      throw Exception(res.message ?? '게시글 삭제 실패');
    }
  }

  /// 공감 토글
  static Future<Map<String, dynamic>> toggleLike(String postId) async {
    final res = await ApiClient.post('/api/posts/$postId/like');
    if (!res.success) {
      throw Exception(res.message ?? '공감 처리 실패');
    }
    return {
      'liked': res.data['liked'] as bool,
      'likes_count': res.data['likes_count'] as int,
    };
  }

  /// 댓글 목록
  static Future<List<CommentModel>> getComments(String postId) async {
    final res = await ApiClient.get('/api/posts/$postId/comments');
    if (!res.success) {
      throw Exception(res.message ?? '댓글 목록 조회 실패');
    }
    final comments = res.data['comments'] as List<dynamic>;
    return comments
        .map((e) => CommentModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// 댓글 작성
  static Future<int> createComment({
    required String postId,
    required String content,
    String? parentCommentId,
  }) async {
    final res = await ApiClient.post('/api/posts/$postId/comments', body: {
      'content': content,
      if (parentCommentId != null) 'parent_comment_id': int.tryParse(parentCommentId),
    });
    if (!res.success) {
      throw Exception(res.message ?? '댓글 등록 실패');
    }
    return res.data['comments_count'] as int;
  }

  /// 댓글 삭제
  static Future<int> deleteComment({
    required String postId,
    required String commentId,
  }) async {
    final res = await ApiClient.delete('/api/posts/$postId/comments/$commentId');
    if (!res.success) {
      throw Exception(res.message ?? '댓글 삭제 실패');
    }
    return res.data['comments_count'] as int;
  }

  static Map<String, dynamic> _normalize(Map<String, dynamic> raw) {
    return {
      'id': raw['id'].toString(),
      'author_id': (raw['author_id'] ?? '').toString(),
      'title': raw['title'] ?? '',
      'content': raw['content'] ?? '',
      'images': raw['images'],
      'category': raw['category'] ?? 'general',
      'is_pinned': raw['is_pinned'] ?? false,
      'views': raw['views'] ?? 0,
      'likes_count': raw['likes_count'] ?? 0,
      'comments_count': raw['comments_count'] ?? 0,
      'read_by_current_user': raw['read_by_current_user'] ?? false,
      'user_has_liked': raw['user_has_liked'] ?? false,
      'created_at': raw['created_at'],
      'updated_at': raw['updated_at'],
      'author_name': raw['author_name'],
      'author_image': raw['author_image'],
    };
  }
}
