import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/localization/translation_keys.dart';
import '../../../core/widgets/responsive_page.dart';
import '../state/auth_controller.dart';
import '../widgets/profile_menu.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final colors = Theme.of(context).colorScheme;
    final name = user?.fullNameEn ?? L.common.adminUser.tr();
    final email = user?.email ?? 'admin@organization.com';
    final permissions = user?.permissions ?? const <String>[];

    return Scaffold(
      appBar: AppBar(title: Text(L.common.profile.tr())),
      body: ResponsivePage(
        maxWidth: 860,
        child: ListView(
          children: [
            DecoratedBox(
              decoration: BoxDecoration(
                color: colors.primary.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: colors.primary.withValues(alpha: 0.35),
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 34,
                      backgroundColor: colors.primary,
                      foregroundColor: colors.onPrimary,
                      child: Text(
                        initials(name),
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(
                              color: colors.onPrimary,
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            email,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: colors.onSurface.withValues(alpha: 0.68),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            _PermissionOverview(permissions: permissions),
            const SizedBox(height: 16),
            _ProfilePanel(
              title: L.profile.account.tr(),
              children: [
                _ProfileField(
                  icon: LucideIcons.mail,
                  label: L.profile.emailAddress.tr(),
                  value: email,
                ),
                _ProfileField(
                  icon: LucideIcons.building2,
                  label: L.profile.tenant.tr(),
                  value: user?.tenantName ?? user?.tenantSlug ?? '-',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PermissionOverview extends StatelessWidget {
  const _PermissionOverview({required this.permissions});

  final List<String> permissions;

  @override
  Widget build(BuildContext context) {
    return _ProfilePanel(
      title: L.profile.permissions.tr(),
      children: [_PermissionMatrix(permissions: permissions)],
    );
  }
}

class _PermissionMatrix extends StatelessWidget {
  const _PermissionMatrix({required this.permissions});

  final List<String> permissions;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final resources = [
      _RbacResource(
        key: 'events',
        label: 'Events',
        description: 'Event setup and event records',
        icon: LucideIcons.calendarDays,
      ),
      _RbacResource(
        key: 'meetings',
        label: 'Meetings',
        description: 'Meeting setup and participants',
        icon: LucideIcons.handshake,
      ),
      _RbacResource(
        key: 'places',
        label: 'Places',
        description: 'Venues and location rules',
        icon: LucideIcons.mapPin,
      ),
      _RbacResource(
        key: 'chairpersons',
        label: 'Chairpersons',
        description: 'Meeting host information',
        icon: LucideIcons.userRoundCheck,
      ),
      _RbacResource(
        key: 'registrations',
        label: 'Registrations',
        description: 'Imported and pre-registered people',
        icon: LucideIcons.fileSpreadsheet,
      ),
      _RbacResource(
        key: 'attendance',
        label: 'Attendance',
        description: 'Check-in records and scan results',
        icon: LucideIcons.clipboardCheck,
      ),
      _RbacResource(
        key: 'users',
        label: 'Users',
        description: 'User accounts',
        icon: LucideIcons.users,
      ),
      _RbacResource(
        key: 'roles',
        label: 'Roles',
        description: 'Permission groups',
        icon: LucideIcons.shieldCheck,
      ),
    ];
    final actions = [
      _RbacAction('read', 'View'),
      _RbacAction('create', 'Create'),
      _RbacAction('update', 'Update'),
      _RbacAction('delete', 'Delete'),
    ];
    final granted = permissions
        .where((permission) => permission.contains(':'))
        .length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        DecoratedBox(
          decoration: BoxDecoration(
            color: colors.primary.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: colors.primary.withValues(alpha: 0.18)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: colors.primary,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    LucideIcons.keyRound,
                    color: colors.onPrimary,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$granted active permissions',
                        style: Theme.of(context).textTheme.titleSmall
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        'Checked boxes show what this account can do.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        for (final resource in resources) ...[
          _PermissionResourceCard(
            resource: resource,
            actions: actions,
            permissions: permissions,
          ),
          const SizedBox(height: 10),
        ],
      ],
    );
  }
}

class _PermissionResourceCard extends StatelessWidget {
  const _PermissionResourceCard({
    required this.resource,
    required this.actions,
    required this.permissions,
  });

  final _RbacResource resource;
  final List<_RbacAction> actions;
  final List<String> permissions;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: colors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: colors.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: colors.secondaryContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    resource.icon,
                    color: colors.onSecondaryContainer,
                    size: 19,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        resource.label,
                        style: Theme.of(context).textTheme.titleSmall
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        resource.description,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final action in actions)
                  _PermissionCheck(
                    label: action.label,
                    checked: permissions.contains(
                      '${resource.key}:${action.key}',
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PermissionCheck extends StatelessWidget {
  const _PermissionCheck({required this.label, required this.checked});

  final String label;
  final bool checked;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: checked
            ? colors.primary.withValues(alpha: 0.10)
            : colors.surfaceContainerHighest.withValues(alpha: 0.42),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: checked
              ? colors.primary.withValues(alpha: 0.34)
              : colors.outlineVariant,
        ),
      ),
      child: Padding(
        padding: const EdgeInsetsDirectional.only(start: 6, end: 12),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Checkbox(
              value: checked,
              onChanged: null,
              visualDensity: VisualDensity.compact,
            ),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: checked ? colors.primary : colors.onSurfaceVariant,
                fontWeight: checked ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RbacResource {
  const _RbacResource({
    required this.key,
    required this.label,
    required this.description,
    required this.icon,
  });

  final String key;
  final String label;
  final String description;
  final IconData icon;
}

class _RbacAction {
  const _RbacAction(this.key, this.label);

  final String key;
  final String label;
}

class _ProfilePanel extends StatelessWidget {
  const _ProfilePanel({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: colors.outline),
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              title,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 10),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _ProfileField extends StatelessWidget {
  const _ProfileField({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: colors.primary.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 18, color: colors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.onSurface.withValues(alpha: 0.62),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
