async function handleAutocomplete(interaction, client) {
    const command = client.commands.get(interaction.commandName);

    if (!command || !command.autocomplete) {
        return;
    }

    try {
        // Check if interaction is still valid
        if (interaction.responded || interaction.deferred) {
            return;
        }

        await command.autocomplete(interaction, client);
    } catch (error) {
        // Suppress 'Unknown interaction' errors (DiscordAPIError[10062])
        if (error?.code === 10062 || (error?.message && error.message.includes('Unknown interaction'))) {
            client.logger.debug(`Suppressed Unknown interaction error in autocomplete for ${interaction.commandName}`);
            return;
        }
        client.logger.error(`Error in autocomplete for ${interaction.commandName}:`, error);
        // Try to respond with empty array if interaction is still valid
        try {
            if (!interaction.responded && !interaction.deferred) {
                await interaction.respond([]);
            }
        } catch (respondError) {
            // Ignore errors - interaction likely expired
            client.logger.debug(`Could not respond to autocomplete for ${interaction.commandName}: ${respondError.message}`);
        }
    }
}

module.exports = { handleAutocomplete };