enum QrPayloadKind { eventAttendee, meetingParticipant, unknown }

class QrPayload {
  const QrPayload({required this.code, required this.kind});

  final String code;
  final QrPayloadKind kind;
}

QrPayload parseQrPayload(String rawValue) {
  final raw = rawValue.trim();
  final uri = Uri.tryParse(raw);
  final segments = uri?.pathSegments ?? raw.split('/');

  String? after(String marker) {
    final index = segments.indexOf(marker);
    if (index == -1 || index + 1 >= segments.length) return null;
    return segments[index + 1];
  }

  final attendeeCode = after('attendee-qr');
  if (attendeeCode != null) {
    return QrPayload(code: attendeeCode, kind: QrPayloadKind.eventAttendee);
  }

  final participantCode = after('participant-qr');
  if (participantCode != null) {
    return QrPayload(
      code: participantCode,
      kind: QrPayloadKind.meetingParticipant,
    );
  }
  final eventScanCode = after('event-scan');
  if (eventScanCode != null) {
    return QrPayload(code: eventScanCode, kind: QrPayloadKind.unknown);
  }

  return QrPayload(code: raw, kind: QrPayloadKind.unknown);
}
