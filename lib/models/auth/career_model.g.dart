// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'career_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CareerModel _$CareerModelFromJson(Map<String, dynamic> json) => CareerModel(
  id: json['id'] as String?,
  memberId: json['member_id'] as String,
  careerDate: json['career_date'] as String,
  careerDescription: json['career_description'] as String,
  createdAt: json['created_at'] == null
      ? null
      : DateTime.parse(json['created_at'] as String),
  updatedAt: json['updated_at'] == null
      ? null
      : DateTime.parse(json['updated_at'] as String),
);

Map<String, dynamic> _$CareerModelToJson(CareerModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'member_id': instance.memberId,
      'career_date': instance.careerDate,
      'career_description': instance.careerDescription,
      'created_at': instance.createdAt?.toIso8601String(),
      'updated_at': instance.updatedAt?.toIso8601String(),
    };

_$CareerModelImpl _$$CareerModelImplFromJson(Map<String, dynamic> json) =>
    _$CareerModelImpl(
      id: json['id'] as String?,
      memberId: json['memberId'] as String,
      careerDate: json['careerDate'] as String,
      careerDescription: json['careerDescription'] as String,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$$CareerModelImplToJson(_$CareerModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'memberId': instance.memberId,
      'careerDate': instance.careerDate,
      'careerDescription': instance.careerDescription,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
    };
