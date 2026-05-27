import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../settings/app_settings.dart';

class AppTheme {
  static const primary = Color(0xFF1D9E75);
  static const darkPrimary = Color(0xFF0F6E56);
  static const surfaceGreen = Color(0xFFE1F5EE);
  static const error = Color(0xFFE24B4A);
  static const warning = Color(0xFFEF9F27);

  static Color successSurface(Brightness brightness) {
    return brightness == Brightness.dark
        ? const Color(0xFF103E33)
        : surfaceGreen;
  }

  static ThemeData light(AppSettings settings) {
    return _theme(
      brightness: Brightness.light,
      primary: settings.themeColor.color,
      background: const Color(0xFFF7F8F5),
      surface: const Color(0xFFFFFEFA),
      foreground: const Color(0xFF101513),
      outline: const Color(0xFFCAD3CC),
      fontFamily: settings.fontFamily,
    );
  }

  static ThemeData dark(AppSettings settings) {
    return _theme(
      brightness: Brightness.dark,
      primary: settings.themeColor.color,
      background: const Color(0xFF071411),
      surface: const Color(0xFF0F1D19),
      foreground: const Color(0xFFF3FAF6),
      outline: const Color(0xFF27443A),
      fontFamily: settings.fontFamily,
    );
  }

  static ThemeData _theme({
    required Brightness brightness,
    required Color primary,
    required Color background,
    required Color surface,
    required Color foreground,
    required Color outline,
    required AppFontFamily fontFamily,
  }) {
    final scheme = ColorScheme.fromSeed(
      seedColor: primary,
      brightness: brightness,
      primary: primary,
      error: error,
      surface: surface,
      onSurface: foreground,
      outline: outline,
    );
    final materialTextTheme = ThemeData(brightness: brightness).textTheme;
    final textTheme = _withKhmerFallback(
      _fontTextTheme(fontFamily, materialTextTheme),
      fontFamily,
    );
    final base = ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: background,
      textTheme: textTheme,
    );

    return base.copyWith(
      cardTheme: CardThemeData(
        elevation: 0,
        color: surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(color: outline),
        ),
      ),
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        backgroundColor: background,
        foregroundColor: foreground,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: _fontTextStyle(
          fontFamily,
          color: foreground,
          fontSize: 20,
          fontWeight: FontWeight.w700,
        ).copyWith(fontFamilyFallback: _fallbackFamilies(fontFamily)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: outline),
        ),
      ),
      navigationRailTheme: NavigationRailThemeData(
        backgroundColor: surface,
        indicatorColor: primary.withValues(alpha: 0.14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: brightness == Brightness.dark
              ? const Color(0xFF161222)
              : Colors.white,
          minimumSize: const Size(48, 48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
    );
  }

  static TextTheme _fontTextTheme(
    AppFontFamily fontFamily,
    TextTheme baseTheme,
  ) {
    return switch (fontFamily) {
      AppFontFamily.kohSantepheap => GoogleFonts.kohSantepheapTextTheme(
        baseTheme,
      ),
      AppFontFamily.notoSansKhmer => GoogleFonts.notoSansKhmerTextTheme(
        baseTheme,
      ),
      AppFontFamily.inter => GoogleFonts.interTextTheme(baseTheme),
      AppFontFamily.googleSans => GoogleFonts.interTextTheme(
        baseTheme,
      ).apply(fontFamily: 'Google Sans'),
    };
  }

  static TextStyle _fontTextStyle(
    AppFontFamily fontFamily, {
    required Color color,
    required double fontSize,
    required FontWeight fontWeight,
  }) {
    return switch (fontFamily) {
      AppFontFamily.kohSantepheap => GoogleFonts.kohSantepheap(
        color: color,
        fontSize: fontSize,
        fontWeight: fontWeight,
      ),
      AppFontFamily.notoSansKhmer => GoogleFonts.notoSansKhmer(
        color: color,
        fontSize: fontSize,
        fontWeight: fontWeight,
      ),
      AppFontFamily.inter => GoogleFonts.inter(
        color: color,
        fontSize: fontSize,
        fontWeight: fontWeight,
      ),
      AppFontFamily.googleSans => GoogleFonts.inter(
        color: color,
        fontSize: fontSize,
        fontWeight: fontWeight,
      ).copyWith(fontFamily: 'Google Sans'),
    };
  }

  static TextTheme _withKhmerFallback(
    TextTheme theme,
    AppFontFamily fontFamily,
  ) {
    final fallback = _fallbackFamilies(fontFamily);
    return theme.copyWith(
      displayLarge: theme.displayLarge?.copyWith(fontFamilyFallback: fallback),
      displayMedium: theme.displayMedium?.copyWith(
        fontFamilyFallback: fallback,
      ),
      displaySmall: theme.displaySmall?.copyWith(fontFamilyFallback: fallback),
      headlineLarge: theme.headlineLarge?.copyWith(
        fontFamilyFallback: fallback,
      ),
      headlineMedium: theme.headlineMedium?.copyWith(
        fontFamilyFallback: fallback,
      ),
      headlineSmall: theme.headlineSmall?.copyWith(
        fontFamilyFallback: fallback,
      ),
      titleLarge: theme.titleLarge?.copyWith(fontFamilyFallback: fallback),
      titleMedium: theme.titleMedium?.copyWith(fontFamilyFallback: fallback),
      titleSmall: theme.titleSmall?.copyWith(fontFamilyFallback: fallback),
      bodyLarge: theme.bodyLarge?.copyWith(fontFamilyFallback: fallback),
      bodyMedium: theme.bodyMedium?.copyWith(fontFamilyFallback: fallback),
      bodySmall: theme.bodySmall?.copyWith(fontFamilyFallback: fallback),
      labelLarge: theme.labelLarge?.copyWith(fontFamilyFallback: fallback),
      labelMedium: theme.labelMedium?.copyWith(fontFamilyFallback: fallback),
      labelSmall: theme.labelSmall?.copyWith(fontFamilyFallback: fallback),
    );
  }

  static List<String> _fallbackFamilies(AppFontFamily fontFamily) {
    final khmer = GoogleFonts.notoSansKhmer().fontFamily!;
    final inter = GoogleFonts.inter().fontFamily!;
    return switch (fontFamily) {
      AppFontFamily.kohSantepheap => [khmer, inter],
      AppFontFamily.notoSansKhmer => [inter],
      AppFontFamily.inter => [khmer],
      AppFontFamily.googleSans => ['Google Sans', inter, khmer],
    };
  }
}
