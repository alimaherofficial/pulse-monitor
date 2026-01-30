import 'package:test/test.dart';
import 'package:pulse_monitor/domain/entities/monitoring_session.dart';
import 'package:pulse_monitor/domain/entities/pulse_reading.dart';

void main() {
  group('MonitoringSession', () {
    late DateTime testStartTime;

    setUp(() {
      testStartTime = DateTime(2024, 1, 15, 10, 0, 0);
    });

    group('creation', () {
      test('should initialize with empty readings', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime);
        expect(session.readings, isEmpty);
        expect(session.status, equals(SessionStatus.pending));
      });

      test('should initialize with provided values', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime, status: SessionStatus.active, userId: 'user-123');
        expect(session.id, equals('session-1'));
        expect(session.startTime, equals(testStartTime));
        expect(session.status, equals(SessionStatus.active));
        expect(session.userId, equals('user-123'));
      });
    });

    group('addReading', () {
      test('should add reading correctly', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime);
        final reading = PulseReading(bpm: 72, timestamp: DateTime.now(), confidence: 0.95, sessionId: 'session-1');
        final updatedSession = session.addReading(reading);
        expect(updatedSession.readings.length, equals(1));
        expect(updatedSession.readings.first, equals(reading));
      });

      test('should not modify original session', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime);
        final reading = PulseReading(bpm: 72, timestamp: DateTime.now(), confidence: 0.95);
        session.addReading(reading);
        expect(session.readings, isEmpty);
      });

      test('should maintain immutability with multiple readings', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime);
        final reading1 = PulseReading(bpm: 72, timestamp: DateTime.now(), confidence: 0.95);
        final reading2 = PulseReading(bpm: 75, timestamp: DateTime.now(), confidence: 0.90);
        final session1 = session.addReading(reading1);
        final session2 = session1.addReading(reading2);
        expect(session.readings, isEmpty);
        expect(session1.readings.length, equals(1));
        expect(session2.readings.length, equals(2));
      });
    });

    group('averageBpm', () {
      test('should calculate average BPM correctly', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime, readings: [
          PulseReading(bpm: 60, timestamp: DateTime.now(), confidence: 0.95),
          PulseReading(bpm: 70, timestamp: DateTime.now(), confidence: 0.95),
          PulseReading(bpm: 80, timestamp: DateTime.now(), confidence: 0.95),
        ]);
        expect(session.averageBpm, equals(70.0));
      });

      test('should return null for empty session', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime);
        expect(session.averageBpm, isNull);
      });

      test('should return single reading for single reading session', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime, readings: [
          PulseReading(bpm: 72, timestamp: DateTime.now(), confidence: 0.95),
        ]);
        expect(session.averageBpm, equals(72.0));
      });
    });

    group('minBpm', () {
      test('should return minimum BPM', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime, readings: [
          PulseReading(bpm: 80, timestamp: DateTime.now(), confidence: 0.95),
          PulseReading(bpm: 60, timestamp: DateTime.now(), confidence: 0.95),
          PulseReading(bpm: 70, timestamp: DateTime.now(), confidence: 0.95),
        ]);
        expect(session.minBpm, equals(60));
      });

      test('should return null for empty session', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime);
        expect(session.minBpm, isNull);
      });
    });

    group('maxBpm', () {
      test('should return maximum BPM', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime, readings: [
          PulseReading(bpm: 60, timestamp: DateTime.now(), confidence: 0.95),
          PulseReading(bpm: 80, timestamp: DateTime.now(), confidence: 0.95),
          PulseReading(bpm: 70, timestamp: DateTime.now(), confidence: 0.95),
        ]);
        expect(session.maxBpm, equals(80));
      });

      test('should return null for empty session', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime);
        expect(session.maxBpm, isNull);
      });
    });

    group('status transitions', () {
      test('should transition from pending to active', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime);
        final activeSession = session.start();
        expect(activeSession.status, equals(SessionStatus.active));
        expect(session.status, equals(SessionStatus.pending));
      });

      test('should transition from active to completed', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime, status: SessionStatus.active);
        final completedSession = session.complete();
        expect(completedSession.status, equals(SessionStatus.completed));
        expect(completedSession.endTime, isNotNull);
      });

      test('should transition to error status', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime, status: SessionStatus.active);
        final errorSession = session.error('Sensor disconnected');
        expect(errorSession.status, equals(SessionStatus.error));
        expect(errorSession.errorMessage, equals('Sensor disconnected'));
      });
    });

    group('duration', () {
      test('should return null for pending session', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime);
        expect(session.duration, isNull);
      });

      test('should calculate duration for completed session', () {
        final endTime = testStartTime.add(const Duration(minutes: 5));
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime, endTime: endTime, status: SessionStatus.completed);
        expect(session.duration, equals(const Duration(minutes: 5)));
      });

      test('should calculate duration from start to now for active session', () {
        final startTime = DateTime.now().subtract(const Duration(minutes: 3));
        final session = MonitoringSession(id: 'session-1', startTime: startTime, status: SessionStatus.active);
        final duration = session.duration;
        expect(duration, isNotNull);
        expect(duration!.inMinutes, closeTo(3, 1));
      });
    });

    group('readingCount', () {
      test('should return count of readings', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime, readings: [
          PulseReading(bpm: 60, timestamp: DateTime.now(), confidence: 0.95),
          PulseReading(bpm: 70, timestamp: DateTime.now(), confidence: 0.95),
          PulseReading(bpm: 80, timestamp: DateTime.now(), confidence: 0.95),
        ]);
        expect(session.readingCount, equals(3));
      });

      test('should return 0 for empty session', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime);
        expect(session.readingCount, equals(0));
      });
    });

    group('reliableReadings', () {
      test('should return only readings with confidence >= 0.8', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime, readings: [
          PulseReading(bpm: 60, timestamp: DateTime.now(), confidence: 0.95),
          PulseReading(bpm: 70, timestamp: DateTime.now(), confidence: 0.75),
          PulseReading(bpm: 80, timestamp: DateTime.now(), confidence: 0.85),
        ]);
        final reliable = session.reliableReadings;
        expect(reliable.length, equals(2));
        expect(reliable.every((r) => r.confidence >= 0.8), isTrue);
      });
    });

    group('isActive', () {
      test('should return true for active status', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime, status: SessionStatus.active);
        expect(session.isActive, isTrue);
      });

      test('should return false for non-active status', () {
        final session = MonitoringSession(id: 'session-1', startTime: testStartTime, status: SessionStatus.completed);
        expect(session.isActive, isFalse);
      });
    });

    group('equality', () {
      test('should return true for identical values', () {
        final session1 = MonitoringSession(id: 'session-1', startTime: testStartTime, status: SessionStatus.active);
        final session2 = MonitoringSession(id: 'session-1', startTime: testStartTime, status: SessionStatus.active);
        expect(session1, equals(session2));
      });

      test('should return false for different id', () {
        final session1 = MonitoringSession(id: 'session-1', startTime: testStartTime);
        final session2 = MonitoringSession(id: 'session-2', startTime: testStartTime);
        expect(session1, isNot(equals(session2)));
      });

      test('should have same hashCode for equal objects', () {
        final session1 = MonitoringSession(id: 'session-1', startTime: testStartTime);
        final session2 = MonitoringSession(id: 'session-1', startTime: testStartTime);
        expect(session1.hashCode, equals(session2.hashCode));
      });
    });

    group('copyWith', () {
      test('should return new session with updated status', () {
        final original = MonitoringSession(id: 'session-1', startTime: testStartTime);
        final copy = original.copyWith(status: SessionStatus.active);
        expect(copy.status, equals(SessionStatus.active));
        expect(copy.id, equals(original.id));
      });

      test('should return new session with updated endTime', () {
        final original = MonitoringSession(id: 'session-1', startTime: testStartTime);
        final endTime = testStartTime.add(const Duration(minutes: 5));
        final copy = original.copyWith(endTime: endTime);
        expect(copy.endTime, equals(endTime));
      });

      test('should return identical copy when no changes', () {
        final original = MonitoringSession(id: 'session-1', startTime: testStartTime);
        final copy = original.copyWith();
        expect(copy, equals(original));
      });
    });
  });
}