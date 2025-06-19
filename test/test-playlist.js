const { Shoukaku, Connectors } = require('shoukaku');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

async function testPlaylist() {
    console.log('🧪 Testing playlist URL...');
    
    const client = new Client({
        intents: [GatewayIntentBits.Guilds]
    });

    const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), [
        {
            name: 'main-node',
            url: 'localhost:2333',
            auth: 'your_lavalink_password_here'
        }
    ]);

    const testUrl = 'https://open.spotify.com/playlist/37i9dQZEVXbMDoHDwVN2tF';

    try {
        await client.login(process.env.DISCORD_TOKEN);
        
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
            shoukaku.once('ready', () => {
                clearTimeout(timeout);
                resolve();
            });
        });
        
        console.log('✅ Connected to Lavalink');
        
        const node = [...shoukaku.nodes.values()][0];
        const result = await node.rest.resolve(testUrl);
        
        console.log('📊 Playlist Result:');
        console.log('- loadType:', result.loadType);
        console.log('- data type:', typeof result.data);
        console.log('- data is array:', Array.isArray(result.data));
        
        if (result.loadType === 'playlist') {
            console.log('- playlist name:', result.data?.info?.name || 'Unknown');
            console.log('- track count:', result.data?.tracks?.length || 0);
            if (result.data?.tracks?.[0]) {
                console.log('- first track:', result.data.tracks[0].info?.title);
            }
        } else if (result.loadType === 'track') {
            console.log('- single track title:', result.data?.info?.title);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    
    process.exit(0);
}

testPlaylist();
