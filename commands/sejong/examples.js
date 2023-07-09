const DiscordUtil = require('../../common/discordutil.js');
const ExampleSentenceAPI = require('../../api/exampleapi.js');
const { ChannelType, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('examples')
        .setDescription('Search the dictionary for example sentences')
        .addStringOption(option =>
            option.setName('word')
                .setDescription('The word to look up examples for')
                .setRequired(true))
        .setDefaultMemberPermissions(0),
    async execute(interaction) {
        const query = interaction.options.getString('word');
        const api = new ExampleSentenceAPI();
        const isDM = interaction.channel.type === ChannelType.DM;

        await interaction.deferReply();

        const response = await api.searchExamples(query);
        const parsedResponse = api.parseExampleResult(response);

        const sendExamples = async () => {
            const exEmbed = DiscordUtil.createExampleResultEmbed(
                'en',
                query,
                interaction.user.username,
                isDM,
                parsedResponse
            );

            if (parsedResponse.length === 0) {
                await interaction.editReply({ embeds: [exEmbed] });
                return;
            }

            await interaction.editReply({ embeds: [exEmbed] })
                .then((msg) => {
                 if (!isDM) {
                   msg.react('🔖');
                 }
            });
        };

        await sendExamples();
    }
};
