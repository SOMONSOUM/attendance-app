import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/offline_screen.dart';
import '../features/auth/state/auth_controller.dart';
import '../features/home/data/event_meeting_models.dart';
import '../features/home/presentation/home_screen.dart';
import '../features/home/presentation/unexpected_error_screen.dart';
import '../features/scan/presentation/scan_screen.dart';
import '../features/settings/presentation/settings_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/home',
    refreshListenable: auth,
    errorBuilder: (context, state) => UnexpectedErrorScreen(error: state.error),
    redirect: (context, state) {
      final loggingIn = state.matchedLocation == '/login';
      final offline = state.matchedLocation == '/offline';
      if (!auth.isReady) {
        return null;
      }
      if (auth.hasConnectionError && !offline) {
        return '/offline';
      }
      if (!auth.hasConnectionError && offline) {
        return auth.isAuthenticated ? '/home' : '/login';
      }
      if (!auth.isAuthenticated && !loggingIn && !offline) {
        return '/login';
      }
      if (auth.isAuthenticated && loggingIn) {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/offline',
        builder: (context, state) => const OfflineScreen(),
      ),
      GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
      GoRoute(
        path: '/error',
        builder: (context, state) => UnexpectedErrorScreen(error: state.extra),
      ),
      GoRoute(
        path: '/scan',
        builder: (context, state) => ScanScreen(
          selectedItem: state.extra is EventMeetingItem
              ? state.extra! as EventMeetingItem
              : null,
        ),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
    ],
  );
});
