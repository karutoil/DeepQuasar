/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { verifyDiscordToken, getUserGuilds, generateToken, verifyToken, validateGuildAccess } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Authenticate user with Discord OAuth2 access token
 */
router.post('/login', async (req, res) => {
    try {
        const { accessToken, guildId } = req.body;
        
        if (!accessToken || !guildId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'accessToken and guildId are required'
            });
        }
        
        // Verify Discord access token
        const tokenValidation = await verifyDiscordToken(accessToken);
        if (!tokenValidation.success) {
            return res.status(401).json({
                error: 'Authentication Failed',
                message: tokenValidation.error || 'Invalid Discord access token'
            });
        }
        
        const discordUser = tokenValidation.user;
        
        // Get user's guilds to verify they have access to the requested guild
        const userGuildsResponse = await getUserGuilds(accessToken);
        if (!userGuildsResponse.success) {
            return res.status(401).json({
                error: 'Authentication Failed',
                message: 'Unable to fetch user guilds from Discord'
            });
        }
        
        // Check if user has admin/manage permissions in the requested guild
        const userGuild = userGuildsResponse.guilds.find(g => g.id === guildId);
        if (!userGuild) {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'You are not a member of the specified guild'
            });
        }
        
        // Check if user has admin or manage guild permissions (0x8 = Admin, 0x20 = Manage Guild)
        const hasRequiredPerms = (parseInt(userGuild.permissions) & (0x8 | 0x20)) !== 0;
        if (!hasRequiredPerms) {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'You need Administrator or Manage Guild permissions'
            });
        }
        
        // Validate that the bot is in the guild
        const guild = req.client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({
                error: 'Guild Not Found',
                message: 'Bot is not a member of the specified guild'
            });
        }
        
        // Get member object for additional details
        let member = guild.members.cache.get(discordUser.id);
        if (!member) {
            // Try to fetch the member from the API in case the cache is stale
            try {
                member = await guild.members.fetch(discordUser.id);
            } catch (fetchErr) {
                req.client.logger?.warn?.('Failed to fetch member from Discord API:', fetchErr);
            }
        }
        if (!member) {
            return res.status(403).json({
                error: 'Access Denied',
                message: 'User is not a member of the specified guild (not found in cache or via fetch)'
            });
        }
        
        // Generate JWT token
        const token = generateToken(discordUser.id, guildId);
        
        res.json({
            success: true,
            token,
            user: {
                id: discordUser.id,
                username: discordUser.username,
                globalName: discordUser.global_name,
                displayName: member.displayName,
                avatar: discordUser.avatar ? 
                    `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` :
                    `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.discriminator) % 5}.png`,
                permissions: {
                    administrator: member.permissions.has('Administrator'),
                    manageGuild: member.permissions.has('ManageGuild'),
                    moderateMembers: member.permissions.has('ModerateMembers'),
                    manageMessages: member.permissions.has('ManageMessages')
                }
            },
            guild: {
                id: guild.id,
                name: guild.name,
                icon: guild.iconURL(),
                memberCount: guild.memberCount
            }
        });
        
    } catch (error) {
        req.client.logger.error('Authentication error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Authentication failed'
        });
    }
});

/**
 * POST /api/auth/verify
 * Verify if current token is valid
 */
router.post('/verify', verifyToken, validateGuildAccess, (req, res) => {
    res.json({
        success: true,
        valid: true,
        user: {
            id: req.member.user.id,
            username: req.member.user.username,
            displayName: req.member.displayName,
            avatar: req.member.user.displayAvatarURL(),
            permissions: {
                administrator: req.member.permissions.has('Administrator'),
                manageGuild: req.member.permissions.has('ManageGuild'),
                moderateMembers: req.member.permissions.has('ModerateMembers'),
                manageMessages: req.member.permissions.has('ManageMessages')
            }
        },
        guild: {
            id: req.guild.id,
            name: req.guild.name,
            icon: req.guild.iconURL(),
            memberCount: req.guild.memberCount
        }
    });
});

/**
 * GET /api/auth/guilds
 * Get list of guilds where user has admin permissions and bot is present
 * Requires Discord access token
 */
router.post('/guilds', async (req, res) => {
    try {
        const { accessToken } = req.body;
        
        if (!accessToken) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Discord accessToken is required'
            });
        }
        
        // Verify Discord access token
        const tokenValidation = await verifyDiscordToken(accessToken);
        if (!tokenValidation.success) {
            return res.status(401).json({
                error: 'Authentication Failed',
                message: tokenValidation.error || 'Invalid Discord access token'
            });
        }
        
        // Get user's guilds from Discord
        const userGuildsResponse = await getUserGuilds(accessToken);
        if (!userGuildsResponse.success) {
            return res.status(401).json({
                error: 'Authentication Failed',
                message: 'Unable to fetch user guilds from Discord'
            });
        }
        
        const managedGuilds = [];
        
        // Filter guilds where user has admin/manage permissions and bot is present
        for (const userGuild of userGuildsResponse.guilds) {
            // Check if user has admin or manage guild permissions
            const hasRequiredPerms = (parseInt(userGuild.permissions) & (0x8 | 0x20)) !== 0;
            if (!hasRequiredPerms) continue;
            
            // Check if bot is in this guild
            const botGuild = req.client.guilds.cache.get(userGuild.id);
            if (!botGuild) continue;
            
            managedGuilds.push({
                id: botGuild.id,
                name: botGuild.name,
                icon: botGuild.iconURL(),
                memberCount: botGuild.memberCount,
                permissions: {
                    administrator: (parseInt(userGuild.permissions) & 0x8) !== 0,
                    manageGuild: (parseInt(userGuild.permissions) & 0x20) !== 0
                }
            });
        }
        
        res.json({
            success: true,
            guilds: managedGuilds
        });
        
    } catch (error) {
        req.client.logger.error('Guild list error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch user guilds'
        });
    }
});

/**
 * POST /api/auth/refresh
 * Refresh an existing token
 */
router.post('/refresh', verifyToken, (req, res) => {
    try {
        // Generate new token with same user/guild
        const newToken = generateToken(req.auth.userId, req.auth.guildId);
        
        res.json({
            success: true,
            token: newToken
        });
        
    } catch (error) {
        req.client.logger.error('Token refresh error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to refresh token'
        });
    }
});

/**
 * GET /api/auth/dev-helper
 * Returns the Discord OAuth2 callback URL and (optionally) the access token if provided.
 * This is for development/testing purposes only.
 */
const axios = require('axios');

router.get('/dev-helper', async (req, res) => {
    // You may want to set this from config/env in production!
    // Use the same redirect_uri as you registered in your Discord application settings.
    // If you set REDIRECT_URI, it will be used. Otherwise, fallback to PUBLIC_URL or http://localhost:3000.
    const redirectUri =
        process.env.REDIRECT_URI ||
        ((process.env.PUBLIC_URL || 'http://localhost:3000') + '/api/auth/callback');
    const callbackUrl = redirectUri;

    // Try to get access token from query or header for convenience
    let accessToken = req.query.accessToken || req.headers['authorization']?.replace(/^Bearer /, '');

    // If a code is provided, try to exchange it for an access token
    if (req.query.code) {
        const clientId = process.env.DISCORD_CLIENT_ID;
        const clientSecret = process.env.DISCORD_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return res.status(500).json({
                error: "Config Error",
                message: "DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET must be set in environment"
            });
        }

        try {
            const params = new URLSearchParams();
            params.append('grant_type', 'authorization_code');
            params.append('code', req.query.code);
            params.append('redirect_uri', redirectUri);
            // Discord does not require scope for token exchange, but if you do, use the same as in the original auth request
            // params.append('scope', 'identify guilds');

            const tokenRes = await axios.post('https://discord.com/api/oauth2/token', params.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                auth: {
                    username: clientId,
                    password: clientSecret
                }
            });

            accessToken = tokenRes.data.access_token;
        } catch (err) {
            return res.status(400).json({
                error: "Authentication Error",
                message: "Invalid code or failed to exchange code for token",
                details: err.response?.data || err.message
            });
        }
    }

    res.json({
        discord_oauth_callback_url: callbackUrl,
        info: "Set this as a Redirect URI in your Discord application settings. It must match exactly in your Discord developer portal and in the OAuth2 code exchange.",
        effective_redirect_uri: redirectUri,
        ...(accessToken ? { accessToken } : {}),
        note: "To get your access token, complete the OAuth2 flow. This endpoint is for development/testing only.",
        full_redirect_uri_for_discord: redirectUri
    });
});

/**
 * GET /api/auth/callback
 * Minimal endpoint to satisfy Discord OAuth2 redirect_uri requirement.
 * You can customize this to redirect to your frontend or show a message.
 */
router.get('/callback', async (req, res) => {
    const code = req.query.code;
    const error = req.query.error;
    const redirectUri =
        process.env.REDIRECT_URI ||
        ((process.env.PUBLIC_URL || 'http://localhost:3000') + '/api/auth/callback');
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;

    if (error) {
        return res.send(`
            <html>
                <head><title>OAuth2 Callback</title></head>
                <body>
                    <h2>OAuth2 Error</h2>
                    <pre>${error}</pre>
                </body>
            </html>
        `);
    }

    if (!code) {
        return res.send(`
            <html>
                <head><title>OAuth2 Callback</title></head>
                <body>
                    <h2>No code provided.</h2>
                </body>
            </html>
        `);
    }

    if (!clientId || !clientSecret) {
        return res.send(`
            <html>
                <head><title>OAuth2 Callback</title></head>
                <body>
                    <h2>Config Error</h2>
                    <pre>DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET must be set in environment</pre>
                </body>
            </html>
        `);
    }

    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', redirectUri);

        const axios = require('axios');
        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            auth: {
                username: clientId,
                password: clientSecret
            }
        });

        const tokenData = tokenRes.data;

        res.send(`
            <html>
                <head><title>OAuth2 Callback</title></head>
                <body>
                    <h2>Authentication successful!</h2>
                    <h3>Access Token Response:</h3>
                    <pre>${JSON.stringify(tokenData, null, 2)}</pre>
                    <p>
                        <b>Next step:</b> Use the <code>access_token</code> above to POST to <code>/api/auth/login</code> with a JSON body:<br>
                        <pre>{
  "accessToken": "${tokenData.access_token}",
  "guildId": "YOUR_GUILD_ID"
}</pre>
                        <br>
                        The response will include a <code>token</code> (JWT) to use with <code>/api/auth/verify</code> and other endpoints.<br>
                        <br>
                        Example curl:<br>
                        <pre>curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"accessToken": "${tokenData.access_token}", "guildId": "YOUR_GUILD_ID"}'</pre>
                    </p>
                    <p>You may close this window.</p>
                </body>
            </html>
        `);
    } catch (err) {
        res.send(`
            <html>
                <head><title>OAuth2 Callback</title></head>
                <body>
                    <h2>Token Exchange Failed</h2>
                    <pre>${err.response?.data ? JSON.stringify(err.response.data, null, 2) : err.message}</pre>
                </body>
            </html>
        `);
    }
});

module.exports = router;
