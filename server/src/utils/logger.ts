export class Logger {
  private static instance: Logger | null = null;

  private constructor() {}


  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }   
  
  public info(message: string, ...args: any[]) {
    console.log(`[${new Date().toISOString()}] ${message}`, ...args);
  }

  public error(message: string, ...args: any[]) {
    console.error(`[${new Date().toISOString()}] ${message}`, ...args);
  }

  public warn(message: string, ...args: any[]) {
    console.warn(`[${new Date().toISOString()}] ${message}`, ...args);
  }

  public debug(message: string, ...args: any[]) {
    console.debug(`[${new Date().toISOString()}] ${message}`, ...args);
  }
}
