import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../l10n/app_localizations.dart';
import '../settings/app_settings.dart';

class AppSettingsActions extends ConsumerWidget {
  const AppSettingsActions({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final settings = ref
        .watch(appSettingsProvider)
        .maybeWhen(data: (value) => value, orElse: () => const AppSettings());

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        PopupMenuButton<Locale>(
          tooltip: l10n.language,
          icon: const Icon(Icons.language_rounded),
          initialValue: settings.locale,
          onSelected: ref.read(appSettingsProvider.notifier).setLocale,
          itemBuilder: (context) => const [
            PopupMenuItem(value: Locale('en'), child: Text('English')),
            PopupMenuItem(value: Locale('km'), child: Text('ភាសាខ្មែរ')),
          ],
        ),
        IconButton(
          tooltip: l10n.theme,
          onPressed: () {
            final next = settings.themeMode == ThemeMode.dark
                ? ThemeMode.light
                : ThemeMode.dark;
            ref.read(appSettingsProvider.notifier).setThemeMode(next);
          },
          icon: Icon(
            settings.themeMode == ThemeMode.dark
                ? Icons.dark_mode_rounded
                : Icons.light_mode_rounded,
          ),
        ),
      ],
    );
  }
}
