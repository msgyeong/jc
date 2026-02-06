import 'package:freezed_annotation/freezed_annotation.dart';

part 'career_model.freezed.dart';
part 'career_model.g.dart';

/// 경력 정보 모델 (schema.sql careers 테이블)
@freezed
@JsonSerializable(fieldRename: FieldRename.snake)
class CareerModel with _$CareerModel {
  const factory CareerModel({
    String? id,
    required String memberId,
    required String careerDate, // 경력 년월 (6자리: 202601)
    required String careerDescription,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _CareerModel;

  factory CareerModel.fromJson(Map<String, dynamic> json) =>
      _$CareerModelFromJson(json);
}
