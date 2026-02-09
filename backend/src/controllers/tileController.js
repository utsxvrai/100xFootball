const tileService = require('../services/tileService');

async function getAllTiles(req, res) {
  try {
    const tiles = await tileService.getAllTiles();
    res.status(200).json(tiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function claimTile(req, res) {
  const { tileId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required in request body' });
  }

  try {
    const result = await tileService.claimTile(userId, tileId);
    res.status(200).json(result);
  } catch (error) {
    const clientErrors = [
      'User is currently on cooldown',
      'Tile already claimed',
      'User not found or error fetching profile',
      'Tile not found'
    ];

    if (clientErrors.includes(error.message)) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
}

module.exports = { getAllTiles, claimTile };
