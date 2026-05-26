import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import 'check_in_models.dart';
import 'qr_payload.dart';

final checkInRepositoryProvider = Provider<CheckInRepository>((ref) {
  return CheckInRepository(ref.watch(dioProvider));
});

class CheckInRepository {
  const CheckInRepository(this._dio);

  final Dio _dio;

  Future<CheckInPerson> checkIn(String rawQrValue) async {
    final payload = parseQrPayload(rawQrValue);
    switch (payload.kind) {
      case QrPayloadKind.eventAttendee:
        return _joinEventAttendee(payload.code);
      case QrPayloadKind.meetingParticipant:
        return _joinMeetingParticipant(payload.code);
      case QrPayloadKind.unknown:
        return _tryUnknownCode(payload.code);
    }
  }

  Future<CheckInPerson> _tryUnknownCode(String code) async {
    try {
      return await _joinEventAttendee(code);
    } on DioException catch (eventError) {
      try {
        return await _joinMeetingParticipant(code);
      } on DioException {
        throw eventError;
      }
    }
  }

  Future<CheckInPerson> _joinEventAttendee(String code) async {
    final response = await _dio.post('/attendance/registrations/qr/$code/join');
    final data = _unwrapMap(response.data);
    return checkInPersonFromApi(data, CheckInKind.eventAttendee);
  }

  Future<CheckInPerson> _joinMeetingParticipant(String code) async {
    final response = await _dio.post('/meetings/participants/qr/$code/join');
    final data = _unwrapMap(response.data);
    return checkInPersonFromApi(data, CheckInKind.meetingParticipant);
  }

  Map<String, dynamic> _unwrapMap(Object? payload) {
    if (payload is Map<String, dynamic>) {
      final data = payload['data'];
      if (data is Map<String, dynamic>) return data;
      return payload;
    }
    throw const FormatException('Invalid check-in response');
  }
}
