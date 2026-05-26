// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Khmer Central Khmer (`km`).
class AppLocalizationsKm extends AppLocalizations {
  AppLocalizationsKm([String locale = 'km']) : super(locale);

  @override
  String get appTitle => 'ម៉ាស៊ីនស្កេនវត្តមាន';

  @override
  String get appSubtitle =>
      'ស្កេន QR សម្រាប់ចុះវត្តមានព្រឹត្តិការណ៍ និងកិច្ចប្រជុំ';

  @override
  String get loginTitle => 'ចូលប្រើជាអ្នកគ្រប់គ្រង';

  @override
  String get loginSubtitle =>
      'ចូលប្រើដោយគណនីអ្នកគ្រប់គ្រង ដើម្បីចាប់ផ្តើមស្កេន។';

  @override
  String get apiBaseUrl => 'API base URL';

  @override
  String get invalidApiUrl => 'សូមបញ្ចូល API URL ត្រឹមត្រូវ';

  @override
  String get email => 'អ៊ីមែល';

  @override
  String get invalidEmail => 'សូមបញ្ចូលអ៊ីមែលត្រឹមត្រូវ';

  @override
  String get password => 'ពាក្យសម្ងាត់';

  @override
  String get invalidPassword => 'សូមបញ្ចូលពាក្យសម្ងាត់';

  @override
  String get signIn => 'ចូលប្រើ';

  @override
  String get forgotPassword => 'ភ្លេចពាក្យសម្ងាត់?';

  @override
  String get appVersion => 'CheckIn Admin - v2.0';

  @override
  String get language => 'ភាសា';

  @override
  String get theme => 'រូបរាង';

  @override
  String get errorTitle => 'ស្កេនមិនជោគជ័យ';

  @override
  String get ok => 'យល់ព្រម';

  @override
  String get scanTitle => 'ចុះវត្តមាន QR';

  @override
  String get qrScanner => 'ម៉ាស៊ីនស្កេន QR';

  @override
  String get adminUser => 'អ្នកគ្រប់គ្រង';

  @override
  String get logout => 'ចាកចេញ';

  @override
  String get mobileScanner => 'ស្កេនដោយកាមេរ៉ាទូរសព្ទ';

  @override
  String get mobileScannerHelp => 'តម្រង់កាមេរ៉ាទៅកាន់ QR របស់អ្នកចូលរួម។';

  @override
  String get hardwareScanner => 'ឧបករណ៍អាន QR';

  @override
  String get hardwareScannerHelp =>
      'ប្រើឧបករណ៍អាន QR ដែលភ្ជាប់ជាមួយកុំព្យូទ័រ។';

  @override
  String get scanNext => 'ស្កេនបន្ទាប់';

  @override
  String get scanNextAttendee => 'ស្កេនអ្នកបន្ទាប់';

  @override
  String get qrCode => 'កូដ QR';

  @override
  String get hardwareScannerPlaceholder => 'ស្កេន ឬបិទភ្ជាប់កូដ check-in';

  @override
  String get waitingForScan => 'កំពុងរង់ចាំការស្កេនដំបូង';

  @override
  String get checkInMethod => 'វិធីចុះវត្តមាន';

  @override
  String get enterCheckInCode => 'បញ្ចូលកូដ check-in';

  @override
  String get typeOrPasteCode => 'វាយ ឬបិទភ្ជាប់កូដ';

  @override
  String get checkIn => 'ចុះវត្តមាន';

  @override
  String get or => 'ឬ';

  @override
  String get scanPersonalQr => 'ស្កេន QR ផ្ទាល់ខ្លួន';

  @override
  String get attendeeQrHelp => 'អ្នកចូលរួមបង្ហាញ QR លើទូរសព្ទ។';

  @override
  String get usbReader => 'ឧបករណ៍ USB';

  @override
  String get alignQrCode => 'តម្រង់ QR ឲ្យនៅក្នុងស៊ុម';

  @override
  String get checkInResult => 'លទ្ធផល check-in';

  @override
  String get scanSuccessful => 'ស្កេនជោគជ័យ';

  @override
  String get checkedInSuccessfully => 'បានចុះវត្តមានជោគជ័យ';

  @override
  String get recentCheckIns => 'Check-in ថ្មីៗ';

  @override
  String get noRecentCheckIns => 'មិនទាន់មាន check-in ថ្មីៗ។';

  @override
  String get scanMode => 'របៀប';

  @override
  String get checkInSuccess => 'បានចុះវត្តមាន';

  @override
  String scanSummary(int count, String code) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'ស្កេនជោគជ័យ $count ដង: $code',
      one: 'ស្កេនជោគជ័យ 1 ដង: $code',
    );
    return '$_temp0';
  }

  @override
  String get fullName => 'ឈ្មោះពេញ';

  @override
  String get gender => 'ភេទ';

  @override
  String get phoneNumber => 'លេខទូរសព្ទ';

  @override
  String get position => 'តួនាទី';

  @override
  String get organization => 'អង្គភាព';

  @override
  String get status => 'ស្ថានភាព';

  @override
  String get profileTitle => 'អ្នកចូលរួមចុងក្រោយ';

  @override
  String get noProfileYet => 'មិនទាន់មានអ្នកបាន check-in';

  @override
  String get noProfileHelp =>
      'ពេលស្កេនជោគជ័យ ព័ត៌មានអ្នកចូលរួម និងស្ថានភាពនឹងបង្ហាញនៅទីនេះ។';
}
