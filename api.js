var axios = require('axios');

module.exports = class ApiService {
    constructor(base) {
        this.baseURL = base;
    }

    async get(url, config = {}) {
        //console.log(url);
        const response = await axios.get(`${this.baseURL}${url}`, config);
        if (response.error) {
            return Promise.reject(
                new Error(`Error GET ${url} : ${JSON.stringify(response)}`)
            );
        }
        return response.data;
    }

    async post(url, data = {}, config = {}) {
        config.headers ||
            (config.headers = {
                "Content-Type": "application/json"
            });
        var base = process.env.VUE_APP_ROOT_API;
        const response = await axios.post(`${this.baseURL}/${url}`, data, config);

        if (response.error) {
            return Promise.reject(
                new Error(`Error POST ${url} : ${JSON.stringify(response)}`)
            );
        }
        return response.data;
    }

    async apiState() {
        const response = await this.get(`/state`);
        return response;
    }
}