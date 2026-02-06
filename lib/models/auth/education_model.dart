import 'package:freezed_annotation/freezed_annotation.dart';

part 'education_model.freezed.dart';
part 'education_model.g.dart';

/// 학력 정보 모델 (schema.sql educations 테이블)
@freezed
@JsonSerializable(fieldRename: FieldRename.snake)
class EducationModel with _$EducationModel {
  const factory EducationModel({
    String? id,
    required String memberId,
    required String graduationDate, // 졸업 년월 (6자리: 202601)
    required String schoolName,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _EducationModel;

  factory EducationModel.fromJson(Map<String, dynamic> json) =>
      _$EducationModelFromJson(json);
}
