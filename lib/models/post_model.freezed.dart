// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'post_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

/// @nodoc
mixin _$PostModel {
  String get id => throw _privateConstructorUsedError;
  String get authorId => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String get content => throw _privateConstructorUsedError;
  List<String>? get images => throw _privateConstructorUsedError;
  String get category => throw _privateConstructorUsedError;
  bool get isPinned => throw _privateConstructorUsedError;
  int get views => throw _privateConstructorUsedError;
  int get likesCount => throw _privateConstructorUsedError;
  int get commentsCount => throw _privateConstructorUsedError;
  bool get readByCurrentUser => throw _privateConstructorUsedError;
  bool get userHasLiked => throw _privateConstructorUsedError;
  DateTime get createdAt => throw _privateConstructorUsedError;
  DateTime? get updatedAt => throw _privateConstructorUsedError;
  String? get authorName => throw _privateConstructorUsedError;
  String? get authorImage => throw _privateConstructorUsedError;

  /// Create a copy of PostModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $PostModelCopyWith<PostModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PostModelCopyWith<$Res> {
  factory $PostModelCopyWith(PostModel value, $Res Function(PostModel) then) =
      _$PostModelCopyWithImpl<$Res, PostModel>;
  @useResult
  $Res call({
    String id,
    String authorId,
    String title,
    String content,
    List<String>? images,
    String category,
    bool isPinned,
    int views,
    int likesCount,
    int commentsCount,
    bool readByCurrentUser,
    bool userHasLiked,
    DateTime createdAt,
    DateTime? updatedAt,
    String? authorName,
    String? authorImage,
  });
}

/// @nodoc
class _$PostModelCopyWithImpl<$Res, $Val extends PostModel>
    implements $PostModelCopyWith<$Res> {
  _$PostModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of PostModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? authorId = null,
    Object? title = null,
    Object? content = null,
    Object? images = freezed,
    Object? category = null,
    Object? isPinned = null,
    Object? views = null,
    Object? likesCount = null,
    Object? commentsCount = null,
    Object? readByCurrentUser = null,
    Object? userHasLiked = null,
    Object? createdAt = null,
    Object? updatedAt = freezed,
    Object? authorName = freezed,
    Object? authorImage = freezed,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            authorId: null == authorId
                ? _value.authorId
                : authorId // ignore: cast_nullable_to_non_nullable
                      as String,
            title: null == title
                ? _value.title
                : title // ignore: cast_nullable_to_non_nullable
                      as String,
            content: null == content
                ? _value.content
                : content // ignore: cast_nullable_to_non_nullable
                      as String,
            images: freezed == images
                ? _value.images
                : images // ignore: cast_nullable_to_non_nullable
                      as List<String>?,
            category: null == category
                ? _value.category
                : category // ignore: cast_nullable_to_non_nullable
                      as String,
            isPinned: null == isPinned
                ? _value.isPinned
                : isPinned // ignore: cast_nullable_to_non_nullable
                      as bool,
            views: null == views
                ? _value.views
                : views // ignore: cast_nullable_to_non_nullable
                      as int,
            likesCount: null == likesCount
                ? _value.likesCount
                : likesCount // ignore: cast_nullable_to_non_nullable
                      as int,
            commentsCount: null == commentsCount
                ? _value.commentsCount
                : commentsCount // ignore: cast_nullable_to_non_nullable
                      as int,
            readByCurrentUser: null == readByCurrentUser
                ? _value.readByCurrentUser
                : readByCurrentUser // ignore: cast_nullable_to_non_nullable
                      as bool,
            userHasLiked: null == userHasLiked
                ? _value.userHasLiked
                : userHasLiked // ignore: cast_nullable_to_non_nullable
                      as bool,
            createdAt: null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as DateTime,
            updatedAt: freezed == updatedAt
                ? _value.updatedAt
                : updatedAt // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            authorName: freezed == authorName
                ? _value.authorName
                : authorName // ignore: cast_nullable_to_non_nullable
                      as String?,
            authorImage: freezed == authorImage
                ? _value.authorImage
                : authorImage // ignore: cast_nullable_to_non_nullable
                      as String?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$PostModelImplCopyWith<$Res>
    implements $PostModelCopyWith<$Res> {
  factory _$$PostModelImplCopyWith(
    _$PostModelImpl value,
    $Res Function(_$PostModelImpl) then,
  ) = __$$PostModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String authorId,
    String title,
    String content,
    List<String>? images,
    String category,
    bool isPinned,
    int views,
    int likesCount,
    int commentsCount,
    bool readByCurrentUser,
    bool userHasLiked,
    DateTime createdAt,
    DateTime? updatedAt,
    String? authorName,
    String? authorImage,
  });
}

/// @nodoc
class __$$PostModelImplCopyWithImpl<$Res>
    extends _$PostModelCopyWithImpl<$Res, _$PostModelImpl>
    implements _$$PostModelImplCopyWith<$Res> {
  __$$PostModelImplCopyWithImpl(
    _$PostModelImpl _value,
    $Res Function(_$PostModelImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of PostModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? authorId = null,
    Object? title = null,
    Object? content = null,
    Object? images = freezed,
    Object? category = null,
    Object? isPinned = null,
    Object? views = null,
    Object? likesCount = null,
    Object? commentsCount = null,
    Object? readByCurrentUser = null,
    Object? userHasLiked = null,
    Object? createdAt = null,
    Object? updatedAt = freezed,
    Object? authorName = freezed,
    Object? authorImage = freezed,
  }) {
    return _then(
      _$PostModelImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        authorId: null == authorId
            ? _value.authorId
            : authorId // ignore: cast_nullable_to_non_nullable
                  as String,
        title: null == title
            ? _value.title
            : title // ignore: cast_nullable_to_non_nullable
                  as String,
        content: null == content
            ? _value.content
            : content // ignore: cast_nullable_to_non_nullable
                  as String,
        images: freezed == images
            ? _value._images
            : images // ignore: cast_nullable_to_non_nullable
                  as List<String>?,
        category: null == category
            ? _value.category
            : category // ignore: cast_nullable_to_non_nullable
                  as String,
        isPinned: null == isPinned
            ? _value.isPinned
            : isPinned // ignore: cast_nullable_to_non_nullable
                  as bool,
        views: null == views
            ? _value.views
            : views // ignore: cast_nullable_to_non_nullable
                  as int,
        likesCount: null == likesCount
            ? _value.likesCount
            : likesCount // ignore: cast_nullable_to_non_nullable
                  as int,
        commentsCount: null == commentsCount
            ? _value.commentsCount
            : commentsCount // ignore: cast_nullable_to_non_nullable
                  as int,
        readByCurrentUser: null == readByCurrentUser
            ? _value.readByCurrentUser
            : readByCurrentUser // ignore: cast_nullable_to_non_nullable
                  as bool,
        userHasLiked: null == userHasLiked
            ? _value.userHasLiked
            : userHasLiked // ignore: cast_nullable_to_non_nullable
                  as bool,
        createdAt: null == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as DateTime,
        updatedAt: freezed == updatedAt
            ? _value.updatedAt
            : updatedAt // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        authorName: freezed == authorName
            ? _value.authorName
            : authorName // ignore: cast_nullable_to_non_nullable
                  as String?,
        authorImage: freezed == authorImage
            ? _value.authorImage
            : authorImage // ignore: cast_nullable_to_non_nullable
                  as String?,
      ),
    );
  }
}

/// @nodoc

class _$PostModelImpl extends _PostModel {
  const _$PostModelImpl({
    required this.id,
    required this.authorId,
    required this.title,
    required this.content,
    final List<String>? images,
    this.category = 'general',
    this.isPinned = false,
    this.views = 0,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.readByCurrentUser = false,
    this.userHasLiked = false,
    required this.createdAt,
    this.updatedAt,
    this.authorName,
    this.authorImage,
  }) : _images = images,
       super._();

  @override
  final String id;
  @override
  final String authorId;
  @override
  final String title;
  @override
  final String content;
  final List<String>? _images;
  @override
  List<String>? get images {
    final value = _images;
    if (value == null) return null;
    if (_images is EqualUnmodifiableListView) return _images;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  @override
  @JsonKey()
  final String category;
  @override
  @JsonKey()
  final bool isPinned;
  @override
  @JsonKey()
  final int views;
  @override
  @JsonKey()
  final int likesCount;
  @override
  @JsonKey()
  final int commentsCount;
  @override
  @JsonKey()
  final bool readByCurrentUser;
  @override
  @JsonKey()
  final bool userHasLiked;
  @override
  final DateTime createdAt;
  @override
  final DateTime? updatedAt;
  @override
  final String? authorName;
  @override
  final String? authorImage;

  @override
  String toString() {
    return 'PostModel(id: $id, authorId: $authorId, title: $title, content: $content, images: $images, category: $category, isPinned: $isPinned, views: $views, likesCount: $likesCount, commentsCount: $commentsCount, readByCurrentUser: $readByCurrentUser, userHasLiked: $userHasLiked, createdAt: $createdAt, updatedAt: $updatedAt, authorName: $authorName, authorImage: $authorImage)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PostModelImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.authorId, authorId) ||
                other.authorId == authorId) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.content, content) || other.content == content) &&
            const DeepCollectionEquality().equals(other._images, _images) &&
            (identical(other.category, category) ||
                other.category == category) &&
            (identical(other.isPinned, isPinned) ||
                other.isPinned == isPinned) &&
            (identical(other.views, views) || other.views == views) &&
            (identical(other.likesCount, likesCount) ||
                other.likesCount == likesCount) &&
            (identical(other.commentsCount, commentsCount) ||
                other.commentsCount == commentsCount) &&
            (identical(other.readByCurrentUser, readByCurrentUser) ||
                other.readByCurrentUser == readByCurrentUser) &&
            (identical(other.userHasLiked, userHasLiked) ||
                other.userHasLiked == userHasLiked) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt) &&
            (identical(other.authorName, authorName) ||
                other.authorName == authorName) &&
            (identical(other.authorImage, authorImage) ||
                other.authorImage == authorImage));
  }

  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    authorId,
    title,
    content,
    const DeepCollectionEquality().hash(_images),
    category,
    isPinned,
    views,
    likesCount,
    commentsCount,
    readByCurrentUser,
    userHasLiked,
    createdAt,
    updatedAt,
    authorName,
    authorImage,
  );

  /// Create a copy of PostModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$PostModelImplCopyWith<_$PostModelImpl> get copyWith =>
      __$$PostModelImplCopyWithImpl<_$PostModelImpl>(this, _$identity);
}

abstract class _PostModel extends PostModel {
  const factory _PostModel({
    required final String id,
    required final String authorId,
    required final String title,
    required final String content,
    final List<String>? images,
    final String category,
    final bool isPinned,
    final int views,
    final int likesCount,
    final int commentsCount,
    final bool readByCurrentUser,
    final bool userHasLiked,
    required final DateTime createdAt,
    final DateTime? updatedAt,
    final String? authorName,
    final String? authorImage,
  }) = _$PostModelImpl;
  const _PostModel._() : super._();

  @override
  String get id;
  @override
  String get authorId;
  @override
  String get title;
  @override
  String get content;
  @override
  List<String>? get images;
  @override
  String get category;
  @override
  bool get isPinned;
  @override
  int get views;
  @override
  int get likesCount;
  @override
  int get commentsCount;
  @override
  bool get readByCurrentUser;
  @override
  bool get userHasLiked;
  @override
  DateTime get createdAt;
  @override
  DateTime? get updatedAt;
  @override
  String? get authorName;
  @override
  String? get authorImage;

  /// Create a copy of PostModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$PostModelImplCopyWith<_$PostModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
