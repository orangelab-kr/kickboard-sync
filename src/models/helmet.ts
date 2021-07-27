import { Document, model, Schema } from 'mongoose';

export enum HelmetStatus {
  READY = 0, // 사용 가능 상태
  INUSE = 1, // 사용중인 상태 (반납 관련)
  BROKEN = 2, // 망가짐 여부
  LOST = 3, // 헬멧 잃어버림
  DISABLED = 4, // 비활성화됨
}

export interface HelmetDoc extends Document {
  helmetId: string;
  version: number;
  status: HelmetStatus;
  macAddress: string;
  battery: number;
  createdAt: Date;
  updatedAt: Date;
}

export const HelmetSchema = new Schema(
  {
    version: { type: Number, required: true },
    password: { type: String, required: true },
    encryptKey: { type: String, required: true },
    macAddress: { type: String, required: true, index: true },
    battery: { type: Number, required: true },
    status: {
      type: Number,
      enum: HelmetStatus,
      default: HelmetStatus.DISABLED,
      required: true,
    },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: { updatedAt: true } }
);

export const HelmetModel = model<HelmetDoc>('helmet', HelmetSchema);
