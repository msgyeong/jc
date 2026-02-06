// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'family_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FamilyModel _$FamilyModelFromJson(Map<String, dynamic> json) => FamilyModel(
  id: json['id'] as String?,
  memberId: json['member_id'] as String,
  isMarried: json['is_married'] as bool,
  spouseName: json['spouse_name'] as String?,
  spouseContact: json['spouse_contact'] as String?,
  spouseBirthdate: json['spouse_birthdate'] as String?,
  hasChildren: json['has_children'] as bool,
  createdAt: json['created_at'] == null
      ? null
      : DateTime.parse(json['created_at'] as String),
  updatedAt: json['updated_at'] == null
      ? null
      : DateTime.parse(json['updated_at'] as String),
);

Map<String, dynamic> _$FamilyModelToJson(FamilyModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'member_id': instance.memberId,
      'is_married': instance.isMarried,
      'spouse_name': instance.spouseName,
      'spouse_contact': instance.spouseContact,
      'spouse_birthdate': instance.spouseBirthdate,
      'has_children': instance.hasChildren,
      'created_at': instance.createdAt?.toIso8601String(),
      'updated_at': instance.updatedAt?.toIso8601String(),
    };

_$FamilyModelImpl _$$FamilyModelImplFromJson(Map<String, dynamic> json) =>
    _$FamilyModelImpl(
      id: json['id'] as String?,
      memberId: json['memberId'] as String,
      isMarried: json['isMarried'] as bool,
      spouseName: json['spouseName'] as String?,
      spouseContact: json['spouseContact'] as String?,
      spouseBirthdate: json['spouseBirthdate'] as String?,
      hasChildren: json['hasChildren'] as bool,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$$FamilyModelImplToJson(_$FamilyModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'memberId': instance.memberId,
      'isMarried': instance.isMarried,
      'spouseName': instance.spouseName,
      'spouseContact': instance.spouseContact,
      'spouseBirthdate': instance.spouseBirthdate,
      'hasChildren': instance.hasChildren,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
    };
