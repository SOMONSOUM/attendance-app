import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_settings_actions.dart';
import '../../../core/widgets/responsive_page.dart';
import '../../../core/widgets/scanner_logo.dart';
import '../../../l10n/app_localizations.dart';
import '../state/auth_controller.dart';

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
    final l10n = AppLocalizations.of(context);
    final auth = ref.watch(authControllerProvider);
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(actions: const [AppSettingsActions(), SizedBox(width: 8)]),
      body: ResponsivePage(
        maxWidth: 1040,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final wide = constraints.maxWidth > 820;
            final form = _LoginForm(
              formKey: _formKey,
              emailController: _emailController,
              passwordController: _passwordController,
              showPassword: _showPassword,
              authError: auth.error,
              isLoading: auth.isLoading,
              onTogglePassword: () =>
                  setState(() => _showPassword = !_showPassword),
              onLogin: _login,
            );

            if (!wide) {
              return ListView(
                children: [
                  _MobileBrandHeader(title: l10n.appTitle),
                  form,
                  const SizedBox(height: 22),
                  Center(
                    child: Text(
                      l10n.appVersion,
                      style: TextStyle(
                        color: colors.onSurface.withValues(alpha: 0.58),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              );
            }

            return Center(
              child: Card(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 820),
                  child: IntrinsicHeight(
                    child: Row(
                      children: [
                        Expanded(
                          flex: 4,
                          child: _BrandPanel(
                            title: l10n.appTitle,
                            subtitle: l10n.appSubtitle,
                          ),
                        ),
                        Expanded(flex: 6, child: form),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
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

class _LoginForm extends StatelessWidget {
  const _LoginForm({
    required this.formKey,
    required this.emailController,
    required this.passwordController,
    required this.showPassword,
    required this.isLoading,
    required this.onTogglePassword,
    required this.onLogin,
    this.authError,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final bool showPassword;
  final bool isLoading;
  final String? authError;
  final VoidCallback onTogglePassword;
  final VoidCallback onLogin;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final colors = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.all(28),
      child: Form(
        key: formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              l10n.loginTitle,
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(
              l10n.loginSubtitle,
              style: TextStyle(color: colors.onSurface.withValues(alpha: 0.68)),
            ),
            const SizedBox(height: 22),
            TextFormField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(
                labelText: l10n.email,
                prefixIcon: const Icon(Icons.mail_outline_rounded),
              ),
              validator: (value) => (value == null || !value.contains('@'))
                  ? l10n.invalidEmail
                  : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: passwordController,
              obscureText: !showPassword,
              decoration: InputDecoration(
                labelText: l10n.password,
                prefixIcon: const Icon(Icons.lock_outline_rounded),
                suffixIcon: IconButton(
                  onPressed: onTogglePassword,
                  icon: Icon(
                    showPassword
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                  ),
                ),
              ),
              validator: (value) => (value == null || value.length < 6)
                  ? l10n.invalidPassword
                  : null,
            ),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () {},
                child: Text(l10n.forgotPassword),
              ),
            ),
            if (authError != null) ...[
              const SizedBox(height: 4),
              Text(authError!, style: TextStyle(color: colors.error)),
            ],
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: isLoading ? null : onLogin,
              icon: isLoading
                  ? const SizedBox.square(
                      dimension: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.login_rounded),
              label: Text(l10n.signIn),
            ),
          ],
        ),
      ),
    );
  }
}

class _MobileBrandHeader extends StatelessWidget {
  const _MobileBrandHeader({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 30),
      decoration: BoxDecoration(
        color: AppTheme.darkPrimary,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          ScannerLogo(
            size: 58,
            backgroundColor: colors.primary.withValues(alpha: 0.18),
            foregroundColor: Colors.white,
          ),
          const SizedBox(height: 16),
          Text(
            title,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            AppLocalizations.of(context).appSubtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xFFD8F4EA)),
          ),
        ],
      ),
    );
  }
}

class _BrandPanel extends StatelessWidget {
  const _BrandPanel({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: AppTheme.darkPrimary,
        borderRadius: const BorderRadius.horizontal(left: Radius.circular(8)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          ScannerLogo(
            size: 58,
            backgroundColor: Colors.white.withValues(alpha: 0.14),
            foregroundColor: Colors.white,
          ),
          const SizedBox(height: 22),
          Text(
            title,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.displaySmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              letterSpacing: 0,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(color: const Color(0xFFD8F4EA)),
          ),
          const SizedBox(height: 28),
          _FeaturePill(icon: Icons.security_rounded, label: 'Secure access'),
          const SizedBox(height: 10),
          _FeaturePill(icon: Icons.sync_rounded, label: 'Realtime sync'),
        ],
      ),
    );
  }
}

class _FeaturePill extends StatelessWidget {
  const _FeaturePill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFFD8F4EA), size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
