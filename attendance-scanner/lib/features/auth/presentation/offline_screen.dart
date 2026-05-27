import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/offline_view.dart';
import '../state/auth_controller.dart';

class OfflineScreen extends ConsumerWidget {
  const OfflineScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);

    return Scaffold(
      body: OfflineView(
        isLoading: auth.isLoading,
        onRefresh: () => ref.read(authControllerProvider).bootstrap(),
      ),
    );
  }
}
