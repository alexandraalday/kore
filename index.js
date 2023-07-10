const fs = require('fs');
const { ChannelType, Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const DiscordUtil = require('./common/discordutil');
const { botToken, commandDirectories } = require('./config.json');
const { deployCommands } = require('./deploy-commands');

const client = new Client({
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions
    ]
});

client.commands = new Collection();
client.buttons = new Collection();
commandDirectories.forEach(dir => {
    const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));
    commandFiles.forEach((file) => {
        const command = require(`${dir}/${file}`);
        client.commands.set(command.data.name, command);
    });
});

client.once('ready', () => {
    console.log('kore is online!');
    deployCommands();
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand() || interaction.isContextMenuCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            return interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial && !user.bot) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message: ', error);
            // Return as `reaction.message.author` may be undefined/null
            return;
        }
    }

    if (user.id === client.user.id || user.bot) {
        return;
    }
    const validChannels = [
        ChannelType.GuildText,
        ChannelType.GuildPublicThread,
        ChannelType.GuildPrivateThread,
        ChannelType.GuildVoice
    ];
    if (reaction.emoji.name === '🔖' && validChannels.includes(reaction.message.channel.type)) {
        if (reaction.message.embeds[0] && reaction.message.author.id === client.user.id) {
            console.log(`${user.username} - result bookmark `);
            const embed = reaction.message.embeds[0];
            user.send({ embeds: [embed] }).then(msg => msg.react('❌'));
        } else {
            console.log(`${user.username} - message bookmark `);
            DiscordUtil.bookmark(reaction.message, user);
        }
    }
    if (reaction.emoji.name === '❌' && !validChannels.includes(reaction.message.channel.type)) {
        if (user.id !== client.user.id && reaction.message.author.id === client.user.id) {
            reaction.message.delete();
        }
    }
});

client.on('error', console.error);

client.login(botToken);