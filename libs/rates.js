'use strict';

const rp = require('request-promise');
const moment = require('moment');

function Rates() {

	this.baseUrl = 'https://api.exchangeratesapi.io/';
	this.baseCurrency = 'EUR';

	this.getRates = function (date = moment().format('YYYY-MM-DD')) {
		let url = `${this.baseUrl}${date}?base=${this.baseCurrency}`;
		return rp(url)
			.then(function (response) {
				let rateData = JSON.parse(response);
				rateData.dateOrigin = date;
				return rateData;
			})
			.catch((err) => {
				return err;
			})
	};

}

module.exports = new Rates();