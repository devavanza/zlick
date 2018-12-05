'use strict';

const moment = require('moment');
const BPromise = require('bluebird');
const _ = require('underscore');

let transactionCount = 100;
let convertCurrency = "EUR";

//set default params from args
_.each(process.argv, (val) => {
	let paramData = val.split("=");
	if(paramData.length === 2) {
		if(paramData[0] === 'count') {
			transactionCount = parseInt(paramData[1]);
		} else if(paramData[0] === 'currency') {
			convertCurrency = paramData[1].trim().toUpperCase();
		}
	}
});

const ratesInstance = require('./libs/rates');
const transactionsInstance = require('./libs/transactions');
ratesInstance.baseCurrency = convertCurrency;

let result = [];
let transactions = [];


for(let i = 0; i < transactionCount; i++) {
	transactions.push(transactionsInstance.getTransactions());
}

//get all needed transactions with parallels
BPromise.all(transactions).then((transactionsData) => {

	if(!_.isArray(transactionsData) || _.isEmpty(transactionsData)) {
		return;
	}

	//check all unique dates to avoid duplicates in requests to exchange api
	let ratesDates = [];
	_.each(transactionsData, (transaction) => {
		let prepareDate = moment(transaction.createdAt).format('YYYY-MM-DD');
		if(!_.contains(ratesDates, prepareDate)) {
			ratesDates.push(prepareDate);
		}
	});

	let rates = [];
	_.each(ratesDates, (date) => {
		rates.push(ratesInstance.getRates(date));
	});

	Promise.all(rates).then((ratesData) => {

		if(!_.isArray(ratesData) || _.isEmpty(ratesData)) {
			return;
		}

		//convert amount to set currency
		let convertedResults = [];
		_.each(transactionsData, (transaction) => {
			let prepareDate = moment(transaction.createdAt).format('YYYY-MM-DD');
			let ratesInfo = _.where(ratesData, {dateOrigin: prepareDate});

			if(!_.isArray(ratesInfo) || _.isEmpty(ratesInfo)) {
				return;
			}

			if(!_.has(ratesInfo[0].rates, transaction.currency)) {
				return;
			}

			let koeficient = ratesInfo[0].rates[transaction.currency];
			let convertedAmount = (transaction.amount / koeficient).toFixed(4);

			convertedResults.push({
				createdAt: transaction.createdAt,
				currency: convertCurrency,
				convertedAmount: parseFloat(convertedAmount),
				checksum: transaction.checksum
			});
		});

		//post trunsactions for checking
		transactionsInstance.postTrunsactions({transactions: convertedResults}).then((result) => {
			if(result.success) {
				console.log("SUCCESSFULLY FINISHED!!!");
			}
			console.log(result);
		}).catch((err) => {
			return;
		});


	}).catch((err) => {
		return;
	});

}).catch((err) => {
	return;
});
