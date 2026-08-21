import { HttpError } from "../../../utils/http-error.util";
import { deviceModel, type DeviceModel } from "../../../models/index";
import type { AddDeviceBody, RemoveDeviceBody } from "./device.request";

export class DeviceService {
  constructor(private readonly model: DeviceModel = deviceModel) {}

  async add(userId: string, input: AddDeviceBody) {
    if (input.token) {
      const existing = await this.model.findOne({
        userId,
        token: input.token,
        isActive: 1,
      });
      if (existing) {
        return this.model.update(
          { id: existing.id },
          {
            device: input.device,
            deviceType: input.deviceType,
            os: input.os,
            version: input.version,
            data: input.data,
            isActive: 1,
          },
        );
      }
    }

    return this.model.create({
      userId,
      device: input.device,
      deviceType: input.deviceType,
      os: input.os,
      version: input.version,
      token: input.token,
      data: input.data,
      createdBy: userId,
    });
  }

  async remove(userId: string, input: RemoveDeviceBody) {
    const device = await this.model.readOne({ id: input.id });
    if (!device || device.userId !== userId) {
      throw new HttpError(404, "Device not found");
    }

    await this.model.update({ id: device.id }, { isActive: 0, updatedBy: userId });
    return { id: device.id, removed: true };
  }
}

export const deviceService = new DeviceService();
