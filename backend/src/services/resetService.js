const supabase = require('../config/supabase');

async function checkAndResetBoard(force = false) {
  try {
    let shouldReset = force;

    if (!force) {
      const { data: unclaimedTiles, error: checkError } = await supabase
        .from('footballer_tiles')
        .select('id')
        .is('claimed_by', null)
        .limit(1);

      if (checkError) throw checkError;
      shouldReset = !unclaimedTiles || unclaimedTiles.length === 0;
    }

    if (shouldReset) {
      console.log('Resetting board and randomizing tiles...');
      
      // 1. Fetch all tile IDs
      const { data: allTiles, error: fetchError } = await supabase
        .from('footballer_tiles')
        .select('id');
      
      if (fetchError) throw fetchError;

      // 2. Prepare randomized updates
      const shuffledIndices = Array.from({ length: allTiles.length }, (_, i) => i)
        .sort(() => Math.random() - 0.5);

      // We have to perform individual or batch updates. 
      // Since it's only 100 tiles, we can use Promise.all to update tile_index and reset claims
      const updates = allTiles.map((tile, i) => {
        return supabase
          .from('footballer_tiles')
          .update({
            claimed_by: null,
            claimed_at: null,
            tile_index: shuffledIndices[i],
            updated_at: new Date().toISOString()
          })
          .eq('id', tile.id);
      });

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error).map(r => r.error);

      if (errors.length > 0) {
        console.error('Errors during board reset:', errors);
        throw new Error('Some tiles failed to reset');
      }

      console.log('Board reset and randomization successful.');
    }
  } catch (error) {
    console.error('Error in checkAndResetBoard:', error.message);
  }
}

module.exports = { checkAndResetBoard };
