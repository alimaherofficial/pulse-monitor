/// Application-wide constants
class AppConstants {
  AppConstants._();
  
  static const String appName = 'Pulse Monitor';
  static const String appVersion = '1.0.0';
  
  static const int minBpm = 35;
  static const int maxBpm = 220;
  static const double minConfidence = 0.0;
  static const double maxConfidence = 1.0;
  static const double reliableConfidenceThreshold = 0.8;
  
  static const Duration defaultSessionTimeout = Duration(minutes: 5);
  static const int maxReadingsPerSession = 1000;
  
  static const int minAge = 1;
  static const int maxAge = 150;
  static const int adultAgeThreshold = 18;
  
  static const Duration readingDebounceInterval = Duration(milliseconds: 200);
  static const Duration uiUpdateInterval = Duration(milliseconds: 100);
  
  static const String databaseName = 'pulse_monitor.db';
  static const int databaseVersion = 1;
  
  static const int defaultSampleRate = 30;
  static const Duration sensorTimeout = Duration(seconds: 10);
}