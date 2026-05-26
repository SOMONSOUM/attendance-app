import 'package:flutter_test/flutter_test.dart';

import 'package:attendance_scanner/features/scan/data/qr_payload.dart';

void main() {
  group('parseQrPayload', () {
    test('detects event attendee QR URLs', () {
      final payload = parseQrPayload('https://app.test/en/attendee-qr/abc123');

      expect(payload.kind, QrPayloadKind.eventAttendee);
      expect(payload.code, 'abc123');
    });

    test('detects meeting participant QR URLs', () {
      final payload = parseQrPayload(
        'https://app.test/en/participant-qr/meeting456',
      );

      expect(payload.kind, QrPayloadKind.meetingParticipant);
      expect(payload.code, 'meeting456');
    });

    test('keeps raw codes as unknown payloads', () {
      final payload = parseQrPayload('raw-check-in-code');

      expect(payload.kind, QrPayloadKind.unknown);
      expect(payload.code, 'raw-check-in-code');
    });
  });
}
