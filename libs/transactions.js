'use strict';

const rp = require('request-promise');

function Transactions() {

	this.baseUrl = 'https://7np770qqk5.execute-api.eu-west-1.amazonaws.com/';

	this.getTransactions = function () {
		let url = `${this.baseUrl}prod/get-transaction`;
		return rp(url)
			.then(function (response) {
				return JSON.parse(response);
			})
			.catch((err) => {
				return err;
			})
	};

	this.postTrunsactions = function (data) {
		let url = `${this.baseUrl}prod/process-transactions`;
		let options = {
			method: 'POST',
			uri: url,
			body: data,
			json: true
		};

		return rp(options)
			.then(function (response) {
				return response;
			})
			.catch((err) => {
				return err;
			})
	};

}

module.exports = new Transactions();