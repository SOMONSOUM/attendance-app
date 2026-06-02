import '../../scan/data/check_in_models.dart';

enum EventMeetingKind { event, meeting }

class EventMeetingItem {
  const EventMeetingItem({
    required this.id,
    required this.kind,
    required this.title,
    required this.startsAt,
    required this.endsAt,
    required this.status,
    required this.totalCount,
    required this.checkedInCount,
    this.location,
    this.description,
    this.badge,
    this.scheduleSortAt,
    this.shifts = const [],
    this.recentPeople = const [],
  });

  factory EventMeetingItem.fromEventJson(Map<String, dynamic> json) {
    final summary = _asMap(json['summary']);
    return EventMeetingItem(
      id: _string(json['id']),
      kind: EventMeetingKind.event,
      title: _string(json['name'] ?? json['title'], fallback: 'Event'),
      startsAt: _startDate(json['startsAt']),
      endsAt: _endDate(json['endsAt']),
      status: _status(json['scheduleStatus']),
      scheduleSortAt: _date(json['scheduleSortAt']),
      description: _stringOrNull(json['description']),
      location:
          _stringOrNull(json['locationName']) ?? _firstPlace(json['places']),
      totalCount: _int(summary['totalUsers'] ?? summary['registrations']),
      checkedInCount: _int(summary['checkedIn']),
      shifts: _shifts(json['shifts']),
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
      startsAt: _startDate(json['startsAt']),
      endsAt: _endDate(json['endsAt']),
      status: _status(json['scheduleStatus']),
      scheduleSortAt: _date(json['scheduleSortAt']),
      description: _stringOrNull(json['description']),
      location:
          _stringOrNull(json['locationName']) ?? _firstPlace(json['places']),
      totalCount: _int(
        _asMap(json['_count'])['participants'],
        participants.length,
      ),
      checkedInCount: checkedIn,
      shifts: _shifts(json['shifts']),
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
  final EventMeetingStatus status;
  final String? location;
  final String? description;
  final int totalCount;
  final int checkedInCount;
  final String? badge;
  final DateTime? scheduleSortAt;
  final List<EventMeetingShift> shifts;
  final List<CheckInPerson> recentPeople;

  bool get isLive => status == EventMeetingStatus.live;
  bool get isEnded => status == EventMeetingStatus.ended;
  bool get isUpcoming => status == EventMeetingStatus.upcoming;

  DateTime get sortDate =>
      scheduleSortAt ?? startsAt ?? DateTime.fromMillisecondsSinceEpoch(0);
}

enum EventMeetingStatus { live, upcoming, ended }

class EventMeetingShift {
  const EventMeetingShift({
    required this.name,
    required this.startHour,
    required this.startMinute,
    required this.endHour,
    required this.endMinute,
  });

  final String name;
  final int startHour;
  final int startMinute;
  final int endHour;
  final int endMinute;
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

EventMeetingStatus _status(Object? value) {
  return switch (value?.toString().trim().toUpperCase()) {
    'LIVE' => EventMeetingStatus.live,
    'ENDED' => EventMeetingStatus.ended,
    _ => EventMeetingStatus.upcoming,
  };
}

DateTime? _startDate(Object? value) {
  final dateOnly = _dateOnlyFromUtcMidnight(value);
  if (dateOnly != null) return dateOnly;
  return _date(value);
}

DateTime? _endDate(Object? value) {
  final dateOnly = _dateOnlyFromUtcMidnight(value);
  if (dateOnly != null) {
    return DateTime(
      dateOnly.year,
      dateOnly.month,
      dateOnly.day,
      23,
      59,
      59,
      999,
    );
  }
  final date = _date(value);
  if (date == null) return null;
  if (date.hour == 0 &&
      date.minute == 0 &&
      date.second == 0 &&
      date.millisecond == 0) {
    return DateTime(date.year, date.month, date.day, 23, 59, 59, 999);
  }
  return date;
}

DateTime? _dateOnlyFromUtcMidnight(Object? value) {
  final text = value?.toString();
  if (text == null) return null;
  final match = RegExp(
    r'^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.000)?Z)?$',
  ).firstMatch(text);
  if (match == null) return null;
  return DateTime(
    int.parse(match.group(1)!),
    int.parse(match.group(2)!),
    int.parse(match.group(3)!),
  );
}

String? _firstPlace(Object? value) {
  final places = _asList(value);
  if (places.isEmpty) return null;
  return _stringOrNull(_asMap(places.first)['name']);
}

List<EventMeetingShift> _shifts(Object? value) {
  return _asList(value)
      .whereType<Map<String, dynamic>>()
      .map((item) {
        final start = _timeParts(item['startTime']);
        final end = _timeParts(item['endTime']);
        if (start == null || end == null) return null;
        return EventMeetingShift(
          name: _string(item['name'], fallback: 'Shift'),
          startHour: start.$1,
          startMinute: start.$2,
          endHour: end.$1,
          endMinute: end.$2,
        );
      })
      .whereType<EventMeetingShift>()
      .toList();
}

(int, int)? _timeParts(Object? value) {
  final text = value?.toString();
  if (text == null || text.isEmpty) return null;
  final date = DateTime.tryParse(text)?.toLocal();
  if (date != null) {
    final time = date.toUtc();
    return (time.hour, time.minute);
  }

  final match = RegExp(r'^(\d{1,2}):(\d{2})').firstMatch(text);
  if (match == null) return null;
  final hour = int.tryParse(match.group(1)!);
  final minute = int.tryParse(match.group(2)!);
  if (hour == null || minute == null || hour > 23 || minute > 59) return null;
  return (hour, minute);
}
