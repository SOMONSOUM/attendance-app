import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/legacy.dart';

import '../../../core/network/network_error.dart';
import '../data/auth_models.dart';
import '../data/auth_repository.dart';

final authControllerProvider = ChangeNotifierProvider<AuthController>((ref) {
  final controller = AuthController(ref.watch(authRepositoryProvider));
  controller.bootstrap();
  return controller;
});

class AuthController extends ChangeNotifier {
  AuthController(this._repository);

  final AuthRepository _repository;

  bool _isReady = false;
  bool _isLoading = false;
  bool _isDisposed = false;
  bool _connectionError = false;
  AuthUser? _user;
  String? _error;

  bool get isReady => _isReady;
  bool get isLoading => _isLoading;
  bool get hasConnectionError => _connectionError;
  bool get isAuthenticated => _user != null;
  AuthUser? get user => _user;
  String? get error => _error;

  Future<void> bootstrap() async {
    _connectionError = false;
    _error = null;
    try {
      if (await _repository.hasAccessToken()) {
        _user = await _repository.me();
      }
    } catch (error) {
      if (isNetworkConnectionError(error)) {
        _connectionError = true;
      } else {
        await _repository.logout();
        _user = null;
      }
    } finally {
      if (!_isDisposed) {
        _isReady = true;
        notifyListeners();
      }
    }
  }

  Future<void> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    _connectionError = false;
    notifyListeners();

    try {
      final session = await _repository.login(
        LoginRequest(email: email.trim(), password: password),
      );
      if (_isDisposed) return;
      _user = session.user;
      if (!_user!.canScanAttendance) {
        await _repository.logout();
        _user = null;
        throw Exception('This account does not have scanner permission.');
      }
    } catch (error) {
      if (isNetworkConnectionError(error)) {
        _connectionError = true;
      } else {
        _error = error.toString().replaceFirst('Exception: ', '');
      }
    } finally {
      if (!_isDisposed) {
        _isLoading = false;
        notifyListeners();
      }
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    if (_isDisposed) return;
    _user = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _isDisposed = true;
    super.dispose();
  }
}
