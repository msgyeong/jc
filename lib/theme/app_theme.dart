import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// 앱 테마 설정
/// 디자인 시스템: Indigo 기반 모던 팔레트, Material 3
class AppTheme {
  // ── 색상 팔레트 ────────────────────────────────────
  static const Color primaryColor   = Color(0xFF4F46E5); // Indigo-600
  static const Color primaryDark    = Color(0xFF3730A3); // Indigo-800
  static const Color primaryLight   = Color(0xFFE0E7FF); // Indigo-100
  static const Color secondaryColor = Color(0xFF06B6D4); // Cyan-500
  static const Color accentColor    = Color(0xFFF59E0B); // Amber-400
  static const Color errorColor     = Color(0xFFEF4444); // Red-500
  static const Color successColor   = Color(0xFF10B981); // Emerald-500
  static const Color warningColor   = Color(0xFFF59E0B); // Amber-400

  // ── 중립 팔레트 ───────────────────────────────────
  static const Color backgroundColor  = Color(0xFFF8FAFC); // Slate-50
  static const Color surfaceColor     = Color(0xFFFFFFFF);
  static const Color surfaceVariant   = Color(0xFFF1F5F9); // Slate-100
  static const Color dividerColor     = Color(0xFFE2E8F0); // Slate-200
  static const Color textPrimary      = Color(0xFF0F172A); // Slate-900
  static const Color textSecondary    = Color(0xFF64748B); // Slate-500
  static const Color textDisabled     = Color(0xFFCBD5E1); // Slate-300

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.light(
        primary:        primaryColor,
        primaryContainer: primaryLight,
        secondary:      secondaryColor,
        tertiary:       accentColor,
        error:          errorColor,
        surface:        surfaceColor,
        surfaceContainerHighest: surfaceVariant,
        onPrimary:      Colors.white,
        onPrimaryContainer: primaryDark,
        onSecondary:    Colors.white,
        onError:        Colors.white,
        onSurface:      textPrimary,
        outline:        dividerColor,
        outlineVariant: Color(0xFFF1F5F9),
      ),
      scaffoldBackgroundColor: backgroundColor,
      fontFamily: GoogleFonts.notoSansKr().fontFamily,
      textTheme: _textTheme,
      appBarTheme: _appBarTheme,
      elevatedButtonTheme: _elevatedButtonTheme,
      outlinedButtonTheme: _outlinedButtonTheme,
      textButtonTheme: _textButtonTheme,
      inputDecorationTheme: _inputDecorationTheme,
      cardTheme: _cardTheme,
      chipTheme: _chipTheme,
      dividerTheme: DividerThemeData(
        color: dividerColor,
        thickness: 1,
        space: 1,
      ),
      listTileTheme: const ListTileThemeData(
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        minLeadingWidth: 0,
      ),
    );
  }

  // ── 텍스트 테마 ───────────────────────────────────
  static TextTheme get _textTheme {
    final base = GoogleFonts.notoSansKr();
    return TextTheme(
      // 대제목 (AppBar, 화면 타이틀)
      headlineLarge: base.copyWith(
        fontSize: 24, fontWeight: FontWeight.w700,
        color: textPrimary, height: 1.3,
      ),
      headlineMedium: base.copyWith(
        fontSize: 20, fontWeight: FontWeight.w700,
        color: textPrimary, height: 1.3,
      ),
      headlineSmall: base.copyWith(
        fontSize: 18, fontWeight: FontWeight.w600,
        color: textPrimary, height: 1.35,
      ),
      // 본문
      titleLarge: base.copyWith(
        fontSize: 16, fontWeight: FontWeight.w600,
        color: textPrimary, height: 1.4,
      ),
      titleMedium: base.copyWith(
        fontSize: 15, fontWeight: FontWeight.w500,
        color: textPrimary, height: 1.4,
      ),
      titleSmall: base.copyWith(
        fontSize: 14, fontWeight: FontWeight.w500,
        color: textPrimary, height: 1.4,
      ),
      bodyLarge: base.copyWith(
        fontSize: 15, fontWeight: FontWeight.w400,
        color: textPrimary, height: 1.6,
      ),
      bodyMedium: base.copyWith(
        fontSize: 14, fontWeight: FontWeight.w400,
        color: textPrimary, height: 1.6,
      ),
      bodySmall: base.copyWith(
        fontSize: 13, fontWeight: FontWeight.w400,
        color: textSecondary, height: 1.5,
      ),
      // 버튼/라벨
      labelLarge: base.copyWith(
        fontSize: 15, fontWeight: FontWeight.w600,
        color: Colors.white, height: 1.4,
        letterSpacing: 0.1,
      ),
      labelMedium: base.copyWith(
        fontSize: 12, fontWeight: FontWeight.w500,
        color: textSecondary, height: 1.4,
        letterSpacing: 0.3,
      ),
      labelSmall: base.copyWith(
        fontSize: 11, fontWeight: FontWeight.w500,
        color: textSecondary, height: 1.4,
        letterSpacing: 0.4,
      ),
    );
  }

  // ── AppBar ────────────────────────────────────────
  static AppBarTheme get _appBarTheme {
    return AppBarTheme(
      backgroundColor: surfaceColor,
      foregroundColor: textPrimary,
      elevation: 0,
      scrolledUnderElevation: 1,
      shadowColor: Colors.black12,
      centerTitle: false,
      titleTextStyle: GoogleFonts.notoSansKr(
        fontSize: 17,
        fontWeight: FontWeight.w700,
        color: textPrimary,
      ),
      iconTheme: const IconThemeData(color: textPrimary, size: 22),
    );
  }

  // ── ElevatedButton ────────────────────────────────
  static ElevatedButtonThemeData get _elevatedButtonTheme {
    return ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        disabledBackgroundColor: textDisabled,
        minimumSize: const Size(double.infinity, 52),
        padding: const EdgeInsets.symmetric(horizontal: 24),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        elevation: 0,
        shadowColor: Colors.transparent,
        textStyle: GoogleFonts.notoSansKr(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.2,
        ),
      ),
    );
  }

  // ── OutlinedButton ────────────────────────────────
  static OutlinedButtonThemeData get _outlinedButtonTheme {
    return OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryColor,
        minimumSize: const Size(double.infinity, 52),
        padding: const EdgeInsets.symmetric(horizontal: 24),
        side: const BorderSide(color: primaryColor, width: 1.5),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        textStyle: GoogleFonts.notoSansKr(
          fontSize: 15,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  // ── TextButton ────────────────────────────────────
  static TextButtonThemeData get _textButtonTheme {
    return TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: primaryColor,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        textStyle: GoogleFonts.notoSansKr(
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  // ── InputDecoration ───────────────────────────────
  static InputDecorationTheme get _inputDecorationTheme {
    const radius = BorderRadius.all(Radius.circular(12));
    return InputDecorationTheme(
      filled: true,
      fillColor: surfaceVariant,
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: radius,
        borderSide: const BorderSide(color: dividerColor),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: radius,
        borderSide: const BorderSide(color: dividerColor),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: radius,
        borderSide: const BorderSide(color: primaryColor, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: radius,
        borderSide: const BorderSide(color: errorColor),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: radius,
        borderSide: const BorderSide(color: errorColor, width: 2),
      ),
      hintStyle: GoogleFonts.notoSansKr(
        fontSize: 14,
        color: textDisabled,
      ),
      labelStyle: GoogleFonts.notoSansKr(
        fontSize: 14,
        color: textSecondary,
      ),
      floatingLabelStyle: GoogleFonts.notoSansKr(
        fontSize: 12,
        color: primaryColor,
        fontWeight: FontWeight.w500,
      ),
    );
  }

  // ── Card ──────────────────────────────────────────
  static CardThemeData get _cardTheme {
    return CardThemeData(
      elevation: 0,
      color: surfaceColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: dividerColor),
      ),
      margin: EdgeInsets.zero,
    );
  }

  // ── Chip ──────────────────────────────────────────
  static ChipThemeData get _chipTheme {
    return ChipThemeData(
      backgroundColor: surfaceVariant,
      selectedColor: primaryLight,
      labelStyle: GoogleFonts.notoSansKr(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: textPrimary,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      side: const BorderSide(color: dividerColor),
    );
  }
}
