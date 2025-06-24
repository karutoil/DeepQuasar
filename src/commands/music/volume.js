const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Guild = require('../../schemas/Guild');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Set or view the playback volume')
        .addIntegerOption(option =>
            option
                .setName('level')
                .setDescription('Volume level (0-200)')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(200)
        ),

    async execute(interaction, client) {
        const player = client.musicPlayerManager.getPlayer(interaction.guild.id);
        
        if (!player) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ There is nothing playing in this server!')
                ],
                ephemeral: true
            });
        }

        // Check if user is in the same voice channel
        if (!client.musicPlayerManager.isInSameVoiceChannel(interaction.member, player)) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ You need to be in the same voice channel as the bot to use this command!')
                ],
                ephemeral: true
            });
        }

        const volumeLevel = interaction.options.getInteger('level');

        if (volumeLevel === null) {
            // Show current volume
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#0099ff')
                    .setDescription(`🔊 Current volume: **${player.volume}%**`)
                ]
            });
        }

        // Set new volume
        await player.setVolume(volumeLevel);

        // Save volume to DB
        try {
            const guildData = await Guild.findByGuildId(interaction.guild.id);
            if (guildData) {
                guildData.musicSettings.defaultVolume = volumeLevel;
                await guildData.save();
            }
        } catch (err) {
            client.logger?.warn?.(`Failed to save volume for guild ${interaction.guild.id}:`, err);
        }

        const volumeEmoji = volumeLevel === 0 ? '🔇' : 
                           volumeLevel < 30 ? '🔈' : 
                           volumeLevel < 70 ? '🔉' : '🔊';

        return interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor('#00ff00')
                .setDescription(`${volumeEmoji} Volume set to **${volumeLevel}%**`)
            ]
        });
    }
};
