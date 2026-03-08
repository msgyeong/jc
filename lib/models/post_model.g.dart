// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'post_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PostModel _$PostModelFromJson(Map<String, dynamic> json) => PostModel(
  id: json['id'] as String,
  authorId: json['author_id'] as String,
  title: json['title'] as String,
  content: json['content'] as String,
  images: (json['images'] as List<dynamic>?)?.map((e) => e as String).toList(),
  category: json['category'] as String,
  isPinned: json['is_pinned'] as bool,
  views: (json['views'] as num).toInt(),
  likesCount: (json['likes_count'] as num).toInt(),
  commentsCount: (json['comments_count'] as num).toInt(),
  readByCurrentUser: json['read_by_current_user'] as bool,
  userHasLiked: json['user_has_liked'] as bool,
  createdAt: DateTime.parse(json['created_at'] as String),
  updatedAt: json['updated_at'] == null
      ? null
      : DateTime.parse(json['updated_at'] as String),
  authorName: json['author_name'] as String?,
  authorImage: json['author_image'] as String?,
);

Map<String, dynamic> _$PostModelToJson(PostModel instance) => <String, dynamic>{
  'id': instance.id,
  'author_id': instance.authorId,
  'title': instance.title,
  'content': instance.content,
  'images': instance.images,
  'category': instance.category,
  'is_pinned': instance.isPinned,
  'views': instance.views,
  'likes_count': instance.likesCount,
  'comments_count': instance.commentsCount,
  'read_by_current_user': instance.readByCurrentUser,
  'user_has_liked': instance.userHasLiked,
  'created_at': instance.createdAt.toIso8601String(),
  'updated_at': instance.updatedAt?.toIso8601String(),
  'author_name': instance.authorName,
  'author_image': instance.authorImage,
};
