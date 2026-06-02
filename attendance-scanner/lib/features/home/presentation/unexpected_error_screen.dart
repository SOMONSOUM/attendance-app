import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/error_view.dart';

class UnexpectedErrorScreen extends StatelessWidget {
  const UnexpectedErrorScreen({super.key, this.error});

  final Object? error;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ErrorView(
        details: error?.toString(),
        onRefresh: () => context.go('/home'),
      ),
    );
  }
}
