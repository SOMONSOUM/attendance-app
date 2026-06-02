import 'package:attendance_scanner/features/home/data/event_meeting_models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('EventMeetingItem status', () {
    test('uses API schedule status instead of deriving status locally', () {
      final tomorrow = DateTime.now().add(const Duration(days: 1));
      final yyyy = tomorrow.year.toString().padLeft(4, '0');
      final mm = tomorrow.month.toString().padLeft(2, '0');
      final dd = tomorrow.day.toString().padLeft(2, '0');

      final item = EventMeetingItem.fromEventJson({
        'id': '1',
        'name': 'API live event',
        'startsAt': '$yyyy-$mm-${dd}T00:00:00.000Z',
        'endsAt': '$yyyy-$mm-${dd}T00:00:00.000Z',
        'scheduleStatus': 'LIVE',
        'summary': {'totalUsers': 0, 'checkedIn': 0},
      });

      expect(item.status, EventMeetingStatus.live);
      expect(item.isLive, isTrue);
    });

    test('uses API sort date when ordering mixed event and meeting cards', () {
      final item = EventMeetingItem.fromMeetingJson({
        'id': '1',
        'name': 'Sorted meeting',
        'startsAt': '2026-06-05T00:00:00.000Z',
        'endsAt': '2026-06-05T00:00:00.000Z',
        'scheduleStatus': 'UPCOMING',
        'scheduleSortAt': '2026-06-04T08:30:00.000Z',
        'participants': [],
      });

      expect(item.status, EventMeetingStatus.upcoming);
      expect(
        item.sortDate,
        DateTime.parse('2026-06-04T08:30:00.000Z').toLocal(),
      );
    });

    test('treats admin date-only UTC midnight range as a full local day', () {
      final item = EventMeetingItem.fromEventJson({
        'id': '1',
        'name': 'Full day event',
        'startsAt': '2026-06-02T00:00:00.000Z',
        'endsAt': '2026-06-02T00:00:00.000Z',
        'scheduleStatus': 'ENDED',
        'summary': {'totalUsers': 0, 'checkedIn': 0},
      });

      expect(item.startsAt, DateTime(2026, 6, 2));
      expect(item.endsAt, DateTime(2026, 6, 2, 23, 59, 59, 999));
      expect(item.status, EventMeetingStatus.ended);
    });

    test('reads API shift time carriers as local time-of-day values', () {
      final item = EventMeetingItem.fromEventJson({
        'id': '1',
        'name': 'Shifted event',
        'startsAt': '2026-06-02T00:00:00.000Z',
        'endsAt': '2026-06-02T00:00:00.000Z',
        'scheduleStatus': 'LIVE',
        'summary': {'totalUsers': 0, 'checkedIn': 0},
        'shifts': [
          {
            'name': 'Morning',
            'startTime': '1970-01-01T08:00:00.000Z',
            'endTime': '1970-01-01T12:30:00.000Z',
          },
        ],
      });

      expect(item.status, EventMeetingStatus.live);
      expect(item.shifts.single.startHour, 8);
      expect(item.shifts.single.startMinute, 0);
      expect(item.shifts.single.endHour, 12);
      expect(item.shifts.single.endMinute, 30);
    });
  });
}
