// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'career_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

CareerModel _$CareerModelFromJson(Map<String, dynamic> json) {
  return _CareerModel.fromJson(json);
}

/// @nodoc
mixin _$CareerModel {
  String? get id => throw _privateConstructorUsedError;
  String get memberId => throw _privateConstructorUsedError;
  String get careerDate =>
      throw _privateConstructorUsedError; // 경력 년월 (6자리: 202601)
  String get careerDescription => throw _privateConstructorUsedError;
  DateTime? get createdAt => throw _privateConstructorUsedError;
  DateTime? get updatedAt => throw _privateConstructorUsedError;

  /// Serializes this CareerModel to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of CareerModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CareerModelCopyWith<CareerModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CareerModelCopyWith<$Res> {
  factory $CareerModelCopyWith(
    CareerModel value,
    $Res Function(CareerModel) then,
  ) = _$CareerModelCopyWithImpl<$Res, CareerModel>;
  @useResult
  $Res call({
    String? id,
    String memberId,
    String careerDate,
    String careerDescription,
    DateTime? createdAt,
    DateTime? updatedAt,
  });
}

/// @nodoc
class _$CareerModelCopyWithImpl<$Res, $Val extends CareerModel>
    implements $CareerModelCopyWith<$Res> {
  _$CareerModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CareerModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = freezed,
    Object? memberId = null,
    Object? careerDate = null,
    Object? careerDescription = null,
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
            careerDate: null == careerDate
                ? _value.careerDate
                : careerDate // ignore: cast_nullable_to_non_nullable
                      as String,
            careerDescription: null == careerDescription
                ? _value.careerDescription
                : careerDescription // ignore: cast_nullable_to_non_nullable
                      as String,
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
abstract class _$$CareerModelImplCopyWith<$Res>
    implements $CareerModelCopyWith<$Res> {
  factory _$$CareerModelImplCopyWith(
    _$CareerModelImpl value,
    $Res Function(_$CareerModelImpl) then,
  ) = __$$CareerModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String? id,
    String memberId,
    String careerDate,
    String careerDescription,
    DateTime? createdAt,
    DateTime? updatedAt,
  });
}

/// @nodoc
class __$$CareerModelImplCopyWithImpl<$Res>
    extends _$CareerModelCopyWithImpl<$Res, _$CareerModelImpl>
    implements _$$CareerModelImplCopyWith<$Res> {
  __$$CareerModelImplCopyWithImpl(
    _$CareerModelImpl _value,
    $Res Function(_$CareerModelImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of CareerModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = freezed,
    Object? memberId = null,
    Object? careerDate = null,
    Object? careerDescription = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(
      _$CareerModelImpl(
        id: freezed == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String?,
        memberId: null == memberId
            ? _value.memberId
            : memberId // ignore: cast_nullable_to_non_nullable
                  as String,
        careerDate: null == careerDate
            ? _value.careerDate
            : careerDate // ignore: cast_nullable_to_non_nullable
                  as String,
        careerDescription: null == careerDescription
            ? _value.careerDescription
            : careerDescription // ignore: cast_nullable_to_non_nullable
                  as String,
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
class _$CareerModelImpl implements _CareerModel {
  const _$CareerModelImpl({
    this.id,
    required this.memberId,
    required this.careerDate,
    required this.careerDescription,
    this.createdAt,
    this.updatedAt,
  });

  factory _$CareerModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$CareerModelImplFromJson(json);

  @override
  final String? id;
  @override
  final String memberId;
  @override
  final String careerDate;
  // 경력 년월 (6자리: 202601)
  @override
  final String careerDescription;
  @override
  final DateTime? createdAt;
  @override
  final DateTime? updatedAt;

  @override
  String toString() {
    return 'CareerModel(id: $id, memberId: $memberId, careerDate: $careerDate, careerDescription: $careerDescription, createdAt: $createdAt, updatedAt: $updatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CareerModelImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.memberId, memberId) ||
                other.memberId == memberId) &&
            (identical(other.careerDate, careerDate) ||
                other.careerDate == careerDate) &&
            (identical(other.careerDescription, careerDescription) ||
                other.careerDescription == careerDescription) &&
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
    careerDate,
    careerDescription,
    createdAt,
    updatedAt,
  );

  /// Create a copy of CareerModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CareerModelImplCopyWith<_$CareerModelImpl> get copyWith =>
      __$$CareerModelImplCopyWithImpl<_$CareerModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CareerModelImplToJson(this);
  }
}

abstract class _CareerModel implements CareerModel {
  const factory _CareerModel({
    final String? id,
    required final String memberId,
    required final String careerDate,
    required final String careerDescription,
    final DateTime? createdAt,
    final DateTime? updatedAt,
  }) = _$CareerModelImpl;

  factory _CareerModel.fromJson(Map<String, dynamic> json) =
      _$CareerModelImpl.fromJson;

  @override
  String? get id;
  @override
  String get memberId;
  @override
  String get careerDate; // 경력 년월 (6자리: 202601)
  @override
  String get careerDescription;
  @override
  DateTime? get createdAt;
  @override
  DateTime? get updatedAt;

  /// Create a copy of CareerModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CareerModelImplCopyWith<_$CareerModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
