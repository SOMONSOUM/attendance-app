import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _themeModeKey = 'attendance_scanner_theme_mode';
const _localeKey = 'attendance_scanner_locale';
const _themeColorKey = 'attendance_scanner_theme_color';
const _fontFamilyKey = 'attendance_scanner_font_family';
const _textScaleKey = 'attendance_scanner_text_scale';

enum AppThemeColor {
  green(Color(0xFF1D9E75)),
  blue(Color(0xFF2563EB)),
  purple(Color(0xFF7C3AED)),
  orange(Color(0xFFEA7A25)),
  red(Color(0xFFE24B4A));

  const AppThemeColor(this.color);

  final Color color;
}

enum AppFontFamily {
  googleSans('Google Sans'),
  kohSantepheap('Koh Santepheap'),
  notoSansKhmer('Noto Sans Khmer'),
  inter('Inter');

  const AppFontFamily(this.label);

  final String label;
}

final appSettingsProvider =
    AsyncNotifierProvider<AppSettingsController, AppSettings>(
      AppSettingsController.new,
    );

class AppSettings {
  const AppSettings({
    this.themeMode = ThemeMode.system,
    this.locale = const Locale('en'),
    this.themeColor = AppThemeColor.green,
    this.fontFamily = AppFontFamily.googleSans,
    this.textScale = 1,
  });

  final ThemeMode themeMode;
  final Locale locale;
  final AppThemeColor themeColor;
  final AppFontFamily fontFamily;
  final double textScale;

  AppSettings copyWith({
    ThemeMode? themeMode,
    Locale? locale,
    AppThemeColor? themeColor,
    AppFontFamily? fontFamily,
    double? textScale,
  }) {
    return AppSettings(
      themeMode: themeMode ?? this.themeMode,
      locale: locale ?? this.locale,
      themeColor: themeColor ?? this.themeColor,
      fontFamily: fontFamily ?? this.fontFamily,
      textScale: textScale ?? this.textScale,
    );
  }
}

class AppSettingsController extends AsyncNotifier<AppSettings> {
  @override
  Future<AppSettings> build() async {
    final prefs = await SharedPreferences.getInstance();
    final themeName = prefs.getString(_themeModeKey);
    final localeCode = prefs.getString(_localeKey);
    final themeColorName = prefs.getString(_themeColorKey);
    final fontFamilyName = prefs.getString(_fontFamilyKey);
    final textScale = prefs.getDouble(_textScaleKey);

    return AppSettings(
      themeMode: ThemeMode.values.firstWhere(
        (mode) => mode.name == themeName,
        orElse: () => ThemeMode.system,
      ),
      locale: Locale(localeCode ?? 'en'),
      themeColor: AppThemeColor.values.firstWhere(
        (value) => value.name == themeColorName,
        orElse: () => AppThemeColor.green,
      ),
      fontFamily: AppFontFamily.values.firstWhere(
        (value) => value.name == fontFamilyName,
        orElse: () => AppFontFamily.googleSans,
      ),
      textScale: (textScale ?? 1).clamp(0.9, 1.2).toDouble(),
    );
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeModeKey, mode.name);
    final current = state.maybeWhen(
      data: (value) => value,
      orElse: () => const AppSettings(),
    );
    state = AsyncData(current.copyWith(themeMode: mode));
  }

  Future<void> setLocale(Locale locale) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_localeKey, locale.languageCode);
    final current = state.maybeWhen(
      data: (value) => value,
      orElse: () => const AppSettings(),
    );
    state = AsyncData(current.copyWith(locale: locale));
  }

  Future<void> setThemeColor(AppThemeColor color) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeColorKey, color.name);
    final current = state.maybeWhen(
      data: (value) => value,
      orElse: () => const AppSettings(),
    );
    state = AsyncData(current.copyWith(themeColor: color));
  }

  Future<void> setFontFamily(AppFontFamily fontFamily) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_fontFamilyKey, fontFamily.name);
    final current = state.maybeWhen(
      data: (value) => value,
      orElse: () => const AppSettings(),
    );
    state = AsyncData(current.copyWith(fontFamily: fontFamily));
  }

  Future<void> setTextScale(double textScale) async {
    final prefs = await SharedPreferences.getInstance();
    final next = textScale.clamp(0.9, 1.2).toDouble();
    await prefs.setDouble(_textScaleKey, next);
    final current = state.maybeWhen(
      data: (value) => value,
      orElse: () => const AppSettings(),
    );
    state = AsyncData(current.copyWith(textScale: next));
  }
}
