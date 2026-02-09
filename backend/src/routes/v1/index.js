const express = require('express');
const router = express.Router();
const { InfoController } = require('../../controllers');
const tileRoutes = require('./tileRoutes');

router.get('/info', InfoController.info);
router.use('/tiles', tileRoutes);

module.exports = router;
