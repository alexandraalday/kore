const got = require('got');
const Promise = require('promise');
const https = require('https');
const rootCas = require('ssl-root-cas').create();
const path = require('path');
const querystring = require('querystring');
const { krDictUrl, krDictToken } = require('../apiconfig.json');
const et = require('elementtree');
const pos = require('../common/pos');
const { isHangul } = require('../common/discordutil');

module.exports = class KrDicApi {

    constructor() {
        this.options = {
            key: krDictToken,
            part: 'word',
            method: 'include',
            multimedia: 0,
            num: 10,
            sort: 'dict',
            translated: 'y',
            trans_lang: '1'
        };
    }

    searchWords(q) {
        // Needed to fix UNABLE_TO_VERIFY_LEAF_SIGNATURE issue - https://stackoverflow.com/a/60020493
        const reqPath = path.join(__dirname, '../');
        rootCas.addFile(path.resolve(reqPath, 'krdic_api_cert.pem'));
        https.globalAgent.options.ca = rootCas;

        let url = `${krDictUrl}search?${querystring.stringify(this.options)}&q=${encodeURI(q)}`;

        if (!isHangul(q)) {
            url = `https://krdict.korean.go.kr/dicMarinerSearch/search?nation=eng&nationCode=6&ParaWordNo=&mainSearchWord=${q}`;
        }

        this.options.q = q;
        const promise = new Promise((resolve, reject) => (async () => {
            try {
                console.log('Debug -- url', url);
                const response = await got(url);
                console.log('Debug -- response', response);
                resolve(response.body);

                // => '<!doctype html> ...'
            } catch (error) {
                console.log(error);
                // => 'Internal server error ...'
            }
        })());
        return promise;
    }

    parseResult(r) {
        this.entries = [];

        et.parse(r).findall('item').forEach((item) => {
            const entry = {};
            entry.word = item.find('word') ? item.find('word').text.trim() : '';
            entry.link = item.find('link') ? item.find('link').text.trim() : '';
            entry.hanja = item.find('origin') ? item.find('origin').text.trim() : '';
            entry.pronunciation = item.find('pronunciation') ? item.find('pronunciation').text.trim() : '';
            entry.wordType = item.find('pos') ? item.find('pos').text.trim() : '';
            entry.wordTypeTranslated = entry.wordType ? pos[entry.wordType] : '';

            const entrySenses = [];
            item.findall('sense').forEach((s) => {
                const sense = {};
                sense.definition = s.find('definition') ? s.find('definition').text.trim() : '';
                const senseTranslations = [];
                s.findall('translation').forEach((t) => {
                    const translation = {};
                    translation.definition = t.find('trans_dfn') ? t.find('trans_dfn').text.trim() : '';
                    translation.meaning = t.find('trans_word') ? t.find('trans_word').text.trim() : '';
                    senseTranslations.push(translation);
                });
                sense.translations = senseTranslations;
                entrySenses.push(sense);
            });

            entry.senses = entrySenses;
            this.entries.push(entry);
        });

        return this.entries;
    }
};