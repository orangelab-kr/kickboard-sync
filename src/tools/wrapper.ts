import { NextFunction, Request, Response } from 'express';

import InternalError from './error';
import OPCODE from './opcode';
import logger from './logger';

type Callback = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export default function Wrapper(cb: Callback): Callback {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      return await cb(req, res, next);
    } catch (err) {
      if (process.env.NODE_ENV === 'dev') {
        logger.error(err.message);
        logger.error(err.stack);
      }

      let status = 500;
      let message = '알 수 없는 오류가 발생했습니다.';

      if (err instanceof InternalError) {
        status = err.status;
        message = err.message;
      }

      res.status(status).json({
        opcode: OPCODE.ERROR,
        message,
      });
    }
  };
}
