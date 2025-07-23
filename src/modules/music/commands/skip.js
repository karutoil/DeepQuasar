const { SlashCommandBuilder, EmbedBuilder, Collection } = require('discord.js');

const cooldowns = new Collection();

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current track')
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Number of tracks to skip (default: 1)')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10)
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

        if (!client.musicPlayerManager.isInSameVoiceChannel(interaction.member, player)) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ You need to be in the same voice channel as the bot to use this command!')
                ],
                ephemeral: true
            });
        }

        if (!player.current) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('❌ There is nothing playing right now!')
                ],
                ephemeral: true
            });
        }

        const amount = interaction.options.getInteger('amount') || 1;
        const now = Date.now();
        const cooldownAmount = amount > 1 ? 15000 : 5000;

        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id);
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return interaction.reply({ content: `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`skip\` command.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, now + cooldownAmount);
        setTimeout(() => cooldowns.delete(interaction.user.id), cooldownAmount);

        const currentTrack = player.current;
        const artist = currentTrack.author || currentTrack.artist || currentTrack.uploader || 'Unknown';

        if (amount === 1) {
            player.skip();
            return interaction.reply({
                embeds: [client.musicPlayerManager.createBeautifulEmbed({
                    title: 'Skipped',
                    description: `⏭️ Skipped: **${currentTrack.title}** by **${artist}**`,
                    color: '#43b581'
                })]
            });
        } else {
            let skippedTracks = 1;
            const skippedList = [currentTrack.title];

            for (let i = 1; i < amount && player.queue.size > 0; i++) {
                const nextTrack = player.queue.tracks[0];
                if (nextTrack) {
                    player.queue.remove(0);
                    skippedList.push(nextTrack.title);
                    skippedTracks++;
                }
            }

            player.skip();

            const embed = client.musicPlayerManager.createBeautifulEmbed({
                title: `Skipped ${skippedTracks} Track${skippedTracks > 1 ? 's' : ''}`,
                description: skippedList.map((title, index) => 
                    `${index + 1}. ${title}`
                ).join('\n'),
                color: '#43b581'
            });

            return interaction.reply({ embeds: [embed] });
        }
    }
};
