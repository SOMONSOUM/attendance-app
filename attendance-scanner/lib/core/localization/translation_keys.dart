import '../settings/app_settings.dart';

abstract final class L {
  static const app = _AppKeys();
  static const common = _CommonKeys();
  static const header = _HeaderKeys();
  static const login = _LoginKeys();
  static const loginForm = _LoginFormKeys();
  static const settings = _SettingsKeys();
  static const scanner = _ScannerKeys();
  static const offline = _OfflineKeys();
  static const error = _ErrorKeys();
  static const checkIn = _CheckInKeys();
  static const home = _HomeKeys();
  static const eventMeeting = _EventMeetingKeys();
  static const status = _StatusKeys();
  static const themeColor = _ThemeColorKeys();
}

class _AppKeys {
  const _AppKeys();

  final title = 'app.title';
  final subtitle = 'app.subtitle';
  final version = 'app.version';
}

class _CommonKeys {
  const _CommonKeys();

  final ok = 'common.ok';
  final refresh = 'common.refresh';
  final settings = 'common.settings';
  final signOut = 'common.signOut';
  final language = 'common.language';
  final theme = 'common.theme';
  final adminUser = 'common.adminUser';
}

class _HeaderKeys {
  const _HeaderKeys();

  final secureAccess = 'header.secureAccess';
  final realtimeSync = 'header.realtimeSync';
}

class _LoginKeys {
  const _LoginKeys();

  final title = 'login.title';
  final subtitle = 'login.subtitle';
}

class _LoginFormKeys {
  const _LoginFormKeys();

  final email = 'loginForm.email';
  final invalidEmail = 'loginForm.invalidEmail';
  final password = 'loginForm.password';
  final invalidPassword = 'loginForm.invalidPassword';
  final forgotPassword = 'loginForm.forgotPassword';
  final signIn = 'loginForm.signIn';
}

class _SettingsKeys {
  const _SettingsKeys();

  final appearance = 'settings.appearance';
  final themeColor = 'settings.themeColor';
  final fontFamily = 'settings.fontFamily';
  final fontSize = 'settings.fontSize';
  final systemTheme = 'settings.systemTheme';
  final lightTheme = 'settings.lightTheme';
  final darkTheme = 'settings.darkTheme';
}

class _ScannerKeys {
  const _ScannerKeys();

  final title = 'scanner.title';
  final errorTitle = 'scanner.errorTitle';
  final scanNextAttendee = 'scanner.scanNextAttendee';
  final waitingForScan = 'scanner.waitingForScan';
  final method = 'scanner.method';
  final enterCheckInCode = 'scanner.enterCheckInCode';
  final typeOrPasteCode = 'scanner.typeOrPasteCode';
  final checkIn = 'scanner.checkIn';
  final or = 'scanner.or';
  final scanPersonalQr = 'scanner.scanPersonalQr';
  final attendeeQrHelp = 'scanner.attendeeQrHelp';
  final usbReader = 'scanner.usbReader';
  final alignQrCode = 'scanner.alignQrCode';
  final result = 'scanner.result';
  final successful = 'scanner.successful';
  final checkedInSuccessfully = 'scanner.checkedInSuccessfully';
  final successTitle = 'scanner.successTitle';
  final successMessage = 'scanner.successMessage';
  final recentCheckIns = 'scanner.recentCheckIns';
  final noRecentCheckIns = 'scanner.noRecentCheckIns';
  final noResultYet = 'scanner.noResultYet';
  final noResultHelp = 'scanner.noResultHelp';
  final fullName = 'scanner.fullName';
  final gender = 'scanner.gender';
  final phoneNumber = 'scanner.phoneNumber';
  final position = 'scanner.position';
  final organization = 'scanner.organization';
}

class _OfflineKeys {
  const _OfflineKeys();

  final title = 'offline.title';
  final message = 'offline.message';
}

class _ErrorKeys {
  const _ErrorKeys();

  final title = 'error.title';
  final message = 'error.message';
  final unauthorizedTitle = 'error.unauthorizedTitle';
  final unauthorizedMessage = 'error.unauthorizedMessage';
  final details = 'error.details';
}

class _CheckInKeys {
  const _CheckInKeys();

  final unavailableTitle = 'checkIn.unavailableTitle';
  final alreadyCheckedInTitle = 'checkIn.alreadyCheckedInTitle';
  final eventEndedTitle = 'checkIn.eventEndedTitle';
  final meetingEndedTitle = 'checkIn.meetingEndedTitle';
  final eventEndedNotice = 'checkIn.eventEndedNotice';
  final meetingEndedNotice = 'checkIn.meetingEndedNotice';
  final invalidEventQrForMeeting = 'checkIn.invalidEventQrForMeeting';
  final invalidMeetingQrForEvent = 'checkIn.invalidMeetingQrForEvent';
  final responseUnread = 'checkIn.responseUnread';
  final failedGeneric = 'checkIn.failedGeneric';
  final meetingNotStartedMessage = 'checkIn.meetingNotStartedMessage';
  final eventNotStartedMessage = 'checkIn.eventNotStartedMessage';
  final meetingEndedMessage = 'checkIn.meetingEndedMessage';
  final eventEndedMessage = 'checkIn.eventEndedMessage';
  final activeShiftMessage = 'checkIn.activeShiftMessage';
  final alreadyCheckedInMessage = 'checkIn.alreadyCheckedInMessage';
  final invalidQrMessage = 'checkIn.invalidQrMessage';
  final locationRequiredMessage = 'checkIn.locationRequiredMessage';
  final serverConnectionMessage = 'checkIn.serverConnectionMessage';
  final badCertificateMessage = 'checkIn.badCertificateMessage';
  final cancelledMessage = 'checkIn.cancelledMessage';
}

class _HomeKeys {
  const _HomeKeys();

  final eventsMeetings = 'home.eventsMeetings';
  final totalEvents = 'home.totalEvents';
  final liveNow = 'home.liveNow';
  final checkedInToday = 'home.checkedInToday';
  final searchEventsMeetings = 'home.searchEventsMeetings';
  final todayDate = 'home.todayDate';
  final countEvents = 'home.countEvents';
  final noEvents = 'home.noEvents';
}

class _EventMeetingKeys {
  const _EventMeetingKeys();

  final event = 'eventMeeting.event';
  final meeting = 'eventMeeting.meeting';
  final startDate = 'eventMeeting.startDate';
  final endDate = 'eventMeeting.endDate';
  final location = 'eventMeeting.location';
}

class _StatusKeys {
  const _StatusKeys();

  final all = 'status.all';
  final today = 'status.today';
  final upcoming = 'status.upcoming';
  final ended = 'status.ended';
  final live = 'status.live';
}

class _ThemeColorKeys {
  const _ThemeColorKeys();

  final green = 'themeColor.green';
  final blue = 'themeColor.blue';
  final purple = 'themeColor.purple';
  final orange = 'themeColor.orange';
  final red = 'themeColor.red';
}

String appThemeColorKey(AppThemeColor color) {
  return switch (color) {
    AppThemeColor.green => L.themeColor.green,
    AppThemeColor.blue => L.themeColor.blue,
    AppThemeColor.purple => L.themeColor.purple,
    AppThemeColor.orange => L.themeColor.orange,
    AppThemeColor.red => L.themeColor.red,
  };
}
