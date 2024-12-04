import { compare } from 'bcrypt';
import { Repository } from 'typeorm';
import { MysqlDataSource } from '../config/database';
import { Admin } from '../entities/adminEntities';
import { Alunos } from '../entities/alunosEntities';
import { TipoConta } from '../entities/baseEntity';
import { Membros } from '../entities/membrosEntities';
import { Professor } from '../entities/professorEntities';
import ErrorHandler from '../errors/errorHandler';
import { gerarToken } from '../utils/jwtUtils';

export class LoginService {
  private membroRepository: Repository<Membros>;
  private adminRepository: Repository<Admin>;
  private alunosRepository: Repository<Alunos>;
  private professorRepository: Repository<Professor>;

  constructor() {
    this.membroRepository = MysqlDataSource.getRepository(Membros);
    this.adminRepository = MysqlDataSource.getRepository(Admin);
    this.alunosRepository = MysqlDataSource.getRepository(Alunos);
    this.professorRepository = MysqlDataSource.getRepository(Professor);
  }

  async login(email: string, senha: string) {
    // Busca o usuário no banco de dados pelo email
    const user = await this.membroRepository.findOne({ where: { email } });

    if (!user) {
      throw ErrorHandler.unauthorized('Seu e-mail ou senha estão incorretos.');
    }

    // Verifica se a senha está correta
    const senhaValida = await compare(senha, user.senha);

    if (!senhaValida) {
      throw ErrorHandler.unauthorized('Seu e-mail ou senha estão incorretos.');
    }

    let id: number;
    switch (user.tipoConta) {
      case TipoConta.ADMIN:
        const admin = await this.adminRepository.findOne({
          where: {
            membro: {
              id: user.id
            }
          }
        });
        id = admin.id;
        break;
      case TipoConta.ALUNO:
        const aluno = await this.alunosRepository.findOne({
          where: {
            membro: {
              id: user.id
            }
          }
        });
        id = aluno.id;
        break;
      case TipoConta.PROFESSOR:
        const professor = await this.professorRepository.findOne({
          where: {
            membro: {
              id: user.id
            }
          }
        });
        id = professor.id;
        break;
      default:
        break;
    }

    // Gera o token JWT com o id, email e tipo de conta do usuário
    const token = gerarToken({
      id,
      email: user.email,
      tipoConta: user.tipoConta
    });

    return { token, tipoConta: user.tipoConta };
  }
}
