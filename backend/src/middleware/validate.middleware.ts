import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';

/** Executa as validações e retorna 400 se houver erros. */
export function validate(chains: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    for (const chain of chains) {
      await chain.run(req);
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array().map((e) => e.msg) });
    }
    next();
  };
}

// ─── Regras de validação reutilizáveis ───────────────────────────────────────

export const loginRules = [
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('Senha obrigatória'),
];

export const registerRules = [
  body('name').trim().notEmpty().withMessage('Nome obrigatório'),
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
];

export const createLeadRules = [
  body('name').trim().notEmpty().withMessage('Nome obrigatório'),
  body('phone')
    .notEmpty().withMessage('Telefone obrigatório')
    .matches(/^\d{10,15}$/).withMessage('Telefone deve conter apenas números (10–15 dígitos)'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido'),
  body('value').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Valor deve ser um número positivo'),
  body('stageId').notEmpty().withMessage('Etapa obrigatória'),
];
