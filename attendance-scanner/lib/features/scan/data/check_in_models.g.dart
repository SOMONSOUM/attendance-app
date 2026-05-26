// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'check_in_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CheckInPerson _$CheckInPersonFromJson(Map<String, dynamic> json) =>
    CheckInPerson(
      id: json['id'] as String,
      fullName: json['fullName'] as String,
      kind: $enumDecode(_$CheckInKindEnumMap, json['kind']),
      fullNameKm: json['fullNameKm'] as String?,
      gender: json['gender'] as String?,
      phoneNumber: json['phoneNumber'] as String?,
      position: json['position'] as String?,
      organization: json['organization'] as String?,
      status: json['status'] as String?,
      checkedInAt: json['checkedInAt'] == null
          ? null
          : DateTime.parse(json['checkedInAt'] as String),
    );

Map<String, dynamic> _$CheckInPersonToJson(CheckInPerson instance) =>
    <String, dynamic>{
      'id': instance.id,
      'fullName': instance.fullName,
      'fullNameKm': instance.fullNameKm,
      'gender': instance.gender,
      'phoneNumber': instance.phoneNumber,
      'position': instance.position,
      'organization': instance.organization,
      'status': instance.status,
      'checkedInAt': instance.checkedInAt?.toIso8601String(),
      'kind': _$CheckInKindEnumMap[instance.kind]!,
    };

const _$CheckInKindEnumMap = {
  CheckInKind.eventAttendee: 'eventAttendee',
  CheckInKind.meetingParticipant: 'meetingParticipant',
};
