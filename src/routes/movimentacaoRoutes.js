const express = require('express');
const router = express.Router();
const { cadastrar, listar } = require('../controllers/movimentacaoControllers');
const auth = require('../middlewares/auth');
router.post('/movimentacoes', auth, cadastrar);
router.get('/movimentacoes', auth, listar);

module.exports = router;
