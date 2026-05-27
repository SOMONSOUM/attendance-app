import 'package:attendance_scanner/core/settings/app_settings.dart';
import 'package:attendance_scanner/features/auth/widgets/login_form.dart';
import 'package:attendance_scanner/features/settings/presentation/settings_screen.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await EasyLocalization.ensureInitialized();
  });

  testWidgets('login form lays out on phone and desktop sizes', (tester) async {
    final formKey = GlobalKey<FormState>();
    final emailController = TextEditingController(text: 'admin@example.com');
    final passwordController = TextEditingController(text: 'password123');

    Future<void> pumpAt(Size size) async {
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1;
      await tester.pumpWidget(
        _TestShell(
          child: LoginForm(
            formKey: formKey,
            emailController: emailController,
            passwordController: passwordController,
            showPassword: false,
            isLoading: false,
            onTogglePassword: () {},
            onLogin: () {},
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    }

    await pumpAt(const Size(390, 844));
    await pumpAt(const Size(1280, 720));

    addTearDown(() {
      emailController.dispose();
      passwordController.dispose();
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
  });

  testWidgets('settings screen lays out on compact mobile', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;

    await tester.pumpWidget(
      const ProviderScope(child: _TestShell(child: SettingsScreen())),
    );
    await tester.pump(const Duration(seconds: 1));
    await tester.pumpAndSettle();

    expect(find.byType(EasyLocalization), findsOneWidget);
    expect(tester.takeException(), isNull);

    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
  });
}

class _TestShell extends StatelessWidget {
  const _TestShell({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return EasyLocalization(
      supportedLocales: const [Locale('en'), Locale('km')],
      path: 'assets/translations',
      fallbackLocale: const Locale('en'),
      child: Builder(
        builder: (context) {
          return MaterialApp(
            localizationsDelegates: context.localizationDelegates,
            supportedLocales: context.supportedLocales,
            locale: context.locale,
            theme: AppThemeData.testTheme,
            home: Scaffold(body: child),
          );
        },
      ),
    );
  }
}

class AppThemeData {
  static ThemeData get testTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: AppThemeColor.green.color),
    );
  }
}
