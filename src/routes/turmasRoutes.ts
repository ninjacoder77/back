import { Router } from 'express';
import { TurmasController } from '../controller/turmasController';
import { authMiddleware } from '../middlewares/authMiddleware';

const turmaController = new TurmasController();
const turmasRouter = Router();

turmasRouter.post(
  '/',
  authMiddleware,
  //  hasPermission('MANAGE_USERS'),
  (req, res) => turmaController.criarTurma(req, res)
);

turmasRouter.get(
  '/',
  authMiddleware,
  //  hasPermission('MANAGE_USERS'),
  (req, res) => turmaController.listarTurmas(req, res)
);

turmasRouter.get(
  '/:id',
  authMiddleware,
  //  hasPermission('MANAGE_USERS'),
  (req, res) => turmaController.buscarTurma(req, res)
);

turmasRouter.put(
  '/:id',
  authMiddleware,
  //  hasPermission('MANAGE_USERS'),
  (req, res) => turmaController.editarTurma(req, res)
);

turmasRouter.delete(
  '/:id',
  authMiddleware,
  //  hasPermission('MANAGE_USERS'),
  (req, res) => turmaController.deletarTurma(req, res)
);

export default turmasRouter;
