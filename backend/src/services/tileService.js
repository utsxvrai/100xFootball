const supabase = require('../config/supabase');
const { calculateCooldownMinutes } = require('../utils/cooldown');
const { checkAndResetBoard } = require('./resetService');

async function getAllTiles() {
  const { data, error } = await supabase
    .from('footballer_tiles')
    .select('*')
    .order('tile_index', { ascending: true });

  if (error) throw error;
  return data;
}

async function claimTile(userId, tileId) {
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('score, cooldown_until')
    .eq('id', userId)
    .single();

  if (userError) throw new Error('User not found or error fetching profile');

  const now = new Date();
  if (user.cooldown_until && new Date(user.cooldown_until) > now) {
    throw new Error('User is currently on cooldown');
  }

  const { data: tile, error: tileError } = await supabase
    .from('footballer_tiles')
    .select('claimed_by, overall')
    .eq('id', tileId)
    .single();

  if (tileError) throw new Error('Tile not found');
  if (tile.claimed_by) throw new Error('Tile already claimed');

  const cooldownMinutes = calculateCooldownMinutes(tile.overall);
  const cooldownUntil = new Date(now.getTime() + cooldownMinutes * 60000).toISOString();
  const newScore = (user.score || 0) + tile.overall;

  const { error: updateTileError } = await supabase
    .from('footballer_tiles')
    .update({
      claimed_by: userId,
      claimed_at: now.toISOString(),
      updated_at: now.toISOString()
    })
    .eq('id', tileId);

  if (updateTileError) throw updateTileError;

  const { error: updateProfileError } = await supabase
    .from('profiles')
    .update({
      score: newScore,
      cooldown_until: cooldownUntil
    })
    .eq('id', userId);

  if (updateProfileError) throw updateProfileError;

  checkAndResetBoard();

  return {
    score: newScore,
    cooldown_until: cooldownUntil
  };
}

module.exports = { getAllTiles, claimTile };
