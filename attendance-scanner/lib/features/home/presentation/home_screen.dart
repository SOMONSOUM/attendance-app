import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/widgets/app_settings_actions.dart';
import '../../../core/widgets/offline_view.dart';
import '../../../core/widgets/responsive_page.dart';
import '../../../core/widgets/scanner_logo.dart';
import '../../auth/state/auth_controller.dart';
import '../../auth/widgets/profile_menu.dart';
import '../data/event_meeting_models.dart';
import '../state/home_controller.dart';

part '../widgets/home_widgets.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _searchController = TextEditingController();
  _HomeFilter _filter = _HomeFilter.all;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    final state = ref.watch(homeControllerProvider);
    final compactAppBar = MediaQuery.of(context).size.width < 520;

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
                      'eventsMeetings'.tr(),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
        actions: [
          IconButton(
            tooltip: 'refresh'.tr(),
            onPressed: _refreshHome,
            icon: const Icon(LucideIcons.refreshCw),
          ),
          const AppSettingsActions(),
          ProfileMenu(user: auth.user, fallbackName: 'adminUser'.tr()),
        ],
      ),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => _ErrorState(
          message: error.toString(),
          onRefresh: () => ref.read(homeControllerProvider.notifier).reload(),
        ),
        data: (value) {
          if (value.isOffline) {
            return OfflineView(
              onRefresh: () =>
                  ref.read(homeControllerProvider.notifier).reload(),
            );
          }

          final filtered = _filterItems(value.items);
          return ResponsivePage(
            maxWidth: 1180,
            child: LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxWidth < 720;
                return RefreshIndicator(
                  onRefresh: _refreshHome,
                  child: ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: [
                      _HomeHeader(
                        total: value.items.length,
                        live: value.items.where((item) => item.isLive).length,
                        upcoming: value.items
                            .where((item) => item.isUpcoming)
                            .length,
                        checkedInToday: value.items.fold<int>(
                          0,
                          (sum, item) => sum + item.checkedInCount,
                        ),
                        compact: compact,
                      ),
                      const SizedBox(height: 14),
                      _SearchAndFilters(
                        controller: _searchController,
                        filter: _filter,
                        onFilterChanged: (filter) =>
                            setState(() => _filter = filter),
                        onSearchChanged: (_) => setState(() {}),
                      ),
                      const SizedBox(height: 14),
                      _SectionHeading(
                        title: 'todayDate'.tr(
                          namedArgs: {
                            'date': DateFormat('d MMMM').format(DateTime.now()),
                          },
                        ),
                        count: filtered
                            .where((item) => !item.isUpcoming)
                            .length,
                      ),
                      const SizedBox(height: 10),
                      _EventGrid(
                        items: filtered
                            .where((item) => !item.isUpcoming)
                            .toList(),
                        compact: compact,
                        onOpen: _openScanner,
                      ),
                      const SizedBox(height: 18),
                      _SectionHeading(
                        title: 'upcoming'.tr(),
                        count: filtered.where((item) => item.isUpcoming).length,
                      ),
                      const SizedBox(height: 10),
                      _EventGrid(
                        items: filtered
                            .where((item) => item.isUpcoming)
                            .toList(),
                        compact: compact,
                        onOpen: _openScanner,
                      ),
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  List<EventMeetingItem> _filterItems(List<EventMeetingItem> items) {
    final query = _searchController.text.trim().toLowerCase();
    return items.where((item) {
      final matchesSearch =
          query.isEmpty ||
          item.title.toLowerCase().contains(query) ||
          (item.location ?? '').toLowerCase().contains(query);
      final matchesFilter = switch (_filter) {
        _HomeFilter.all => true,
        _HomeFilter.today => !item.isUpcoming && !item.isEnded,
        _HomeFilter.upcoming => item.isUpcoming,
        _HomeFilter.ended => item.isEnded,
      };
      return matchesSearch && matchesFilter;
    }).toList();
  }

  Future<void> _openScanner(EventMeetingItem item) async {
    await context.push('/scan', extra: item);
    if (!mounted) return;
    ref.read(homeControllerProvider.notifier).reload();
  }

  Future<void> _refreshHome() {
    return ref.read(homeControllerProvider.notifier).reload();
  }
}
