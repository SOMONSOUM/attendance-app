import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';

import '../../../core/localization/translation_keys.dart';
import '../../../core/widgets/app_settings_actions.dart';
import '../../../core/widgets/responsive_page.dart';
import '../state/auth_controller.dart';
import '../widgets/login_brand_panel.dart';
import '../widgets/login_form.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController(text: 'admin@example.com');
  final _passwordController = TextEditingController(text: 'password123');
  bool _showPassword = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    final media = MediaQuery.of(context);
    final wide = media.size.width >= 840;
    final isShort = media.size.height < 680;
    final horizontalPadding = media.size.width < 420 ? 16.0 : 24.0;

    final form = LoginForm(
      formKey: _formKey,
      emailController: _emailController,
      passwordController: _passwordController,
      showPassword: _showPassword,
      authError: auth.error,
      isLoading: auth.isLoading,
      onTogglePassword: () => setState(() => _showPassword = !_showPassword),
      onLogin: _login,
    );

    return Scaffold(
      appBar: AppBar(actions: const [AppSettingsActions(), Gap(8)]),
      body: ResponsivePage(
        maxWidth: 900,
        horizontalPadding: horizontalPadding,
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(vertical: isShort ? 18 : 36),
            child: wide
                ? DecoratedBox(
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surface,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: Theme.of(context).colorScheme.outline,
                      ),
                    ),
                    child: _DesktopLoginShell(form: form),
                  )
                : Column(
                    children: [
                      LoginBrandPanel.compact(
                        title: L.app.title.tr(),
                        subtitle: L.app.subtitle.tr(),
                      ),
                      const Gap(16),
                      form,
                      const Gap(18),
                      Text(
                        L.app.version.tr(),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    await ref
        .read(authControllerProvider)
        .login(_emailController.text, _passwordController.text);
  }
}

class _DesktopLoginShell extends StatelessWidget {
  const _DesktopLoginShell({required this.form});

  final Widget form;

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 860),
      child: IntrinsicHeight(
        child: Row(
          children: [
            Expanded(
              flex: 4,
              child: LoginBrandPanel(
                title: L.app.title.tr(),
                subtitle: L.app.subtitle.tr(),
              ),
            ),
            Expanded(flex: 6, child: form),
          ],
        ),
      ),
    );
  }
}
