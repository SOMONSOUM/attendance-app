import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../../core/constants.dart';
import '../../../core/network/api_client.dart';
import 'auth_models.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    dio: ref.watch(dioProvider),
    storage: ref.watch(secureStorageProvider),
  );
});

class AuthRepository {
  const AuthRepository({required this.dio, required this.storage});

  final Dio dio;
  final FlutterSecureStorage storage;

  Future<AuthSession> login(LoginRequest request) async {
    final response = await dio.post('/auth/login', data: request.toJson());
    final session = unwrapSession(response.data);
    await saveSession(session);
    return session;
  }

  Future<AuthUser> me() async {
    final response = await dio.get('/auth/me');
    return unwrapData(response.data, AuthUser.fromJson);
  }

  Future<AuthUser?> restoreUser() async {
    if (await hasAccessToken()) {
      return me();
    }

    final refreshToken = await storage.read(key: refreshTokenStorageKey);
    if (refreshToken == null || refreshToken.isEmpty) return null;

    final response = await dio.post(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
    );
    final session = unwrapSession(response.data);
    await saveSession(session);
    return session.user;
  }

  Future<void> saveSession(AuthSession session) async {
    await storage.write(key: accessTokenStorageKey, value: session.accessToken);
    await storage.write(
      key: refreshTokenStorageKey,
      value: session.refreshToken,
    );
  }

  Future<bool> hasAccessToken() async {
    return (await storage.read(key: accessTokenStorageKey)) != null;
  }

  Future<void> logout() async {
    await storage.delete(key: accessTokenStorageKey);
    await storage.delete(key: refreshTokenStorageKey);
  }
}
