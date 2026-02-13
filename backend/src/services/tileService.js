const supabase = require('../config/supabase');
const { calculateCooldownMinutes } = require('../utils/cooldown');
const { checkAndResetBoard } = require('./resetService');
const socketIO = require('../socket');

async function getAllTiles() {
  const { data, error } = await supabase
    .from('footballer_tiles')
    .select('*')
    .order('tile_index', { ascending: true });

  if (error) throw error;
  return data;
}

async function claimTile(userId, tileId) {
  // 1. Fetch user profile
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('username, color, score, cooldown_until')
    .eq('id', userId)
    .single();

  if (userError) throw new Error('User not found or error fetching profile');

  // 2. Cooldown check
  const now = new Date();
  if (user.cooldown_until && new Date(user.cooldown_until) > now) {
    throw new Error('User is currently on cooldown');
  }

  // 3. Fetch tile info
  const { data: tile, error: tileError } = await supabase
    .from('footballer_tiles')
    .select('id, claimed_by, overall, name, tile_index')
    .eq('id', tileId)
    .single();

  if (tileError) throw new Error('Tile not found');
  if (tile.claimed_by) throw new Error('Tile already claimed');

  // 4. Calculate cooldown and score
  const cooldownMinutes = calculateCooldownMinutes(tile.overall);
  const cooldownUntil = new Date(now.getTime() + cooldownMinutes * 60000).toISOString();
  const newScore = (user.score || 0) + tile.overall;

  // 5. Update tile in DB
  const { error: updateTileError } = await supabase
    .from('footballer_tiles')
    .update({
      claimed_by: userId,
      claimed_at: now.toISOString(),
      updated_at: now.toISOString()
    })
    .eq('id', tileId);

  if (updateTileError) throw updateTileError;

  // 6. Update user profile in DB
  const { error: updateProfileError } = await supabase
    .from('profiles')
    .update({
      score: newScore,
      cooldown_until: cooldownUntil
    })
    .eq('id', userId);

  if (updateProfileError) throw updateProfileError;

  // 7. Broadcast the update via Socket.io
  try {
    const io = socketIO.getIO();
    io.emit('tileUpdate', {
      eventType: 'UPDATE',
      new: {
        id: tile.id,
        tile_index: tile.tile_index,
        claimed_by: userId,
        claimed_at: now.toISOString(),
        overall: tile.overall,
        name: tile.name
      },
      profile: {
        id: userId,
        username: user.username,
        color: user.color
      }
    });
  } catch (socketErr) {
    console.error('Socket broadcast failed:', socketErr.message);
  }

  checkAndResetBoard();

  return {
    score: newScore,
    cooldown_until: cooldownUntil
  };
}

module.exports = { getAllTiles, claimTile };

