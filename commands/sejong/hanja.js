const Hanja = require('../../hanja/sql');
const DiscordUtil = require('../../common/discordutil.js');
const paginator = require('../../common/paginator');
const { ButtonBuilder, ButtonStyle, ChannelType, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hanja')
        .setDescription('Search for Hanja in English, Korean, or Hanja itself')
        .addStringOption(option =>
            option.setName('word')
                .setDescription('What is the word?')
                .setRequired(true))
        .setDefaultMemberPermissions(0),
    async execute(interaction) {
        const query = interaction.options.getString('word');
        const isDM = interaction.channel.type === ChannelType.DM;
        const hanja = new Hanja();

        await interaction.deferReply();

        const response = await hanja.searchWords(query);

        const sendHanja = async () => {
            const pages = DiscordUtil.createHanjaEmbeds(
                response.query,
                interaction.user.username,
                isDM,
                response
            );

            const button1 = new ButtonBuilder()
                .setCustomId('previousbtn')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Danger);

            const button2 = new ButtonBuilder()
                .setCustomId('nextbtn')
                .setLabel('Next')
                .setStyle(ButtonStyle.Success);

            const buttonList = [button1, button2];

            paginator(interaction, pages, buttonList)
                .then((msg) => {
                    if (!isDM) {
                        msg.react('🔖');
                    }
                });
        };

        await sendHanja();
    }
};
