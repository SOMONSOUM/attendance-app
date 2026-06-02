part of '../presentation/scan_screen.dart';

class _DesktopScannerLayout extends StatelessWidget {
  const _DesktopScannerLayout({
    required this.state,
    required this.selectedItem,
    required this.selectedItemLoading,
    required this.hardwareController,
    required this.hardwareFocusNode,
    required this.onHardwareSubmit,
  });

  final ScanState state;
  final EventMeetingItem? selectedItem;
  final bool selectedItemLoading;
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
        Expanded(
          child: _DesktopResultPane(
            state: state,
            selectedItem: selectedItem,
            selectedItemLoading: selectedItemLoading,
          ),
        ),
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
    final l10n = _L10n();
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
                  onChanged: (value) {
                    if (_hasScannerSuffix(value)) onSubmitted(value);
                  },
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
  const _DesktopResultPane({
    required this.state,
    required this.selectedItem,
    required this.selectedItemLoading,
  });

  final ScanState state;
  final EventMeetingItem? selectedItem;
  final bool selectedItemLoading;

  @override
  Widget build(BuildContext context) {
    final l10n = _L10n();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (state.isCheckingIn)
          const LinearProgressIndicator(minHeight: 6)
        else if (state.lastPerson != null)
          _SuccessBanner(text: l10n.checkedInSuccessfully)
        else
          _NeutralBanner(text: l10n.waitingForScan),
        if (selectedItemLoading || selectedItem != null) ...[
          const SizedBox(height: 12),
          _SelectedScanContext(
            item: selectedItem,
            isLoading: selectedItemLoading,
          ),
        ],
        const SizedBox(height: 14),
        if (state.lastPerson == null)
          _EmptyProfile(l10n: l10n)
        else
          _ResultCard(person: state.lastPerson!),
        const SizedBox(height: 18),
        _RecentCheckIns(
          people: [
            ...state.recentPeople,
            ...?selectedItem?.recentPeople.where(
              (person) =>
                  !state.recentPeople.any((recent) => recent.id == person.id),
            ),
          ].take(5).toList(),
          isLoading: selectedItemLoading,
          onPersonTap: (person) => _showPersonDialog(context, person),
        ),
      ],
    );
  }
}

class _MobileScannerView extends StatelessWidget {
  const _MobileScannerView({
    required this.state,
    required this.selectedItem,
    required this.selectedItemLoading,
    required this.cameraPaused,
    required this.cameraController,
    required this.hardwareController,
    required this.hardwareFocusNode,
    required this.onCameraDetect,
    required this.onHardwareSubmit,
    required this.onRefresh,
  });

  final ScanState state;
  final EventMeetingItem? selectedItem;
  final bool selectedItemLoading;
  final bool cameraPaused;
  final MobileScannerController cameraController;
  final TextEditingController hardwareController;
  final FocusNode hardwareFocusNode;
  final ValueChanged<BarcodeCapture> onCameraDetect;
  final ValueChanged<String> onHardwareSubmit;
  final RefreshCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    final l10n = _L10n();

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.only(
          bottom: 20 + MediaQuery.of(context).padding.bottom,
        ),
        children: [
          _MobileHeader(
            title: selectedItem?.title ?? l10n.qrScanner,
            subtitle: l10n.scanPersonalQr,
            icon: Icons.qr_code_scanner_rounded,
          ),
          if (selectedItemLoading || selectedItem != null) ...[
            const SizedBox(height: 12),
            _SelectedScanContext(
              item: selectedItem,
              isLoading: selectedItemLoading,
            ),
          ],
          const SizedBox(height: 14),
          if (supportsCameraScanning) ...[
            _CameraFrame(
              paused: cameraPaused,
              controller: cameraController,
              onDetect: onCameraDetect,
            ),
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
      ),
    );
  }
}

class _MobileResultView extends StatelessWidget {
  const _MobileResultView({
    required this.person,
    required this.selectedItem,
    required this.selectedItemLoading,
    required this.onScanNext,
    required this.onRefresh,
  });

  final CheckInPerson person;
  final EventMeetingItem? selectedItem;
  final bool selectedItemLoading;
  final VoidCallback onScanNext;
  final RefreshCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    final l10n = _L10n();

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.only(
          bottom: 20 + MediaQuery.of(context).padding.bottom,
        ),
        children: [
          _MobileHeader(
            title: l10n.checkInResult,
            subtitle: l10n.scanSuccessful,
            icon: Icons.check_rounded,
          ),
          const SizedBox(height: 14),
          _SuccessBanner(text: l10n.checkedInSuccessfully),
          if (selectedItemLoading || selectedItem != null) ...[
            const SizedBox(height: 12),
            _SelectedScanContext(
              item: selectedItem,
              isLoading: selectedItemLoading,
            ),
          ],
          const SizedBox(height: 12),
          _ResultCard(person: person),
          const SizedBox(height: 14),
          ElevatedButton.icon(
            onPressed: onScanNext,
            icon: const Icon(Icons.qr_code_scanner_rounded),
            label: Text(l10n.scanNextAttendee),
          ),
        ],
      ),
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
              Text(subtitle, maxLines: 2, overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      ],
    );
  }
}

class _SelectedScanContext extends StatelessWidget {
  const _SelectedScanContext({required this.item, required this.isLoading});

  final EventMeetingItem? item;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final item = this.item;
    final isEvent = item?.kind == EventMeetingKind.event;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: colors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: colors.primary.withValues(alpha: 0.28)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Icon(
              isEvent ? Icons.event_available : Icons.groups_rounded,
              color: colors.primary,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (isLoading) ...[
                    const LinearProgressIndicator(minHeight: 3),
                    const SizedBox(height: 10),
                  ],
                  Text(
                    item?.title ?? 'eventsMeetings'.tr(),
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 12,
                    runSpacing: 6,
                    children: [
                      _DetailMeta(
                        icon: Icons.flag_rounded,
                        text: isEvent ? 'event'.tr() : 'meeting'.tr(),
                      ),
                      _DetailMeta(
                        icon: Icons.verified_rounded,
                        text: _detailStatus(item),
                      ),
                      _DetailMeta(
                        icon: Icons.calendar_today_rounded,
                        text: 'Start: ${_detailStart(item)}',
                      ),
                      _DetailMeta(
                        icon: Icons.schedule_rounded,
                        text: 'End: ${_detailEnd(item)}',
                      ),
                      _DetailMeta(
                        icon: Icons.place_outlined,
                        text: 'Location: ${item?.location ?? '-'}',
                      ),
                    ],
                  ),
                  if (item?.description?.isNotEmpty ?? false) ...[
                    const SizedBox(height: 6),
                    Text(
                      item!.description!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailMeta extends StatelessWidget {
  const _DetailMeta({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14),
        const SizedBox(width: 4),
        ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 220),
          child: Text(
            text,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
      ],
    );
  }
}

class _CameraFrame extends StatelessWidget {
  const _CameraFrame({
    required this.paused,
    required this.controller,
    required this.onDetect,
  });

  final bool paused;
  final MobileScannerController controller;
  final ValueChanged<BarcodeCapture> onDetect;

  @override
  Widget build(BuildContext context) {
    final l10n = _L10n();
    final colors = Theme.of(context).colorScheme;

    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: AspectRatio(
        aspectRatio: 3 / 4,
        child: Stack(
          fit: StackFit.expand,
          children: [
            MobileScanner(
              controller: controller,
              fit: BoxFit.cover,
              onDetect: onDetect,
            ),
            ColoredBox(color: Colors.black.withValues(alpha: 0.22)),
            Center(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final size = constraints.biggest.shortestSide.clamp(
                    128.0,
                    190.0,
                  );
                  return SizedBox.square(
                    dimension: size,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        border: Border.all(color: colors.primary, width: 3),
                      ),
                    ),
                  );
                },
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
    final l10n = _L10n();

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
              onChanged: (value) {
                if (_hasScannerSuffix(value)) onSubmitted(value);
              },
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
    final l10n = _L10n();
    final colors = Theme.of(context).colorScheme;
    final checkedTime = person.checkedInAt == null
        ? DateFormat('hh:mm a').format(DateTime.now())
        : DateFormat('hh:mm a').format(person.checkedInAt!.toLocal());

    return DecoratedBox(
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: colors.primary.withValues(alpha: 0.55)),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              decoration: BoxDecoration(
                color: colors.primary.withValues(alpha: 0.12),
                border: Border(
                  bottom: BorderSide(
                    color: colors.primary.withValues(alpha: 0.28),
                  ),
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final compact = constraints.maxWidth < 360;
                    final avatar = CircleAvatar(
                      radius: compact ? 22 : 28,
                      backgroundColor: colors.primary,
                      foregroundColor: colors.onPrimary,
                      child: Text(
                        _initials(person.fullName),
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                    );
                    final details = _ResultHeaderDetails(person: person);
                    final time = _TimePill(text: checkedTime);

                    if (compact) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(children: [avatar, const Spacer(), time]),
                          const SizedBox(height: 12),
                          details,
                        ],
                      );
                    }

                    return Row(
                      children: [
                        avatar,
                        const SizedBox(width: 14),
                        Expanded(child: details),
                        const SizedBox(width: 8),
                        ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 110),
                          child: time,
                        ),
                      ],
                    );
                  },
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final tileWidth = constraints.maxWidth >= 620
                      ? (constraints.maxWidth - 24) / 2
                      : constraints.maxWidth;

                  return Wrap(
                    runSpacing: 14,
                    spacing: 24,
                    children: [
                      _InfoTile(
                        width: tileWidth,
                        icon: Icons.transgender_rounded,
                        label: l10n.gender,
                        value: person.gender,
                      ),
                      _InfoTile(
                        width: tileWidth,
                        icon: Icons.phone_outlined,
                        label: l10n.phoneNumber,
                        value: person.phoneNumber,
                      ),
                      _InfoTile(
                        width: tileWidth,
                        icon: Icons.work_outline_rounded,
                        label: l10n.position,
                        value: person.position,
                      ),
                      _InfoTile(
                        width: tileWidth,
                        icon: Icons.business_outlined,
                        label: l10n.organization,
                        value: person.organization,
                      ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ResultHeaderDetails extends StatelessWidget {
  const _ResultHeaderDetails({required this.person});

  final CheckInPerson person;

  @override
  Widget build(BuildContext context) {
    final subtitle = [
      person.position,
      person.organization,
    ].whereType<String>().where((value) => value.isNotEmpty).join(' - ');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 6,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 260),
              child: Text(
                person.fullName,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
              ),
            ),
            _StatusPill(text: person.status ?? 'Checked in', compact: true),
          ],
        ),
        if (subtitle.isNotEmpty)
          Text(subtitle, maxLines: 2, overflow: TextOverflow.ellipsis),
      ],
    );
  }
}

class _RecentCheckIns extends StatelessWidget {
  const _RecentCheckIns({
    required this.people,
    required this.isLoading,
    required this.onPersonTap,
  });

  final List<CheckInPerson> people;
  final bool isLoading;
  final ValueChanged<CheckInPerson> onPersonTap;

  @override
  Widget build(BuildContext context) {
    final l10n = _L10n();
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
            if (isLoading)
              const LinearProgressIndicator(minHeight: 4)
            else if (people.isEmpty)
              Text(
                l10n.noRecentCheckIns,
                style: TextStyle(
                  color: colors.onSurface.withValues(alpha: 0.58),
                ),
              )
            else
              ...people.map(
                (person) => _RecentRow(
                  person: person,
                  onTap: () => onPersonTap(person),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _RecentRow extends StatelessWidget {
  const _RecentRow({required this.person, required this.onTap});

  final CheckInPerson person;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        overlayColor: WidgetStateProperty.all(Colors.transparent),
        splashFactory: NoSplash.splashFactory,
        mouseCursor: SystemMouseCursors.click,
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 9),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: colors.outlineVariant.withValues(alpha: 0.45),
              ),
            ),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: colors.primary,
                foregroundColor: colors.onPrimary,
                child: Text(
                  _initials(person.fullName),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
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
                      person.position ??
                          person.organization ??
                          person.kindLabel,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              Icon(Icons.check_circle_rounded, color: colors.primary, size: 18),
            ],
          ),
        ),
      ),
    );
  }
}

Future<void> _showPersonDialog(BuildContext context, CheckInPerson person) {
  final l10n = _L10n();
  final colors = Theme.of(context).colorScheme;
  return showDialog<void>(
    context: context,
    builder: (context) => Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: colors.primaryContainer,
                    foregroundColor: colors.onPrimaryContainer,
                    child: Text(
                      _initials(person.fullName),
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          person.fullName,
                          style: Theme.of(context).textTheme.titleLarge
                              ?.copyWith(fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          person.kindLabel,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: colors.onSurface.withValues(alpha: 0.62),
                              ),
                        ),
                      ],
                    ),
                  ),
                  DecoratedBox(
                    decoration: BoxDecoration(
                      color: colors.primaryContainer,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      child: Text(
                        person.status ?? 'JOINED',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: colors.onPrimaryContainer,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Divider(height: 1),
              const SizedBox(height: 16),
              if (person.fullNameKm?.isNotEmpty == true)
                _DialogInfo(label: l10n.fullName, value: person.fullNameKm!),
              _DialogInfo(label: l10n.position, value: person.position),
              _DialogInfo(label: l10n.organization, value: person.organization),
              _DialogInfo(label: l10n.phoneNumber, value: person.phoneNumber),
              _DialogInfo(label: l10n.gender, value: person.gender),
              const SizedBox(height: 6),
              FilledButton(
                onPressed: () => Navigator.of(context).pop(),
                child: Text(l10n.ok),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class _DialogInfo extends StatelessWidget {
  const _DialogInfo({required this.label, required this.value});

  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    if (value == null || value!.trim().isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 108,
            child: Text(
              label,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: Theme.of(
                  context,
                ).colorScheme.onSurface.withValues(alpha: 0.6),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value!,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyProfile extends StatelessWidget {
  const _EmptyProfile({required this.l10n});

  final _L10n l10n;

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
    required this.width,
    required this.icon,
    required this.label,
    required this.value,
  });

  final double width;
  final IconData icon;
  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return SizedBox(
      width: width,
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
  const _StatusPill({required this.text, this.compact = false});

  final String text;
  final bool compact;

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
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          color: colors.onPrimary,
          fontSize: compact ? 11 : 12,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _TimePill extends StatelessWidget {
  const _TimePill({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: colors.primary.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: colors.primary,
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
        color: colors.primary.withValues(alpha: 0.10),
        border: Border.all(color: colors.primary.withValues(alpha: 0.24)),
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
                color: isDark ? const Color(0xFFD8F4EA) : colors.primary,
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

bool _hasScannerSuffix(String value) {
  return value.contains('\n') || value.contains('\r') || value.contains('\t');
}

String _detailStart(EventMeetingItem? item) {
  if (item?.startsAt == null) return '-';
  return DateFormat('d MMM y, HH:mm').format(item!.startsAt!);
}

String _detailEnd(EventMeetingItem? item) {
  if (item?.endsAt == null) return '-';
  return DateFormat('d MMM y, HH:mm').format(item!.endsAt!);
}

String _detailStatus(EventMeetingItem? item) {
  if (item == null) return '-';
  if (item.isLive) return 'live'.tr();
  if (item.isUpcoming) return 'upcoming'.tr();
  if (item.isEnded) return 'ended'.tr();
  return '-';
}
