import 'package:freezed_annotation/freezed_annotation.dart';

part 'family_model.freezed.dart';
part 'family_model.g.dart';

/// 가족 정보 모델 (schema.sql families 테이블)
@freezed
@JsonSerializable(fieldRename: FieldRename.snake)
class FamilyModel with _$FamilyModel {
  const factory FamilyModel({
    String? id,
    required String memberId,
    required bool isMarried, // 혼인 유무
    String? spouseName, // 배우자명
    String? spouseContact, // 배우자 연락처
    String? spouseBirthdate, // 배우자 생년월일 (8자리)
    required bool hasChildren, // 자녀 유무
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _FamilyModel;

  factory FamilyModel.fromJson(Map<String, dynamic> json) =>
      _$FamilyModelFromJson(json);
}
