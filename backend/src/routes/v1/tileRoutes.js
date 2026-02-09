const express = require('express');
const router = express.Router();
const { TileController } = require('../../controllers');

router.get('/', TileController.getAllTiles);
router.post('/:tileId/claim', TileController.claimTile);

module.exports = router;
