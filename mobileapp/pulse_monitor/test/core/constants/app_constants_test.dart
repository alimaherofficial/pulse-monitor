import 'package:test/test.dart';
import 'package:pulse_monitor/core/constants/app_constants.dart';

void main() {
  group('AppConstants', () {
    test('should have correct app name', () {
      expect(AppConstants.appName, equals('Pulse Monitor'));
    });

    test('should have correct BPM range', () {
      expect(AppConstants.minBpm, equals(35));
      expect(AppConstants.maxBpm, equals(220));
    });

    test('should have correct confidence range', () {
      expect(AppConstants.minConfidence, equals(0.0));
      expect(AppConstants.maxConfidence, equals(1.0));
    });

    test('should have correct age range', () {
      expect(AppConstants.minAge, equals(1));
      expect(AppConstants.maxAge, equals(150));
    });

    test('should have correct thresholds', () {
      expect(AppConstants.reliableConfidenceThreshold, equals(0.8));
      expect(AppConstants.adultAgeThreshold, equals(18));
    });

    test('should have correct database settings', () {
      expect(AppConstants.databaseName, equals('pulse_monitor.db'));
      expect(AppConstants.databaseVersion, equals(1));
    });

    test('should have correct timing constants', () {
      expect(AppConstants.defaultSessionTimeout, equals(const Duration(minutes: 5)));
      expect(AppConstants.readingDebounceInterval, equals(const Duration(milliseconds: 200)));
    });
  });
}