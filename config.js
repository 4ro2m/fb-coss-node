module.exports.settings = {
    binom: {
        isActive: 1,
        apiKey: process.env.BINOM_API_KEY,
        domain: process.env.BINOM_URL,
        tokenNumber: '2'
    },
    keitaro: {
        isActive: 0,
        apiKey: '',
        domain: '',
        subid: '',
        campaigns: '',
        currency: '',
        timezone: ''
    }
}