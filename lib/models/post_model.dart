import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:json_annotation/json_annotation.dart';

part 'post_model.freezed.dart';
part 'post_model.g.dart';

@Freezed(fromJson: false)
@JsonSerializable(fieldRename: FieldRename.snake)
class PostModel with _$PostModel {
  const PostModel._();

  const factory PostModel({
    required String id,
    required String authorId,
    required String title,
    required String content,
    List<String>? images,
    @Default('general') String category,
    @Default(false) bool isPinned,
    @Default(0) int views,
    @Default(0) int likesCount,
    @Default(0) int commentsCount,
    @Default(false) bool readByCurrentUser,
    @Default(false) bool userHasLiked,
    required DateTime createdAt,
    DateTime? updatedAt,
    String? authorName,
    String? authorImage,
  }) = _PostModel;

  factory PostModel.fromJson(Map<String, dynamic> json) {
    final safe = Map<String, dynamic>.from(json);
    safe['likes_count'] ??= 0;
    safe['comments_count'] ??= 0;
    safe['read_by_current_user'] ??= false;
    safe['user_has_liked'] ??= false;
    safe['is_pinned'] ??= false;
    return _$PostModelFromJson(safe);
  }

  bool get isNotice => category == 'notice';
}
