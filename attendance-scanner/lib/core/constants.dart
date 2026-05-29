import 'package:flutter_dotenv/flutter_dotenv.dart';

const defaultApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:3001/api/v1',
);

String get apiBaseUrl =>
    dotenv.maybeGet('API_BASE_URL')?.trim().isNotEmpty == true
    ? dotenv.get('API_BASE_URL')
    : defaultApiBaseUrl;

const accessTokenStorageKey = 'attendance_scanner_access_token';
const refreshTokenStorageKey = 'attendance_scanner_refresh_token';
