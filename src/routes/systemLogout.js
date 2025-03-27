const { Router } = require("express");
const router = Router();

router.post('/auth/signout', (req, res) => {
  res.clearCookie('userSession');
  res.status(200).json({ success: true, message: 'Logout realizado com sucesso' });
});

module.exports = router;;;