import 'package:get_it/get_it.dart';
import '../core/utils/logger.dart';

final GetIt sl = GetIt.instance;

Future<void> configureDependencies() async {
  sl.registerLazySingleton<AppLogger>(() => AppLogger());
}

void resetDependencies() {
  sl.reset(dispose: false);
}