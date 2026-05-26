import 'dart:io';

import 'package:flutter/foundation.dart';

bool get supportsCameraScanning {
  if (kIsWeb) return true;
  return Platform.isAndroid || Platform.isIOS;
}

bool get prefersHardwareQrReader {
  if (kIsWeb) return false;
  return Platform.isWindows || Platform.isMacOS || Platform.isLinux;
}
