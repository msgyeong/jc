import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';

import '../services/api_client.dart';

/// 이미지 업로드 유틸리티
/// 이미지 선택, 크롭, Railway API를 통한 업로드를 처리합니다.
class ImageUploader {
  static final ImagePicker _picker = ImagePicker();

  /// 이미지 선택 (카메라 또는 갤러리)
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

  /// Railway API를 통한 이미지 업로드
  static Future<String> uploadToServer({
    required File file,
    Function(double)? onProgress,
  }) async {
    final res = await ApiClient.uploadFile(
      '/api/upload',
      file: file,
    );

    if (!res.success) {
      throw Exception(res.message ?? '이미지 업로드에 실패했습니다.');
    }

    onProgress?.call(1.0);
    return res.data['url'] as String;
  }

  /// 이미지 선택 및 업로드 전체 프로세스
  static Future<String> pickAndUpload({
    required ImageSource source,
    CropAspectRatio? cropAspectRatio,
    Function(double)? onProgress,
  }) async {
    final pickedImage = await pickImage(source: source);
    if (pickedImage == null) {
      throw Exception('이미지가 선택되지 않았습니다.');
    }

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

    final url = await uploadToServer(
      file: croppedFile,
      onProgress: onProgress,
    );

    return url;
  }
}
