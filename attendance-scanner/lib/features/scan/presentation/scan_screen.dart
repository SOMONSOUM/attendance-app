import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
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
import '../data/check_in_repository.dart';
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
  final _hardwareScanBuffer = StringBuffer();
  late final MobileScannerController _cameraController;
  Timer? _hardwareScanTimer;
  String? _endedNoticeItemId;
  bool _cameraPaused = false;
  bool _endedDialogOpen = false;

  @override
  void initState() {
    super.initState();
    _cameraController = MobileScannerController(
      detectionSpeed: DetectionSpeed.noDuplicates,
      formats: const [BarcodeFormat.qrCode],
    );
    HardwareKeyboard.instance.addHandler(_handleHardwareKey);
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
    HardwareKeyboard.instance.removeHandler(_handleHardwareKey);
    _hardwareScanTimer?.cancel();
    _cameraController.dispose();
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

    _showEndedNoticeIfNeeded(selectedItem);

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
              return RefreshIndicator(
                onRefresh: _refreshSelectedItem,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  child: SizedBox(
                    width: constraints.maxWidth,
                    child: _DesktopScannerLayout(
                      state: state,
                      selectedItem: selectedItem,
                      selectedItemLoading: detailLoading,
                      hardwareController: _hardwareController,
                      hardwareFocusNode: _hardwareFocusNode,
                      onHardwareSubmit: (value) =>
                          _submitHardwareCode(value, selectedItem),
                    ),
                  ),
                ),
              );
            }

            if (state.lastPerson != null) {
              return _MobileResultView(
                person: state.lastPerson!,
                selectedItem: selectedItem,
                selectedItemLoading: detailLoading,
                onScanNext: _resumeScanning,
                onRefresh: _refreshSelectedItem,
              );
            }

            return _MobileScannerView(
              state: state,
              selectedItem: selectedItem,
              selectedItemLoading: detailLoading,
              cameraPaused: _cameraPaused,
              cameraController: _cameraController,
              hardwareController: _hardwareController,
              hardwareFocusNode: _hardwareFocusNode,
              onCameraDetect: (capture) =>
                  _onCameraDetect(capture, selectedItem),
              onHardwareSubmit: (value) =>
                  _submitHardwareCode(value, selectedItem),
              onRefresh: _refreshSelectedItem,
            );
          },
        ),
      ),
    );
  }

  Future<void> _submitHardwareCode(
    String value,
    EventMeetingItem? selectedItem,
  ) async {
    final cleaned = value.trim();
    if (cleaned.isEmpty) return;
    if (_isScanBlocked(selectedItem)) {
      _hardwareController.clear();
      _hardwareFocusNode.requestFocus();
      return;
    }
    await ref
        .read(scanControllerProvider.notifier)
        .submit(cleaned, target: _checkInTarget(selectedItem));
    final selectedKey = _selectedKey;
    if (selectedKey != null) {
      ref.invalidate(_selectedScanItemProvider(selectedKey));
    }
    _hardwareController.clear();
    _hardwareFocusNode.requestFocus();
  }

  bool _handleHardwareKey(KeyEvent event) {
    if (event is! KeyDownEvent || _hardwareFocusNode.hasFocus) return false;

    final key = event.logicalKey;
    final shouldSubmit =
        key == LogicalKeyboardKey.enter ||
        key == LogicalKeyboardKey.numpadEnter ||
        key == LogicalKeyboardKey.tab;

    if (shouldSubmit) {
      final value = _hardwareScanBuffer.toString().trim();
      _clearHardwareScanBuffer();
      if (value.isEmpty) return false;
      _submitHardwareCode(value, _currentSelectedItem());
      return true;
    }

    final character = event.character;
    if (character == null || character.isEmpty) return false;
    if (character.codeUnitAt(0) < 32) return false;

    _hardwareScanBuffer.write(character);
    _hardwareScanTimer?.cancel();
    _hardwareScanTimer = Timer(
      const Duration(milliseconds: 700),
      _clearHardwareScanBuffer,
    );
    return true;
  }

  void _clearHardwareScanBuffer() {
    _hardwareScanTimer?.cancel();
    _hardwareScanTimer = null;
    _hardwareScanBuffer.clear();
  }

  Future<void> _onCameraDetect(
    BarcodeCapture capture,
    EventMeetingItem? selectedItem,
  ) async {
    if (_cameraPaused) return;
    if (_isScanBlocked(selectedItem)) return;
    final value = capture.barcodes.isEmpty
        ? null
        : capture.barcodes.first.rawValue;
    if (value == null || value.isEmpty) return;

    setState(() => _cameraPaused = true);
    await ref
        .read(scanControllerProvider.notifier)
        .submit(value, target: _checkInTarget(selectedItem));
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

  EventMeetingItem? _currentSelectedItem() {
    final selectedKey = _selectedKey;
    if (selectedKey == null) return widget.selectedItem;
    return ref
            .read(_selectedScanItemProvider(selectedKey))
            .whenOrNull(data: (item) => item) ??
        widget.selectedItem;
  }

  Future<void> _refreshSelectedItem() async {
    final selectedKey = _selectedKey;
    if (selectedKey == null) return;
    ref.invalidate(_selectedScanItemProvider(selectedKey));
    await ref.read(_selectedScanItemProvider(selectedKey).future);
  }

  void _resumeScanning() {
    ref.read(scanControllerProvider.notifier).clearResult();
    setState(() => _cameraPaused = false);
    if (prefersHardwareQrReader) _hardwareFocusNode.requestFocus();
  }

  CheckInTarget? _checkInTarget(EventMeetingItem? item) {
    if (item == null) return null;
    return CheckInTarget(
      id: item.id,
      kind: item.kind == EventMeetingKind.event
          ? CheckInTargetKind.event
          : CheckInTargetKind.meeting,
    );
  }

  bool _isScanBlocked(EventMeetingItem? item) {
    if (item == null || !item.isEnded) return false;
    _showEndedNotice(item, force: true);
    return true;
  }

  Future<void> _showScanError(String message) async {
    if (!mounted) return;
    final tone = _scanDialogTone(message);
    final translatedMessage = _localizedScanMessage(message);
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        icon: CircleAvatar(
          backgroundColor: tone.color.withValues(alpha: 0.14),
          foregroundColor: tone.color,
          child: Icon(tone.icon),
        ),
        title: Text(tone.title),
        content: Text(
          translatedMessage,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(_L10n().ok),
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

  void _showEndedNoticeIfNeeded(EventMeetingItem? item) {
    if (item == null || !item.isEnded || _endedNoticeItemId == item.id) {
      return;
    }
    _showEndedNotice(item);
  }

  void _showEndedNotice(EventMeetingItem item, {bool force = false}) {
    if (_endedDialogOpen) return;
    if (!force && _endedNoticeItemId == item.id) return;
    if (!force) _endedNoticeItemId = item.id;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _endedDialogOpen = true;
      showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          icon: CircleAvatar(
            backgroundColor: const Color(0xFFD97706).withValues(alpha: 0.14),
            foregroundColor: const Color(0xFFD97706),
            child: const Icon(Icons.event_busy_rounded),
          ),
          title: Text(
            item.kind == EventMeetingKind.meeting
                ? 'meetingEndedTitle'.tr()
                : 'eventEndedTitle'.tr(),
          ),
          content: Text(
            item.kind == EventMeetingKind.meeting
                ? 'meetingEndedNotice'.tr()
                : 'eventEndedNotice'.tr(),
          ),
          actions: [
            FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(_L10n().ok),
            ),
          ],
        ),
      ).whenComplete(() => _endedDialogOpen = false);
    });
  }
}

({String title, IconData icon, Color color}) _scanDialogTone(String message) {
  final normalized = message.toLowerCase();
  final unavailable =
      message == 'eventNotStartedMessage' ||
      message == 'meetingNotStartedMessage' ||
      message == 'eventEndedMessage' ||
      message == 'meetingEndedMessage' ||
      message == 'activeShiftMessage' ||
      normalized.contains('not started') ||
      normalized.contains('ended') ||
      normalized.contains('active shift') ||
      normalized.contains('no longer available');
  final alreadyCheckedIn =
      message == 'alreadyCheckedInMessage' ||
      normalized.contains('already joined') ||
      normalized.contains('already checked in');

  if (unavailable) {
    return (
      title: 'checkInUnavailableTitle'.tr(),
      icon: Icons.event_busy_rounded,
      color: const Color(0xFFD97706),
    );
  }
  if (alreadyCheckedIn) {
    return (
      title: 'alreadyCheckedInTitle'.tr(),
      icon: Icons.warning_amber_rounded,
      color: const Color(0xFFD97706),
    );
  }

  return (
    title: _L10n().errorTitle,
    icon: Icons.error_outline_rounded,
    color: const Color(0xFFDC2626),
  );
}

String _localizedScanMessage(String message) {
  return _translationKeys.contains(message) ? message.tr() : message;
}

const _translationKeys = {
  'invalidEventQrForMeeting',
  'invalidMeetingQrForEvent',
  'checkInResponseUnread',
  'checkInFailedGeneric',
  'meetingNotStartedMessage',
  'eventNotStartedMessage',
  'meetingEndedMessage',
  'eventEndedMessage',
  'activeShiftMessage',
  'alreadyCheckedInMessage',
  'invalidQrMessage',
  'locationRequiredMessage',
  'serverConnectionMessage',
  'badCertificateMessage',
  'checkInCancelledMessage',
};
