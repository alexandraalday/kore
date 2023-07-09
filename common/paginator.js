const { ActionRowBuilder, ButtonStyle } = require('discord.js');
const paginator = async (
    interaction,
    pages,
    buttonList,
    timeout = 120000
) => {
    if (!pages) {
        throw new Error('Pages are required.');
    }
    if (!buttonList) {
        throw new Error('Buttons are required.');
    }
    if (buttonList[0].data.style === ButtonStyle.Link || buttonList[1].data.style === ButtonStyle.Link) {
        throw new Error('Link buttons are not supported.');
    }
    if (buttonList.length !== 2) {
        throw new Error('Two buttons are required.');
    }

    let page = 0;

    const isOnlyPage = pages.length <= 1;
    const row = new ActionRowBuilder().addComponents(
        buttonList[0].setDisabled(isOnlyPage),
        buttonList[1].setDisabled(isOnlyPage)
    );

    // has the interaction already been deferred? If not, defer the reply.
    if (interaction.deferred === false) {
        await interaction.deferReply();
    }

    const currentPage = await interaction.editReply({
        embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
        components: [row],
        fetchReply: true
    });

    if (isOnlyPage) {
        return currentPage;
    }

    const filter = (i) => {
        return i.customId === buttonList[1].data.custom_id ||
        i.customId === buttonList[0].data.custom_id;
    };


    const collector = await currentPage.createMessageComponentCollector({
        filter,
        time: timeout
    });

    collector.on('collect', async (i) => {
        switch (i.customId) {
            case buttonList[0].data.custom_id:
                page = page > 0 ? --page : pages.length - 1;
                break;
            case buttonList[1].data.custom_id:
                page = page + 1 < pages.length ? ++page : 0;
                break;
            default:
                break;
        }
        await i.deferUpdate();
        await i.editReply({
            embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
            components: [row]
        });
        collector.resetTimer();
    });

    collector.on('end', (_, reason) => {
        if (reason !== 'messageDelete') {
            currentPage.edit({
                embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
                components: [row]
            });
        }
    });

    return currentPage;
};
module.exports = paginator;
