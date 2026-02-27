import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:json_annotation/json_annotation.dart';

part 'notice_model.freezed.dart';
part 'notice_model.g.dart';

/// 공지사항 모델 (schema notices 테이블 및 API 응답 구조)
@freezed
@JsonSerializable(fieldRename: FieldRename.snake)
class NoticeModel with _$NoticeModel {
  const NoticeModel._();

  const factory NoticeModel({
    required String id,
    required String authorId,
    required String title,
    required String content,
    List<String>? images,
    @Default(false) bool isPinned,
    @Default(false) bool hasAttendance,
    @Default(0) int views,
    @Default(0) int likesCount,
    @Default(0) int commentsCount,
    required DateTime createdAt,
    DateTime? updatedAt,
    String? authorName,
    String? authorImage,
  }) = _NoticeModel;

  factory NoticeModel.fromJson(Map<String, dynamic> json) {
    final safe = Map<String, dynamic>.from(json);
    safe['likes_count'] ??= 0;
    safe['comments_count'] ??= 0;
    return _$NoticeModelFromJson(safe);
  }

  /// 참석자 조사 활성화 여부 (문서: attendanceSurveyEnabled)
  bool get attendanceSurveyEnabled => hasAttendance;
}
