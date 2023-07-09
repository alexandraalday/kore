const DiscordUtil = require('../../common/discordutil.js');
const PapagoApi = require('../../api/papagoapi.js');
const langs = require('../../common/langs.js');
const { ChannelType, SlashCommandBuilder } = require('discord.js');

/*
  details: `Translate a sentence using Papago. Use ${prefix}papago to translate from Korean to English (default).
  \r\nUse ${prefix}papago [source]>[target] [text] to specify both the target and source language.\r\n
  The available language codes are: ko (Korean), en (English), zh-CN (Chinese), zh-TW (Taiwanese), es (Spanish), fr (French), vi (Vietnamese), th (Thai), id (Indonesian).
  \r\nThe available combinations are:\r\nko<->en\r\nko<->zh-CN\r\nko<->zh-TW\r\nko<->es\r\nko<->fr\r\nko<->vi\r\nko<->th\r\nko<->id\r\nen<->ja\r\nen<->fr`,
  */

module.exports = {
    data: new SlashCommandBuilder()
        .setName('papago')
        .setDescription('Translate a text using Papago')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('What is the text to translate?')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('language_codes')
                .setDescription('What are the language codes?'))
        .setDefaultMemberPermissions(0),
    async execute(interaction) {
        let source = 'ko';
        let target = 'en';
        const language_codes = interaction.options.getString('language_codes');
        const text = interaction.options.getString('text');
        const isDM = interaction.channel.type === ChannelType.DM;

        await interaction.deferReply();

        if (language_codes) {
            const l = language_codes.split('>');
            if (l.length === 2) {
                [source, target] = l;
            }
        }

        if (!langs[source] || !langs[target]) {
            await interaction.editReply(`enter a valid combination of languages. The available combinations are:
        \r\nko<->en\r\nko<->zh-CN\r\nko<->zh-TW\r\nko<->es\r\nko<->fr\r\nko<->vi\r\nko<->th\r\nko<->id\r\nen<->ja\r\nen<->fr`);
            return;
        }

        if (source === target) {
            await interaction.editReply('source and target language must be different');
            return;
        }

        const papagoApi = new PapagoApi();

        const response = await papagoApi.translate(text, source, target);
        const translationEmbed = DiscordUtil.createTranslationResultEmbed(text, response);

        await interaction
            .editReply({
                embeds: [translationEmbed]
            })
            .then((msg) => {
                if (!isDM) {
                    msg.react('🔖');
                }
            });
    }
};
