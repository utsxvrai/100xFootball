const supabase = require('../config/supabase');

async function checkAndResetBoard() {
  try {
    const { data: unclaimedTiles, error: checkError } = await supabase
      .from('footballer_tiles')
      .select('id')
      .is('claimed_by', null)
      .limit(1);

    if (checkError) throw checkError;

    if (!unclaimedTiles || unclaimedTiles.length === 0) {
      console.log('All tiles claimed. Resetting board...');
      
      const { error: resetError } = await supabase
        .from('footballer_tiles')
        .update({
          claimed_by: null,
          claimed_at: null,
          updated_at: new Date().toISOString()
        })
        .neq('tile_index', -1);

      if (resetError) throw resetError;
      console.log('Board reset successful.');
    }
  } catch (error) {
    console.error('Error in checkAndResetBoard:', error.message);
  }
}

module.exports = { checkAndResetBoard };
