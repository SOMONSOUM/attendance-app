part of '../presentation/home_screen.dart';

enum _HomeFilter { all, today, upcoming, ended }

String _homeFilterLabel(_HomeFilter filter) {
  return switch (filter) {
    _HomeFilter.all => L.status.all,
    _HomeFilter.today => L.status.today,
    _HomeFilter.upcoming => L.status.upcoming,
    _HomeFilter.ended => L.status.ended,
  };
}

String _eventMeetingKindLabel(EventMeetingKind kind) {
  return switch (kind) {
    EventMeetingKind.event => L.eventMeeting.event,
    EventMeetingKind.meeting => L.eventMeeting.meeting,
  };
}

class _HomeHeader extends StatelessWidget {
  const _HomeHeader({
    required this.total,
    required this.live,
    required this.upcoming,
    required this.checkedInToday,
    required this.compact,
  });

  final int total;
  final int live;
  final int upcoming;
  final int checkedInToday;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final stats = [
      _StatData(total.toString(), L.home.totalEvents.tr()),
      _StatData(live.toString(), L.home.liveNow.tr()),
      _StatData(upcoming.toString(), L.status.upcoming.tr()),
      _StatData(checkedInToday.toString(), L.home.checkedInToday.tr()),
    ];

    return DecoratedBox(
      decoration: BoxDecoration(
        color: colors.surface.withValues(alpha: isDark ? 0.62 : 0.76),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.55),
        ),
        boxShadow: [
          BoxShadow(
            color: colors.shadow.withValues(alpha: 0.08),
            blurRadius: 28,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      child: Padding(
        padding: EdgeInsets.all(compact ? 14 : 18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: colors.primary.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: colors.primary.withValues(alpha: 0.22),
                    ),
                  ),
                  child: Icon(LucideIcons.calendarDays, color: colors.primary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        L.home.eventsMeetings.tr(),
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        DateFormat('EEEE, d MMMM y').format(DateTime.now()),
                        style: TextStyle(
                          color: colors.onSurface.withValues(alpha: 0.66),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            LayoutBuilder(
              builder: (context, constraints) {
                final veryCompact = constraints.maxWidth < 320;
                return GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: stats.length,
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: compact ? 2 : 4,
                    mainAxisExtent: veryCompact
                        ? 92
                        : compact
                        ? 84
                        : 72,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                  ),
                  itemBuilder: (context, index) =>
                      _StatTile(data: stats[index]),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _StatData {
  const _StatData(this.value, this.label);

  final String value;
  final String label;
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.data});

  final _StatData data;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: colors.surfaceContainerHighest.withValues(alpha: 0.36),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.46),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              data.value,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: colors.primary,
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              data.label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}

class _SearchAndFilters extends StatelessWidget {
  const _SearchAndFilters({
    required this.controller,
    required this.filter,
    required this.onFilterChanged,
    required this.onSearchChanged,
  });

  final TextEditingController controller;
  final _HomeFilter filter;
  final ValueChanged<_HomeFilter> onFilterChanged;
  final ValueChanged<String> onSearchChanged;

  @override
  Widget build(BuildContext context) {
    final chips = _HomeFilter.values
        .map(
          (value) => ChoiceChip(
            selected: filter == value,
            label: Text(_homeFilterLabel(value).tr()),
            onSelected: (_) => onFilterChanged(value),
          ),
        )
        .toList();

    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 700;
        final search = TextField(
          controller: controller,
          onChanged: onSearchChanged,
          decoration: InputDecoration(
            hintText: L.home.searchEventsMeetings.tr(),
            prefixIcon: const Icon(LucideIcons.search),
          ),
        );

        if (compact) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              search,
              const SizedBox(height: 10),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    for (var index = 0; index < chips.length; index++) ...[
                      chips[index],
                      if (index != chips.length - 1) const SizedBox(width: 10),
                    ],
                  ],
                ),
              ),
            ],
          );
        }

        return Wrap(
          spacing: 10,
          runSpacing: 10,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            SizedBox(width: 480, child: search),
            ...chips,
          ],
        );
      },
    );
  }
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading({required this.title, required this.count});

  final String title;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(fontWeight: FontWeight.w800),
          ),
        ),
        Text(
          L.home.countEvents.tr(namedArgs: {'count': count.toString()}),
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}

class _EventGrid extends StatelessWidget {
  const _EventGrid({
    required this.items,
    required this.compact,
    required this.onOpen,
  });

  final List<EventMeetingItem> items;
  final bool compact;
  final ValueChanged<EventMeetingItem> onOpen;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Text(L.home.noEvents.tr()),
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final veryCompact = constraints.maxWidth < 320;
        if (compact) {
          return Column(
            children: [
              for (var index = 0; index < items.length; index++) ...[
                SizedBox(
                  height: veryCompact ? 232 : 172,
                  child: _EventCard(
                    item: items[index],
                    compact: compact,
                    veryCompact: veryCompact,
                    onOpen: () => onOpen(items[index]),
                  ),
                ),
                if (index != items.length - 1) const SizedBox(height: 12),
              ],
            ],
          );
        }

        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: items.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: compact ? 1 : 2,
            mainAxisExtent: veryCompact
                ? 232
                : compact
                ? 172
                : 140,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          itemBuilder: (context, index) => _EventCard(
            item: items[index],
            compact: compact,
            veryCompact: veryCompact,
            onOpen: () => onOpen(items[index]),
          ),
        );
      },
    );
  }
}

class _EventCard extends StatelessWidget {
  const _EventCard({
    required this.item,
    required this.compact,
    required this.veryCompact,
    required this.onOpen,
  });

  final EventMeetingItem item;
  final bool compact;
  final bool veryCompact;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final accent = item.kind == EventMeetingKind.event
        ? colors.primary
        : const Color(0xFFEF9F27);
    final total = item.totalCount == 0 ? 1 : item.totalCount;
    final progress = (item.checkedInCount / total).clamp(0, 1).toDouble();

    return Material(
      color: colors.surface.withValues(alpha: 0.78),
      borderRadius: BorderRadius.circular(8),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onOpen,
        child: DecoratedBox(
          decoration: BoxDecoration(
            border: Border.all(
              color: colors.outlineVariant.withValues(alpha: 0.68),
            ),
            borderRadius: BorderRadius.circular(8),
            boxShadow: [
              BoxShadow(
                color: colors.shadow.withValues(alpha: 0.05),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(width: 5, child: ColoredBox(color: accent)),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final metaWidth = veryCompact
                          ? (constraints.maxWidth - 24).clamp(96.0, 150.0)
                          : compact
                          ? (constraints.maxWidth - 24).clamp(96.0, 180.0)
                          : 150.0;

                      return Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: accent.withValues(alpha: 0.13),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(
                                  item.kind == EventMeetingKind.event
                                      ? LucideIcons.calendarDays
                                      : LucideIcons.usersRound,
                                  color: accent,
                                  size: 19,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  item.title,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                              Flexible(
                                flex: 0,
                                child: _Badge(item: item, color: accent),
                              ),
                            ],
                          ),
                          SizedBox(height: veryCompact ? 14 : 12),
                          Wrap(
                            spacing: 10,
                            runSpacing: 4,
                            children: [
                              _TinyMeta(
                                icon: LucideIcons.calendarDays,
                                text: _dateRange(item, compact: compact),
                                maxWidth: metaWidth,
                              ),
                              _TinyMeta(
                                icon: LucideIcons.mapPin,
                                text: item.location ?? '-',
                                maxWidth: metaWidth,
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: LinearProgressIndicator(
                                  value: progress,
                                  minHeight: 4,
                                  color: accent,
                                  backgroundColor: colors.outline.withValues(
                                    alpha: 0.5,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '${item.checkedInCount}/${item.totalCount}',
                                style: TextStyle(
                                  color: accent,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                        ],
                      );
                    },
                  ),
                ),
              ),
              SizedBox(
                width: veryCompact ? 28 : 44,
                child: Center(
                  child: Icon(
                    LucideIcons.chevronRight,
                    size: veryCompact ? 18 : 20,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _dateRange(EventMeetingItem item, {required bool compact}) {
    if (item.startsAt == null) return '-';
    final start = item.startsAt!;
    final end = item.endsAt;
    if (end == null || _isSameDay(start, end)) {
      return DateFormat('d MMM y').format(start);
    }
    if (compact && start.year == end.year && start.month == end.month) {
      return '${DateFormat('d').format(start)}-${DateFormat('d MMM y').format(end)}';
    }
    if (compact && start.year == end.year) {
      return '${DateFormat('d MMM').format(start)}-${DateFormat('d MMM y').format(end)}';
    }
    final format = DateFormat('d MMM y');
    return '${format.format(start)} - ${format.format(end)}';
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.item, required this.color});

  final EventMeetingItem item;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final label = item.isLive
        ? L.status.live.tr()
        : item.isUpcoming
        ? L.status.upcoming.tr()
        : item.isEnded
        ? L.status.ended.tr()
        : _eventMeetingKindLabel(item.kind).tr();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.13),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

bool _isSameDay(DateTime a, DateTime b) {
  return a.year == b.year && a.month == b.month && a.day == b.day;
}

class _TinyMeta extends StatelessWidget {
  const _TinyMeta({
    required this.icon,
    required this.text,
    required this.maxWidth,
  });

  final IconData icon;
  final String text;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13),
        const SizedBox(width: 4),
        ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
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
