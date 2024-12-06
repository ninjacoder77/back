import { Request, Response } from 'express';
import { AlunoService } from '../services/alunoService';

export class AlunoController {
  private alunoService = new AlunoService();

  async criarAluno(req: Request, res: Response) {
    try {
      const membroIdDoAdmin = Number(req.user.id);

      const resultado = await this.alunoService.criarAluno(
        req.body,
        membroIdDoAdmin
      );

      return res
        .status(201)
        .json({ message: resultado.message, aluno: resultado.aluno });
    } catch (error) {
      console.log(error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res
          .status(409)
          .json({ message: 'Número de matrícula já está em uso' });
      }
      return res
        .status(error.statusCode || 500)
        .json({ message: 'Erro ao criar aluno' });
    }
  }

  async listarAlunos(req: Request, res: Response) {
    try {
      const { page, perPage } = req.query;
      const searchTerm = req.query.searchTerm ?? '';
      const membroIdDoAdmin = req.user.id;

      const resultado = await this.alunoService.listarAlunos(
        Number(page) || 1,
        Number(perPage) || 10,
        searchTerm as string,
        membroIdDoAdmin
      );

      return res.status(200).json({
        // message: resultado.message,
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

  async listarAlunosPorId(req: Request, res: Response) {
    try {
      const alunoId = parseInt(req.params.id);

      const aluno = await this.alunoService.listarAlunosPorId(alunoId);

      return res.status(200).json({ ...aluno });
    } catch (error) {
      return res.status(error.statusCode || 500).json({ error });
    }
  }

  async atualizarAluno(req: Request, res: Response) {
    try {
      const alunoId = parseInt(req.params.id);

      const resultado = await this.alunoService.atualizarAluno(
        alunoId,
        req.body
      );

      return res.status(200).json({ message: resultado.message });
    } catch (error) {
      console.log(error);

      return res
        .status(error.statusCode || 500)
        .json({ message: 'Erro ao atualizar o Aluno' });
    }
  }

  async excluirAluno(req: Request, res: Response) {
    try {
      const alunoId = parseInt(req.params.id);

      const resultado = await this.alunoService.excluirAluno(alunoId);

      return res.status(200).json({ message: resultado.message });
    } catch (error) {
      return res
        .status(error.statusCode || 500)
        .json({ message: 'Erro ao excluir o Aluno', error });
    }
  }
}
