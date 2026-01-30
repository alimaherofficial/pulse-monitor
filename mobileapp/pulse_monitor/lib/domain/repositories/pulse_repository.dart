import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../entities/pulse_reading.dart';

abstract class PulseRepository {
  Future<Either<Failure, PulseReading>> saveReading(PulseReading reading);
  Future<Either<Failure, List<PulseReading>>> getReadings(String sessionId);
  Future<Either<Failure, List<PulseReading>>> getReadingsInRange(
    DateTime start,
    DateTime end,
  );
  Future<Either<Failure, void>> deleteReading(String id);
  Future<Either<Failure, List<PulseReading>>> getRecentReadings({int limit = 50});
}