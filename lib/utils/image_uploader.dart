import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// 이미지 업로드 유틸리티
/// 이미지 선택, 크롭, Supabase Storage 업로드를 처리합니다.
class ImageUploader {
  static final ImagePicker _picker = ImagePicker();
  static final SupabaseClient _supabase = Supabase.instance.client;

  /// 이미지 선택 (카메라 또는 갤러리)
  /// [source] ImageSource.camera 또는 ImageSource.gallery
  /// 반환: 선택된 이미지 파일 또는 null
  static Future<XFile?> pickImage({
    required ImageSource source,
  }) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1920,
        maxHeight: 1920,
      );
      return image;
    } catch (e) {
      throw Exception('이미지 선택 중 오류가 발생했습니다: $e');
    }
  }

  /// 이미지 크롭
  /// [imageFile] 크롭할 이미지 파일
  /// 반환: 크롭된 이미지 파일 또는 null
  static Future<File?> cropImage({
    required XFile imageFile,
    CropAspectRatio? aspectRatio,
  }) async {
    try {
      final croppedFile = await ImageCropper().cropImage(
        sourcePath: imageFile.path,
        aspectRatio: aspectRatio,
        uiSettings: [
          AndroidUiSettings(
            toolbarTitle: '이미지 편집',
            toolbarColor: const Color(0xFF1F4FD8),
            toolbarWidgetColor: Colors.white,
            initAspectRatio: CropAspectRatioPreset.original,
            lockAspectRatio: false,
          ),
          IOSUiSettings(
            title: '이미지 편집',
          ),
        ],
      );

      if (croppedFile != null) {
        return File(croppedFile.path);
      }
      return null;
    } catch (e) {
      throw Exception('이미지 크롭 중 오류가 발생했습니다: $e');
    }
  }

  /// Supabase Storage에 이미지 업로드
  /// [file] 업로드할 파일
  /// [bucket] Storage 버킷 이름
  /// [path] Storage 내 경로
  /// [onProgress] 업로드 진행률 콜백 (0.0 ~ 1.0)
  /// 반환: 업로드된 파일의 공개 URL
  static Future<String> uploadToStorage({
    required File file,
    required String bucket,
    required String path,
    Function(double)? onProgress,
  }) async {
    try {
      // 파일 크기 확인 (500MB 제한)
      final fileSize = await file.length();
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (fileSize > maxSize) {
        throw Exception('파일 크기는 500MB를 초과할 수 없습니다.');
      }

      // MIME 타입 결정 (경로 확장자 기준)
      String contentType = 'image/jpeg';
      final extension = path.split('.').last.toLowerCase();
      if (extension == 'png') {
        contentType = 'image/png';
      } else if (extension == 'webp') {
        contentType = 'image/webp';
      }

      // 파일 업로드
      await _supabase.storage.from(bucket).uploadBinary(
            path,
            await file.readAsBytes(),
            fileOptions: FileOptions(
              upsert: true,
              contentType: contentType,
            ),
          );

      // 업로드 완료 시 진행률 100%로 설정
      if (onProgress != null) {
        onProgress(1.0);
      }

      // 공개 URL 가져오기
      final publicUrl = _supabase.storage.from(bucket).getPublicUrl(path);

      return publicUrl;
    } catch (e) {
      if (e is StorageException) rethrow;
      throw Exception('이미지 업로드 중 오류가 발생했습니다: $e');
    }
  }

  /// 이미지 선택 및 업로드 전체 프로세스
  /// [source] 이미지 소스 (카메라/갤러리)
  /// [bucket] Storage 버킷 이름
  /// [path] Storage 내 경로
  /// [cropAspectRatio] 크롭 비율 (선택)
  /// [onProgress] 업로드 진행률 콜백
  /// 반환: 업로드된 파일의 공개 URL
  static Future<String> pickAndUpload({
    required ImageSource source,
    required String bucket,
    required String path,
    CropAspectRatio? cropAspectRatio,
    Function(double)? onProgress,
  }) async {
    // 1. 이미지 선택
    final pickedImage = await pickImage(source: source);
    if (pickedImage == null) {
      throw Exception('이미지가 선택되지 않았습니다.');
    }

    // 2. 이미지 크롭 (선택)
    File? croppedFile;
    if (cropAspectRatio != null) {
      croppedFile = await cropImage(
        imageFile: pickedImage,
        aspectRatio: cropAspectRatio,
      );
    } else {
      croppedFile = File(pickedImage.path);
    }

    if (croppedFile == null) {
      throw Exception('이미지 크롭이 취소되었습니다.');
    }

    // 3. Supabase Storage 업로드
    final url = await uploadToStorage(
      file: croppedFile,
      bucket: bucket,
      path: path,
      onProgress: onProgress,
    );

    return url;
  }
}
