import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/check_in_models.dart';
import '../data/check_in_repository.dart';

final scanControllerProvider = NotifierProvider<ScanController, ScanState>(
  ScanController.new,
);

class ScanState {
  const ScanState({
    this.lastPerson,
    this.lastRawCode,
    this.error,
    this.recentPeople = const [],
    this.isCheckingIn = false,
    this.successCount = 0,
  });

  final CheckInPerson? lastPerson;
  final String? lastRawCode;
  final String? error;
  final List<CheckInPerson> recentPeople;
  final bool isCheckingIn;
  final int successCount;

  ScanState copyWith({
    CheckInPerson? lastPerson,
    String? lastRawCode,
    String? error,
    List<CheckInPerson>? recentPeople,
    bool? isCheckingIn,
    int? successCount,
    bool clearPerson = false,
    bool clearError = false,
  }) {
    return ScanState(
      lastPerson: clearPerson ? null : lastPerson ?? this.lastPerson,
      lastRawCode: lastRawCode ?? this.lastRawCode,
      error: clearError ? null : error ?? this.error,
      recentPeople: recentPeople ?? this.recentPeople,
      isCheckingIn: isCheckingIn ?? this.isCheckingIn,
      successCount: successCount ?? this.successCount,
    );
  }
}

class ScanController extends Notifier<ScanState> {
  @override
  ScanState build() => const ScanState();

  Future<void> submit(String rawQrValue) async {
    final trimmed = rawQrValue.trim();
    if (trimmed.isEmpty || state.isCheckingIn) return;

    state = state.copyWith(
      lastRawCode: trimmed,
      isCheckingIn: true,
      clearError: true,
    );

    try {
      final person = await ref.read(checkInRepositoryProvider).checkIn(trimmed);
      state = state.copyWith(
        lastPerson: person,
        recentPeople: [person, ...state.recentPeople].take(5).toList(),
        isCheckingIn: false,
        successCount: state.successCount + 1,
        clearError: true,
      );
    } catch (error) {
      state = state.copyWith(
        isCheckingIn: false,
        error: error.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  void clearResult() {
    state = state.copyWith(clearPerson: true, clearError: true);
  }
}
