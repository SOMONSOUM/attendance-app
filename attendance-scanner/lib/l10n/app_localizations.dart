import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_km.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('km'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'Attendance Scanner'**
  String get appTitle;

  /// No description provided for @appSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Fast QR check-in for events and meetings'**
  String get appSubtitle;

  /// No description provided for @loginTitle.
  ///
  /// In en, this message translates to:
  /// **'Admin sign in'**
  String get loginTitle;

  /// No description provided for @loginSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Connect to the attendance API before scanning attendees.'**
  String get loginSubtitle;

  /// No description provided for @apiBaseUrl.
  ///
  /// In en, this message translates to:
  /// **'API base URL'**
  String get apiBaseUrl;

  /// No description provided for @invalidApiUrl.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid API URL'**
  String get invalidApiUrl;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @invalidEmail.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid email'**
  String get invalidEmail;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @invalidPassword.
  ///
  /// In en, this message translates to:
  /// **'Enter your password'**
  String get invalidPassword;

  /// No description provided for @signIn.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get signIn;

  /// No description provided for @forgotPassword.
  ///
  /// In en, this message translates to:
  /// **'Forgot password?'**
  String get forgotPassword;

  /// No description provided for @appVersion.
  ///
  /// In en, this message translates to:
  /// **'CheckIn Admin - v2.0'**
  String get appVersion;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @theme.
  ///
  /// In en, this message translates to:
  /// **'Theme'**
  String get theme;

  /// No description provided for @errorTitle.
  ///
  /// In en, this message translates to:
  /// **'Scan failed'**
  String get errorTitle;

  /// No description provided for @ok.
  ///
  /// In en, this message translates to:
  /// **'OK'**
  String get ok;

  /// No description provided for @scanTitle.
  ///
  /// In en, this message translates to:
  /// **'QR check-in'**
  String get scanTitle;

  /// No description provided for @qrScanner.
  ///
  /// In en, this message translates to:
  /// **'QR Scanner'**
  String get qrScanner;

  /// No description provided for @adminUser.
  ///
  /// In en, this message translates to:
  /// **'Admin User'**
  String get adminUser;

  /// No description provided for @logout.
  ///
  /// In en, this message translates to:
  /// **'Logout'**
  String get logout;

  /// No description provided for @mobileScanner.
  ///
  /// In en, this message translates to:
  /// **'Mobile camera scanner'**
  String get mobileScanner;

  /// No description provided for @mobileScannerHelp.
  ///
  /// In en, this message translates to:
  /// **'Point the device camera at an attendee or participant QR code.'**
  String get mobileScannerHelp;

  /// No description provided for @hardwareScanner.
  ///
  /// In en, this message translates to:
  /// **'Hardware QR reader'**
  String get hardwareScanner;

  /// No description provided for @hardwareScannerHelp.
  ///
  /// In en, this message translates to:
  /// **'Use the connected QR reader. It works like a keyboard and submits after scan.'**
  String get hardwareScannerHelp;

  /// No description provided for @scanNext.
  ///
  /// In en, this message translates to:
  /// **'Scan next'**
  String get scanNext;

  /// No description provided for @scanNextAttendee.
  ///
  /// In en, this message translates to:
  /// **'Scan next attendee'**
  String get scanNextAttendee;

  /// No description provided for @qrCode.
  ///
  /// In en, this message translates to:
  /// **'QR code'**
  String get qrCode;

  /// No description provided for @hardwareScannerPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Scan or paste a QR code'**
  String get hardwareScannerPlaceholder;

  /// No description provided for @waitingForScan.
  ///
  /// In en, this message translates to:
  /// **'Waiting for the first scan'**
  String get waitingForScan;

  /// No description provided for @checkInMethod.
  ///
  /// In en, this message translates to:
  /// **'Check-in method'**
  String get checkInMethod;

  /// No description provided for @enterCheckInCode.
  ///
  /// In en, this message translates to:
  /// **'Enter check-in code'**
  String get enterCheckInCode;

  /// No description provided for @typeOrPasteCode.
  ///
  /// In en, this message translates to:
  /// **'Type or paste code'**
  String get typeOrPasteCode;

  /// No description provided for @checkIn.
  ///
  /// In en, this message translates to:
  /// **'Check in'**
  String get checkIn;

  /// No description provided for @or.
  ///
  /// In en, this message translates to:
  /// **'or'**
  String get or;

  /// No description provided for @scanPersonalQr.
  ///
  /// In en, this message translates to:
  /// **'Scan personal QR'**
  String get scanPersonalQr;

  /// No description provided for @attendeeQrHelp.
  ///
  /// In en, this message translates to:
  /// **'Attendee shows QR on phone. Hold up to webcam or reader.'**
  String get attendeeQrHelp;

  /// No description provided for @usbReader.
  ///
  /// In en, this message translates to:
  /// **'USB reader'**
  String get usbReader;

  /// No description provided for @alignQrCode.
  ///
  /// In en, this message translates to:
  /// **'Align QR code within the frame'**
  String get alignQrCode;

  /// No description provided for @checkInResult.
  ///
  /// In en, this message translates to:
  /// **'Check-in result'**
  String get checkInResult;

  /// No description provided for @scanSuccessful.
  ///
  /// In en, this message translates to:
  /// **'Scan successful'**
  String get scanSuccessful;

  /// No description provided for @checkedInSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'Checked in successfully'**
  String get checkedInSuccessfully;

  /// No description provided for @recentCheckIns.
  ///
  /// In en, this message translates to:
  /// **'Recent check-ins'**
  String get recentCheckIns;

  /// No description provided for @noRecentCheckIns.
  ///
  /// In en, this message translates to:
  /// **'No recent check-ins yet.'**
  String get noRecentCheckIns;

  /// No description provided for @scanMode.
  ///
  /// In en, this message translates to:
  /// **'Mode'**
  String get scanMode;

  /// No description provided for @checkInSuccess.
  ///
  /// In en, this message translates to:
  /// **'Checked in'**
  String get checkInSuccess;

  /// No description provided for @scanSummary.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 successful scan: {code}} other{{count} successful scans: {code}}}'**
  String scanSummary(int count, String code);

  /// No description provided for @fullName.
  ///
  /// In en, this message translates to:
  /// **'Full name'**
  String get fullName;

  /// No description provided for @gender.
  ///
  /// In en, this message translates to:
  /// **'Gender'**
  String get gender;

  /// No description provided for @phoneNumber.
  ///
  /// In en, this message translates to:
  /// **'Phone number'**
  String get phoneNumber;

  /// No description provided for @position.
  ///
  /// In en, this message translates to:
  /// **'Position'**
  String get position;

  /// No description provided for @organization.
  ///
  /// In en, this message translates to:
  /// **'Organization'**
  String get organization;

  /// No description provided for @status.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get status;

  /// No description provided for @profileTitle.
  ///
  /// In en, this message translates to:
  /// **'Latest attendee'**
  String get profileTitle;

  /// No description provided for @noProfileYet.
  ///
  /// In en, this message translates to:
  /// **'No attendee checked in yet'**
  String get noProfileYet;

  /// No description provided for @noProfileHelp.
  ///
  /// In en, this message translates to:
  /// **'Successful scans appear here with the attendee profile and attendance status.'**
  String get noProfileHelp;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'km'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'km':
      return AppLocalizationsKm();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
