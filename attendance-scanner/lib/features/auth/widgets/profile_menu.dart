import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../data/auth_models.dart';
import '../state/auth_controller.dart';

class ProfileMenu extends ConsumerWidget {
  const ProfileMenu({
    super.key,
    required this.user,
    required this.fallbackName,
  });

  final AuthUser? user;
  final String fallbackName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = Theme.of(context).colorScheme;
    final name = user?.fullNameEn ?? fallbackName;
    final email = user?.email ?? 'admin@organization.com';

    return PopupMenuButton<String>(
      tooltip: 'profile'.tr(),
      offset: const Offset(0, 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: colors.outline),
      ),
      onSelected: (value) {
        if (value == 'profile') {
          context.push('/profile');
        } else if (value == 'settings') {
          context.push('/settings');
        } else if (value == 'logout') {
          ref.read(authControllerProvider).logout();
        }
      },
      itemBuilder: (context) => [
        PopupMenuItem(
          enabled: false,
          child: _ProfileHeader(name: name, email: email),
        ),
        const PopupMenuDivider(height: 1),
        PopupMenuItem(
          value: 'profile',
          child: _MenuRow(icon: LucideIcons.userRound, text: 'profile'.tr()),
        ),
        PopupMenuItem(
          value: 'settings',
          child: _MenuRow(icon: LucideIcons.settings, text: 'settings'.tr()),
        ),
        const PopupMenuDivider(height: 1),
        PopupMenuItem(
          value: 'logout',
          child: _MenuRow(
            icon: LucideIcons.logOut,
            text: 'signOut'.tr(),
            color: colors.error,
          ),
        ),
      ],
      child: Padding(
        padding: const EdgeInsets.only(right: 12),
        child: CircleAvatar(
          radius: 18,
          backgroundColor: colors.primary,
          foregroundColor: colors.onPrimary,
          child: Text(
            initials(name),
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800),
          ),
        ),
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.name, required this.email});

  final String name;
  final String email;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Row(
      children: [
        CircleAvatar(
          radius: 18,
          backgroundColor: colors.primary,
          foregroundColor: colors.onPrimary,
          child: Text(initials(name), style: const TextStyle(fontSize: 12)),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              Text(
                email,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _MenuRow extends StatelessWidget {
  const _MenuRow({required this.icon, required this.text, this.color});

  final IconData icon;
  final String text;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final effectiveColor = color ?? Theme.of(context).colorScheme.onSurface;

    return Row(
      children: [
        Icon(icon, size: 18, color: effectiveColor),
        const SizedBox(width: 10),
        Text(text, style: TextStyle(color: effectiveColor)),
      ],
    );
  }
}

String initials(String value) {
  final words = value
      .trim()
      .split(RegExp(r'\s+'))
      .where((word) => word.isNotEmpty)
      .toList();
  if (words.isEmpty) return 'AD';
  if (words.length == 1) return words.first.characters.first.toUpperCase();
  return '${words.first.characters.first}${words.last.characters.first}'
      .toUpperCase();
}
