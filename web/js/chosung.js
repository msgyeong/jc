/**
 * 한글 초성(chosung) 유틸리티
 * - isAllChosung(str): 입력이 모두 한글 자음인지 판별
 * - extractChosung(str): 한글 문자열 → 초성 문자열 변환
 */

(function() {
    'use strict';

    // 한글 초성 19자 (유니코드 순서)
    var CHOSUNG_LIST = [
        'ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ',
        'ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'
    ];

    /**
     * 입력 문자열이 모두 한글 자음(ㄱ~ㅎ)인지 판별
     * @param {string} str
     * @returns {boolean}
     */
    function isAllChosung(str) {
        if (!str || str.length === 0) return false;
        return /^[ㄱ-ㅎ]+$/.test(str);
    }

    /**
     * 한글 문자열에서 초성만 추출
     * '김민우' → 'ㄱㅁㅇ', 'abc' → 'abc'
     * @param {string} str
     * @returns {string}
     */
    function extractChosung(str) {
        if (!str) return '';
        var result = '';
        for (var i = 0; i < str.length; i++) {
            var code = str.charCodeAt(i);
            // 한글 완성형 범위: 0xAC00 ~ 0xD7A3
            if (code >= 0xAC00 && code <= 0xD7A3) {
                var idx = Math.floor((code - 0xAC00) / 588); // 21 * 28 = 588
                result += CHOSUNG_LIST[idx];
            } else {
                result += str.charAt(i);
            }
        }
        return result;
    }

    // 전역 노출
    window.isAllChosung = isAllChosung;
    window.extractChosung = extractChosung;
})();
