const { isCompleteAll } = require('hangul-js');
const DiscordUtil = require('../common/discordutil.js');
const KrDicApi = require('../api/krdicapi.js');

let previousEnding;

const KkeunmalErrorTypes = {
    InvalidInput: 'InvalidInput',
    InvalidStarter: 'InvalidStarter',
    NoResults: 'NoResults'
};

const ErrorNames = {
    [KkeunmalErrorTypes.InvalidInput]: 'Invalid Submission',
    [KkeunmalErrorTypes.InvalidStarter]: 'Invalid Starting Character',
    [KkeunmalErrorTypes.NoResults]: 'Unknown Word',
    [KkeunmalErrorTypes.RepeatedEnding]: 'Same Ending Character'
};

const ErrorDescriptions = {
    [KkeunmalErrorTypes.InvalidInput]: 'Sorry! Your submission was invalid, was there a typo? Please make sure that it is in 한글, has more than two characters, and uses complete characters. 다시 시도해 보세요! Please try again!',
    [KkeunmalErrorTypes.InvalidStarter]: `The word should begin with ${previousEnding}. 다시 시도해 보세요! Please try again!`,
    [KkeunmalErrorTypes.NoResults]: 'Could not find word in the dictionary. Maybe there was a typo or spelling mistake? 다시 시도해 보세요! Please try again!',
    [KkeunmalErrorTypes.RepeatedEnding]: 'The word cannot end with the same ending character as the previous round. 다시 시도해 보세요! Please try again!'
};

const kkeunmal = async (message) => {
    const isHangeul = isCompleteAll(message.content);
    const word = message.content;
    const lastCharacter = word[word.length - 1];
    console.log(word);
    console.log(isHangeul);

    if (!isHangeul || word.length < 2) {
        const errorEmbed = createErrorEmbed(word, KkeunmalErrorTypes.InvalidInput);
        return message.channel.send({ embeds: [errorEmbed] });
    }

    if (previousEnding && word[0] !== previousEnding) {
        const errorEmbed = createErrorEmbed(word, KkeunmalErrorTypes.InvalidStarter);
        return message.channel.send({ embeds: [errorEmbed] });
    }

    if (previousEnding && lastCharacter === previousEnding) {
        const errorEmbed = createErrorEmbed(word, KkeunmalErrorTypes.RepeatedEnding);
        return message.channel.send({ embeds: [errorEmbed] });
    }

    const api = new KrDicApi();
    const response = await api.searchWords(word, 5, 7);
    const filtered = response.filter(result => result.word === word);

    if (filtered.length === 0) {
        const errorEmbed = createErrorEmbed(word, KkeunmalErrorTypes.NoResults);
        return message.channel.send({ embeds: [errorEmbed] });
    }

    const enEmbed = createSuccessEmbed(word, filtered, message.author.username);
    console.log('prev ending', previousEnding);
    previousEnding = word.split('')[word.length - 1];
    return message.channel.send({ embeds: [enEmbed] });
};

const createErrorEmbed = (word, errorType) => {
    const embed = DiscordUtil.createBasicEmbed('KORE', '#DD4B4B');
    embed.setDescription(word);
    embed.addFields({ name: ErrorNames[errorType], value: ErrorDescriptions[errorType] });
    return embed;
};

const createSuccessEmbed = (word, results, player) => {
    const embed = DiscordUtil.createBasicEmbed('KORE', '#62D668');
    embed.setFooter({ text: `${player} 씨 잘했어요! Great job!` });
    results.forEach((result) => {
        const meaning = result.senses.map((sense, index) => `${index + 1}. __${sense.meaning}__\n${sense.translation}`).join('\n');
        console.log(meaning);
        const hanja = result.hanja ? `(${result.hanja}) ` : '';
        const pronunciation = result.pronunciation ? ` - [${result.pronunciation}]` : '';
        const name = `**${result.word} ${hanja}- ${result.wordTypeTranslated}${pronunciation}**`;
        embed.addFields({ name, value: meaning });
        embed.addFields({ name: '\nNext word needs to start with', value: word[word.length - 1] });
    });
    return embed;
};

module.exports = {
    kkeunmal
};
