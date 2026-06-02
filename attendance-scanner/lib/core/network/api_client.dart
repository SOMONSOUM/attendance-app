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
      baseUrl: versionedApiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
      headers: {'Content-Type': 'application/json'},
    ),
  );
  final refreshDio = Dio(dio.options);
  Future<String?>? refreshInFlight;

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await storage.read(key: accessTokenStorageKey);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (await _tryRefreshAndRetry(
          error: error,
          handler: handler,
          dio: dio,
          refreshDio: refreshDio,
          storage: storage,
          refreshInFlight: () => refreshInFlight,
          setRefreshInFlight: (future) => refreshInFlight = future,
        )) {
          return;
        }

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

Future<bool> _tryRefreshAndRetry({
  required DioException error,
  required ErrorInterceptorHandler handler,
  required Dio dio,
  required Dio refreshDio,
  required FlutterSecureStorage storage,
  required Future<String?>? Function() refreshInFlight,
  required void Function(Future<String?>?) setRefreshInFlight,
}) async {
  final requestOptions = error.requestOptions;
  final path = requestOptions.path;
  final isAuthRoute =
      path.contains('/auth/login') ||
      path.contains('/auth/register') ||
      path.contains('/auth/refresh') ||
      path.contains('/auth/logout');

  if (error.response?.statusCode != 401 ||
      isAuthRoute ||
      requestOptions.extra['retried'] == true) {
    return false;
  }

  final refreshToken = await storage.read(key: refreshTokenStorageKey);
  if (refreshToken == null || refreshToken.isEmpty) return false;

  try {
    var refreshFuture = refreshInFlight();
    if (refreshFuture == null) {
      refreshFuture = _refreshAccessToken(refreshDio, storage, refreshToken);
      setRefreshInFlight(refreshFuture);
    }

    final accessToken = await refreshFuture;
    if (accessToken == null || accessToken.isEmpty) return false;

    requestOptions.extra['retried'] = true;
    requestOptions.headers['Authorization'] = 'Bearer $accessToken';
    final response = await dio.fetch<Object?>(requestOptions);
    handler.resolve(response);
    return true;
  } catch (_) {
    await storage.delete(key: accessTokenStorageKey);
    await storage.delete(key: refreshTokenStorageKey);
    return false;
  } finally {
    setRefreshInFlight(null);
  }
}

Future<String?> _refreshAccessToken(
  Dio refreshDio,
  FlutterSecureStorage storage,
  String refreshToken,
) async {
  final response = await refreshDio.post(
    '/auth/refresh',
    data: {'refreshToken': refreshToken},
  );
  final session = unwrapSession(response.data);
  await storage.write(key: accessTokenStorageKey, value: session.accessToken);
  await storage.write(key: refreshTokenStorageKey, value: session.refreshToken);
  return session.accessToken;
}

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

String get versionedApiBaseUrl {
  final normalized = apiBaseUrl.replaceAll(RegExp(r'/+$'), '');
  if (normalized.endsWith('/api')) return '$normalized/v1';
  return normalized;
}
