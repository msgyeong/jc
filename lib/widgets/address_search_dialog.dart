import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../theme/app_theme.dart';

/// Daum 우편번호 서비스를 이용한 주소 검색 다이얼로그
class AddressSearchDialog extends StatefulWidget {
  const AddressSearchDialog({super.key});

  @override
  State<AddressSearchDialog> createState() => _AddressSearchDialogState();
}

class _AddressSearchDialogState extends State<AddressSearchDialog> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            if (mounted) setState(() => _isLoading = true);
          },
          onPageFinished: (String url) {
            if (mounted) setState(() => _isLoading = false);
          },
          onWebResourceError: (WebResourceError error) {
            if (mounted) {
              setState(() {
                _isLoading = false;
                _hasError = true;
              });
            }
          },
        ),
      )
      ..addJavaScriptChannel(
        'AddressResult',
        onMessageReceived: (JavaScriptMessage message) {
          _handleAddressResultFromJs(message.message);
        },
      );

    controller.loadHtmlString(
      _getDaumPostcodeHtml(),
      baseUrl: 'https://t1.daumcdn.net/',
    );
    _controller = controller;
  }

  void _handleAddressResultFromJs(String jsonStr) {
    try {
      final data = jsonDecode(jsonStr) as Map<String, dynamic>;
      final addr = data['address'] as String? ?? '';
      final zonecode = data['zonecode'] as String? ?? '';

      final result = AddressResult(
        zonecode: zonecode,
        address: addr,
        addressEnglish: data['addressEnglish'] as String?,
        roadAddress: data['roadAddress'] as String?,
        jibunAddress: data['jibunAddress'] as String?,
        buildingName: data['buildingName'] as String?,
        extraAddress: data['extraAddress'] as String?,
      );

      if (mounted) {
        Navigator.of(context).pop(result);
      }
    } catch (e) {
      if (mounted) {
        Navigator.of(context).pop();
      }
    }
  }

  String _getDaumPostcodeHtml() {
    return '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>주소 검색</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; }
        #wrap { width: 100%; height: 100%; }
    </style>
</head>
<body>
    <div id="wrap"></div>
    <script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
    <script>
        (function() {
            var wrap = document.getElementById('wrap');
            new daum.Postcode({
                oncomplete: function(data) {
                    var addr = '';
                    var extraAddr = '';

                    if (data.userSelectedType === 'R') {
                        addr = data.roadAddress || '';
                    } else {
                        addr = data.jibunAddress || '';
                    }

                    if (data.userSelectedType === 'R') {
                        if (data.bname && /[동|로|가]\$/.test(data.bname)) {
                            extraAddr += data.bname;
                        }
                        if (data.buildingName && data.apartment === 'Y') {
                            extraAddr += (extraAddr ? ', ' + data.buildingName : data.buildingName);
                        }
                        if (extraAddr) {
                            extraAddr = ' (' + extraAddr + ')';
                        }
                    }

                    var result = {
                        zonecode: data.zonecode || '',
                        address: addr + (extraAddr || ''),
                        addressEnglish: data.addressEnglish || '',
                        roadAddress: data.roadAddress || '',
                        jibunAddress: data.jibunAddress || '',
                        buildingName: data.buildingName || '',
                        extraAddress: extraAddr || ''
                    };

                    if (typeof AddressResult !== 'undefined') {
                        AddressResult.postMessage(JSON.stringify(result));
                    }
                },
                width: '100%',
                height: '100%'
            }).embed(wrap);
        })();
    </script>
</body>
</html>
''';
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.all(16),
      child: SizedBox(
        width: double.infinity,
        height: MediaQuery.of(context).size.height * 0.8,
        child: Column(
          children: [
            AppBar(
              title: const Text('주소 검색'),
              leading: IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.of(context).pop(),
              ),
              automaticallyImplyLeading: false,
            ),
            Expanded(
              child: _hasError
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.error_outline,
                            size: 64,
                            color: AppTheme.errorColor,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            '주소 검색을 불러오지 못했습니다',
                            style: Theme.of(context).textTheme.bodyLarge,
                          ),
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: () {
                              setState(() {
                                _hasError = false;
                                _isLoading = true;
                              });
                              _controller.loadHtmlString(_getDaumPostcodeHtml());
                            },
                            child: const Text('다시 시도'),
                          ),
                        ],
                      ),
                    )
                  : Stack(
                      children: [
                        WebViewWidget(controller: _controller),
                        if (_isLoading)
                          const Center(child: CircularProgressIndicator()),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

/// 주소 검색 결과
class AddressResult {
  const AddressResult({
    required this.zonecode,
    required this.address,
    this.addressEnglish,
    this.roadAddress,
    this.jibunAddress,
    this.buildingName,
    this.extraAddress,
  });

  final String zonecode; // 우편번호
  final String address; // 기본 주소
  final String? addressEnglish; // 영문 주소
  final String? roadAddress; // 도로명 주소
  final String? jibunAddress; // 지번 주소
  final String? buildingName; // 건물명
  final String? extraAddress; // 추가 주소 (동, 건물명 등)

  factory AddressResult.fromJson(Map<String, dynamic> json) {
    return AddressResult(
      zonecode: json['zonecode'] as String,
      address: json['address'] as String,
      addressEnglish: json['addressEnglish'] as String?,
      roadAddress: json['roadAddress'] as String?,
      jibunAddress: json['jibunAddress'] as String?,
      buildingName: json['buildingName'] as String?,
      extraAddress: json['extraAddress'] as String?,
    );
  }
}
