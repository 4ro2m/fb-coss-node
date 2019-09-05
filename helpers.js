const request = require('async-request');
const querystring = require('querystring');
const { logger } = require('./logger');

const Telegraf = require('telegraf');
const bot = new Telegraf(process.env.T_BOT_API);
const chatID = process.env.T_CHAT_ID;

const timeoutForRequest = '500';

async function sendMessage(message) {
    try {
        await bot.telegram.sendMessage(chatID, message);
    } catch(err) {
        logger('warn',`Error: ${err}`);
    }
}

async function getFacebookApi(path, data) {
    const url = 'https://graph.facebook.com/v3.0' + path + '?' + querystring.stringify(data);
    try {
        const response = await request(url, {});
        return JSON.parse(response.body);
    } catch(err) {
        logger('warn',`Error: ${err}`);
    }
}

async function requestUrl(path) {
    const url = path;
    try {
        const response = await request(url, {});
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(JSON.parse(response.body))
            }, timeoutForRequest)
        })
    } catch(err) {
        logger('warn',`Error: ${err}`);
    }
}

const getAccountsData = async() => {
    let accounts = [];
    // Google Spreadsheet URL
    const url = process.env.GOOGL_SHEET_LINK;
    try {
        const response = await requestUrl(url);
        if (!response.feed.entry) {
            logger('warn',`Problem with acessing google sheet url`);
        }

        const data = response.feed.entry;
        
        for (const row of data) {
            const account = {
                id: row['gsx$id']['$t'].replace(' ', ''),
                token: row['gsx$токен']['$t'].replace(' ', ''),
                cabinets: row['gsx$кабинеты']['$t'].replace(' ', '').split(','),
                campaigns: row['gsx$кампании']['$t'].replace(' ', '').split(','),
                comment: row['gsx$комменатрий']['$t'],
            }
            accounts.push(account);
        }

        return accounts;
    } catch(err) {
        logger('warn',`Error: ${err}`);
    }
}

exports.getFacebookApi = getFacebookApi;
exports.requestUrl = requestUrl;
exports.getAccountsData = getAccountsData;
exports.sendMessage = sendMessage;