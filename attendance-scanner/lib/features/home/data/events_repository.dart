import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import 'event_meeting_models.dart';

final eventsRepositoryProvider = Provider<EventsRepository>((ref) {
  return EventsRepository(ref.watch(dioProvider));
});

class EventsRepository {
  const EventsRepository(this._dio);

  final Dio _dio;

  Future<List<EventMeetingItem>> listEventsAndMeetings({
    int pageSize = 100,
  }) async {
    final responses = await Future.wait([
      _dio.get('/events', queryParameters: {'pageSize': pageSize}),
      _dio.get('/meetings', queryParameters: {'pageSize': pageSize}),
    ]);

    final events = _items(
      responses[0].data,
    ).map(EventMeetingItem.fromEventJson).toList();
    final meetings = _items(
      responses[1].data,
    ).map(EventMeetingItem.fromMeetingJson).toList();

    return [...events, ...meetings]..sort((a, b) {
      final aDate = a.startsAt ?? DateTime.fromMillisecondsSinceEpoch(0);
      final bDate = b.startsAt ?? DateTime.fromMillisecondsSinceEpoch(0);
      return aDate.compareTo(bDate);
    });
  }

  Future<EventMeetingItem?> getEventMeeting({
    required EventMeetingKind kind,
    required String id,
  }) async {
    final items = await listEventsAndMeetings();
    for (final item in items) {
      if (item.kind == kind && item.id == id) return item;
    }
    return null;
  }

  List<Map<String, dynamic>> _items(Object? payload) {
    final root = payload is Map<String, dynamic> ? payload : const {};
    final data = root['data'] is Map<String, dynamic> ? root['data'] : root;
    final items = data is Map<String, dynamic> ? data['items'] : null;
    if (items is List) {
      return items.whereType<Map<String, dynamic>>().toList();
    }
    if (payload is List) {
      return payload.whereType<Map<String, dynamic>>().toList();
    }
    return const [];
  }
}
