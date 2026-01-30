import 'package:test/test.dart';
import 'package:pulse_monitor/core/utils/logger.dart';
import 'package:pulse_monitor/injection_container.dart';

void main() {
  group('Dependency Injection', () {
    setUp(() async {
      resetDependencies();
      await configureDependencies();
    });

    tearDown(() {
      resetDependencies();
    });

    test('should register AppLogger as singleton', () {
      final logger1 = sl<AppLogger>();
      final logger2 = sl<AppLogger>();
      expect(logger1, isA<AppLogger>());
      expect(logger1, same(logger2));
    });

    test('should reset all dependencies', () {
      expect(sl.isRegistered<AppLogger>(), isTrue);
      resetDependencies();
      expect(sl.isRegistered<AppLogger>(), isFalse);
    });
  });
}