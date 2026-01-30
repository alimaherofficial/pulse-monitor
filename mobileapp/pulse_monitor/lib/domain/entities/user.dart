import 'package:equatable/equatable.dart';
import '../../core/constants/app_constants.dart';

/// Represents a user of the application.
class User extends Equatable {
  final String id;
  final String name;
  final String email;
  final int? age;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.age,
  }) {
    _validate();
  }

  void _validate() {
    // Empty id is allowed - it indicates an anonymous user
    if (id.isNotEmpty) {
      if (name.isEmpty) {
        throw ArgumentError('Name cannot be empty');
      }
      if (email.isEmpty) {
        throw ArgumentError('Email cannot be empty');
      }
    }
    if (age != null) {
      if (age! < AppConstants.minAge || age! > AppConstants.maxAge) {
        throw ArgumentError(
          'Age must be between ${AppConstants.minAge} and ${AppConstants.maxAge}',
        );
      }
    }
  }

  factory User.anonymous() {
    return User(
      id: '',
      name: 'Anonymous',
      email: '',
    );
  }

  bool get isAdult => age != null && age! >= AppConstants.adultAgeThreshold;
  bool get isAnonymous => id.isEmpty;

  User copyWith({
    String? id,
    String? name,
    String? email,
    int? age,
    bool clearAge = false,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      age: clearAge ? null : (age ?? this.age),
    );
  }

  @override
  List<Object?> get props => [id, name, email, age];

  @override
  String toString() {
    return 'User(id: $id, name: $name, email: $email, age: $age)';
  }
}