import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { currentUserId, requireParamId } from "../crm.http";
import type {
  CreateClientBody,
  ListClientsQuery,
  RemoveClientBody,
  UpdateClientBody,
} from "./client.request";
import { clientService, type ClientService } from "./client.service";

export class ClientController extends BaseController {
  constructor(private readonly service: ClientService = clientService) {
    super();
  }

  async list(req: Request, res: Response) {
    const result = await this.service.list(req.query as ListClientsQuery);
    this.sendSuccess(req, res, result, "Clients retrieved");
  }

  async getById(req: Request, res: Response) {
    const client = await this.service.getById(requireParamId(req, "Client"));
    this.sendSuccess(req, res, { client }, "Client retrieved");
  }

  async create(req: Request, res: Response) {
    const client = await this.service.create(
      currentUserId(req),
      req.body as CreateClientBody,
    );
    this.sendSuccess(req, res, { client }, "Client created", 201);
  }

  async update(req: Request, res: Response) {
    const client = await this.service.update(
      currentUserId(req),
      requireParamId(req, "Client"),
      req.body as UpdateClientBody,
    );
    this.sendSuccess(req, res, { client }, "Client updated");
  }

  async remove(req: Request, res: Response) {
    const result = await this.service.remove(
      currentUserId(req),
      req.body as RemoveClientBody,
    );
    this.sendSuccess(req, res, result, "Client removed");
  }
}

export const clientController = new ClientController();
