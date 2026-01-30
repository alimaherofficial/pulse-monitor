import 'package:equatable/equatable.dart';
import '../../core/constants/app_constants.dart';
import '../../core/errors/exceptions.dart';

/// Represents a single pulse reading measurement.
class PulseReading extends Equatable {
  final int bpm;
  final DateTime timestamp;
  final double confidence;
  final String? sessionId;

  PulseReading({
    required this.bpm,
    required this.timestamp,
    required this.confidence,
    this.sessionId,
  }) {
    _validate();
  }

  void _validate() {
    if (bpm < AppConstants.minBpm || bpm > AppConstants.maxBpm) {
      throw InvalidPulseException(
        'BPM must be between ${AppConstants.minBpm} and ${AppConstants.maxBpm}, got $bpm',
      );
    }
    if (confidence < AppConstants.minConfidence || 
        confidence > AppConstants.maxConfidence) {
      throw InvalidPulseException(
        'Confidence must be between ${AppConstants.minConfidence} and ${AppConstants.maxConfidence}, got $confidence',
      );
    }
  }

  int get ageInSeconds {
    final now = DateTime.now();
    if (timestamp.isAfter(now)) return 0;
    return now.difference(timestamp).inSeconds;
  }

  bool get isReliable => 
      confidence >= AppConstants.reliableConfidenceThreshold;

  PulseReading copyWith({
    int? bpm,
    DateTime? timestamp,
    double? confidence,
    String? sessionId,
  }) {
    return PulseReading(
      bpm: bpm ?? this.bpm,
      timestamp: timestamp ?? this.timestamp,
      confidence: confidence ?? this.confidence,
      sessionId: sessionId ?? this.sessionId,
    );
  }

  @override
  List<Object?> get props => [bpm, timestamp, confidence, sessionId];

  @override
  String toString() {
    return 'PulseReading(bpm: $bpm, timestamp: $timestamp, confidence: $confidence, sessionId: $sessionId)';
  }
}