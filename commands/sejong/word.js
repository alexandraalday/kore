const KrDicApi = require('../../api/krdicapi.js');
const DiscordUtil = require('../../common/discordutil.js');
const paginator = require('../../common/paginator');
const { ButtonStyle, ChannelType, SlashCommandBuilder, ButtonBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('word')
        .setDescription('Search the dictionary for a Korean word')
        .addStringOption(option =>
            option.setName('word')
                .setDescription('What is the word?')
                .setRequired(true))
        .setDefaultMemberPermissions(0),
    async execute(interaction) {
        // args = [args];
        const isDM = interaction.channel.type === ChannelType.DM;
        // const q = args.join(" ");
        const query = interaction.options.getString('word');
        const api = new KrDicApi();

        await interaction.deferReply();

        const response = await api.searchWords(query, 5, 7);

        const send = async () => {
            const enEmbed = DiscordUtil.createWordSearchEmbed(
                'en',
                query,
                interaction.user.username,
                isDM,
                response
            );
            const krEmbed = DiscordUtil.createWordSearchEmbed(
                'ko',
                query,
                interaction.user.username,
                isDM,
                response
            );

            if (response.length === 0) {
                await interaction.followUp({ embeds: [enEmbed] });
                return;
            }

            const pages = [enEmbed, krEmbed];

            const button1 = new ButtonBuilder()
                .setCustomId('english')
                .setLabel('🇬🇧 English')
                .setStyle(ButtonStyle.Primary);

            const button2 = new ButtonBuilder()
                .setCustomId('korean')
                .setLabel('🇰🇷 한국어')
                .setStyle(ButtonStyle.Primary);

            const buttonList = [button1, button2];

            await paginator(interaction, pages, buttonList)
                .then((msg) => {
                    if (!isDM) {
                        msg.react('🔖');
                    }
                });
        };

        await send();
    }
};
