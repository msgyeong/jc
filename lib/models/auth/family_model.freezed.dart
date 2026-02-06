// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'family_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

FamilyModel _$FamilyModelFromJson(Map<String, dynamic> json) {
  return _FamilyModel.fromJson(json);
}

/// @nodoc
mixin _$FamilyModel {
  String? get id => throw _privateConstructorUsedError;
  String get memberId => throw _privateConstructorUsedError;
  bool get isMarried => throw _privateConstructorUsedError; // 혼인 유무
  String? get spouseName => throw _privateConstructorUsedError; // 배우자명
  String? get spouseContact => throw _privateConstructorUsedError; // 배우자 연락처
  String? get spouseBirthdate =>
      throw _privateConstructorUsedError; // 배우자 생년월일 (8자리)
  bool get hasChildren => throw _privateConstructorUsedError; // 자녀 유무
  DateTime? get createdAt => throw _privateConstructorUsedError;
  DateTime? get updatedAt => throw _privateConstructorUsedError;

  /// Serializes this FamilyModel to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of FamilyModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $FamilyModelCopyWith<FamilyModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $FamilyModelCopyWith<$Res> {
  factory $FamilyModelCopyWith(
    FamilyModel value,
    $Res Function(FamilyModel) then,
  ) = _$FamilyModelCopyWithImpl<$Res, FamilyModel>;
  @useResult
  $Res call({
    String? id,
    String memberId,
    bool isMarried,
    String? spouseName,
    String? spouseContact,
    String? spouseBirthdate,
    bool hasChildren,
    DateTime? createdAt,
    DateTime? updatedAt,
  });
}

/// @nodoc
class _$FamilyModelCopyWithImpl<$Res, $Val extends FamilyModel>
    implements $FamilyModelCopyWith<$Res> {
  _$FamilyModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of FamilyModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = freezed,
    Object? memberId = null,
    Object? isMarried = null,
    Object? spouseName = freezed,
    Object? spouseContact = freezed,
    Object? spouseBirthdate = freezed,
    Object? hasChildren = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(
      _value.copyWith(
            id: freezed == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String?,
            memberId: null == memberId
                ? _value.memberId
                : memberId // ignore: cast_nullable_to_non_nullable
                      as String,
            isMarried: null == isMarried
                ? _value.isMarried
                : isMarried // ignore: cast_nullable_to_non_nullable
                      as bool,
            spouseName: freezed == spouseName
                ? _value.spouseName
                : spouseName // ignore: cast_nullable_to_non_nullable
                      as String?,
            spouseContact: freezed == spouseContact
                ? _value.spouseContact
                : spouseContact // ignore: cast_nullable_to_non_nullable
                      as String?,
            spouseBirthdate: freezed == spouseBirthdate
                ? _value.spouseBirthdate
                : spouseBirthdate // ignore: cast_nullable_to_non_nullable
                      as String?,
            hasChildren: null == hasChildren
                ? _value.hasChildren
                : hasChildren // ignore: cast_nullable_to_non_nullable
                      as bool,
            createdAt: freezed == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            updatedAt: freezed == updatedAt
                ? _value.updatedAt
                : updatedAt // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$FamilyModelImplCopyWith<$Res>
    implements $FamilyModelCopyWith<$Res> {
  factory _$$FamilyModelImplCopyWith(
    _$FamilyModelImpl value,
    $Res Function(_$FamilyModelImpl) then,
  ) = __$$FamilyModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String? id,
    String memberId,
    bool isMarried,
    String? spouseName,
    String? spouseContact,
    String? spouseBirthdate,
    bool hasChildren,
    DateTime? createdAt,
    DateTime? updatedAt,
  });
}

/// @nodoc
class __$$FamilyModelImplCopyWithImpl<$Res>
    extends _$FamilyModelCopyWithImpl<$Res, _$FamilyModelImpl>
    implements _$$FamilyModelImplCopyWith<$Res> {
  __$$FamilyModelImplCopyWithImpl(
    _$FamilyModelImpl _value,
    $Res Function(_$FamilyModelImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of FamilyModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = freezed,
    Object? memberId = null,
    Object? isMarried = null,
    Object? spouseName = freezed,
    Object? spouseContact = freezed,
    Object? spouseBirthdate = freezed,
    Object? hasChildren = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(
      _$FamilyModelImpl(
        id: freezed == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String?,
        memberId: null == memberId
            ? _value.memberId
            : memberId // ignore: cast_nullable_to_non_nullable
                  as String,
        isMarried: null == isMarried
            ? _value.isMarried
            : isMarried // ignore: cast_nullable_to_non_nullable
                  as bool,
        spouseName: freezed == spouseName
            ? _value.spouseName
            : spouseName // ignore: cast_nullable_to_non_nullable
                  as String?,
        spouseContact: freezed == spouseContact
            ? _value.spouseContact
            : spouseContact // ignore: cast_nullable_to_non_nullable
                  as String?,
        spouseBirthdate: freezed == spouseBirthdate
            ? _value.spouseBirthdate
            : spouseBirthdate // ignore: cast_nullable_to_non_nullable
                  as String?,
        hasChildren: null == hasChildren
            ? _value.hasChildren
            : hasChildren // ignore: cast_nullable_to_non_nullable
                  as bool,
        createdAt: freezed == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        updatedAt: freezed == updatedAt
            ? _value.updatedAt
            : updatedAt // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$FamilyModelImpl implements _FamilyModel {
  const _$FamilyModelImpl({
    this.id,
    required this.memberId,
    required this.isMarried,
    this.spouseName,
    this.spouseContact,
    this.spouseBirthdate,
    required this.hasChildren,
    this.createdAt,
    this.updatedAt,
  });

  factory _$FamilyModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$FamilyModelImplFromJson(json);

  @override
  final String? id;
  @override
  final String memberId;
  @override
  final bool isMarried;
  // 혼인 유무
  @override
  final String? spouseName;
  // 배우자명
  @override
  final String? spouseContact;
  // 배우자 연락처
  @override
  final String? spouseBirthdate;
  // 배우자 생년월일 (8자리)
  @override
  final bool hasChildren;
  // 자녀 유무
  @override
  final DateTime? createdAt;
  @override
  final DateTime? updatedAt;

  @override
  String toString() {
    return 'FamilyModel(id: $id, memberId: $memberId, isMarried: $isMarried, spouseName: $spouseName, spouseContact: $spouseContact, spouseBirthdate: $spouseBirthdate, hasChildren: $hasChildren, createdAt: $createdAt, updatedAt: $updatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$FamilyModelImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.memberId, memberId) ||
                other.memberId == memberId) &&
            (identical(other.isMarried, isMarried) ||
                other.isMarried == isMarried) &&
            (identical(other.spouseName, spouseName) ||
                other.spouseName == spouseName) &&
            (identical(other.spouseContact, spouseContact) ||
                other.spouseContact == spouseContact) &&
            (identical(other.spouseBirthdate, spouseBirthdate) ||
                other.spouseBirthdate == spouseBirthdate) &&
            (identical(other.hasChildren, hasChildren) ||
                other.hasChildren == hasChildren) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    memberId,
    isMarried,
    spouseName,
    spouseContact,
    spouseBirthdate,
    hasChildren,
    createdAt,
    updatedAt,
  );

  /// Create a copy of FamilyModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$FamilyModelImplCopyWith<_$FamilyModelImpl> get copyWith =>
      __$$FamilyModelImplCopyWithImpl<_$FamilyModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$FamilyModelImplToJson(this);
  }
}

abstract class _FamilyModel implements FamilyModel {
  const factory _FamilyModel({
    final String? id,
    required final String memberId,
    required final bool isMarried,
    final String? spouseName,
    final String? spouseContact,
    final String? spouseBirthdate,
    required final bool hasChildren,
    final DateTime? createdAt,
    final DateTime? updatedAt,
  }) = _$FamilyModelImpl;

  factory _FamilyModel.fromJson(Map<String, dynamic> json) =
      _$FamilyModelImpl.fromJson;

  @override
  String? get id;
  @override
  String get memberId;
  @override
  bool get isMarried; // 혼인 유무
  @override
  String? get spouseName; // 배우자명
  @override
  String? get spouseContact; // 배우자 연락처
  @override
  String? get spouseBirthdate; // 배우자 생년월일 (8자리)
  @override
  bool get hasChildren; // 자녀 유무
  @override
  DateTime? get createdAt;
  @override
  DateTime? get updatedAt;

  /// Create a copy of FamilyModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$FamilyModelImplCopyWith<_$FamilyModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
