import { In, Like } from 'typeorm';
import { MysqlDataSource } from '../config/database';
import { Admin } from '../entities/adminEntities';
import { TipoConta } from '../entities/baseEntity';
import { Membros } from '../entities/membrosEntities';
import { Professor } from '../entities/professorEntities';
import { Turma } from '../entities/turmasEntities';
import ErrorHandler from '../errors/errorHandler';
import { criptografarSenha } from '../utils/validarSenhaUtils';

export class ProfessorService {
  private adminRepository = MysqlDataSource.getRepository(Admin);
  private membrosRepository = MysqlDataSource.getRepository(Membros);
  private professorRepository = MysqlDataSource.getRepository(Professor);
  private turmaRepository = MysqlDataSource.getRepository(Turma);

  private async iniciarDatabase() {
    if (!MysqlDataSource.isInitialized) {
      await MysqlDataSource.initialize();
    }
  }

  private dadosProfessor(professor: Professor) {
    return {
      id: professor.id,
      nomeCompleto: professor.membro.nomeCompleto,
      numeroMatricula: professor.membro.numeroMatricula,
      email: professor.membro.email,
      cpf: professor.membro.cpf,
      turmas: professor.turmas.map((turma) => ({
        id: turma.id,
        anoLetivo: turma.anoLetivo,
        periodoLetivo: turma.periodoLetivo,
        ensino: turma.ensino,
        turmaApelido: turma.turmaApelido
      }))
    };
  }

  async criarProfessor(
    dadosProfessor: {
      email: string;
      nomeCompleto: string;
      numeroMatricula: string;
      cpf: string;
      turmas: number[];
    },
    membroAdminId: number
  ) {
    await this.iniciarDatabase();

    try {
      const admin = await this.adminRepository.findOne({
        where: {
          membro: {
            id: membroAdminId
          }
        }
      });

      const turmaArray = await this.turmaRepository.find({
        where: { id: In(dadosProfessor.turmas) }
      });

      if (turmaArray.length !== dadosProfessor.turmas.length) {
        throw ErrorHandler.notFound(
          'Algumas turmas fornecidas não foram encontradas'
        );
      }

      const senhaCriptografada = await criptografarSenha(
        dadosProfessor.numeroMatricula
      );

      const membroCriado = this.membrosRepository.create({
        email: dadosProfessor.email,
        nomeCompleto: dadosProfessor.nomeCompleto,
        numeroMatricula: dadosProfessor.numeroMatricula,
        senha: senhaCriptografada,
        cpf: dadosProfessor.cpf,
        tipoConta: TipoConta.PROFESSOR,
        adminCriador: admin
      });

      const membro = await this.membrosRepository.save(membroCriado);

      const professor = this.professorRepository.create({
        membro,
        turmas: turmaArray,
        admin
      });

      const novoProfessor = await this.professorRepository.save(professor);

      return {
        message: 'Professor cadastrado com sucesso',
        professor: novoProfessor
      };
    } catch (error) {
      console.log(error);

      throw new Error('Erro ao Criar Professor');
    }
  }

  async listarProfessores(
    adminId: number,
    paginaNumero: number,
    paginaTamanho: number | null,
    searchTerm: string
  ) {
    await this.iniciarDatabase();

    const offset = (paginaNumero - 1) * (paginaTamanho ?? 0);
    const [professores, total] = await this.professorRepository.findAndCount({
      where: {
        admin: {
          membro: { id: adminId }
        },
        membro: {
          nomeCompleto: Like(`%${searchTerm}%`)
        }
      },
      skip: paginaTamanho ? offset : undefined,
      take: paginaTamanho || undefined
    });

    return {
      total,
      data: professores.map(this.dadosProfessor)
    };
  }

  async listarProfessoresPagina(
    paginaNumero: number,
    paginaTamanho: number,
    termoDeBusca: string,
    adminLogadoId: number
  ) {
    const pular = (paginaNumero - 1) * paginaTamanho;

    const [professores, total] = await this.professorRepository.findAndCount({
      relations: ['membro'],
      where: {
        membro: {
          adminCriadorId: adminLogadoId,
          ...(termoDeBusca && { nomeCompleto: Like(`%${termoDeBusca}%`) })
        }
      },
      order: { membro: { nomeCompleto: 'ASC' } },
      skip: pular,
      take: paginaTamanho
    });

    if (professores.length === 0) {
      throw ErrorHandler.notFound(
        termoDeBusca
          ? `Nenhum professor encontrado com o termo "${termoDeBusca}".`
          : 'Nenhum professor cadastrado no momento.'
      );
    }

    return {
      message: 'Professores listados com sucesso',
      data: professores.map(this.dadosProfessor),
      total
    };
  }

  async buscarProfessorPorId(id: number, adminLogadoId: number) {
    await this.iniciarDatabase();

    const professor = await this.professorRepository.findOne({
      where: {
        id,
        admin: {
          membro: {
            id: adminLogadoId
          }
        }
      },
      relations: ['membro']
    });

    if (!professor) {
      throw ErrorHandler.notFound('Professor não encontrado');
    }

    return this.dadosProfessor(professor);
  }

  async atualizarProfessor(
    id: number,
    dadosProfessor: Partial<{
      email?: string;
      senha?: string;
      nomeCompleto?: string;
      numeroMatricula?: string;
      cpf?: string;
      turmas?: number[];
    }>,
    membroAdminId: number
  ) {
    await this.iniciarDatabase();

    const professorExistente = await this.professorRepository.findOne({
      where: {
        id,
        admin: {
          membro: {
            id: membroAdminId
          }
        }
      },
      relations: ['membro', 'turmas']
    });

    if (!professorExistente) {
      throw ErrorHandler.notFound('Professor não encontrado');
    }

    const membro = professorExistente.membro;

    const senhaCriptografada = await criptografarSenha(
      dadosProfessor.numeroMatricula ?? membro.numeroMatricula
    );

    Object.assign(membro, {
      email: dadosProfessor.email ?? membro.email,
      nomeCompleto: dadosProfessor.nomeCompleto ?? membro.nomeCompleto,
      cpf: dadosProfessor.cpf ?? membro.cpf,
      numeroMatricula: dadosProfessor.numeroMatricula ?? membro.numeroMatricula,
      senha: dadosProfessor.senha
        ? await criptografarSenha(dadosProfessor.senha)
        : senhaCriptografada
    });

    await this.membrosRepository.save(membro);

    if (dadosProfessor.turmas) {
      const turmasDoProfessor = await this.turmaRepository.findBy({
        id: In(dadosProfessor.turmas)
      });

      if (turmasDoProfessor.length !== dadosProfessor.turmas.length) {
        throw ErrorHandler.notFound(
          'Algumas turmas fornecidas não foram encontradas'
        );
      }

      professorExistente.turmas = turmasDoProfessor;
    }

    await this.professorRepository.save(professorExistente);

    return {
      message: 'Professor atualizado com sucesso',
      professor: professorExistente
    };
  }

  async deletarProfessor(id: number, membroIdDoAdmin: number) {
    await this.iniciarDatabase();

    console.log({
      id,
      membroIdDoAdmin
    });

    const professorExistente = await this.professorRepository.findOne({
      where: {
        id
      },
      relations: ['membro']
    });

    if (!professorExistente) {
      throw ErrorHandler.notFound('Professor não encontrado');
    }

    await this.membrosRepository.delete(professorExistente.membro.id);
    await this.professorRepository.delete(professorExistente.id);

    return { message: 'Professor excluído com sucesso' };
  }

  async buscarProfessorTurmas(professorId: number) {
    const professor = await this.professorRepository.findOne({
      where: {
        membro: {
          id: professorId
        }
      },
      relations: ['turmas']
    });

    if (!professor) {
      throw ErrorHandler.notFound('Professor não encontrado');
    }

    if (!professor.turmas || !Array.isArray(professor.turmas)) {
      return [];
    }

    return professor.turmas.map((turma) => ({
      id: turma.id,
      turmaApelido: turma.turmaApelido
    }));
  }
}
