import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

class LoginForm extends StatelessWidget {
  const LoginForm({
    super.key,
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
    final colors = Theme.of(context).colorScheme;
    final compact = MediaQuery.of(context).size.width < 420;

    return Padding(
      padding: EdgeInsets.all(compact ? 18 : 28),
      child: Form(
        key: formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'loginTitle'.tr(),
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
            ),
            const Gap(6),
            Text(
              'loginSubtitle'.tr(),
              style: TextStyle(color: colors.onSurface.withValues(alpha: 0.72)),
            ),
            const Gap(22),
            TextFormField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(
                labelText: 'email'.tr(),
                prefixIcon: const Icon(LucideIcons.mail),
              ),
              validator: (value) => (value == null || !value.contains('@'))
                  ? 'invalidEmail'.tr()
                  : null,
            ),
            const Gap(14),
            TextFormField(
              controller: passwordController,
              obscureText: !showPassword,
              decoration: InputDecoration(
                labelText: 'password'.tr(),
                prefixIcon: const Icon(LucideIcons.lockKeyhole),
                suffixIcon: IconButton(
                  onPressed: onTogglePassword,
                  icon: Icon(
                    showPassword ? LucideIcons.eyeOff : LucideIcons.eye,
                  ),
                ),
              ),
              validator: (value) => (value == null || value.length < 6)
                  ? 'invalidPassword'.tr()
                  : null,
            ),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () {},
                child: Text('forgotPassword'.tr()),
              ),
            ),
            if (authError != null) ...[
              const Gap(4),
              Text(authError!, style: TextStyle(color: colors.error)),
            ],
            const Gap(16),
            ElevatedButton.icon(
              onPressed: isLoading ? null : onLogin,
              icon: isLoading
                  ? const SizedBox.square(
                      dimension: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(LucideIcons.logIn),
              label: Text('signIn'.tr()),
            ),
          ],
        ),
      ),
    );
  }
}
