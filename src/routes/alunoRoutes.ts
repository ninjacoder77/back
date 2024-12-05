import { Router } from 'express';
import { AlunoController } from '../controller/alunoController';
import { authMiddleware } from '../middlewares/authMiddleware';

// TODO: as linhas comentadas ainda serão utilizadas.

const alunoRouter = Router();
const alunoController = new AlunoController();

alunoRouter.post(
  '/',
  // validarEmail,
  authMiddleware,
  //  hasPermission('VIEW_MEMBERS'),
  (req, res) => alunoController.criarAluno(req, res)
);

alunoRouter.get(
  '/',
  authMiddleware,
  //  hasPermission('VIEW_MEMBERS'),
  (req, res) => alunoController.listarAlunos(req, res)
);

alunoRouter.get(
  '/:id',
  authMiddleware,
  //  hasPermission('VIEW_MEMBERS'),
  (req, res) => alunoController.listarAlunosPorId(req, res)
);

alunoRouter.put(
  '/:id',
  // validarEmail,
  authMiddleware,
  //  hasPermission('VIEW_MEMBERS'),
  (req, res) => alunoController.atualizarAluno(req, res)
);

alunoRouter.delete(
  '/:id',
  authMiddleware,
  //  hasPermission('VIEW_MEMBERS'),
  (req, res) => alunoController.excluirAluno(req, res)
);

export default alunoRouter;
