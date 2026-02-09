const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const supabase = require('../config/supabase');

const CSV_PATH = path.join(__dirname, 'players_info.csv');

async function seed() {
    console.log('Starting seeding process from CSV...');

    const players = [];

    try {
        const { data: existingTiles, error: fetchError } = await supabase
            .from('footballer_tiles')
            .select('id')
            .limit(1);

        if (fetchError) throw fetchError;

        if (existingTiles && existingTiles.length > 0) {
            console.log('Tiles already exist. Skipping seeding.');
            return;
        }

        if (!fs.existsSync(CSV_PATH)) {
            throw new Error(`CSV file not found at ${CSV_PATH}`);
        }

        await new Promise((resolve, reject) => {
            fs.createReadStream(CSV_PATH)
                .pipe(csv())
                .on('data', (data) => {
                    if (data.gender === 'M' && players.length < 100) {
                        players.push({
                            tile_index: players.length,
                            name: data.player_name,
                            overall: parseInt(data.ovr),
                            image_url: data.image_url,
                            nationality: data.nationality
                        });
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        if (players.length < 100) {
            console.warn(`Only found ${players.length} male players. Proceeding anyway...`);
        }

        console.log(`Seeding ${players.length} footballers...`);

        const { error: insertError } = await supabase
            .from('footballer_tiles')
            .insert(players);

        if (insertError) throw insertError;

        console.log('Seeding completed successfully!');
    } catch (error) {
        console.error('Error during seeding:', error.message);
        process.exit(1);
    }
}

seed();
