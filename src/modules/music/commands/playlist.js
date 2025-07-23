const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../../schemas/User');

module.exports = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Manage your playlists')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new playlist')
                .addStringOption(option =>
                    option.setName('name').setDescription('The name of the playlist').setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View your playlists or a specific playlist')
                .addStringOption(option =>
                    option.setName('name').setDescription('The name of the playlist to view')
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a track to a playlist')
                .addStringOption(option =>
                    option.setName('playlist').setDescription('The name of the playlist').setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('track').setDescription('The track to add (URL or search query)').setRequired(true)
                )
        ),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            const name = interaction.options.getString('name');
            let userData = await User.findByUserId(interaction.user.id);
            if (!userData) {
                userData = await User.createDefault(interaction.user.id, interaction.user.username, interaction.user.discriminator);
            }

            const existingPlaylist = userData.getPlaylist(name);
            if (existingPlaylist) {
                return interaction.reply({ content: `You already have a playlist named \`${name}\`.`, ephemeral: true });
            }

            userData.createPlaylist(name);
            await userData.save();

            return interaction.reply({ content: `Created playlist \`${name}\`.`, ephemeral: true });
        } else if (subcommand === 'view') {
            const name = interaction.options.getString('name');
            const userData = await User.findByUserId(interaction.user.id);

            if (!userData || !userData.playlists || userData.playlists.length === 0) {
                return interaction.reply({ content: 'You have no playlists.', ephemeral: true });
            }

            if (name) {
                const playlist = userData.getPlaylist(name);
                if (!playlist) {
                    return interaction.reply({ content: `Playlist \`${name}\` not found.`, ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setTitle(playlist.name)
                    .setDescription(playlist.description || 'No description');

                if (playlist.tracks.length > 0) {
                    const trackList = playlist.tracks.map((track, index) => {
                        return `${index + 1}. [${track.title}](${track.uri}) - ${track.artist}`;
                    }).join('\n');
                    embed.addFields({ name: 'Tracks', value: trackList });
                } else {
                    embed.addFields({ name: 'Tracks', value: 'This playlist is empty.' });
                }

                return interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                const playlistNames = userData.playlists.map(p => p.name).join('\n');
                const embed = new EmbedBuilder()
                    .setTitle('Your Playlists')
                    .setDescription(playlistNames);
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } else if (subcommand === 'add') {
            const playlistName = interaction.options.getString('playlist');
            const query = interaction.options.getString('track');
            let userData = await User.findByUserId(interaction.user.id);
            if (!userData) {
                return interaction.reply({ content: 'You have no playlists.', ephemeral: true });
            }
            const searchResult = await client.musicPlayerManager.search({ query, requester: interaction.user.id });
            if (!searchResult.tracks.length) {
                return interaction.reply({ content: 'Could not find a track for your query.', ephemeral: true });
            }
            const track = searchResult.tracks[0];
            const added = userData.addTrackToPlaylist(playlistName, track);
            if (!added) {
                return interaction.reply({ content: `Track **${track.title}** is already in playlist \`${playlistName}\`.`, ephemeral: true });
            }
            await userData.save();
            return interaction.reply({ content: `Added **${track.title}** to playlist \`${playlistName}\`.`, ephemeral: true });
        }
    }
};