// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Attendance Scanner';

  @override
  String get appSubtitle => 'Fast QR check-in for events and meetings';

  @override
  String get loginTitle => 'Admin sign in';

  @override
  String get loginSubtitle =>
      'Connect to the attendance API before scanning attendees.';

  @override
  String get apiBaseUrl => 'API base URL';

  @override
  String get invalidApiUrl => 'Enter a valid API URL';

  @override
  String get email => 'Email';

  @override
  String get invalidEmail => 'Enter a valid email';

  @override
  String get password => 'Password';

  @override
  String get invalidPassword => 'Enter your password';

  @override
  String get signIn => 'Sign in';

  @override
  String get forgotPassword => 'Forgot password?';

  @override
  String get appVersion => 'CheckIn Admin - v2.0';

  @override
  String get language => 'Language';

  @override
  String get theme => 'Theme';

  @override
  String get errorTitle => 'Scan failed';

  @override
  String get ok => 'OK';

  @override
  String get scanTitle => 'QR check-in';

  @override
  String get qrScanner => 'QR Scanner';

  @override
  String get adminUser => 'Admin User';

  @override
  String get logout => 'Logout';

  @override
  String get mobileScanner => 'Mobile camera scanner';

  @override
  String get mobileScannerHelp =>
      'Point the device camera at an attendee or participant QR code.';

  @override
  String get hardwareScanner => 'Hardware QR reader';

  @override
  String get hardwareScannerHelp =>
      'Use the connected QR reader. It works like a keyboard and submits after scan.';

  @override
  String get scanNext => 'Scan next';

  @override
  String get scanNextAttendee => 'Scan next attendee';

  @override
  String get qrCode => 'QR code';

  @override
  String get hardwareScannerPlaceholder => 'Scan or paste a QR code';

  @override
  String get waitingForScan => 'Waiting for the first scan';

  @override
  String get checkInMethod => 'Check-in method';

  @override
  String get enterCheckInCode => 'Enter check-in code';

  @override
  String get typeOrPasteCode => 'Type or paste code';

  @override
  String get checkIn => 'Check in';

  @override
  String get or => 'or';

  @override
  String get scanPersonalQr => 'Scan personal QR';

  @override
  String get attendeeQrHelp =>
      'Attendee shows QR on phone. Hold up to webcam or reader.';

  @override
  String get usbReader => 'USB reader';

  @override
  String get alignQrCode => 'Align QR code within the frame';

  @override
  String get checkInResult => 'Check-in result';

  @override
  String get scanSuccessful => 'Scan successful';

  @override
  String get checkedInSuccessfully => 'Checked in successfully';

  @override
  String get recentCheckIns => 'Recent check-ins';

  @override
  String get noRecentCheckIns => 'No recent check-ins yet.';

  @override
  String get scanMode => 'Mode';

  @override
  String get checkInSuccess => 'Checked in';

  @override
  String scanSummary(int count, String code) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count successful scans: $code',
      one: '1 successful scan: $code',
    );
    return '$_temp0';
  }

  @override
  String get fullName => 'Full name';

  @override
  String get gender => 'Gender';

  @override
  String get phoneNumber => 'Phone number';

  @override
  String get position => 'Position';

  @override
  String get organization => 'Organization';

  @override
  String get status => 'Status';

  @override
  String get profileTitle => 'Latest attendee';

  @override
  String get noProfileYet => 'No attendee checked in yet';

  @override
  String get noProfileHelp =>
      'Successful scans appear here with the attendee profile and attendance status.';
}
