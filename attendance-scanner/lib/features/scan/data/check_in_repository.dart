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

  Future<CheckInPerson> checkIn(
    String rawQrValue, {
    CheckInTarget? target,
  }) async {
    final payload = parseQrPayload(rawQrValue);
    switch (payload.kind) {
      case QrPayloadKind.eventAttendee:
        if (target != null && target.kind != CheckInTargetKind.event) {
          throw const CheckInException('invalidEventQrForMeeting');
        }
        return _joinEventAttendee(payload.code, eventId: target?.id);
      case QrPayloadKind.meetingParticipant:
        if (target != null && target.kind != CheckInTargetKind.meeting) {
          throw const CheckInException('invalidMeetingQrForEvent');
        }
        return _joinMeetingParticipant(payload.code, meetingId: target?.id);
      case QrPayloadKind.unknown:
        return _tryUnknownCode(payload.code, target: target);
    }
  }

  Future<CheckInPerson> _tryUnknownCode(
    String code, {
    CheckInTarget? target,
  }) async {
    if (target?.kind == CheckInTargetKind.event) {
      return _joinEventAttendee(code, eventId: target?.id);
    }
    if (target?.kind == CheckInTargetKind.meeting) {
      return _joinMeetingParticipant(code, meetingId: target?.id);
    }

    try {
      return await _joinEventAttendee(code);
    } on DioException catch (eventError) {
      try {
        return await _joinMeetingParticipant(code);
      } on DioException catch (meetingError) {
        if (meetingError.response?.statusCode != 404) rethrow;
        throw eventError;
      }
    }
  }

  Future<CheckInPerson> _joinEventAttendee(
    String code, {
    String? eventId,
  }) async {
    final response = await _dio.post(
      '/attendance/registrations/qr/$code/join',
      data: eventId == null ? null : {'eventId': eventId},
    );
    final data = _unwrapMap(response.data);
    return checkInPersonFromApi(data, CheckInKind.eventAttendee);
  }

  Future<CheckInPerson> _joinMeetingParticipant(
    String code, {
    String? meetingId,
  }) async {
    final response = await _dio.post(
      '/meetings/participants/qr/$code/join',
      data: meetingId == null ? null : {'meetingId': meetingId},
    );
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

enum CheckInTargetKind { event, meeting }

class CheckInTarget {
  const CheckInTarget({required this.id, required this.kind});

  final String id;
  final CheckInTargetKind kind;
}

class CheckInException implements Exception {
  const CheckInException(this.message);

  final String message;

  @override
  String toString() => message;
}

String checkInErrorMessage(Object error) {
  if (error is CheckInException) return error.message;
  if (error is DioException) return _dioMessage(error);
  if (error is FormatException) return 'checkInResponseUnread';
  return 'checkInFailedGeneric';
}

String _dioMessage(DioException error) {
  final apiMessage = _apiMessage(error.response?.data);
  final apiCode = _apiCode(error.response?.data);
  final normalized = (apiMessage ?? '').toLowerCase();
  final normalizedCode = (apiCode ?? '').toLowerCase();

  if (normalized.contains('not started') ||
      normalizedCode.contains('not_started')) {
    if (normalized.contains('meeting') || normalizedCode.contains('meeting')) {
      return 'meetingNotStartedMessage';
    }
    return 'eventNotStartedMessage';
  }
  if (normalized.contains('already ended') ||
      normalized.contains('ended') ||
      normalizedCode.contains('ended')) {
    if (normalized.contains('meeting') || normalizedCode.contains('meeting')) {
      return 'meetingEndedMessage';
    }
    return 'eventEndedMessage';
  }
  if (normalized.contains('active shift')) {
    return 'activeShiftMessage';
  }
  if (normalized.contains('already joined')) {
    return 'alreadyCheckedInMessage';
  }
  if (normalized.contains('not found') || normalized.contains('inactive')) {
    return 'invalidQrMessage';
  }
  if (normalized.contains('location')) {
    return apiMessage ?? 'locationRequiredMessage';
  }

  switch (error.type) {
    case DioExceptionType.connectionError:
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.receiveTimeout:
    case DioExceptionType.sendTimeout:
      return 'serverConnectionMessage';
    case DioExceptionType.badCertificate:
      return 'badCertificateMessage';
    case DioExceptionType.cancel:
      return 'checkInCancelledMessage';
    case DioExceptionType.badResponse:
    case DioExceptionType.unknown:
      return apiMessage ?? 'checkInFailedGeneric';
  }
}

String? _apiMessage(Object? data) {
  if (data is Map<String, dynamic>) {
    final error = data['error'];
    if (error is Map<String, dynamic>) {
      final nestedMessage = _apiMessage(error);
      if (nestedMessage != null) return nestedMessage;
    }
    final message = data['message'];
    if (message is String && message.trim().isNotEmpty) return message;
    if (message is List && message.isNotEmpty) {
      return message.whereType<String>().join('\n');
    }
    final nested = data['data'];
    if (nested is Map<String, dynamic>) return _apiMessage(nested);
  }
  return null;
}

String? _apiCode(Object? data) {
  if (data is Map<String, dynamic>) {
    final code = data['code'];
    if (code is String && code.trim().isNotEmpty) return code;
    final error = data['error'];
    if (error is Map<String, dynamic>) return _apiCode(error);
    final nested = data['data'];
    if (nested is Map<String, dynamic>) return _apiCode(nested);
  }
  return null;
}
