import { Request, Response } from 'express';
import ErrorHandler from '../errors/errorHandler';
import { ProfessorService } from '../services/professorService';
import { getPaginacao } from '../utils/paginacaoUtils';

export class ProfessorController {
  private professorService = new ProfessorService();

  async criarProfessor(req: Request, res: Response) {
    try {
      const membroAdminId = req.user.id;

      // if (!adminLogadoId) {
      //   throw ErrorHandler.unauthorized('Admin não autenticado.');
      // }

      const resultado = await this.professorService.criarProfessor(
        req.body,
        membroAdminId
      );

      return res.status(201).json(resultado);
    } catch (error) {
      return res
        .status(500)
        .json({ error: error.message, message: 'Erro ao Criar Professor' });
    }
  }

  async listarProfessores(req: Request, res: Response) {
    try {
      const { page, perPage } = getPaginacao(req);
      const searchTerm = req.query.searchTerm
        ? String(req.query.searchTerm)
        : '';
      const adminId = Number(req.user.id);

      const { data, total } = await this.professorService.listarProfessores(
        adminId,
        page,
        perPage,
        searchTerm
      );

      return res.status(200).json({ page, perPage, total, data });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ error: error.message, message: 'Erro ao listar Professores' });
    }
  }

  async listarProfessoresPagina(req: Request, res: Response) {
    try {
      const { page, perPage } = req.query;
      const searchTerm = req.query.searchTerm ?? '';
      const adminLogadoId = req.user?.id;

      const resultado = await this.professorService.listarProfessoresPagina(
        Number(page) || 1,
        Number(perPage) || 10,
        searchTerm as string,
        adminLogadoId
      );

      return res.status(200).json({
        message: resultado.message,
        page,
        perPage,
        total: resultado.total,
        data: resultado.data
      });
    } catch (error) {
      return res
        .status(error.statusCode || 500)
        .json({ message: error.message });
    }
  }

  async buscarProfessorPorId(req: Request, res: Response) {
    try {
      const membroAdminId = req.user.id;

      if (!membroAdminId) {
        throw ErrorHandler.unauthorized('Admin não autenticado.');
      }

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        throw ErrorHandler.badRequest('ID inválido.');
      }

      const professor = await this.professorService.buscarProfessorPorId(
        id,
        membroAdminId
      );

      return res.status(200).json(professor);
    } catch (error) {
      console.log(error);
      return res
        .status(error.statusCode || 500)
        .json({ message: 'Erro aso Buscar Professor' });
    }
  }

  async atualizarProfessor(req: Request, res: Response) {
    try {
      const membroAdminId = Number(req.user.id);

      if (!membroAdminId) {
        throw ErrorHandler.unauthorized('Admin não autenticado.');
      }

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        throw ErrorHandler.badRequest('ID inválido.');
      }

      const resultado = await this.professorService.atualizarProfessor(
        id,
        req.body,
        membroAdminId
      );

      return res.status(200).json(resultado);
    } catch (error) {
      return res
        .status(error.statusCode || 500)
        .json({ message: 'Erro ao atualizar professor', error });
    }
  }

  async deletarProfessor(req: Request, res: Response) {
    try {
      const membroIdDoAdmin = Number(req.user.id);

      if (!membroIdDoAdmin) {
        throw ErrorHandler.unauthorized('Admin não autenticado.');
      }

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        throw ErrorHandler.badRequest('ID inválido.');
      }

      const resultado = await this.professorService.deletarProfessor(
        id,
        membroIdDoAdmin
      );

      res.status(200).json(resultado);
    } catch (error) {
      return res
        .status(500)
        .json({ error: error.message, message: 'Erro ao excluir Professor' });
    }
  }

  async professorTurmas(req: Request, res: Response) {
    try {
      const professorId = req.user?.id;
      if (!professorId) {
        return res.status(400).json({ message: 'Usuário não identificado' });
      }
      const turmas =
        await this.professorService.buscarProfessorTurmas(professorId);
      return res.status(200).json(turmas);
    } catch (error) {
      console.error(error);

      if (error instanceof ErrorHandler) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      return res.status(500).json({
        message: 'Não foi possível carregar as turmas. Erro interno do servidor'
      });
    }
  }
}
