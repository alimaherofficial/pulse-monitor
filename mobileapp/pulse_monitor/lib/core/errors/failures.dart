import 'package:equatable/equatable.dart';

/// Base class for all failures in the app
/// 
/// Failures represent errors at the domain layer level.
/// They are returned from use cases and repositories.
abstract class Failure extends Equatable {
  final String message;
  
  const Failure({required this.message});
  
  @override
  List<Object?> get props => [message];
}

/// Failure representing server errors
class ServerFailure extends Failure {
  final int code;
  
  const ServerFailure({
    required super.message,
    this.code = 500,
  });
  
  @override
  List<Object?> get props => [message, code];
}

/// Failure representing cache/database errors
class CacheFailure extends Failure {
  const CacheFailure({required super.message});
}

/// Failure representing permission errors
class PermissionFailure extends Failure {
  const PermissionFailure({super.message = 'Permission denied'});
}

/// Failure representing invalid input errors
class InvalidInputFailure extends Failure {
  const InvalidInputFailure({super.message = 'Invalid input'});
}

/// Failure representing sensor errors
class SensorFailure extends Failure {
  final String sensorType;
  
  const SensorFailure({
    super.message = 'Sensor error',
    this.sensorType = 'unknown',
  });
  
  @override
  List<Object?> get props => [message, sensorType];
}

/// Failure representing processing errors
class ProcessingFailure extends Failure {
  const ProcessingFailure({required super.message});
}