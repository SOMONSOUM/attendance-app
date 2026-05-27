import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/network_error.dart';
import '../data/event_meeting_models.dart';
import '../data/events_repository.dart';

final homeControllerProvider = AsyncNotifierProvider<HomeController, HomeState>(
  HomeController.new,
);

class HomeState {
  const HomeState({this.items = const [], this.isOffline = false});

  final List<EventMeetingItem> items;
  final bool isOffline;
}

class HomeController extends AsyncNotifier<HomeState> {
  @override
  Future<HomeState> build() => refresh();

  Future<HomeState> refresh() async {
    try {
      final items = await ref
          .read(eventsRepositoryProvider)
          .listEventsAndMeetings();
      return HomeState(items: items.take(10).toList());
    } catch (error) {
      if (isNetworkConnectionError(error)) {
        return const HomeState(isOffline: true);
      }
      rethrow;
    }
  }

  Future<void> reload() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(refresh);
  }
}
