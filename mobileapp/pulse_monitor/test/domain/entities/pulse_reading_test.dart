import 'package:test/test.dart';
import 'package:pulse_monitor/core/errors/exceptions.dart';
import 'package:pulse_monitor/domain/entities/pulse_reading.dart';

void main() {
  group('PulseReading', () {
    late DateTime testTimestamp;

    setUp(() {
      testTimestamp = DateTime(2024, 1, 15, 10, 30, 0);
    });

    group('creation', () {
      test('should be created with valid values', () {
        const bpm = 72;
        const confidence = 0.95;
        const sessionId = 'test-session-id';

        final reading = PulseReading(
          bpm: bpm,
          timestamp: testTimestamp,
          confidence: confidence,
          sessionId: sessionId,
        );

        expect(reading.bpm, equals(bpm));
        expect(reading.timestamp, equals(testTimestamp));
        expect(reading.confidence, equals(confidence));
        expect(reading.sessionId, equals(sessionId));
      });

      test('should validate BPM range - too low', () {
        expect(
          () => PulseReading(bpm: 30, timestamp: testTimestamp, confidence: 0.95),
          throwsA(isA<InvalidPulseException>()),
        );
      });

      test('should validate BPM range - too high', () {
        expect(
          () => PulseReading(bpm: 250, timestamp: testTimestamp, confidence: 0.95),
          throwsA(isA<InvalidPulseException>()),
        );
      });

      test('should validate negative BPM', () {
        expect(
          () => PulseReading(bpm: -10, timestamp: testTimestamp, confidence: 0.95),
          throwsA(isA<InvalidPulseException>()),
        );
      });

      test('should accept minimum valid BPM (35)', () {
        final reading = PulseReading(bpm: 35, timestamp: testTimestamp, confidence: 0.95);
        expect(reading.bpm, equals(35));
      });

      test('should accept maximum valid BPM (220)', () {
        final reading = PulseReading(bpm: 220, timestamp: testTimestamp, confidence: 0.95);
        expect(reading.bpm, equals(220));
      });

      test('should throw when confidence is negative', () {
        expect(
          () => PulseReading(bpm: 72, timestamp: testTimestamp, confidence: -0.1),
          throwsA(isA<InvalidPulseException>()),
        );
      });

      test('should throw when confidence is greater than 1', () {
        expect(
          () => PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 1.1),
          throwsA(isA<InvalidPulseException>()),
        );
      });
    });

    group('equality', () {
      test('should return true for identical values', () {
        final reading1 = PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 0.95, sessionId: 'session-1');
        final reading2 = PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 0.95, sessionId: 'session-1');
        expect(reading1, equals(reading2));
      });

      test('should return false for different BPM', () {
        final reading1 = PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 0.95);
        final reading2 = PulseReading(bpm: 75, timestamp: testTimestamp, confidence: 0.95);
        expect(reading1, isNot(equals(reading2)));
      });

      test('should return false for different timestamps', () {
        final reading1 = PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 0.95);
        final reading2 = PulseReading(bpm: 72, timestamp: testTimestamp.add(const Duration(seconds: 1)), confidence: 0.95);
        expect(reading1, isNot(equals(reading2)));
      });

      test('should return false for different confidence', () {
        final reading1 = PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 0.95);
        final reading2 = PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 0.90);
        expect(reading1, isNot(equals(reading2)));
      });

      test('should return false for different session IDs', () {
        final reading1 = PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 0.95, sessionId: 'session-1');
        final reading2 = PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 0.95, sessionId: 'session-2');
        expect(reading1, isNot(equals(reading2)));
      });

      test('should have same hashCode for equal objects', () {
        final reading1 = PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 0.95, sessionId: 'session-1');
        final reading2 = PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 0.95, sessionId: 'session-1');
        expect(reading1.hashCode, equals(reading2.hashCode));
      });
    });

    group('copyWith', () {
      test('should return new reading with updated BPM', () {
        final original = PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 0.95, sessionId: 'session-1');
        final copy = original.copyWith(bpm: 80);
        expect(copy.bpm, equals(80));
        expect(copy.timestamp, equals(original.timestamp));
        expect(copy.confidence, equals(original.confidence));
        expect(copy.sessionId, equals(original.sessionId));
      });

      test('should return new reading with updated confidence', () {
        final original = PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 0.95, sessionId: 'session-1');
        final copy = original.copyWith(confidence: 0.88);
        expect(copy.confidence, equals(0.88));
        expect(copy.bpm, equals(original.bpm));
      });

      test('should return new reading with updated timestamp', () {
        final original = PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 0.95);
        final newTimestamp = testTimestamp.add(const Duration(seconds: 5));
        final copy = original.copyWith(timestamp: newTimestamp);
        expect(copy.timestamp, equals(newTimestamp));
        expect(copy.bpm, equals(original.bpm));
      });

      test('should return new reading with updated sessionId', () {
        final original = PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 0.95, sessionId: 'session-1');
        final copy = original.copyWith(sessionId: 'session-2');
        expect(copy.sessionId, equals('session-2'));
        expect(copy.bpm, equals(original.bpm));
      });

      test('should return identical copy when no changes', () {
        final original = PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 0.95, sessionId: 'session-1');
        final copy = original.copyWith();
        expect(copy, equals(original));
      });

      test('should not modify original reading', () {
        final original = PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 0.95, sessionId: 'session-1');
        original.copyWith(bpm: 100);
        expect(original.bpm, equals(72));
      });
    });

    group('ageInSeconds', () {
      test('should calculate age of reading correctly', () {
        final fiveSecondsAgo = DateTime.now().subtract(const Duration(seconds: 5));
        final reading = PulseReading(bpm: 72, timestamp: fiveSecondsAgo, confidence: 0.95);
        final age = reading.ageInSeconds;
        expect(age, closeTo(5, 1));
      });

      test('should return zero for future timestamps', () {
        final inFuture = DateTime.now().add(const Duration(seconds: 5));
        final reading = PulseReading(bpm: 72, timestamp: inFuture, confidence: 0.95);
        expect(reading.ageInSeconds, equals(0));
      });
    });

    group('isReliable', () {
      test('should return true when confidence >= 0.8', () {
        final reading = PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 0.85);
        expect(reading.isReliable, isTrue);
      });

      test('should return false when confidence < 0.8', () {
        final reading = PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 0.75);
        expect(reading.isReliable, isFalse);
      });
    });

    group('toString', () {
      test('should return string representation', () {
        final reading = PulseReading(bpm: 72, timestamp: testTimestamp, confidence: 0.95, sessionId: 'session-1');
        final str = reading.toString();
        expect(str, contains('72'));
        expect(str, contains('0.95'));
        expect(str, contains('session-1'));
      });
    });
  });
}