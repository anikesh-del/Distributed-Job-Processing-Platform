import type { Logger } from '../config/logger';

declare global {
  namespace Express {
    interface Request {
      id: string;
      log: Logger;
    }
  }
}

export {};
