import * as util from 'util';
import { format, loggers, transport, transports } from 'winston';
import 'winston-daily-rotate-file';
const configs = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    verbose: 4,
    success: 5,
  },
  colors: {
    info: 'cyan',
    warn: 'yellow',
    error: 'red',
    debug: 'magenta',
    verbose: 'gray',
    success: 'green',
  },
  icons: {
    error: '💥  ',
    warn: '💡   ',
    info: '💻   ',
    debug: '🔨  ',
    verbose: '🔦',
    success: '🎉',
  },
};
export type LoggerOptions = {
  file?: boolean;
};

export class Logger {
  private logger: any;
  private transports: transport[] = [];

  constructor(
    private readonly context: string = Logger.name,
    private options?: LoggerOptions
  ) {
    if (!this.options) this.options = { file: true };
    const logFormat = format.printf((info) => {
      const { timestamp, level, message, stack, ...extra } = info;
      const icon = configs.icons[String(info[Symbol.for('level')])];
      const extraDetails = Object.keys(extra).length ? util.inspect(extra) : '';
      const stackTrace = stack ? `\nStack Trace:\n${stack}` : '';
      return `[${timestamp}] ${icon} ${level} [${this.context}]: ${message}${extraDetails}${stackTrace}`;
    });
    const enumerateErrorFormat = format((info) => {
      if (info instanceof Error) {
        info.message = `[${info.name}] ${info.message}`;
        info.level = info.name;
      }
      return info;
    });

    if (!loggers.has(this.context)) {
      this.initTransports();
      loggers.add(this.context, {
        format: format.combine(
          enumerateErrorFormat(),
          format.splat(),
          format.colorize({
            colors: configs.colors,
            all: true,
          }),
          format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
          }),
          logFormat
        ),
        levels: configs.levels,
        transports: this.transports,
      });
    }

    this.logger = loggers.get(this.context);
  }

  private initTransports() {
    this.transports.push(
      new transports.Console({
        level: 'success',
        handleExceptions: true,
      })
    );
    if (this.options?.file) {
      this.transports.push(
        new transports.DailyRotateFile({
          datePattern: 'YYYY-MM-DD',
          filename: `logs/%DATE%.log`,
          maxFiles: 30,
          handleExceptions: true,
          json: false,
          zippedArchive: true,
        })
      );
    }
  }

  log(msg: any, ...args: any) {
    return this.logger.info(args && msg ? `${msg}` : (args ?? msg));
  }
  debug(msg: any, ...args: any) {
    return this.logger.debug(args && msg ? `${msg}` : (args ?? msg));
  }
  warn(msg: any, ...args: any) {
    return this.logger.warn(args && msg ? `${msg}` : (args ?? msg));
  }
  error(msg: any, ...args: any) {
    return this.logger.error(args && msg ? `${msg} ${args ? '\n' + args : ''} ` : (args ?? msg));
  }
  verbose(msg: any, ...args: any) {
    return this.logger.verbose(args && msg ? `${msg} ${args ? '\n' + args : ''}` : (args ?? msg));
  }
  success?(msg: any, ...args: any) {
    return this.logger.success(args && msg ? `${msg}` : (args ?? msg));
  }
}
