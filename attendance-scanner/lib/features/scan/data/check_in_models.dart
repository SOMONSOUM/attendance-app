import 'package:json_annotation/json_annotation.dart';

part 'check_in_models.g.dart';

enum CheckInKind { eventAttendee, meetingParticipant }

@JsonSerializable()
class CheckInPerson {
  const CheckInPerson({
    required this.id,
    required this.fullName,
    required this.kind,
    this.fullNameKm,
    this.gender,
    this.phoneNumber,
    this.position,
    this.organization,
    this.status,
    this.checkedInAt,
  });

  factory CheckInPerson.fromJson(Map<String, dynamic> json) =>
      _$CheckInPersonFromJson(json);

  final String id;
  final String fullName;
  final String? fullNameKm;
  final String? gender;
  final String? phoneNumber;
  final String? position;
  final String? organization;
  final String? status;
  final DateTime? checkedInAt;
  final CheckInKind kind;

  String get kindLabel => kind == CheckInKind.eventAttendee
      ? 'Event attendee'
      : 'Meeting participant';

  Map<String, dynamic> toJson() => _$CheckInPersonToJson(this);
}

CheckInPerson checkInPersonFromApi(
  Map<String, dynamic> json,
  CheckInKind kind,
) {
  final fullName =
      (json['fullNameEn'] ?? json['fullName'] ?? 'Unknown') as String;
  final organization =
      json['organization'] ??
      json['event']?['name'] ??
      json['meeting']?['name'];

  return CheckInPerson(
    id: json['id'] as String,
    fullName: fullName,
    fullNameKm: json['fullNameKm'] as String?,
    gender: json['gender'] as String?,
    phoneNumber: (json['phoneNumber'] ?? json['phone']) as String?,
    position: json['position'] as String?,
    organization: organization as String?,
    status: (json['status'] ?? 'JOINED') as String?,
    checkedInAt: DateTime.tryParse(
      (json['joinedAt'] ?? json['createdAt'] ?? '') as String,
    ),
    kind: kind,
  );
}
