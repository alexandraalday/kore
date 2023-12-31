const { AttachmentBuilder, ChannelType, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getreactions')
        .setDescription('Get reactions from a message')
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('The message id you would like to get reactions from')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel this message is in')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildPublicThread, ChannelType.GuildPrivateThread)
                .setRequired(true))
        .setDefaultMemberPermissions(0),
    async execute(interaction) {
        const options = interaction.options;
        const messageId = options.getString('message_id');
        const channel = options.getChannel('channel');

        await interaction.deferReply();

        channel.messages.fetch(messageId).then((msg) => {
            const users = {};
            msg.reactions.cache.map((reaction) => {
                users[reaction.emoji] = [];
                reaction.users.fetch().then(result => {
                    result.map(user => {
                        users[reaction.emoji].push('<@' + user.id + '>');
                    });
                    const attachment = new AttachmentBuilder(Buffer.from(`${users[reaction.emoji].join('\n')}`, 'utf-8'), { name: 'reactions.txt' });
                    interaction.followUp({ content: `Users that reacted with ${reaction.emoji}`, files: [attachment] });
                });
            });
        }).catch((error) => {
            console.log(error);
            interaction.followUp({ content: `Message with ID ${messageId} wasn't found in channel <#${channel.id}>` });
        });
    }
};