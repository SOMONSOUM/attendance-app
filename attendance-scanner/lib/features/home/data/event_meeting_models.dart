import '../../scan/data/check_in_models.dart';

enum EventMeetingKind { event, meeting }

class EventMeetingItem {
  const EventMeetingItem({
    required this.id,
    required this.kind,
    required this.title,
    required this.startsAt,
    required this.endsAt,
    required this.totalCount,
    required this.checkedInCount,
    this.location,
    this.description,
    this.badge,
    this.recentPeople = const [],
  });

  factory EventMeetingItem.fromEventJson(Map<String, dynamic> json) {
    final summary = _asMap(json['summary']);
    return EventMeetingItem(
      id: _string(json['id']),
      kind: EventMeetingKind.event,
      title: _string(json['name'] ?? json['title'], fallback: 'Event'),
      startsAt: _date(json['startsAt']),
      endsAt: _date(json['endsAt']),
      description: _stringOrNull(json['description']),
      location:
          _stringOrNull(json['locationName']) ?? _firstPlace(json['places']),
      totalCount: _int(summary['totalUsers'] ?? summary['registrations']),
      checkedInCount: _int(summary['checkedIn']),
      badge: _statusBadge(json['startsAt'], json['endsAt']),
      recentPeople: _asList(json['recentAttendances'])
          .whereType<Map<String, dynamic>>()
          .map((item) => checkInPersonFromApi(item, CheckInKind.eventAttendee))
          .toList(),
    );
  }

  factory EventMeetingItem.fromMeetingJson(Map<String, dynamic> json) {
    final participants = _asList(json['participants']);
    final checkedIn = participants.where((item) {
      final status = _stringOrNull(_asMap(item)['status'])?.toUpperCase();
      return status == 'JOINED' || status == 'CHECKED_IN';
    }).length;

    return EventMeetingItem(
      id: _string(json['id']),
      kind: EventMeetingKind.meeting,
      title: _string(json['name'] ?? json['title'], fallback: 'Meeting'),
      startsAt: _date(json['startsAt']),
      endsAt: _date(json['endsAt']),
      description: _stringOrNull(json['description']),
      location:
          _stringOrNull(json['locationName']) ?? _firstPlace(json['places']),
      totalCount: _int(
        _asMap(json['_count'])['participants'],
        participants.length,
      ),
      checkedInCount: checkedIn,
      badge: _statusBadge(json['startsAt'], json['endsAt']),
      recentPeople:
          participants
              .whereType<Map<String, dynamic>>()
              .where((item) {
                final status = _stringOrNull(item['status'])?.toUpperCase();
                return status == 'JOINED' || status == 'CHECKED_IN';
              })
              .map(
                (item) =>
                    checkInPersonFromApi(item, CheckInKind.meetingParticipant),
              )
              .toList()
            ..sort((a, b) {
              final aDate =
                  a.checkedInAt ?? DateTime.fromMillisecondsSinceEpoch(0);
              final bDate =
                  b.checkedInAt ?? DateTime.fromMillisecondsSinceEpoch(0);
              return bDate.compareTo(aDate);
            }),
    );
  }

  final String id;
  final EventMeetingKind kind;
  final String title;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final String? location;
  final String? description;
  final int totalCount;
  final int checkedInCount;
  final String? badge;
  final List<CheckInPerson> recentPeople;

  bool get isLive {
    final now = DateTime.now();
    return startsAt != null &&
        endsAt != null &&
        now.isAfter(startsAt!) &&
        now.isBefore(endsAt!);
  }

  bool get isEnded => endsAt != null && DateTime.now().isAfter(endsAt!);
  bool get isUpcoming => startsAt != null && DateTime.now().isBefore(startsAt!);
}

Map<String, dynamic> _asMap(Object? value) {
  return value is Map<String, dynamic> ? value : const {};
}

List<Object?> _asList(Object? value) {
  return value is List ? value : const [];
}

String _string(Object? value, {String fallback = ''}) {
  final text = value?.toString().trim();
  return text == null || text.isEmpty ? fallback : text;
}

String? _stringOrNull(Object? value) {
  final text = value?.toString().trim();
  return text == null || text.isEmpty ? null : text;
}

int _int(Object? value, [int fallback = 0]) {
  if (value is int) return value;
  return int.tryParse(value?.toString() ?? '') ?? fallback;
}

DateTime? _date(Object? value) {
  return DateTime.tryParse(value?.toString() ?? '')?.toLocal();
}

String? _firstPlace(Object? value) {
  final places = _asList(value);
  if (places.isEmpty) return null;
  return _stringOrNull(_asMap(places.first)['name']);
}

String? _statusBadge(Object? startsAt, Object? endsAt) {
  final start = _date(startsAt);
  final end = _date(endsAt);
  if (start == null || end == null) return null;
  final now = DateTime.now();
  if (now.isAfter(start) && now.isBefore(end)) return 'live';
  if (now.isBefore(start)) return 'upcoming';
  return 'ended';
}
