require('dotenv').config();

const { settings } = require('./config');
const { getFacebookApi, requestUrl, getAccountsData, sendMessage } = require('./helpers');

const _ = require('lodash');
const moment = require('moment');
const { logger } = require('./logger');



const run = async() => {
    await logger('info',`Started`);
    const accounts = await getAccountsData();

    for (const account of accounts) {
        let costUpdated = 0;
        let costNotUpdated = 0;

        if (!account.id) {
            logger('warn',`Error, Message: No id for account`);
            continue;
        };

        if (!account.token) {
            logger('warn',`Error, account id: ${account.id}, message: No token`);
            continue;
        };
        
        if (!account.cabinets) {
            logger('warn',`Error, account id: ${account.id}, message: No cabinets`);
            continue;
        };

        const me = await getFacebookApi('/me', {
            'access_token': account.token
        })
        if (me.error) {
            const message = `Error, account id: ${account.id}, message: ${me.error.message}`;
            logger('warn',message);
            await sendMessage(`Расходы Facebook\n` + message);
            continue;
        };

        for (cabinet of account.cabinets) {  
            let adsets = [];
            let adsetsDirty = await getFacebookApi('/act_' + cabinet + '/adsets', {
                'access_token': account.token,
                'fields': 'name'
                // 'limit': '1'
            });
            if (adsetsDirty.error) logger('warn',`Error, account id: ${account.id}, message: ${adsetsDirty.error.message}`);
            
            adsets = _.concat(adsets, adsetsDirty.data);

            while (_.get(adsetsDirty, 'paging.next')) {
                adsetsDirty = await requestUrl(adsetsDirty.paging.next);
                adsets = _.concat(adsets, adsetsDirty.data);
            }
            
            for (adset of adsets) {
                let insights = [];
                const options = {
                    'access_token': account.token,
                    'fields': 'spend',
                    'time_increment':'1',
                    'time_range': {
                        'since': '2018-01-01', 'until': moment().format('YYYY-MM-DD')
                    }
                }

                let insightsDirty = await getFacebookApi('/' + adset.id + '/insights', options);

                if (insightsDirty.error) logger('warn',`Error, account id: ${account.id}, message: ${insightsDirty.error.message}`);

                insights = _.concat(insights, insightsDirty.data);

                while (_.get(insightsDirty, 'paging.next')) {
                    insightsDirty = await requestUrl(insightsDirty.paging.next);
                    insights = _.concat(insights, insightsDirty.data);
                }

                for (insight of insights) {
                    // Если Binom включен, отправляем стату в него
                    
                    if(settings.binom.isActive) {
                        for (campaign of account.campaigns) {
                            
                            const binomUrl = `http://${settings.binom.domain}?page=save_update_costs&camp_id=${campaign}&date=12&timezone=3&token_number=${settings.binom.tokenNumber}&token_value=${adset.id}&cost=${insight.spend}&date_s=${insight.date_start}&date_e=${insight.date_stop}&api_key=${settings.binom.apiKey}`;
                            const response = await requestUrl(binomUrl);
                            if (response.error) {
                                costNotUpdated ++;
                                logger('warn',`Error, account id: ${account.id}, message: ${response.error}`);
                            } else {
                                costUpdated ++;
                                logger('info',`Account id: ${account.id}, adset id: ${adset.id} - spend updated!`);
                            }
                        }
                    }
                }
            }
        }
        const message = `Account id: ${account.id}, costs updated: ${costUpdated}, costs not updated: ${costNotUpdated}`;
        logger('info',message);
        await sendMessage(`Расходы Facebook\n` + message);
    }
    await logger('info',`Finished`);
}

run()