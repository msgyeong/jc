import 'package:freezed_annotation/freezed_annotation.dart';

part 'member_model.freezed.dart';
part 'member_model.g.dart';

/// 회원 정보 모델 (schema.sql members 테이블과 일치)
@Freezed(fromJson: false)
@JsonSerializable(fieldRename: FieldRename.snake)
class MemberModel with _$MemberModel {
  const factory MemberModel({
    required String id,
    String? authUserId,
    required String email,
    required String name,
    required String residentId,
    required String address,
    required String phone,
    String? profilePhotoUrl,
    String? companyName,
    String? companyPosition,
    String? companyAddress,
    String? jobType,
    String? hobby,
    String? specialty,
    String? recommender,
    String? jcAffiliation,
    String? memberNumber,
    String? jcPosition,
    String? joinedAt, // DATE (YYYY-MM-DD)
    String? department,
    String? transferredAt, // DATE (YYYY-MM-DD)
    String? discipline,
    @Default(false) bool isApproved,
    @Default(false) bool isSuspended,
    String? rejectionReason,
    DateTime? withdrawnAt,
    @Default(false) bool isDeleted,
    @Default(false) bool isSpecialMember,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _MemberModel;

  factory MemberModel.fromJson(Map<String, dynamic> json) =>
      _$MemberModelFromJson(json);
}
