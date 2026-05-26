import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../features/auth/data/auth_models.dart';
import '../constants.dart';

final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

final dioProvider = Provider<Dio>((ref) {
  final storage = ref.watch(secureStorageProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: defaultApiBaseUrl.replaceAll(RegExp(r'/+$'), ''),
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await storage.read(key: accessTokenStorageKey);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) {
        final payload = error.response?.data;
        if (payload is Map<String, dynamic>) {
          final message =
              payload['error']?['message'] ??
              payload['message'] ??
              error.message ??
              'Request failed';
          handler.reject(
            DioException(
              requestOptions: error.requestOptions,
              response: error.response,
              type: error.type,
              error: message,
            ),
          );
          return;
        }
        handler.next(error);
      },
    ),
  );

  return dio;
});

T unwrapData<T>(Object? payload, T Function(Map<String, dynamic>) fromJson) {
  if (payload is Map<String, dynamic>) {
    final data = payload['data'];
    if (data is Map<String, dynamic>) return fromJson(data);
    return fromJson(payload);
  }
  throw const FormatException('Invalid API response');
}

List<T> unwrapList<T>(
  Object? payload,
  T Function(Map<String, dynamic>) fromJson,
) {
  final data = payload is Map<String, dynamic> ? payload['data'] : payload;
  if (data is List) {
    return data.whereType<Map<String, dynamic>>().map(fromJson).toList();
  }
  throw const FormatException('Invalid API response');
}

AuthSession unwrapSession(Object? payload) {
  return unwrapData(payload, AuthSession.fromJson);
}
