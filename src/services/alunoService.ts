import { Like } from 'typeorm';
import { MysqlDataSource } from '../config/database';
import { Admin } from '../entities/adminEntities';
import { Alunos } from '../entities/alunosEntities';
import { TipoConta } from '../entities/baseEntity';
import { Membros } from '../entities/membrosEntities';
import { PDI } from '../entities/pdiEntities';
import { Turma } from '../entities/turmasEntities';
import ErrorHandler from '../errors/errorHandler';
import { criptografarSenha } from '../utils/validarSenhaUtils';

export class AlunoService {
  private adminRepository = MysqlDataSource.getRepository(Admin);
  private membrosRepository = MysqlDataSource.getRepository(Membros);
  private alunoRepository = MysqlDataSource.getRepository(Alunos);
  private turmaRepository = MysqlDataSource.getRepository(Turma);
  private pdiRepository = MysqlDataSource.getRepository(PDI);

  private async iniciarDatabase() {
    if (!MysqlDataSource.isInitialized) {
      await MysqlDataSource.initialize();
    }
  }

  private dadosAluno(aluno: Alunos) {
    return {
      id: aluno.id,
      nomeCompleto: aluno.membro.nomeCompleto,
      email: aluno.membro.email,
      numeroMatricula: aluno.membro.numeroMatricula,
      responsavelCpf: aluno.membro.cpf,
      turma: aluno.turma ? { id: aluno.turma.id } : null
    };
  }

  async criarAluno(
    dadosAluno: {
      email: string;
      nomeCompleto: string;
      numeroMatricula: string;
      turma: number;
      responsavelCpf: string;
    },
    membroIdDoAdmin: number
  ) {
    await this.iniciarDatabase();

    const turma = await this.turmaRepository.findOne({
      where: { id: dadosAluno.turma }
    });

    const adminCriador = await this.adminRepository.findOne({
      where: {
        membro: {
          id: membroIdDoAdmin
        }
      }
    });

    // if (!turma) {
    //   throw ErrorHandler.badRequest(
    //     'Turma não encontrada. Por favor, verifique o ID informado.'
    //   );
    // }

    const senhaCriptografada = await criptografarSenha(
      dadosAluno.numeroMatricula
    );
    const membro = this.membrosRepository.create({
      email: dadosAluno.email,
      nomeCompleto: dadosAluno.nomeCompleto,
      numeroMatricula: dadosAluno.numeroMatricula,
      cpf: dadosAluno.responsavelCpf,
      senha: senhaCriptografada,
      tipoConta: TipoConta.ALUNO,
      adminCriador
    });

    await this.membrosRepository.save(membro);
    const aluno = this.alunoRepository.create({
      membro,
      turma,
      admin: adminCriador
    });

    await this.alunoRepository.save(aluno);
    return { message: 'Aluno cadastrado com sucesso', aluno };
  }

  async listarAlunos(
    paginaNumero: number,
    paginaTamanho: number,
    termoDeBusca: string,
    membroIdDoAdmin: number
  ) {
    const pular = (paginaNumero - 1) * paginaTamanho;

    const [alunos, total] = await this.alunoRepository.findAndCount({
      relations: ['membro'],
      where: {
        admin: {
          membro: {
            id: membroIdDoAdmin
          }
        },
        ...(termoDeBusca && {
          membro: { nomeCompleto: Like(`%${termoDeBusca}%`) }
        })
      },
      order: { membro: { nomeCompleto: 'ASC' } },
      skip: pular,
      take: paginaTamanho
    });

    // if (alunos.length === 0) {
    //   throw ErrorHandler.notFound(
    //     termoDeBusca
    //       ? `Nenhum aluno encontrado com o termo "${termoDeBusca}".`
    //       : 'Nenhum aluno cadastrado no momento.'
    //   );
    // }

    return {
      // message: 'Alunos listados com sucesso.',
      data: alunos.map(this.dadosAluno),
      total
    };
  }

  async listarAlunosPorId(alunoId: number) {
    try {
      const aluno = await this.alunoRepository.findOne({
        where: {
          id: alunoId
        },
        relations: ['turma']
      });

      return {
        id: aluno.id,
        nomeCompleto: aluno.membro.nomeCompleto,
        email: aluno.membro.email,
        numeroMatricula: aluno.membro.numeroMatricula,
        responsavelCpf: aluno.membro.cpf,
        turmaId: aluno.turma ? aluno.turma.id : null
      };
    } catch (error) {
      console.log(error);
    }
  }

  async atualizarAluno(
    alunoId: number,
    dadosAtualizados: {
      email?: string;
      nomeCompleto?: string;
      numeroMatricula?: string;
      responsavelCpf?: string;
      turma?: number;
    }
  ) {
    await this.iniciarDatabase();

    const aluno = await this.alunoRepository.findOne({
      where: { id: alunoId },
      relations: ['membro', 'turma']
    });

    // if (!aluno || aluno.admin.id !== adminId) {
    //   throw ErrorHandler.notFound('Aluno não encontrado ou acesso negado.');
    // }

    if (dadosAtualizados.turma) {
      const turma = await this.turmaRepository.findOneBy({
        id: dadosAtualizados.turma
      });
      if (!turma) {
        throw ErrorHandler.badRequest('A turma informada não existe.');
      }
      aluno.turma = turma;
    }

    Object.assign(aluno.membro, dadosAtualizados);

    aluno.membro.cpf = dadosAtualizados.responsavelCpf || null;

    await this.membrosRepository.save(aluno.membro);
    await this.alunoRepository.save(aluno);

    return { message: 'Aluno atualizado com sucesso' };
  }

  async excluirAluno(alunoId: number) {
    await this.iniciarDatabase();

    const aluno = await this.alunoRepository.findOne({
      where: { id: alunoId },
      relations: ['membro', 'admin', 'admin.membro']
    });

    // if (!aluno || aluno.admin.membro.id !== membroIdAdmin) {
    //   throw ErrorHandler.notFound('Aluno não encontrado ou acesso negado.');
    // }
    await this.pdiRepository
      .createQueryBuilder()
      .delete()
      .where('alunoId = :alunoId', { alunoId })
      .execute();

    await this.membrosRepository.delete(aluno.membro.id);
    await this.alunoRepository.delete(aluno.id);

    return { message: 'Aluno excluído com sucesso' };
  }
}
