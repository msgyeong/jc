import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'session_service.dart';

/// Railway API 응답 래퍼
class ApiResponse {
  final int statusCode;
  final Map<String, dynamic> data;
  final bool success;

  ApiResponse({
    required this.statusCode,
    required this.data,
    required this.success,
  });

  String? get message => data['message'] as String?;
}

/// Railway API HTTP 클라이언트
/// JWT 토큰 자동 첨부, JSON 직렬화/역직렬화를 처리합니다.
class ApiClient {
  ApiClient._();

  static String get baseUrl {
    final url = dotenv.env['API_BASE_URL'] ?? 'http://localhost:3000';
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  static Map<String, String> _headers({String? token}) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<Map<String, String>> _authHeaders() async {
    final token = await SessionService.getToken();
    return _headers(token: token);
  }

  /// GET 요청
  static Future<ApiResponse> get(String path) async {
    final url = Uri.parse('$baseUrl$path');
    final headers = await _authHeaders();
    final response = await http.get(url, headers: headers);
    return _parseResponse(response);
  }

  /// POST 요청
  static Future<ApiResponse> post(
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final url = Uri.parse('$baseUrl$path');
    final headers = await _authHeaders();
    final response = await http.post(
      url,
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
    return _parseResponse(response);
  }

  /// PUT 요청
  static Future<ApiResponse> put(
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final url = Uri.parse('$baseUrl$path');
    final headers = await _authHeaders();
    final response = await http.put(
      url,
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
    return _parseResponse(response);
  }

  /// DELETE 요청
  static Future<ApiResponse> delete(String path) async {
    final url = Uri.parse('$baseUrl$path');
    final headers = await _authHeaders();
    final response = await http.delete(url, headers: headers);
    return _parseResponse(response);
  }

  /// PATCH 요청
  static Future<ApiResponse> patch(
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final url = Uri.parse('$baseUrl$path');
    final headers = await _authHeaders();
    final response = await http.patch(
      url,
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
    return _parseResponse(response);
  }

  /// Multipart 파일 업로드
  static Future<ApiResponse> uploadFile(
    String path, {
    required File file,
    String fieldName = 'image',
  }) async {
    final url = Uri.parse('$baseUrl$path');
    final token = await SessionService.getToken();

    final request = http.MultipartRequest('POST', url);
    if (token != null && token.isNotEmpty) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    request.files.add(
      await http.MultipartFile.fromPath(fieldName, file.path),
    );

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    return _parseResponse(response);
  }

  static ApiResponse _parseResponse(http.Response response) {
    Map<String, dynamic> data;
    try {
      data = jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      data = {'message': response.body};
    }
    return ApiResponse(
      statusCode: response.statusCode,
      data: data,
      success: data['success'] == true,
    );
  }
}
