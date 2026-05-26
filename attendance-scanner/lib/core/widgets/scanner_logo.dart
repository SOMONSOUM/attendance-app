import 'package:flutter/material.dart';

class ScannerLogo extends StatelessWidget {
  const ScannerLogo({
    required this.size,
    this.backgroundColor,
    this.foregroundColor,
    super.key,
  });

  final double size;
  final Color? backgroundColor;
  final Color? foregroundColor;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final background = backgroundColor ?? colors.primary;
    final foreground = foregroundColor ?? colors.onPrimary;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(8),
      ),
      child: CustomPaint(
        painter: _ScannerLogoPainter(
          foreground: foreground,
          background: background,
        ),
      ),
    );
  }
}

class _ScannerLogoPainter extends CustomPainter {
  const _ScannerLogoPainter({
    required this.foreground,
    required this.background,
  });

  final Color foreground;
  final Color background;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = foreground;
    final unit = size.width / 7;
    final radius = Radius.circular(unit * 0.35);

    void square(int x, int y, [int span = 1]) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(x * unit, y * unit, span * unit, span * unit),
          radius,
        ),
        paint,
      );
    }

    for (final offset in const [Offset(1, 1), Offset(4, 1), Offset(1, 4)]) {
      square(offset.dx.toInt(), offset.dy.toInt(), 2);
      paint.color = background;
      square(offset.dx.toInt() + 1, offset.dy.toInt() + 1);
      paint.color = foreground;
    }
    square(4, 4);
    square(6, 4);
    square(5, 5);
    square(4, 6);
    square(6, 6);
  }

  @override
  bool shouldRepaint(_ScannerLogoPainter oldDelegate) {
    return foreground != oldDelegate.foreground ||
        background != oldDelegate.background;
  }
}
