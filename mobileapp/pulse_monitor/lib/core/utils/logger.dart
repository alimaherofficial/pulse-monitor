import 'package:logger/logger.dart';

/// Log levels for the application
enum LogLevel {
  verbose,
  debug,
  info,
  warning,
  error,
}

/// A wrapper around the logger package providing structured logging
class AppLogger {
  late final Logger _logger;
  
  AppLogger() {
    _logger = Logger(
      printer: PrettyPrinter(
        methodCount: 2,
        errorMethodCount: 8,
        lineLength: 120,
        colors: true,
        printEmojis: true,
        printTime: true,
      ),
    );
  }
  
  void v(String message, [dynamic data]) {
    _logger.t('$message${data != null ? ' | Data: $data' : ''}');
  }
  
  void d(String message, [dynamic data]) {
    _logger.d('$message${data != null ? ' | Data: $data' : ''}');
  }
  
  void i(String message, [dynamic data]) {
    _logger.i('$message${data != null ? ' | Data: $data' : ''}');
  }
  
  void w(String message, {dynamic error, StackTrace? stackTrace}) {
    _logger.w(message, error: error, stackTrace: stackTrace);
  }
  
  void e(String message, {dynamic error, StackTrace? stackTrace}) {
    _logger.e(message, error: error, stackTrace: stackTrace);
  }
  
  void f(String message, {dynamic error, StackTrace? stackTrace}) {
    _logger.f(message, error: error, stackTrace: stackTrace);
  }
}

final appLogger = AppLogger();