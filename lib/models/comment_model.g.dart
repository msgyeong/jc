// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'comment_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CommentModel _$CommentModelFromJson(Map<String, dynamic> json) => CommentModel(
  id: json['id'] as String,
  authorId: json['author_id'] as String,
  content: json['content'] as String,
  parentCommentId: json['parent_comment_id'] as String?,
  createdAt: DateTime.parse(json['created_at'] as String),
  authorName: json['author_name'] as String?,
  authorImage: json['author_image'] as String?,
);

Map<String, dynamic> _$CommentModelToJson(CommentModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'author_id': instance.authorId,
      'content': instance.content,
      'parent_comment_id': instance.parentCommentId,
      'created_at': instance.createdAt.toIso8601String(),
      'author_name': instance.authorName,
      'author_image': instance.authorImage,
    };
