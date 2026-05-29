import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/widgets/scanner_logo.dart';

class LoginBrandPanel extends StatelessWidget {
  const LoginBrandPanel({
    super.key,
    required this.title,
    required this.subtitle,
  }) : compact = false;

  const LoginBrandPanel.compact({
    super.key,
    required this.title,
    required this.subtitle,
  }) : compact = true;

  final String title;
  final String subtitle;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(8);
    final colors = Theme.of(context).colorScheme;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(compact ? 24 : 32),
      decoration: BoxDecoration(
        color: colors.primary,
        borderRadius: compact
            ? radius
            : const BorderRadius.horizontal(left: Radius.circular(8)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ScannerLogo(
            size: compact ? 52 : 60,
            backgroundColor: Colors.white.withValues(alpha: 0.14),
            foregroundColor: colors.onPrimary,
          ),
          const Gap(20),
          Text(
            title,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.displaySmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: compact ? 28 : null,
            ),
          ),
          const Gap(10),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: colors.onPrimary.withValues(alpha: 0.78),
              height: 1.4,
            ),
          ),
          if (!compact) ...[
            const Gap(28),
            _FeaturePill(
              icon: LucideIcons.shieldCheck,
              label: 'secureAccess'.tr(),
            ),
            const Gap(10),
            _FeaturePill(
              icon: LucideIcons.refreshCw,
              label: 'realtimeSync'.tr(),
            ),
          ],
        ],
      ),
    );
  }
}

class _FeaturePill extends StatelessWidget {
  const _FeaturePill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(icon, color: colors.onPrimary.withValues(alpha: 0.78), size: 18),
          const Gap(8),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
