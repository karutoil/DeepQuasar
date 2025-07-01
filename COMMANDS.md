# Command Reference

## Ai Commands

| Command | Description | Options/Subcommands |
|---|---|---|
| `ask` | Ask the AI chatbot a question directly | `message` |
| `chatbot` | Configure AI chatbot settings for this server | `status`, `toggle`, `api`, `behavior`, `channels`, `advanced`, `prompt`, `conversation`, `test` |

## Information Commands

| Command | Description | Options/Subcommands |
|---|---|---|
| `globalstats` | Show all-time global stats: played songs, AI conversations, total users, premium users |  |
| `help` | Get help with bot commands | `command`, `category` |
| `linecount` | Show the total line count for the entire project |  |
| `selfrole-help` | Get help with the self-role system | `topic` |
| `stats` | Show global bot statistics: played songs, AI conversations, servers, users, supporters |  |

## Music Commands

| Command | Description | Options/Subcommands |
|---|---|---|
| `filters` | Apply audio filters to the player | `filter` |
| `history` | View and play from your music play history. |  |
| `loop` | Set loop mode for the player | `mode` |
| `nowplaying` | Show information about the currently playing track |  |
| `pause` | Pause the current song |  |
| `play` | Play a song or playlist | `query`, `source`, `next`, `shuffle` |
| `queue` | Show the current queue | `page` |
| `resume` | Resume playback if paused |  |
| `search` | Search for music and select tracks to play | `query`, `source`, `limit` |
| `seek` | Seek to a specific position in the current track | `position` |
| `skip` | Skip the current track | `amount` |
| `stop` | Stop playback and clear the queue |  |
| `volume` | Set or view the playback volume | `level` |

## Settings Commands

| Command | Description | Options/Subcommands |
|---|---|---|
| `autorole` | Configure automatic role assignment for new members | `setup`, `disable`, `status`, `test` |
| `cleanup` | Clean up messages in channels | `user`, `amount`, `all`, `bots` |
| `create-guild-data` | Force create/update guild data with welcome system (Debug) |  |
| `debug-welcome` | Debug welcome system configuration |  |
| `embed` | Interactive embed builder | `builder` |
| `modlog` | Configure moderation logging settings | `setup`, `disable`, `status`, `configure`, `setchannel`, `toggle` |
| `selfrole` | Manage self-assignable roles with buttons | `create`, `add-role`, `remove-role`, `edit`, `settings`, `list`, `delete`, `stats`, `cleanup` |
| `selfrole-advanced` | Advanced self-role management options | `role-limits`, `role-conflicts`, `reorder-roles`, `bulk-assign`, `export-data`, `reset-stats` |
| `selfrole-setup` | Quick setup wizard for self-roles | `channel`, `template`, `title`, `description` |
| `settings` | Configure bot settings for this server | `music`, `permissions`, `commands`, `view`, `reset` |
| `templates` | Manage embed templates | `list`, `delete`, `info` |
| `test-welcome` | Test the welcome system (Developer only) |  |
| `welcome` | Configure welcome and leave messages for the server | `setup`, `config`, `status`, `test`, `placeholders` |

## Tempvc Commands

| Command | Description | Options/Subcommands |
|---|---|---|
| `tempvc` | Configure the temporary voice channel system | `setup`, `toggle`, `config`, `settings`, `permissions`, `advanced` |
| `tempvc-list` | View and manage active temporary voice channels | `all`, `mine`, `user`, `cleanup`, `stats` |
| `tempvc-templates` | Manage channel naming templates for temp VCs | `list`, `add`, `remove`, `edit`, `preview`, `placeholders` |
| `vc` | Manage your temporary voice channel | `rename`, `limit`, `bitrate`, `lock`, `hide`, `transfer`, `allow`, `deny`, `kick`, `info`, `settings`, `delete` |

## Tickets Commands

| Command | Description | Options/Subcommands |
|---|---|---|
| `fix-tickets` | Fix ticket system modal configurations |  |
| `panel` | Manage ticket panels | `create`, `edit`, `delete`, `list`, `add-button`, `remove-button` |
| `ticket` | Manage tickets | `close`, `assign`, `reopen`, `delete`, `transcript`, `tag`, `priority`, `list`, `info` |
| `tickets` | Configure the ticket system | `setup`, `config`, `channels`, `staff`, `settings`, `autoclose`, `transcripts`, `naming`, `tags` |

