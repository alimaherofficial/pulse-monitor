import 'package:test/test.dart';
import 'package:pulse_monitor/core/errors/failures.dart';

void main() {
  group('ServerFailure', () {
    test('should have correct message and code', () {
      const message = 'Server error occurred';
      const code = 500;
      const failure = ServerFailure(message: message, code: code);
      expect(failure.message, equals(message));
      expect(failure.code, equals(code));
    });

    test('should have default code when not provided', () {
      const failure = ServerFailure(message: 'Error');
      expect(failure.code, equals(500));
    });

    test('should support value equality', () {
      const failure1 = ServerFailure(message: 'Error', code: 500);
      const failure2 = ServerFailure(message: 'Error', code: 500);
      const failure3 = ServerFailure(message: 'Different', code: 500);
      expect(failure1, equals(failure2));
      expect(failure1, isNot(equals(failure3)));
    });
  });

  group('CacheFailure', () {
    test('should have correct message', () {
      const message = 'Cache error occurred';
      const failure = CacheFailure(message: message);
      expect(failure.message, equals(message));
    });

    test('should support value equality', () {
      const failure1 = CacheFailure(message: 'Error');
      const failure2 = CacheFailure(message: 'Error');
      const failure3 = CacheFailure(message: 'Different');
      expect(failure1, equals(failure2));
      expect(failure1, isNot(equals(failure3)));
    });
  });

  group('PermissionFailure', () {
    test('should have correct message', () {
      const message = 'Permission denied';
      const failure = PermissionFailure(message: message);
      expect(failure.message, equals(message));
    });

    test('should have default message when not provided', () {
      const failure = PermissionFailure();
      expect(failure.message, equals('Permission denied'));
    });

    test('should support value equality', () {
      const failure1 = PermissionFailure(message: 'Error');
      const failure2 = PermissionFailure(message: 'Error');
      const failure3 = PermissionFailure(message: 'Different');
      expect(failure1, equals(failure2));
      expect(failure1, isNot(equals(failure3)));
    });
  });

  group('InvalidInputFailure', () {
    test('should have correct message', () {
      const message = 'Invalid input provided';
      const failure = InvalidInputFailure(message: message);
      expect(failure.message, equals(message));
    });

    test('should have default message when not provided', () {
      const failure = InvalidInputFailure();
      expect(failure.message, equals('Invalid input'));
    });

    test('should support value equality', () {
      const failure1 = InvalidInputFailure(message: 'Error');
      const failure2 = InvalidInputFailure(message: 'Error');
      const failure3 = InvalidInputFailure(message: 'Different');
      expect(failure1, equals(failure2));
      expect(failure1, isNot(equals(failure3)));
    });
  });

  group('SensorFailure', () {
    test('should have correct message and sensor type', () {
      const message = 'Sensor not available';
      const sensorType = 'camera';
      const failure = SensorFailure(message: message, sensorType: sensorType);
      expect(failure.message, equals(message));
      expect(failure.sensorType, equals(sensorType));
    });

    test('should have default values when not provided', () {
      const failure = SensorFailure();
      expect(failure.message, equals('Sensor error'));
      expect(failure.sensorType, equals('unknown'));
    });

    test('should support value equality', () {
      const failure1 = SensorFailure(message: 'Error', sensorType: 'camera');
      const failure2 = SensorFailure(message: 'Error', sensorType: 'camera');
      const failure3 = SensorFailure(message: 'Error', sensorType: 'hardware');
      expect(failure1, equals(failure2));
      expect(failure1, isNot(equals(failure3)));
    });
  });

  group('ProcessingFailure', () {
    test('should have correct message', () {
      const message = 'Processing failed';
      const failure = ProcessingFailure(message: message);
      expect(failure.message, equals(message));
    });

    test('should support value equality', () {
      const failure1 = ProcessingFailure(message: 'Error');
      const failure2 = ProcessingFailure(message: 'Error');
      expect(failure1, equals(failure2));
    });
  });
}