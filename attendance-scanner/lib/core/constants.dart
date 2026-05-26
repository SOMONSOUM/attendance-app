const defaultApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:3001/api',
);

const accessTokenStorageKey = 'attendance_scanner_access_token';
const refreshTokenStorageKey = 'attendance_scanner_refresh_token';
