import 'package:dartz/dartz.dart';
import 'package:test/test.dart';
import 'package:pulse_monitor/core/errors/failures.dart';
import 'package:pulse_monitor/core/usecases/usecase.dart';

void main() {
  group('UseCase', () {
    late TestUseCase useCase;

    setUp(() {
      useCase = TestUseCase();
    });

    test('should return Right with success value', () async {
      const params = TestParams(value: 'success');
      final result = await useCase(params);
      expect(result, isA<Right<Failure, String>>());
      expect(result.getOrElse(() => ''), equals('success'));
    });

    test('should return Left with failure when params indicate error', () async {
      const params = TestParams(value: 'error');
      final result = await useCase(params);
      expect(result, isA<Left<Failure, String>>());
      result.fold(
        (failure) => expect(failure, isA<InvalidInputFailure>()),
        (_) => fail('Should have returned Left'),
      );
    });
  });

  group('NoParams', () {
    test('should be a singleton-like empty class', () {
      const params1 = NoParams();
      const params2 = NoParams();
      expect(params1, equals(params2));
      expect(params1.props, isEmpty);
    });
  });
}

class TestParams {
  final String value;
  const TestParams({required this.value});
}

class TestUseCase implements UseCase<String, TestParams> {
  @override
  Future<Either<Failure, String>> call(TestParams params) async {
    if (params.value == 'error') {
      return const Left(InvalidInputFailure(message: 'Test error'));
    }
    return Right(params.value);
  }
}