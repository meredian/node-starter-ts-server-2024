import { pino } from 'pino';
import type { DestinationStream, LoggerOptions, StreamEntry } from 'pino';
import type { Config } from 'common/config';

export type ChildLoggerContext = pino.Bindings;
export type Logger = pino.Logger;
export type LevelWithSilent = pino.LevelWithSilent;

export function maxLogLevel(
  level1: LevelWithSilent,
  level2: LevelWithSilent,
): LevelWithSilent {
  const num1 = pino.levels.values[level1] ?? Number.MAX_SAFE_INTEGER;
  const num2 = pino.levels.values[level2] ?? Number.MAX_SAFE_INTEGER;

  // greater pino numeric level - less verbose logs
  const result = Math.min(num1, num2);
  return result === Number.MAX_SAFE_INTEGER
    ? 'silent'
    : ((pino.levels.labels[result] ?? 'silent') as LevelWithSilent);
}

export const buildLogger = (config: Config, opt: LoggerOptions = {}) => {
  const logLevel = config.logger.level;
  const fileLogLevel = config.logger.file.level;

  const streams: (DestinationStream | StreamEntry<LevelWithSilent>)[] = [
    {
      stream: pino.destination(),
      level: logLevel,
    },
  ];

  if (fileLogLevel !== 'silent') {
    streams.push({
      stream: pino.destination({
        dest: config.logger.file.name || 'app.log',
      }),
      level: fileLogLevel,
    });
  }

  const formatters: LoggerOptions['formatters'] = {};
  if (config.logger.levelIsStringified) {
    formatters.level = (label: string) => ({
      level: label.toUpperCase(),
    });
  }

  const multistream = pino.multistream(streams);
  return pino(
    {
      formatters,
      onChild: child => child.setBindings({ env: config.env }),
      ...opt,
      level: maxLogLevel(logLevel, fileLogLevel),
    },
    multistream,
  ).child({ env: config.env });
};
