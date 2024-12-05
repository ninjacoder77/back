import { NextFunction, Request, Response } from 'express';
import { AdminService } from '../services/adminService';

export class AdminController {
  private adminService = new AdminService();

  async criarAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const adminLogadoId = req.user?.id;

      if (!adminLogadoId) {
        throw new Error('Admin não autenticado.');
      }

      const novoAdmin = await this.adminService.criarAdmin(req.body);
      res.status(201).json(novoAdmin);
    } catch (error) {
      next(error);
    }
  }

  async listarAdmins(req: Request, res: Response, next: NextFunction) {
    try {
      const adminLogadoId = req.user?.id;

      if (!adminLogadoId) {
        throw new Error('Admin não autenticado.');
      }

      const admins = await this.adminService.listarAdmins(adminLogadoId);
      res.json(admins);
    } catch (error) {
      next(error);
    }
  }

  async buscarAdminPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const adminLogadoId = req.user?.id;

      if (!adminLogadoId) {
        throw new Error('Admin não autenticado.');
      }

      const id = parseInt(req.params.id, 10);
      const admin = await this.adminService.buscarAdminPorId(id, adminLogadoId);
      res.json(admin);
    } catch (error) {
      next(error);
    }
  }

  async atualizarAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const adminLogadoId = req.user?.id;

      if (!adminLogadoId) {
        throw new Error('Admin não autenticado.');
      }

      const id = parseInt(req.params.id, 10);
      const adminAtualizado = await this.adminService.atualizarAdmin(
        id,
        req.body,
        adminLogadoId
      );
      res.json(adminAtualizado);
    } catch (error) {
      next(error);
    }
  }

  async deletarAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const adminLogadoId = req.user?.id;

      if (!adminLogadoId) {
        throw new Error('Admin não autenticado.');
      }

      const id = parseInt(req.params.id, 10);
      await this.adminService.deletarAdmin(id, adminLogadoId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
