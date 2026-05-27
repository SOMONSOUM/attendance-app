import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../../core/platform/device_form_factor.dart';
import '../../../core/widgets/app_settings_actions.dart';
import '../../../core/widgets/responsive_page.dart';
import '../../../core/widgets/scanner_logo.dart';
import '../../auth/state/auth_controller.dart';
import '../../auth/widgets/profile_menu.dart';
import '../../home/data/event_meeting_models.dart';
import '../../home/data/events_repository.dart';
import '../data/check_in_models.dart';
import '../state/scan_controller.dart';

part '../widgets/scan_widgets.dart';

final _selectedScanItemProvider = FutureProvider.autoDispose
    .family<EventMeetingItem?, _SelectedItemKey>((ref, key) {
      return ref
          .read(eventsRepositoryProvider)
          .getEventMeeting(kind: key.kind, id: key.id);
    });

class _SelectedItemKey {
  const _SelectedItemKey({required this.kind, required this.id});

  final EventMeetingKind kind;
  final String id;

  @override
  bool operator ==(Object other) {
    return other is _SelectedItemKey && other.kind == kind && other.id == id;
  }

  @override
  int get hashCode => Object.hash(kind, id);
}

class _L10n {
  String get qrScanner => 'qrScanner'.tr();
  String get adminUser => 'adminUser'.tr();
  String get errorTitle => 'errorTitle'.tr();
  String get ok => 'ok'.tr();
  String get checkInMethod => 'checkInMethod'.tr();
  String get enterCheckInCode => 'enterCheckInCode'.tr();
  String get typeOrPasteCode => 'typeOrPasteCode'.tr();
  String get checkIn => 'checkIn'.tr();
  String get or => 'or'.tr();
  String get scanPersonalQr => 'scanPersonalQr'.tr();
  String get attendeeQrHelp => 'attendeeQrHelp'.tr();
  String get usbReader => 'usbReader'.tr();
  String get checkedInSuccessfully => 'checkedInSuccessfully'.tr();
  String get waitingForScan => 'waitingForScan'.tr();
  String get checkInResult => 'checkInResult'.tr();
  String get scanSuccessful => 'scanSuccessful'.tr();
  String get scanNextAttendee => 'scanNextAttendee'.tr();
  String get alignQrCode => 'alignQrCode'.tr();
  String get recentCheckIns => 'recentCheckIns'.tr();
  String get noRecentCheckIns => 'noRecentCheckIns'.tr();
  String get noProfileYet => 'noProfileYet'.tr();
  String get noProfileHelp => 'noProfileHelp'.tr();
  String get fullName => 'fullName'.tr();
  String get gender => 'gender'.tr();
  String get phoneNumber => 'phoneNumber'.tr();
  String get position => 'position'.tr();
  String get organization => 'organization'.tr();
}

class ScanScreen extends ConsumerStatefulWidget {
  const ScanScreen({super.key, this.selectedItem});

  final EventMeetingItem? selectedItem;

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
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(scanControllerProvider.notifier).clearSession();
    });
    if (prefersHardwareQrReader) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _hardwareFocusNode.requestFocus();
      });
    }
  }

  @override
  void didUpdateWidget(covariant ScanScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedItem?.id != widget.selectedItem?.id ||
        oldWidget.selectedItem?.kind != widget.selectedItem?.kind) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(scanControllerProvider.notifier).clearSession();
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
    final selectedKey = _selectedKey;
    final selectedDetail = selectedKey == null
        ? const AsyncData<EventMeetingItem?>(null)
        : ref.watch(_selectedScanItemProvider(selectedKey));
    final selectedItem =
        selectedDetail.whenOrNull(data: (item) => item) ?? widget.selectedItem;
    final detailLoading = selectedDetail.isLoading;
    final l10n = _L10n();
    final compactAppBar = MediaQuery.of(context).size.width < 560;

    ref.listen(scanControllerProvider, (previous, next) {
      if (next.error != null && next.error != previous?.error) {
        _showScanError(next.error!);
      }
    });

    return Scaffold(
      appBar: AppBar(
        titleSpacing: compactAppBar ? 8 : null,
        title: compactAppBar
            ? const SizedBox.shrink()
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const ScannerLogo(size: 34),
                  const SizedBox(width: 10),
                  Flexible(
                    child: Text(
                      l10n.qrScanner,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
        actions: [
          const AppSettingsActions(),
          ProfileMenu(user: auth.user, fallbackName: l10n.adminUser),
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
                selectedItem: selectedItem,
                selectedItemLoading: detailLoading,
                hardwareController: _hardwareController,
                hardwareFocusNode: _hardwareFocusNode,
                onHardwareSubmit: _submitHardwareCode,
              );
            }

            if (state.lastPerson != null) {
              return _MobileResultView(
                person: state.lastPerson!,
                selectedItem: selectedItem,
                selectedItemLoading: detailLoading,
                onScanNext: _resumeScanning,
              );
            }

            return _MobileScannerView(
              state: state,
              selectedItem: selectedItem,
              selectedItemLoading: detailLoading,
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
    final selectedKey = _selectedKey;
    if (selectedKey != null) {
      ref.invalidate(_selectedScanItemProvider(selectedKey));
    }
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
    final selectedKey = _selectedKey;
    if (selectedKey != null) {
      ref.invalidate(_selectedScanItemProvider(selectedKey));
    }
  }

  _SelectedItemKey? get _selectedKey {
    final item = widget.selectedItem;
    if (item == null) return null;
    return _SelectedItemKey(kind: item.kind, id: item.id);
  }

  void _resumeScanning() {
    ref.read(scanControllerProvider.notifier).clearResult();
    setState(() => _cameraPaused = false);
    if (prefersHardwareQrReader) _hardwareFocusNode.requestFocus();
  }

  Future<void> _showScanError(String message) async {
    if (!mounted) return;
    final l10n = _L10n();
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
