import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_model.freezed.dart';

/// Supabase Auth 사용자 정보 모델
/// 앱 내 인증 상태 및 사용자 식별에 사용합니다.
@freezed
class UserModel with _$UserModel {
  const factory UserModel({
    required String id,
    required String email,
    DateTime? emailConfirmedAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _UserModel;
}
