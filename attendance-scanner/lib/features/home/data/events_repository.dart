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
    bool fresh = false,
  }) async {
    final queryParameters = {
      'pageSize': pageSize,
      if (fresh) '_': DateTime.now().microsecondsSinceEpoch,
    };
    final options = fresh ? _freshOptions() : null;
    final responses = await Future.wait([
      _dio.get(
        '/events',
        queryParameters: queryParameters,
        options: options,
      ),
      _dio.get(
        '/meetings',
        queryParameters: queryParameters,
        options: options,
      ),
    ]);

    final events = _items(
      responses[0].data,
    ).map(EventMeetingItem.fromEventJson).toList();
    final meetings = _items(
      responses[1].data,
    ).map(EventMeetingItem.fromMeetingJson).toList();

    return [...events, ...meetings]..sort(_compareEventMeetingItems);
  }

  Future<EventMeetingItem?> getEventMeeting({
    required EventMeetingKind kind,
    required String id,
    bool fresh = false,
  }) async {
    try {
      final response = await _dio.get(
        kind == EventMeetingKind.event ? '/events/$id' : '/meetings/$id',
        queryParameters: fresh
            ? {'_': DateTime.now().microsecondsSinceEpoch}
            : null,
        options: fresh ? _freshOptions() : null,
      );
      final data = _dataMap(response.data);
      if (data.isNotEmpty) {
        return kind == EventMeetingKind.event
            ? EventMeetingItem.fromEventJson(data)
            : EventMeetingItem.fromMeetingJson(data);
      }
    } on DioException {
      if (!fresh) rethrow;
    }

    final items = await listEventsAndMeetings(fresh: fresh);
    for (final item in items) {
      if (item.kind == kind && item.id == id) return item;
    }
    return null;
  }

  Options _freshOptions() {
    return Options(
      headers: const {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    );
  }

  Map<String, dynamic> _dataMap(Object? payload) {
    final root = payload is Map<String, dynamic>
        ? payload
        : const <String, dynamic>{};
    final data = root['data'];
    if (data is Map<String, dynamic>) return data;
    return root;
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

int _compareEventMeetingItems(EventMeetingItem a, EventMeetingItem b) {
  final statusCompare = _statusRank(a.status).compareTo(_statusRank(b.status));
  if (statusCompare != 0) return statusCompare;

  if (a.isEnded && b.isEnded) {
    return b.sortDate.compareTo(a.sortDate);
  }
  return a.sortDate.compareTo(b.sortDate);
}

int _statusRank(EventMeetingStatus status) {
  return switch (status) {
    EventMeetingStatus.live => 0,
    EventMeetingStatus.upcoming => 1,
    EventMeetingStatus.ended => 2,
  };
}
