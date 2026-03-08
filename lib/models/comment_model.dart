import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:json_annotation/json_annotation.dart';

part 'comment_model.freezed.dart';
part 'comment_model.g.dart';

@Freezed(fromJson: false)
@JsonSerializable(fieldRename: FieldRename.snake)
class CommentModel with _$CommentModel {
  const CommentModel._();

  const factory CommentModel({
    required String id,
    required String authorId,
    required String content,
    String? parentCommentId,
    required DateTime createdAt,
    String? authorName,
    String? authorImage,
  }) = _CommentModel;

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    final safe = Map<String, dynamic>.from(json);
    safe['id'] = safe['id'].toString();
    safe['author_id'] = (safe['author_id'] ?? '').toString();
    safe['parent_comment_id'] = safe['parent_comment_id']?.toString();
    return _$CommentModelFromJson(safe);
  }

  bool get isReply => parentCommentId != null;
}
