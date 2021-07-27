import { Document, Schema, model } from 'mongoose';

export declare class PacketStatusGps {
  timestamp: Date;
  latitude: number;
  longitude: number;
  satelliteUsedCount: number;
  isValid: boolean;
  updatedAt: Date;
  speed: number;
}

export interface StatusDoc extends Document {
  kickboardId: string;
  timestamp: Date;
  messageNumber: number;
  gps: PacketStatusGps;
  network: any;
  trip: any;
  power: any;
  isEnabled: boolean;
  isLightsOn: boolean;
  isBuzzerOn: boolean;
  isControllerChecked: boolean;
  isIotChecked: boolean;
  isBatteryChecked: boolean;
  isFallDown: boolean;
  isEBSBrakeOn: boolean;
  isKickstandOn: boolean;
  isLineLocked: boolean;
  isBatteryLocked: boolean;
  reportReason: number[];
  speed: number;
  createdAt: Date;
}

export const StatusGpsSchema = new Schema({
  timestamp: { type: Date, required: false },
  latitude: { type: Number, required: false },
  longitude: { type: Number, required: false },
  updatedAt: { type: Date, required: false },
  satelliteUsedCount: { type: Number, required: false },
  isValid: { type: Boolean, required: false },
  speed: { type: Number, required: false },
});

export const StatusNetworkSchema = new Schema({
  isRoaming: { type: Boolean, required: false },
  signalStrength: { type: Number, required: false },
  mcc: { type: Number, required: false },
  mnc: { type: Number, required: false },
});

export const StatusTripSchema = new Schema({
  time: { type: Number, required: false },
  distance: { type: Number, required: false },
});

export const StatusPowerDetailsSchema = new Schema({
  battery: { type: Number, required: false },
  isCharging: { type: Boolean, required: false },
});

export const StatusPowerSchema = new Schema({
  scooter: { type: StatusPowerDetailsSchema, required: false },
  iot: { type: StatusPowerDetailsSchema, required: false },
  batteryCycle: { type: Number, required: false },
  speedLimit: { type: Number, required: false },
});

export const StatusSchema = new Schema({
  kickboardId: { type: String, index: true, required: true },
  timestamp: { type: String, required: false },
  messageNumber: { type: Number, required: false },
  gps: { type: StatusGpsSchema, required: false },
  network: { type: StatusNetworkSchema, required: false },
  trip: { type: StatusTripSchema, required: false },
  power: { type: StatusPowerSchema, required: false },
  isEnabled: { type: Boolean, required: false },
  isLightsOn: { type: Boolean, required: false },
  isBuzzerOn: { type: Boolean, required: false },
  isControllerChecked: { type: Boolean, required: false },
  isIotChecked: { type: Boolean, required: false },
  isBatteryChecked: { type: Boolean, required: false },
  isFallDown: { type: Boolean, required: false },
  isEBSBrakeOn: { type: Boolean, required: false },
  isKickstandOn: { type: Boolean, required: false },
  isLineLocked: { type: Boolean, required: false },
  isBatteryLocked: { type: Boolean, required: false },
  reportReason: { type: [Number], required: false },
  speed: { type: Number, required: false },
  createdAt: { type: Date, required: true, default: Date.now },
});

StatusSchema.index({ createdAt: -1 });
export const StatusModel = model<StatusDoc>('status', StatusSchema);
