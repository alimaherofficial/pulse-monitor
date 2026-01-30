import 'package:equatable/equatable.dart';
import 'pulse_reading.dart';

enum SessionStatus {
  pending,
  active,
  completed,
  error,
}

class MonitoringSession extends Equatable {
  final String id;
  final DateTime startTime;
  final DateTime? endTime;
  final SessionStatus status;
  final List<PulseReading> readings;
  final String? userId;
  final String? errorMessage;

  MonitoringSession({
    required this.id,
    required this.startTime,
    this.endTime,
    this.status = SessionStatus.pending,
    List<PulseReading>? readings,
    this.userId,
    this.errorMessage,
  }) : readings = List.unmodifiable(readings ?? []);

  double? get averageBpm {
    if (readings.isEmpty) return null;
    final sum = readings.fold<int>(0, (sum, r) => sum + r.bpm);
    return sum / readings.length;
  }

  int? get minBpm {
    if (readings.isEmpty) return null;
    return readings.map((r) => r.bpm).reduce((a, b) => a < b ? a : b);
  }

  int? get maxBpm {
    if (readings.isEmpty) return null;
    return readings.map((r) => r.bpm).reduce((a, b) => a > b ? a : b);
  }

  int get readingCount => readings.length;

  List<PulseReading> get reliableReadings => 
      readings.where((r) => r.isReliable).toList();

  bool get isActive => status == SessionStatus.active;

  Duration? get duration {
    switch (status) {
      case SessionStatus.pending:
        return null;
      case SessionStatus.active:
        return DateTime.now().difference(startTime);
      case SessionStatus.completed:
      case SessionStatus.error:
        return endTime?.difference(startTime);
    }
  }

  MonitoringSession addReading(PulseReading reading) {
    return copyWith(readings: [...readings, reading]);
  }

  MonitoringSession start() {
    return copyWith(status: SessionStatus.active);
  }

  MonitoringSession complete() {
    return copyWith(
      status: SessionStatus.completed,
      endTime: DateTime.now(),
    );
  }

  MonitoringSession error(String message) {
    return copyWith(
      status: SessionStatus.error,
      endTime: DateTime.now(),
      errorMessage: message,
    );
  }

  MonitoringSession copyWith({
    String? id,
    DateTime? startTime,
    DateTime? endTime,
    SessionStatus? status,
    List<PulseReading>? readings,
    String? userId,
    String? errorMessage,
  }) {
    return MonitoringSession(
      id: id ?? this.id,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      status: status ?? this.status,
      readings: readings ?? this.readings,
      userId: userId ?? this.userId,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  List<Object?> get props => [
        id,
        startTime,
        endTime,
        status,
        readings,
        userId,
        errorMessage,
      ];

  @override
  String toString() {
    return 'MonitoringSession(id: $id, status: $status, readings: $readingCount, duration: $duration)';
  }
}