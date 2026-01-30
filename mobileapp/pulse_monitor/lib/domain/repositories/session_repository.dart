import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../entities/monitoring_session.dart';

abstract class SessionRepository {
  Future<Either<Failure, MonitoringSession>> createSession({String? userId});
  Future<Either<Failure, MonitoringSession>> getSession(String sessionId);
  Future<Either<Failure, MonitoringSession>> updateSession(MonitoringSession session);
  Future<Either<Failure, void>> deleteSession(String sessionId);
  Future<Either<Failure, List<MonitoringSession>>> getAllSessions({
    int limit = 100,
    bool descending = true,
  });
  Future<Either<Failure, List<MonitoringSession>>> getSessionsInRange(
    DateTime start,
    DateTime end,
  );
  Future<Either<Failure, MonitoringSession?>> getActiveSession();
}