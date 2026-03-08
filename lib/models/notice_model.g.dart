// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notice_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

NoticeModel _$NoticeModelFromJson(Map<String, dynamic> json) => NoticeModel(
  id: json['id'] as String,
  authorId: json['author_id'] as String,
  title: json['title'] as String,
  content: json['content'] as String,
  images: (json['images'] as List<dynamic>?)?.map((e) => e as String).toList(),
  isPinned: json['is_pinned'] as bool,
  hasAttendance: json['has_attendance'] as bool,
  views: (json['views'] as num).toInt(),
  likesCount: (json['likes_count'] as num).toInt(),
  commentsCount: (json['comments_count'] as num).toInt(),
  createdAt: DateTime.parse(json['created_at'] as String),
  updatedAt: json['updated_at'] == null
      ? null
      : DateTime.parse(json['updated_at'] as String),
  authorName: json['author_name'] as String?,
  authorImage: json['author_image'] as String?,
);

Map<String, dynamic> _$NoticeModelToJson(NoticeModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'author_id': instance.authorId,
      'title': instance.title,
      'content': instance.content,
      'images': instance.images,
      'is_pinned': instance.isPinned,
      'has_attendance': instance.hasAttendance,
      'views': instance.views,
      'likes_count': instance.likesCount,
      'comments_count': instance.commentsCount,
      'created_at': instance.createdAt.toIso8601String(),
      'updated_at': instance.updatedAt?.toIso8601String(),
      'author_name': instance.authorName,
      'author_image': instance.authorImage,
    };
