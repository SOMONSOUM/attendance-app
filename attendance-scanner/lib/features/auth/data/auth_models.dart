import 'package:json_annotation/json_annotation.dart';

part 'auth_models.g.dart';

@JsonSerializable()
class LoginRequest {
  const LoginRequest({required this.email, required this.password});

  final String email;
  final String password;

  Map<String, dynamic> toJson() => _$LoginRequestToJson(this);
}

@JsonSerializable()
class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory AuthSession.fromJson(Map<String, dynamic> json) =>
      _$AuthSessionFromJson(json);

  final String accessToken;
  final String refreshToken;
  final AuthUser user;

  Map<String, dynamic> toJson() => _$AuthSessionToJson(this);
}

@JsonSerializable()
class AuthUser {
  const AuthUser({
    required this.id,
    required this.fullNameEn,
    required this.permissions,
    this.tenantId,
    this.tenantSlug,
    this.tenantName,
    this.email,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) =>
      _$AuthUserFromJson(json);

  final String id;
  final String? tenantId;
  final String? tenantSlug;
  final String? tenantName;
  final String? email;
  final String fullNameEn;
  final List<String> permissions;

  bool get canScanAttendance =>
      permissions.contains('attendance:create') ||
      permissions.contains('meetings:update');

  Map<String, dynamic> toJson() => _$AuthUserToJson(this);
}
