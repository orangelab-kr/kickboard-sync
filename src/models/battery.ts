import { Document, Schema, model } from 'mongoose';

export interface BatteryDoc extends Document {
  kickboardId: string;
  batterySN: string;
  totalTrip: number;
  totalTime: number;
  totalCapacity: number;
  cellType: string;
  cells: number[];
  updatedAt: Date;
}

export const BatterySchema = new Schema({
  kickboardId: { type: String, required: true, unique: true },
  batterySN: { type: String, required: false },
  totalTrip: { type: Number, required: false },
  totalTime: { type: Number, required: false },
  totalCapacity: { type: Number, required: false },
  cellType: { type: String, required: false },
  cells: { type: [Number], required: false, default: [] },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
});

export const BatteryModel = model<BatteryDoc>('battery', BatterySchema);
