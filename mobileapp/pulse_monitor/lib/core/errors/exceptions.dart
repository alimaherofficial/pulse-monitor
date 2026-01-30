/// Base class for all custom exceptions in the app
abstract class AppException implements Exception {
  final String message;
  
  const AppException(this.message);
  
  @override
  String toString() => '$runtimeType: $message';
}

/// Exception thrown when a server error occurs
class ServerException extends AppException {
  final int? code;
  
  const ServerException(String message, {this.code}) : super(message);
}

/// Exception thrown when a cache operation fails
class CacheException extends AppException {
  const CacheException(String message) : super(message);
}

/// Exception thrown when a permission is denied
class PermissionException extends AppException {
  const PermissionException([String message = 'Permission denied']) : super(message);
}

/// Exception thrown when a sensor operation fails
class SensorException extends AppException {
  final String sensorType;
  
  const SensorException(
    String message, {
    this.sensorType = 'unknown',
  }) : super(message);
}

/// Exception thrown when an invalid pulse reading is encountered
class InvalidPulseException extends AppException {
  const InvalidPulseException([String message = 'Invalid pulse reading']) : super(message);
}

/// Exception thrown when invalid input is provided
class InvalidInputException extends AppException {
  const InvalidInputException(String message) : super(message);
}

/// Exception thrown when processing fails
class ProcessingException extends AppException {
  const ProcessingException(String message) : super(message);
}