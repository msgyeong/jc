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

_$NoticeModelImpl _$$NoticeModelImplFromJson(Map<String, dynamic> json) =>
    _$NoticeModelImpl(
      id: json['id'] as String,
      authorId: json['authorId'] as String,
      title: json['title'] as String,
      content: json['content'] as String,
      images: (json['images'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      isPinned: json['isPinned'] as bool? ?? false,
      hasAttendance: json['hasAttendance'] as bool? ?? false,
      views: (json['views'] as num?)?.toInt() ?? 0,
      likesCount: (json['likesCount'] as num?)?.toInt() ?? 0,
      commentsCount: (json['commentsCount'] as num?)?.toInt() ?? 0,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
      authorName: json['authorName'] as String?,
      authorImage: json['authorImage'] as String?,
    );

Map<String, dynamic> _$$NoticeModelImplToJson(_$NoticeModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'authorId': instance.authorId,
      'title': instance.title,
      'content': instance.content,
      'images': instance.images,
      'isPinned': instance.isPinned,
      'hasAttendance': instance.hasAttendance,
      'views': instance.views,
      'likesCount': instance.likesCount,
      'commentsCount': instance.commentsCount,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
      'authorName': instance.authorName,
      'authorImage': instance.authorImage,
    };
