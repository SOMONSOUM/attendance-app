import 'package:attendance_scanner/main.dart' as app;
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

Future<void> _pumpUntilFound(
  WidgetTester tester,
  Finder finder, {
  Duration timeout = const Duration(seconds: 20),
}) async {
  final deadline = DateTime.now().add(timeout);
  while (DateTime.now().isBefore(deadline)) {
    await tester.pump(const Duration(milliseconds: 250));
    if (finder.evaluate().isNotEmpty) return;
  }

  expect(finder, findsWidgets);
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('logs in against the local API and stores the session', (
    tester,
  ) async {
    app.main();
    await tester.pumpAndSettle(const Duration(seconds: 3));

    final loggedInScreen = find.byWidgetPredicate((widget) {
      if (widget is! Text) return false;
      return {
        'Events & Meetings',
        'ព្រឹត្តិការណ៍ និងកិច្ចប្រជុំ',
        'QR Scanner',
        'ស្កេន QR',
      }.contains(widget.data);
    });

    if (loggedInScreen.evaluate().isEmpty) {
      final signInButton = find.text('Sign in').evaluate().isNotEmpty
          ? find.text('Sign in')
          : find.text('ចូលប្រើ');
      await tester.tap(signInButton);
      await _pumpUntilFound(tester, loggedInScreen);
    }

    expect(find.textContaining('PlatformException'), findsNothing);
    expect(find.textContaining('required entitlement'), findsNothing);
    expect(loggedInScreen, findsWidgets);
  });
}
