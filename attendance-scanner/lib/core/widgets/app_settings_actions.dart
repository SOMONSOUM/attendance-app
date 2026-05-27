import 'package:country_flags/country_flags.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../settings/app_settings.dart';

class AppSettingsActions extends ConsumerWidget {
  const AppSettingsActions({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref
        .watch(appSettingsProvider)
        .maybeWhen(data: (value) => value, orElse: () => const AppSettings());

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          tooltip: 'language'.tr(),
          onPressed: () async {
            final locale = settings.locale.languageCode == 'km'
                ? const Locale('en')
                : const Locale('km');
            await context.setLocale(locale);
            await ref.read(appSettingsProvider.notifier).setLocale(locale);
          },
          icon: SizedBox(
            width: 24,
            height: 18,
            child: CountryFlag.fromCountryCode(
              settings.locale.languageCode == 'km' ? 'KH' : 'US',
              theme: const ImageTheme(shape: RoundedRectangle(3)),
            ),
          ),
        ),
        IconButton(
          tooltip: 'theme'.tr(),
          onPressed: () {
            final next = settings.themeMode == ThemeMode.dark
                ? ThemeMode.light
                : ThemeMode.dark;
            ref.read(appSettingsProvider.notifier).setThemeMode(next);
          },
          icon: Icon(
            settings.themeMode == ThemeMode.dark
                ? LucideIcons.moon
                : LucideIcons.sun,
          ),
        ),
      ],
    );
  }
}
