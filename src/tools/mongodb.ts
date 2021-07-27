import { logger } from '.';
import mongoose from 'mongoose';
import { readFileSync } from 'fs';

export class MongoDB {
  public static async init(): Promise<void> {
    const DATABASE_URL =
      process.env.DATABASE_URL || 'mongodb://localhost:27017/kickboard';
    mongoose.Promise = global.Promise;
    await mongoose.connect(DATABASE_URL, {
      useCreateIndex: true,
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    logger.info('[몽고디비] 데이터베이스 준비가 완료되었습니다.');
  }
}
