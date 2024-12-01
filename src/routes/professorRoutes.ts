import { Router } from 'express';
import { ProfessorController } from '../controller/professorController';
import { validarEmail } from '../middlewares/validarEmail';
// import { authenticateJWT, hasPermission } from '../middlewares/authMiddleware';

const professorController = new ProfessorController();
const professorRouter = Router();

professorRouter.post(
  '/',
  validarEmail,
  //  authenticateJWT,
  //  hasPermission('MANAGE_USERS'),
  (req, res, next) => professorController.criarProfessor(req, res, next)
);

professorRouter.get(
  '/',
  //  authenticateJWT,
  //  hasPermission('MANAGE_USERS'),
  (req, res, next) => professorController.listarProfessores(req, res, next)
);

professorRouter.get(
  '/:id',
  //  authenticateJWT,
  //  hasPermission('MANAGE_USERS'),
  (req, res, next) => professorController.buscarProfessorPorId(req, res, next)
);

professorRouter.put(
  '/:id',
  validarEmail,
  //  authenticateJWT,
  //  hasPermission('MANAGE_USERS'),
  (req, res, next) => professorController.atualizarProfessor(req, res, next)
);

professorRouter.delete(
  '/:id',
  //  authenticateJWT,
  //  hasPermission('MANAGER_USERS'),
  (req, res, next) => professorController.deletarProfessor(req, res, next)
);

export default professorRouter;
