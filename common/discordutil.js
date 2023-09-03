const { EmbedBuilder } = require('discord.js');
const langs = require('./langs.js');

module.exports = {

    bookmark(message, user) {
        if (!user.dmChannel) {
            user.createDM();
        }

        const attachment = message.attachments.first();
        let image;
        if (attachment && (attachment.width || attachment.height)) {
            image = attachment.url;
        }

        if (!image && !message.content) {
            if (message.embeds[0]) {
                const embed = message.embeds[0];
                user.send(`Sent by: ${message.author.username}`, { embed }).then(msg => msg.react('❌'));
                return;
            }
        }

        if (message.content.length >= 2048) {
            const splitText = this.splitText(message.content);
            this.createBookMarkMessage(message, splitText[0], image, user);
            this.createBookMarkMessage(message, splitText[1], image, user);
        } else {
            this.createBookMarkMessage(message, message.content, image, user);
        }
    },

    createBookMarkMessage(message, text, image, user) {
        const author = {
            name: message.author.username,
            iconURL: message.author.avatarURL()
        };
        const embed = new EmbedBuilder()
            .setColor('#9F4193')
            .setAuthor(author)
            .setDescription(`${text}${image ? `\r\n\r\n${image}` : ''} \r\n\r\n **Message link:** ${message.url}`)
            .setImage(image)
            .setTimestamp(message.editedTimestamp || message.createdTimestamp);

        user.send({ embeds: [embed] }).then(msg => msg.react('❌'));
    },

    createBasicEmbed(name) {
        const author = {
            name: name || 'KORE',
            iconURL: 'https://i.imgur.com/V93c5to.png'
        };

        return new EmbedBuilder()
            .setColor('#9F4193')
            .setAuthor(author);
    },

    setEmbedFooter(embed, footer) {
        const footerData = {
            text: footer
        };
        embed.setFooter(footerData);
    },

    createWordSearchEmbed(language, query, username, isDM, searchResults) {
        const embed = this.createBasicEmbed();
        embed.setDescription(`Search results for: **${query}**`);

        if (searchResults.length === 0) {
            embed.addFields({ name: 'No Results', value: 'No results have been found' });
        } else {
            this.setEmbedFooter(embed, `${username} can toggle languages. ${!isDM ? 'Anyone can bookmark this message.' : ''}`);

            searchResults.forEach((entry) => {
                const definitions = [];
                entry.senses.forEach((sense, index) => {
                    let definition;
                    if (language === 'en') {
                        sense.translations.forEach((translation) => {
                            definition = `${index}. __${translation.meaning}__\r\n${translation.definition}`;
                            if (`${definitions.join('\n')}\n${definition}`.length < 1024) {
                                definitions.push(definition);
                            }
                        });
                    } else if (language === 'ko') {
                        definition = `${index}. ${sense.definition}`;
                        if (`${definitions.join('\n')}\n${definition}`.length < 1024) {
                            definitions.push(definition);
                        }
                    }
                });

                if (language === 'en') {
                    const entryHeader = `**${entry.word}**${entry.hanja ? ` (${entry.hanja})` : ''} - ${entry.wordTypeTranslated}${entry.pronunciation ? ` - [${entry.pronunciation}]` : ''}`;
                    embed.addFields({ name: entryHeader, value: definitions.join('\n') });
                } else if (language === 'ko') {
                    const entryHeader = `**${entry.word}**${entry.hanja ? ` (${entry.hanja})` : ''} - ${entry.wordType}${entry.pronunciation ? ` - [${entry.pronunciation}]` : ''}`;
                    embed.addFields({ name: entryHeader, value: definitions.join('\n') });
                }
            });
        }
        return embed;
    },

    createHanjaEmbeds(query, username, isDM, results) {
        const pages = [];
        const isEmpty = results.similarwords.length === 0 && results.hanjas.length === 0;
        if (isEmpty) {
            const embed = this.createBasicEmbed();
            embed.setDescription(`Search results for: **${query}**`);
            embed.addFields({ name: 'No Results', value: 'No results have been found' });
            pages.push(embed);
        } else {
            const pageLength = 10;
            let counter = 0;
            while (results.hanjas.length > 0 || results.similarwords.length > 0) {
                const page = this.createBasicEmbed();
                page.setDescription(`Search results for: **${query}**`);
                let i;
                const hanjas = [];
                const words = [];
                for (i = 0; i < pageLength; i += 1) {
                    if (results.hanjas.length > 0) {
                        const hanja = results.hanjas.shift();
                        hanjas.push(`${counter + 1}. **${hanja.hanja}**\r\n${hanja.definition}`);
                        counter += 1;
                    } else if (results.similarwords.length > 0) {
                        const word = results.similarwords.shift();
                        words.push(`${counter + 1}. **${word.hanja}** **(${word.hangul})**\r\n${word.english}`);
                        counter += 1;
                    }
                }

                if (hanjas.length > 0) {
                    page.addFields({ name: 'Hanjas', value: hanjas.join('\r\n') });
                }
                if (words.length > 0) {
                    page.addFields({ name: 'Related Words', value: words.join('\r\n') });
                }

                pages.push(page);
            }
        }
        const pageCount = pages.length;
        if (pageCount > 0) {
            pages.forEach((page) => {
                const author = {
                    name: 'KORE',
                    iconURL: 'https://i.imgur.com/V93c5to.png'
                };
                page.setAuthor(author);
            });
        }
        return pages;
    },

    createExampleResultEmbed(language, query, username, isDM, searchResults) {
        const embed = this.createBasicEmbed();
        embed.setDescription(`Example sentences for **${query}**:\r\n\r\n`);

        if (searchResults.length === 0) {
            embed.addFields({ name: 'No Results', value: 'No results have been found' });
        } else {
            let s = `Example sentences for **${query}**:\r\n\r\n`;
            let i;
            for (i = 0; i < searchResults.length; i += 1) {
                s += `**${i + 1}.** ${searchResults[i].example.replace(query, `**__${query}__**`)}\r\n\r\n`;
            }
            embed.setDescription(s);
            if (!isDM) {
                this.setEmbedFooter(embed, 'Anyone can bookmark this message.');
            }
        }
        return embed;
    },

    createTranslationResultEmbed(query, result) {
        const embed = this.createBasicEmbed();
        embed.setDescription(`Translation for: **${query}**`);

        this.setEmbedFooter(embed, 'Powered by Papago');
        if (!result) {
            embed.addFields({ name: 'No Results', value: 'No results have been found' });
        } else {
            embed.addFields({ name: 'Result', value : result.text });
            embed.addFields({ name: 'Original Language', value: langs[result.source], inline: true });
            embed.addFields({ name: 'Target Language', value: langs[result.target], inline: true });
            this.setEmbedFooter(embed, 'Anyone can bookmark this message.');
        }
        return embed;
    },

    splitText(s, separator = ' ') {
        let middle = Math.floor(s.length / 2);
        const before = s.lastIndexOf(separator, middle);
        const after = s.indexOf(separator, middle + 1);

        if (before === -1 || (after !== -1 && middle - before >= after - middle)) {
            middle = after;
        } else {
            middle = before;
        }

        const s1 = s.substring(0, middle);
        const s2 = s.substring(middle + 1);

        return [s1, s2];
    },

    isHangul(string) {
        if (typeof string !== 'string' || string.length === 0) {
            return false;
        }
        for (let i = 0; i < string.length; i++) {
            const char = string.charCodeAt(i);
            if (char < 0xAC00 || char > 0xD7A3) {
                return false;
            }
        }
        return true;
    }
};
