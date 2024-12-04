import {
  AnoLetivo,
  PeriodoLetivo,
  TipoEnsino,
  Turma
} from '../entities/turmasEntities';
// import { Aluno } from '../entities/alunoEntities';
import { Admin } from '../entities/adminEntities';
import { Like } from 'typeorm';
// import { Professor } from '../entities/professorEntities';
import { MysqlDataSource } from '../config/database';
import { ConflictError } from '../errors/ConflitctError';
import ErrorHandler from '../errors/errorHandler';
// import { In } from 'typeorm';

/**
 * Classe para gerenciar operações relacionadas a turmas.
 */
export class TurmasService {
  private turmasRepository = MysqlDataSource.getRepository(Turma);
  private adminRepository = MysqlDataSource.getRepository(Admin);

  private mapTurma(turma: Turma) {
    const { id, turmaApelido, anoLetivo, periodoLetivo } = turma;
    return {
      id,
      turmaApelido,
      anoLetivo,
      periodoLetivo
    };
  }

  // private professorRepository = MysqlDataSource.getRepository(Professor);
  // private alunoRepository = MysqlDataSource.getRepository(Aluno);

  /**
   * Cria uma nova turma com os dados fornecidos.
   *
   * @param dadosTurma - Dados da turma a ser criada. Pode ser um objeto parcial da entidade `Turma`.
   * @returns A turma criada.
   */
  async criar(
    anoLetivo: AnoLetivo,
    periodoLetivo: PeriodoLetivo,
    ensino: TipoEnsino,
    turmaApelido: string,
    adminId: number
  ): Promise<Turma> {
    const turmaExistente = await this.turmasRepository.findOne({
      where: {
        turmaApelido,
        admin: {
          id: adminId
        }
      }
    });

    if (turmaExistente) {
      throw new ConflictError('Turma já foi cadastrada');
    }

    const admin = await this.adminRepository.findOneBy({ id: adminId });

    const novaTurma = this.turmasRepository.create({
      anoLetivo,
      periodoLetivo,
      ensino,
      turmaApelido,
      admin
    });

    return await this.turmasRepository.save(novaTurma);
  }
  /**
   * Lista todas as turmas cadastradas.
   *
   * @returns Uma promessa que resolve para um array de turmas.
   */
  async listar(
    adminId: number,
    paginaNumero: number,
    paginaTamanho: number | null,
    searchTerm: string
  ) {
    const offset = (paginaNumero - 1) * (paginaTamanho ?? 0);
    const [turmas, total] = await this.turmasRepository.findAndCount({
      where: {
        admin: {
          id: adminId
        },
        turmaApelido: Like(`%${searchTerm}%`)
      },
      skip: paginaTamanho ? offset : undefined,
      take: paginaTamanho || undefined
    });
    const turmasMap = turmas.map(this.mapTurma);
    return {
      paginaNumero,
      paginaTamanho,
      total,
      data: turmasMap
    };
  }
  /**
   * Atualiza uma turma existente.
   *
   * @param id - O ID da turma a ser atualizada.
   * @param dadosTurma - Dados atualizados da turma. Pode ser um objeto parcial da entidade `Turma`.
   * @returns A turma atualizada ou null se não encontrada.
   */
  async editar(id: number, dadosTurma: Partial<Turma>) {
    const turmaExistente = await this.turmasRepository.findOneBy({ id });
    Object.assign(turmaExistente, dadosTurma);
    return await this.turmasRepository.save(turmaExistente);
  }

  /**
   * Deleta uma turma pelo ID.
   *
   * @param id - O ID da turma a ser deletada (pode ser string ou number).
   * @returns Uma promessa que resolve para o resultado da operação de exclusão
   */
  async deletar(turmaId: number, adminId: number) {
    const turma = await this.turmasRepository.findOne({
      where: {
        id: turmaId,
        admin: {
          id: adminId
        }
      }
    });

    if (!turma) {
      throw { status: 404, message: 'Turma não encontrada' };
    }

    await this.turmasRepository.remove(turma);
  }

  /**
   * Busca uma turma específica pelo ID.
   *
   * @param id - O ID da turma a ser buscada (pode ser string ou number).
   * @returns A turma encontrada ou null se não encontrada.
   */
  async buscarPorId(id: number): Promise<Turma | null> {
    return await this.turmasRepository.findOneBy({ id });
  }

  async buscarAlunosPorTurma(turmaId: number) {
    const turma = await this.turmasRepository.findOne({
      where: { id: turmaId },
      relations: ['alunos', 'alunos.membro']
    });

    if (!turma) {
      throw ErrorHandler.notFound('Turma não encontrada');
    }

    if (!turma.alunos || turma.alunos.length === 0) {
      return [];
    }

    const listaAlunos = turma.alunos.map((aluno) => ({
      id: aluno.id,
      name: aluno.membro.nomeCompleto,
      performance: aluno.desempenho
    }));

    return listaAlunos;
  }
}
