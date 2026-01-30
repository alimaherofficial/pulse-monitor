import 'package:test/test.dart';
import 'package:pulse_monitor/core/errors/exceptions.dart';

void main() {
  group('ServerException', () {
    test('should be created with message', () {
      const message = 'Server error';
      final exception = ServerException(message);
      expect(exception.message, equals(message));
    });

    test('should have toString with message', () {
      const message = 'Server error';
      final exception = ServerException(message);
      expect(exception.toString(), contains(message));
    });
  });

  group('CacheException', () {
    test('should be created with message', () {
      const message = 'Cache error';
      final exception = CacheException(message);
      expect(exception.message, equals(message));
    });

    test('should have toString with message', () {
      const message = 'Cache error';
      final exception = CacheException(message);
      expect(exception.toString(), contains(message));
    });
  });

  group('PermissionException', () {
    test('should be created with message', () {
      const message = 'Permission denied';
      final exception = PermissionException(message);
      expect(exception.message, equals(message));
    });

    test('should have default message', () {
      final exception = PermissionException();
      expect(exception.message, equals('Permission denied'));
    });
  });

  group('SensorException', () {
    test('should be created with message and sensor type', () {
      const message = 'Sensor not available';
      const sensorType = 'camera';
      final exception = SensorException(message, sensorType: sensorType);
      expect(exception.message, equals(message));
      expect(exception.sensorType, equals(sensorType));
    });

    test('should have default sensor type', () {
      final exception = SensorException('Error');
      expect(exception.sensorType, equals('unknown'));
    });
  });

  group('InvalidPulseException', () {
    test('should be created with message', () {
      const message = 'Invalid pulse value';
      final exception = InvalidPulseException(message);
      expect(exception.message, equals(message));
    });

    test('should have default message', () {
      final exception = InvalidPulseException();
      expect(exception.message, equals('Invalid pulse reading'));
    });
  });

  group('InvalidInputException', () {
    test('should be created with message', () {
      const message = 'Invalid input';
      final exception = InvalidInputException(message);
      expect(exception.message, equals(message));
    });
  });
}