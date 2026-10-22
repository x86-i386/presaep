const express = require('express');
const router = express.Router();
const { cadastrar, listar, deletar } = require('../controllers/produtosController');
const auth = require('../middlewares/auth');
const permitir = require('../middlewares/checkRole');
router.post('/produtos', auth, cadastrar);
router.get('/produtos', auth, listar);
router.delete('/produtos/:id', auth, permitir('administrador'), deletar);
module.exports = router;