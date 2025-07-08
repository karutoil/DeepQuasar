const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    category: 'Information',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get links to the bot documentation and support server'),

    async execute(interaction, client) {
        await showGeneralHelp(interaction, client);
    }
};

async function showGeneralHelp(interaction, client) {
    const embed = new EmbedBuilder()
        .setTitle('📖 DeepQuasar Bot Help')
        .setDescription('Explore the bot documentation and join the support server.')
        .setColor(client.config.colors.primary)
        .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
        .setTimestamp()
        .addFields([
            {
                name: '📚 Documentation',
                value: '[View Docs](https://karutoil.github.io/DeepQuasar/) - Learn about all commands and features.',
                inline: true
            },
            {
                name: '🔗 Support Server',
                value: '[Join Support Server](https://discord.karutoil.site) - Get help and updates.',
                inline: true
            }
        ])
        .setFooter({
            text: 'Made with ❤️ by Karutoil',
            iconURL: client.user.displayAvatarURL()
        });

    await interaction.reply({ embeds: [embed] });
}
