const { Router } = require("express");
const { dbAcconts } = require("../databases/index");
const { body, validationResult } = require('express-validator');

const router = Router();
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Muitas tentativas de registro. Tente novamente após 15 minutos.'
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Muitas tentativas de login. Tente novamente após 15 minutos.'
});

const signupValidation = [
  body('fullName').trim().isLength({ min: 3, max: 100 }).withMessage('Nome deve ter entre 3 e 100 caracteres').escape(),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/).withMessage('Senha deve ter pelo menos 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
];

router.post("/auth/signin", loginLimiter, loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, rememberMe } = req.body;

    const user = await dbAcconts.get(`users.${email.toLowerCase()}`);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou senha inválidos' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Email ou senha inválidos' });
    }

    user.lastLogin = new Date().toISOString();
    await dbAcconts.set(`users.${email.toLowerCase()}`, user);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : null
    };

    res.cookie('userSession', JSON.stringify({ email: user.email, fullName: user.fullName }), cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      data: { fullName: user.fullName, email: user.email }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}
);

router.post("/auth/signup", signupLimiter, signupValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { fullName, email, password } = req.body;

    const existingUser = await dbAcconts.get(`users.${email}`);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Este email já está registrado' });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userData = {
      fullName: fullName.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    };

    await dbAcconts.set(`users.${email}`, userData);

    res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso',
      data: { fullName: userData.fullName, email: userData.email }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}
);

router.get("/auth/check-login", async (req, res) => {
  try {
    const userSession = req.cookies.userSession;

    if (!userSession) {
      return res.status(401).json({
        success: false,
        message: 'Nenhum usuário logado'
      });
    }

    let sessionData;
    try {
      sessionData = JSON.parse(userSession);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Cookie de sessão inválido'
      });
    }

    const { email } = sessionData;

    const user = await dbAcconts.get(`users.${email.toLowerCase()}`);
    if (!user || !user.isActive) {
      res.clearCookie('userSession');
      return res.status(401).json({
        success: false,
        message: 'Sessão inválida ou usuário desativado'
      });
    }

    // Retornar informações do usuário
    res.status(200).json({
      success: true,
      message: 'Usuário autenticado',
      data: {
        fullName: user.fullName,
        email: user.email,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Erro ao verificar login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;