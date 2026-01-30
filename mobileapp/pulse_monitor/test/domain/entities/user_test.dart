import 'package:test/test.dart';
import 'package:pulse_monitor/domain/entities/user.dart';

void main() {
  group('User', () {
    group('creation', () {
      test('should be created with valid values', () {
        const id = 'user-123';
        const name = 'John Doe';
        const email = 'john@example.com';
        const age = 30;

        final user = User(id: id, name: name, email: email, age: age);

        expect(user.id, equals(id));
        expect(user.name, equals(name));
        expect(user.email, equals(email));
        expect(user.age, equals(age));
      });

      test('should be created without optional age', () {
        final user = User(id: 'user-123', name: 'John Doe', email: 'john@example.com');
        expect(user.age, isNull);
      });

      test('should validate minimum age', () {
        expect(
          () => User(id: 'user-123', name: 'John', email: 'john@example.com', age: 0),
          throwsA(isA<ArgumentError>()),
        );
      });

      test('should validate maximum age', () {
        expect(
          () => User(id: 'user-123', name: 'John', email: 'john@example.com', age: 151),
          throwsA(isA<ArgumentError>()),
        );
      });
    });

    group('equality', () {
      test('should return true for identical values', () {
        final user1 = User(id: 'user-123', name: 'John Doe', email: 'john@example.com', age: 30);
        final user2 = User(id: 'user-123', name: 'John Doe', email: 'john@example.com', age: 30);
        expect(user1, equals(user2));
      });

      test('should return false for different id', () {
        final user1 = User(id: 'user-123', name: 'John Doe', email: 'john@example.com');
        final user2 = User(id: 'user-456', name: 'John Doe', email: 'john@example.com');
        expect(user1, isNot(equals(user2)));
      });

      test('should return false for different name', () {
        final user1 = User(id: 'user-123', name: 'John Doe', email: 'john@example.com');
        final user2 = User(id: 'user-123', name: 'Jane Doe', email: 'john@example.com');
        expect(user1, isNot(equals(user2)));
      });

      test('should return false for different email', () {
        final user1 = User(id: 'user-123', name: 'John Doe', email: 'john@example.com');
        final user2 = User(id: 'user-123', name: 'John Doe', email: 'jane@example.com');
        expect(user1, isNot(equals(user2)));
      });

      test('should return false for different age', () {
        final user1 = User(id: 'user-123', name: 'John Doe', email: 'john@example.com', age: 30);
        final user2 = User(id: 'user-123', name: 'John Doe', email: 'john@example.com', age: 35);
        expect(user1, isNot(equals(user2)));
      });

      test('should have same hashCode for equal objects', () {
        final user1 = User(id: 'user-123', name: 'John Doe', email: 'john@example.com', age: 30);
        final user2 = User(id: 'user-123', name: 'John Doe', email: 'john@example.com', age: 30);
        expect(user1.hashCode, equals(user2.hashCode));
      });
    });

    group('copyWith', () {
      test('should return new user with updated name', () {
        final original = User(id: 'user-123', name: 'John Doe', email: 'john@example.com', age: 30);
        final copy = original.copyWith(name: 'Jane Doe');
        expect(copy.name, equals('Jane Doe'));
        expect(copy.id, equals(original.id));
        expect(copy.email, equals(original.email));
        expect(copy.age, equals(original.age));
      });

      test('should return new user with updated email', () {
        final original = User(id: 'user-123', name: 'John Doe', email: 'john@example.com', age: 30);
        final copy = original.copyWith(email: 'new@example.com');
        expect(copy.email, equals('new@example.com'));
        expect(copy.name, equals(original.name));
      });

      test('should return new user with updated age', () {
        final original = User(id: 'user-123', name: 'John Doe', email: 'john@example.com', age: 30);
        final copy = original.copyWith(age: 35);
        expect(copy.age, equals(35));
        expect(copy.id, equals(original.id));
      });

      test('should allow setting age to null', () {
        final original = User(id: 'user-123', name: 'John Doe', email: 'john@example.com', age: 30);
        final copy = original.copyWith(clearAge: true);
        expect(copy.age, isNull);
      });

      test('should return identical copy when no changes', () {
        final original = User(id: 'user-123', name: 'John Doe', email: 'john@example.com', age: 30);
        final copy = original.copyWith();
        expect(copy, equals(original));
      });
    });

    group('isAdult', () {
      test('should return true when age >= 18', () {
        final user = User(id: 'user-123', name: 'John', email: 'john@example.com', age: 18);
        expect(user.isAdult, isTrue);
      });

      test('should return false when age < 18', () {
        final user = User(id: 'user-123', name: 'John', email: 'john@example.com', age: 17);
        expect(user.isAdult, isFalse);
      });

      test('should return false when age is null', () {
        final user = User(id: 'user-123', name: 'John', email: 'john@example.com');
        expect(user.isAdult, isFalse);
      });
    });

    group('isAnonymous', () {
      test('should return true for empty id', () {
        final user = User(id: '', name: 'Guest', email: '');
        expect(user.isAnonymous, isTrue);
      });

      test('should return false for non-empty id', () {
        final user = User(id: 'user-123', name: 'John', email: 'john@example.com');
        expect(user.isAnonymous, isFalse);
      });
    });

    group('toString', () {
      test('should return string representation', () {
        final user = User(id: 'user-123', name: 'John Doe', email: 'john@example.com', age: 30);
        final str = user.toString();
        expect(str, contains('user-123'));
        expect(str, contains('John Doe'));
        expect(str, contains('john@example.com'));
      });
    });

    group('anonymous factory', () {
      test('should create anonymous user', () {
        final user = User.anonymous();
        expect(user.id, isEmpty);
        expect(user.name, equals('Anonymous'));
        expect(user.email, isEmpty);
        expect(user.age, isNull);
        expect(user.isAnonymous, isTrue);
      });
    });
  });
}
