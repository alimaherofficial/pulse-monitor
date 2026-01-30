import 'package:test/test.dart';
import 'package:pulse_monitor/core/utils/logger.dart';

void main() {
  group('AppLogger', () {
    late AppLogger logger;

    setUp(() {
      logger = AppLogger();
    });

    test('should create logger instance', () {
      expect(logger, isNotNull);
    });

    test('should log debug message', () {
      expect(() => logger.d('Debug message'), returnsNormally);
    });

    test('should log info message', () {
      expect(() => logger.i('Info message'), returnsNormally);
    });

    test('should log warning message', () {
      expect(() => logger.w('Warning message'), returnsNormally);
    });

    test('should log error message', () {
      expect(() => logger.e('Error message'), returnsNormally);
    });

    test('should log error with exception', () {
      final exception = Exception('Test exception');
      expect(() => logger.e('Error', error: exception), returnsNormally);
    });

    test('should log error with stack trace', () {
      final stackTrace = StackTrace.current;
      expect(() => logger.e('Error', stackTrace: stackTrace), returnsNormally);
    });
  });

  group('LogLevel', () {
    test('should have correct enum values', () {
      expect(LogLevel.values.length, equals(5));
      expect(LogLevel.verbose, isNotNull);
      expect(LogLevel.debug, isNotNull);
      expect(LogLevel.info, isNotNull);
      expect(LogLevel.warning, isNotNull);
      expect(LogLevel.error, isNotNull);
    });
  });
}