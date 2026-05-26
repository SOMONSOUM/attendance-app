import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../../core/platform/device_form_factor.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_settings_actions.dart';
import '../../../core/widgets/responsive_page.dart';
import '../../../core/widgets/scanner_logo.dart';
import '../../../l10n/app_localizations.dart';
import '../../auth/state/auth_controller.dart';
import '../data/check_in_models.dart';
import '../state/scan_controller.dart';

class ScanScreen extends ConsumerStatefulWidget {
  const ScanScreen({super.key});

  @override
  ConsumerState<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends ConsumerState<ScanScreen> {
  final _hardwareController = TextEditingController();
  final _hardwareFocusNode = FocusNode();
  bool _cameraPaused = false;

  @override
  void initState() {
    super.initState();
    if (prefersHardwareQrReader) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _hardwareFocusNode.requestFocus();
      });
    }
  }

  @override
  void dispose() {
    _hardwareController.dispose();
    _hardwareFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(scanControllerProvider);
    final auth = ref.watch(authControllerProvider);
    final l10n = AppLocalizations.of(context);

    ref.listen(scanControllerProvider, (previous, next) {
      if (next.error != null && next.error != previous?.error) {
        _showScanError(next.error!);
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const ScannerLogo(size: 34),
            const SizedBox(width: 10),
            Text(l10n.qrScanner),
          ],
        ),
        actions: [
          const AppSettingsActions(),
          _UserMenu(name: auth.user?.fullNameEn ?? l10n.adminUser),
        ],
      ),
      body: ResponsivePage(
        maxWidth: 1180,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final wide = constraints.maxWidth >= 900;
            if (wide) {
              return _DesktopScannerLayout(
                state: state,
                hardwareController: _hardwareController,
                hardwareFocusNode: _hardwareFocusNode,
                onHardwareSubmit: _submitHardwareCode,
              );
            }

            if (state.lastPerson != null) {
              return _MobileResultView(
                person: state.lastPerson!,
                onScanNext: _resumeScanning,
              );
            }

            return _MobileScannerView(
              state: state,
              cameraPaused: _cameraPaused,
              hardwareController: _hardwareController,
              hardwareFocusNode: _hardwareFocusNode,
              onCameraDetect: _onCameraDetect,
              onHardwareSubmit: _submitHardwareCode,
            );
          },
        ),
      ),
    );
  }

  Future<void> _submitHardwareCode(String value) async {
    await ref.read(scanControllerProvider.notifier).submit(value);
    _hardwareController.clear();
    _hardwareFocusNode.requestFocus();
  }

  Future<void> _onCameraDetect(BarcodeCapture capture) async {
    if (_cameraPaused) return;
    final value = capture.barcodes.isEmpty
        ? null
        : capture.barcodes.first.rawValue;
    if (value == null || value.isEmpty) return;

    setState(() => _cameraPaused = true);
    await ref.read(scanControllerProvider.notifier).submit(value);
  }

  void _resumeScanning() {
    ref.read(scanControllerProvider.notifier).clearResult();
    setState(() => _cameraPaused = false);
    if (prefersHardwareQrReader) _hardwareFocusNode.requestFocus();
  }

  Future<void> _showScanError(String message) async {
    if (!mounted) return;
    final l10n = AppLocalizations.of(context);
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        icon: const Icon(Icons.error_outline_rounded),
        title: Text(l10n.errorTitle),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(l10n.ok),
          ),
        ],
      ),
    );
    if (!mounted) return;
    if (supportsCameraScanning) {
      setState(() => _cameraPaused = false);
    } else {
      _hardwareFocusNode.requestFocus();
    }
  }
}

class _DesktopScannerLayout extends StatelessWidget {
  const _DesktopScannerLayout({
    required this.state,
    required this.hardwareController,
    required this.hardwareFocusNode,
    required this.onHardwareSubmit,
  });

  final ScanState state;
  final TextEditingController hardwareController;
  final FocusNode hardwareFocusNode;
  final ValueChanged<String> onHardwareSubmit;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 300,
          child: _DesktopMethodRail(
            controller: hardwareController,
            focusNode: hardwareFocusNode,
            onSubmitted: onHardwareSubmit,
          ),
        ),
        const SizedBox(width: 20),
        Expanded(child: _DesktopResultPane(state: state)),
      ],
    );
  }
}

class _DesktopMethodRail extends StatelessWidget {
  const _DesktopMethodRail({
    required this.controller,
    required this.focusNode,
    required this.onSubmitted,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onSubmitted;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final colors = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          l10n.checkInMethod,
          style: Theme.of(
            context,
          ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 10),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _SectionLabel(
                  icon: Icons.keyboard_alt_rounded,
                  text: l10n.enterCheckInCode,
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: controller,
                  focusNode: focusNode,
                  autofocus: true,
                  onSubmitted: onSubmitted,
                  decoration: InputDecoration(
                    hintText: l10n.typeOrPasteCode,
                    prefixIcon: const Icon(Icons.tag_rounded),
                    suffixIcon: IconButton(
                      onPressed: () => onSubmitted(controller.text),
                      icon: const Icon(Icons.keyboard_return_rounded),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  onPressed: () => onSubmitted(controller.text),
                  icon: const Icon(Icons.arrow_forward_rounded),
                  label: Text(l10n.checkIn),
                ),
              ],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Row(
            children: [
              Expanded(child: Divider(color: colors.outline)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text(
                  l10n.or,
                  style: TextStyle(
                    color: colors.onSurface.withValues(alpha: 0.58),
                  ),
                ),
              ),
              Expanded(child: Divider(color: colors.outline)),
            ],
          ),
        ),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _SectionLabel(
                  icon: Icons.qr_code_2_rounded,
                  text: l10n.scanPersonalQr,
                ),
                const SizedBox(height: 14),
                Container(
                  height: 126,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: colors.outline,
                      style: BorderStyle.solid,
                    ),
                    color: colors.surfaceContainerHighest.withValues(
                      alpha: 0.38,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.phone_android_rounded,
                        color: colors.onSurface.withValues(alpha: 0.72),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        l10n.attendeeQrHelp,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () => focusNode.requestFocus(),
                  icon: const Icon(Icons.usb_rounded),
                  label: Text(l10n.usbReader),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _DesktopResultPane extends StatelessWidget {
  const _DesktopResultPane({required this.state});

  final ScanState state;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (state.isCheckingIn)
          const LinearProgressIndicator(minHeight: 6)
        else if (state.lastPerson != null)
          _SuccessBanner(text: l10n.checkedInSuccessfully)
        else
          _NeutralBanner(text: l10n.waitingForScan),
        const SizedBox(height: 14),
        if (state.lastPerson == null)
          _EmptyProfile(l10n: l10n)
        else
          _ResultCard(person: state.lastPerson!),
        const SizedBox(height: 18),
        _RecentCheckIns(people: state.recentPeople),
      ],
    );
  }
}

class _MobileScannerView extends StatelessWidget {
  const _MobileScannerView({
    required this.state,
    required this.cameraPaused,
    required this.hardwareController,
    required this.hardwareFocusNode,
    required this.onCameraDetect,
    required this.onHardwareSubmit,
  });

  final ScanState state;
  final bool cameraPaused;
  final TextEditingController hardwareController;
  final FocusNode hardwareFocusNode;
  final ValueChanged<BarcodeCapture> onCameraDetect;
  final ValueChanged<String> onHardwareSubmit;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return ListView(
      children: [
        _MobileHeader(
          title: l10n.qrScanner,
          subtitle: l10n.scanPersonalQr,
          icon: Icons.qr_code_scanner_rounded,
        ),
        const SizedBox(height: 14),
        if (supportsCameraScanning) ...[
          _CameraFrame(paused: cameraPaused, onDetect: onCameraDetect),
          const SizedBox(height: 14),
        ],
        _ManualEntryCard(
          controller: hardwareController,
          focusNode: hardwareFocusNode,
          onSubmitted: onHardwareSubmit,
        ),
        if (state.isCheckingIn) ...[
          const SizedBox(height: 16),
          const LinearProgressIndicator(minHeight: 6),
        ],
      ],
    );
  }
}

class _MobileResultView extends StatelessWidget {
  const _MobileResultView({required this.person, required this.onScanNext});

  final CheckInPerson person;
  final VoidCallback onScanNext;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return ListView(
      children: [
        _MobileHeader(
          title: l10n.checkInResult,
          subtitle: l10n.scanSuccessful,
          icon: Icons.check_rounded,
        ),
        const SizedBox(height: 14),
        _SuccessBanner(text: l10n.checkedInSuccessfully),
        const SizedBox(height: 12),
        _ResultCard(person: person),
        const SizedBox(height: 14),
        ElevatedButton.icon(
          onPressed: onScanNext,
          icon: const Icon(Icons.qr_code_scanner_rounded),
          label: Text(l10n.scanNextAttendee),
        ),
      ],
    );
  }
}

class _MobileHeader extends StatelessWidget {
  const _MobileHeader({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Row(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: colors.primary,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: colors.onPrimary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
              ),
              Text(subtitle),
            ],
          ),
        ),
      ],
    );
  }
}

class _CameraFrame extends StatelessWidget {
  const _CameraFrame({required this.paused, required this.onDetect});

  final bool paused;
  final ValueChanged<BarcodeCapture> onDetect;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final colors = Theme.of(context).colorScheme;

    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: AspectRatio(
        aspectRatio: 3 / 4,
        child: Stack(
          fit: StackFit.expand,
          children: [
            MobileScanner(fit: BoxFit.cover, onDetect: onDetect),
            ColoredBox(color: Colors.black.withValues(alpha: 0.22)),
            Center(
              child: SizedBox.square(
                dimension: 190,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    border: Border.all(color: colors.primary, width: 3),
                  ),
                ),
              ),
            ),
            Positioned(
              left: 18,
              right: 18,
              bottom: 18,
              child: Text(
                paused ? l10n.scanSuccessful : l10n.alignQrCode,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ManualEntryCard extends StatelessWidget {
  const _ManualEntryCard({
    required this.controller,
    required this.focusNode,
    required this.onSubmitted,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onSubmitted;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _SectionLabel(
              icon: Icons.keyboard_alt_rounded,
              text: l10n.enterCheckInCode,
            ),
            const SizedBox(height: 10),
            TextField(
              controller: controller,
              focusNode: focusNode,
              onSubmitted: onSubmitted,
              decoration: InputDecoration(
                hintText: l10n.typeOrPasteCode,
                suffixIcon: IconButton(
                  onPressed: () => onSubmitted(controller.text),
                  icon: const Icon(Icons.chevron_right_rounded),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ResultCard extends StatelessWidget {
  const _ResultCard({required this.person});

  final CheckInPerson person;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final colors = Theme.of(context).colorScheme;

    return Card(
      color: AppTheme.successSurface(Theme.of(context).brightness),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: colors.primary,
                  foregroundColor: colors.onPrimary,
                  child: Text(
                    _initials(person.fullName),
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        person.fullName,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      Text(person.organization ?? person.kindLabel),
                    ],
                  ),
                ),
                _StatusPill(text: person.status ?? 'In'),
              ],
            ),
            const SizedBox(height: 18),
            Wrap(
              runSpacing: 12,
              spacing: 12,
              children: [
                _InfoTile(
                  icon: Icons.person_outline_rounded,
                  label: l10n.fullName,
                  value: person.fullName,
                ),
                _InfoTile(
                  icon: Icons.transgender_rounded,
                  label: l10n.gender,
                  value: person.gender,
                ),
                _InfoTile(
                  icon: Icons.phone_outlined,
                  label: l10n.phoneNumber,
                  value: person.phoneNumber,
                ),
                _InfoTile(
                  icon: Icons.work_outline_rounded,
                  label: l10n.position,
                  value: person.position,
                ),
                _InfoTile(
                  icon: Icons.business_outlined,
                  label: l10n.organization,
                  value: person.organization,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _RecentCheckIns extends StatelessWidget {
  const _RecentCheckIns({required this.people});

  final List<CheckInPerson> people;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final colors = Theme.of(context).colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              l10n.recentCheckIns,
              style: Theme.of(
                context,
              ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 10),
            if (people.isEmpty)
              Text(
                l10n.noRecentCheckIns,
                style: TextStyle(
                  color: colors.onSurface.withValues(alpha: 0.58),
                ),
              )
            else
              ...people.map((person) => _RecentRow(person: person)),
          ],
        ),
      ),
    );
  }
}

class _RecentRow extends StatelessWidget {
  const _RecentRow({required this.person});

  final CheckInPerson person;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: colors.primary,
            foregroundColor: colors.onPrimary,
            child: Text(
              _initials(person.fullName),
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  person.fullName,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                Text(
                  person.position ?? person.organization ?? person.kindLabel,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          Icon(Icons.check_circle_rounded, color: colors.primary, size: 18),
        ],
      ),
    );
  }
}

class _EmptyProfile extends StatelessWidget {
  const _EmptyProfile({required this.l10n});

  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          children: [
            Icon(Icons.person_search_rounded, size: 48, color: colors.primary),
            const SizedBox(height: 14),
            Text(
              l10n.noProfileYet,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              l10n.noProfileHelp,
              textAlign: TextAlign.center,
              style: TextStyle(color: colors.onSurface.withValues(alpha: 0.62)),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return SizedBox(
      width: 220,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 17, color: colors.primary),
          const SizedBox(width: 8),
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
                Text(
                  value == null || value!.isEmpty ? '-' : value!,
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

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: colors.primary,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: colors.onPrimary,
          fontSize: 12,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _SuccessBanner extends StatelessWidget {
  const _SuccessBanner({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.successSurface(Theme.of(context).brightness),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.check_circle_outline_rounded, color: colors.primary),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              text,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: isDark ? const Color(0xFFD8F4EA) : AppTheme.darkPrimary,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NeutralBanner extends StatelessWidget {
  const _NeutralBanner({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: colors.surfaceContainerHighest.withValues(alpha: 0.42),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Row(
      children: [
        Icon(icon, size: 18, color: colors.primary),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontWeight: FontWeight.w800),
          ),
        ),
      ],
    );
  }
}

class _UserMenu extends ConsumerWidget {
  const _UserMenu({required this.name});

  final String name;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final colors = Theme.of(context).colorScheme;

    return PopupMenuButton<String>(
      tooltip: name,
      onSelected: (value) {
        if (value == 'logout') {
          ref.read(authControllerProvider).logout();
        }
      },
      itemBuilder: (context) => [
        PopupMenuItem(
          enabled: false,
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: colors.primary,
                foregroundColor: colors.onPrimary,
                child: Text(_initials(name)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  name,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
              ),
            ],
          ),
        ),
        const PopupMenuDivider(),
        PopupMenuItem(
          value: 'logout',
          child: Row(
            children: [
              Icon(Icons.logout_rounded, color: colors.error, size: 18),
              const SizedBox(width: 10),
              Text(l10n.logout, style: TextStyle(color: colors.error)),
            ],
          ),
        ),
      ],
      child: Padding(
        padding: const EdgeInsets.only(right: 12),
        child: Row(
          children: [
            CircleAvatar(
              radius: 17,
              backgroundColor: colors.primary,
              foregroundColor: colors.onPrimary,
              child: Text(
                _initials(name),
                style: const TextStyle(fontSize: 12),
              ),
            ),
            const SizedBox(width: 8),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 140),
              child: Text(
                name,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
            const Icon(Icons.keyboard_arrow_down_rounded),
          ],
        ),
      ),
    );
  }
}

String _initials(String value) {
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
