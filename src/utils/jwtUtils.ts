import jwt from 'jsonwebtoken';
import 'dotenv/config';

const SECRET_KEY = process.env.JWT_SECRET;

export interface JwtPayload {
  id: number;
  email: string;
  tipoConta: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

// Mapeamento das permissões por tipo de conta
const permissionsByRole = {
  admin: [
    'MANAGE_USERS', // Gerenciar todos os usuários
    'VIEW_MEMBERS', // Visualizar todos os membros
    'VIEW_TURMAS' // Visualizar todas as turmas
  ],
  professor: [
    'VIEW_OWN_TURMAS', // Ver apenas as turmas às quais está associado
    'VIEW_ALUNOS_IN_OWN_TURMAS' // Ver alunos associados apenas às suas turmas
  ],
  turma: [
    'VIEW_ALUNOS_IN_TURMA' // Ver alunos associados à própria turma
  ],
  responsavel: [
    'VIEW_OWN_ALUNOS' // Ver apenas os alunos às quais está associado
  ],
  aluno: [] // Alunos não possuem permissões de visualização
};

/**
 * Gera um token JWT para um usuário com base no payload fornecido.
 * Inclui permissões de acordo com o tipo de conta do usuário.
 *
 * @param payload - Dados do usuário, incluindo `id`, `email` e `tipoConta`.
 * @returns O token JWT gerado como uma string.
 */
export function gerarToken(payload: {
  id: number;
  email: string;
  tipoConta: string;
}): string {
  const permissions = permissionsByRole[payload.tipoConta] || [];
  return jwt.sign({ ...payload, permissions }, SECRET_KEY, { expiresIn: '1d' });
}

/**
 * Verifica a validade de um token JWT.
 * Decodifica o token e retorna o payload se o token for válido.
 *
 * @param token - Token JWT a ser verificado.
 * @returns O payload decodificado do token.
 * @throws {Error} Se o token for inválido ou expirado.
 */
export const verificarToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, SECRET_KEY) as JwtPayload;
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
};
