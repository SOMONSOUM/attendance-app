import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';

import 'package:attendance_scanner/features/scan/data/check_in_repository.dart';
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

    test('trims hardware scanner suffixes from raw codes', () {
      final payload = parseQrPayload('raw-check-in-code\t\n');

      expect(payload.kind, QrPayloadKind.unknown);
      expect(payload.code, 'raw-check-in-code');
    });
  });

  group('checkInErrorMessage', () {
    test('uses clean event window messages from wrapped API errors', () {
      final error = DioException(
        requestOptions: RequestOptions(
          path: '/attendance/registrations/qr/x/join',
        ),
        response: Response(
          requestOptions: RequestOptions(
            path: '/attendance/registrations/qr/x/join',
          ),
          statusCode: 400,
          data: {
            'success': false,
            'error': {
              'code': 'EVENT_NOT_STARTED',
              'message': 'This event has not started yet.',
            },
          },
        ),
        type: DioExceptionType.badResponse,
      );

      expect(checkInErrorMessage(error), 'eventNotStartedMessage');
    });
  });
}
