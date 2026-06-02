import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/localization/translation_keys.dart';
import '../../../core/settings/app_settings.dart';
import '../../../core/widgets/responsive_page.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref
        .watch(appSettingsProvider)
        .maybeWhen(data: (value) => value, orElse: () => const AppSettings());
    final controller = ref.read(appSettingsProvider.notifier);

    return Scaffold(
      appBar: AppBar(title: Text(L.common.settings.tr())),
      body: ResponsivePage(
        maxWidth: 760,
        child: ListView(
          children: [
            Text(
              L.settings.appearance.tr(),
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            const Gap(16),
            _Section(
              icon: LucideIcons.sunMoon,
              title: L.common.theme.tr(),
              child: SegmentedButton<ThemeMode>(
                segments: [
                  ButtonSegment(
                    value: ThemeMode.system,
                    label: Text(L.settings.systemTheme.tr()),
                  ),
                  ButtonSegment(
                    value: ThemeMode.light,
                    label: Text(L.settings.lightTheme.tr()),
                  ),
                  ButtonSegment(
                    value: ThemeMode.dark,
                    label: Text(L.settings.darkTheme.tr()),
                  ),
                ],
                selected: {settings.themeMode},
                onSelectionChanged: (value) =>
                    controller.setThemeMode(value.first),
              ),
            ),
            const Gap(14),
            _Section(
              icon: LucideIcons.palette,
              title: L.settings.themeColor.tr(),
              child: Wrap(
                spacing: 10,
                runSpacing: 10,
                children: AppThemeColor.values.map((color) {
                  return Tooltip(
                    message: appThemeColorKey(color).tr(),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(999),
                      onTap: () => controller.setThemeColor(color),
                      child: Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: color.color,
                          shape: BoxShape.circle,
                          border: Border.all(
                            width: settings.themeColor == color ? 4 : 1,
                            color: settings.themeColor == color
                                ? Theme.of(context).colorScheme.onSurface
                                : Theme.of(context).colorScheme.outline,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const Gap(14),
            _Section(
              icon: LucideIcons.type,
              title: L.settings.fontFamily.tr(),
              child: DropdownButtonFormField<AppFontFamily>(
                initialValue: settings.fontFamily,
                decoration: const InputDecoration(),
                items: AppFontFamily.values
                    .map(
                      (font) => DropdownMenuItem(
                        value: font,
                        child: Text(font.label),
                      ),
                    )
                    .toList(),
                onChanged: (value) {
                  if (value != null) controller.setFontFamily(value);
                },
              ),
            ),
            const Gap(14),
            _Section(
              icon: LucideIcons.textCursorInput,
              title: L.settings.fontSize.tr(),
              child: Slider(
                min: 0.9,
                max: 1.2,
                divisions: 6,
                value: settings.textScale,
                label: '${(settings.textScale * 100).round()}%',
                onChanged: controller.setTextScale,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({
    required this.icon,
    required this.title,
    required this.child,
  });

  final IconData icon;
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return DecoratedBox(
      decoration: BoxDecoration(
        border: Border.all(color: colors.outline),
        borderRadius: BorderRadius.circular(8),
        color: colors.surface,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(icon, color: colors.primary, size: 20),
                const Gap(8),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
            const Gap(12),
            child,
          ],
        ),
      ),
    );
  }
}
