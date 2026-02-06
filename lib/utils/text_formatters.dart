import 'package:flutter/services.dart';

/// 이메일 등: 입력을 소문자로만 표시
class LowerCaseTextInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final lower = newValue.text.toLowerCase();
    if (lower == newValue.text) return newValue;
    return TextEditingValue(
      text: lower,
      selection: TextSelection.collapsed(offset: lower.length),
    );
  }
}

/// 주민등록번호 포맷터 (850628-1******, 7번째 자리만 보이고 8~13번째 마스킹)
/// 표시 형식: 앞 6자리 + `-` + 7번째 자리 + `*` 6개
/// 원본 숫자를 유지하면서 화면 표시만 마스킹합니다.
class ResidentIdFormatter extends TextInputFormatter {
  // 실제 입력된 숫자 저장 (마스킹 전 원본)
  String _rawDigits = '';

  /// 저장된 원본 숫자 반환 (13자리 순수 숫자)
  String get rawValue => _rawDigits;

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    // 새로 입력된 값에서 숫자만 추출
    final newDigits = newValue.text.replaceAll(RegExp(r'[^0-9]'), '');
    // 이전 포맷된 값에서 숫자+*만 추출하여 길이 계산
    final oldFormatted = oldValue.text.replaceAll('-', '');
    final oldLen = oldFormatted.length;
    final newLen = newValue.text.replaceAll(RegExp(r'[^0-9*]'), '').length;

    // 삭제된 경우: rawDigits에서도 삭제
    if (newLen < oldLen) {
      // 삭제: 뒤에서부터 삭제된 만큼 제거
      final deleteCount = oldLen - newLen;
      if (_rawDigits.length > deleteCount) {
        _rawDigits = _rawDigits.substring(0, _rawDigits.length - deleteCount);
      } else {
        _rawDigits = '';
      }
    } else if (newDigits.isNotEmpty) {
      // 추가된 경우: 새로 입력된 숫자를 rawDigits에 추가
      // newDigits에서 마지막에 추가된 숫자들을 찾음
      final addedCount = newLen - oldLen;
      if (addedCount > 0 && newDigits.isNotEmpty) {
        // 새로 추가된 숫자 = newDigits의 마지막 addedCount개
        final addedDigits =
            newDigits.substring((newDigits.length - addedCount).clamp(0, newDigits.length));
        _rawDigits += addedDigits;
      }
    }

    // 최대 13자리로 제한
    if (_rawDigits.length > 13) {
      _rawDigits = _rawDigits.substring(0, 13);
    }

    if (_rawDigits.isEmpty) {
      return const TextEditingValue(text: '');
    }

    // 포맷팅: 850628-1******
    final buffer = StringBuffer();
    for (int i = 0; i < _rawDigits.length; i++) {
      if (i == 6) buffer.write('-');
      // 0~6: 그대로 표시 (앞 6자리 + 7번째 자리)
      // 7~12: * 마스킹
      if (i >= 7) {
        buffer.write('*');
      } else {
        buffer.write(_rawDigits[i]);
      }
    }

    final formatted = buffer.toString();
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }

  /// rawDigits 초기화 (필드 리셋 시 사용)
  void reset() {
    _rawDigits = '';
  }

  /// 외부에서 rawDigits 설정 (초기값 로드 시 사용)
  void setRawValue(String value) {
    _rawDigits = value.replaceAll(RegExp(r'[^0-9]'), '');
    if (_rawDigits.length > 13) {
      _rawDigits = _rawDigits.substring(0, 13);
    }
  }

  /// 마스킹된 표시 문자열 (850628-1****** 형식). 복원 시 컨트롤러에 넣을 때 사용.
  String get masked {
    if (_rawDigits.isEmpty) return '';
    final buffer = StringBuffer();
    for (int i = 0; i < _rawDigits.length; i++) {
      if (i == 6) buffer.write('-');
      if (i >= 7) {
        buffer.write('*');
      } else {
        buffer.write(_rawDigits[i]);
      }
    }
    return buffer.toString();
  }
}

/// 휴대폰 번호 포맷터 (010-0000-0000)
class PhoneFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final text = newValue.text.replaceAll(RegExp(r'[^0-9]'), '');

    if (text.isEmpty) {
      return newValue.copyWith(text: '');
    }

    final buffer = StringBuffer();

    for (int i = 0; i < text.length && i < 11; i++) {
      if (i == 3 || i == 7) {
        buffer.write('-');
      }
      buffer.write(text[i]);
    }

    final formatted = buffer.toString();

    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

/// 생년월일 포맷터 (19900101, 8자리)
class BirthdateFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final text = newValue.text.replaceAll(RegExp(r'[^0-9]'), '');

    if (text.length > 8) {
      return oldValue;
    }

    return newValue.copyWith(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }
}

/// 졸업/경력 년월 포맷터 (202601, 6자리)
class YearMonthFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final text = newValue.text.replaceAll(RegExp(r'[^0-9]'), '');

    if (text.length > 6) {
      return oldValue;
    }

    return newValue.copyWith(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }
}
