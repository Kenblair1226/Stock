/// <reference path="typings/node/node.d.ts"/>
var url = require('urllib');
var Promise = require('promise');
var Parse = require('parse').Parse;
var async = require('async');

var TWSE_HOST = 'http://www.twse.com.tw';
var Stock = Parse.Object.extend('TWStocks');

// fetch and update monthly aftermarket data for stock_no on y/m
function updateMonthly(stock_no, latest_date, today) {
	return new Promise( function(resolve, reject) {
		if(today instanceof Date)
		{
			var year = today.getFullYear();
			var month = today.getMonth()+1;
		} else 	{
			reject('must give date for fetching');
		}
	
		if (typeof stock_no !== 'number')
		{
			stock_no = parseInt(stock_no);
			if( stock_no === 'NaN')
			{
				console.log('Can\'t find stock number' );
				reject('Can\t find stock number');
			}
		}
	
		var monStock = TWSE_HOST + '/ch/trading/exchange/' +
	            'STOCK_DAY/STOCK_DAY_print.php?genpage=genpage/' +
	            'Report' + year + (("0" + month).slice(-2)) + '/' + year + (("0" + month).slice(-2)) + 
				'_F3_1_8_' + stock_no + '.php' + '&type=csv';
	            //ex: http://www.twse.com.tw/ch/trading/exchange/STOCK_DAY/STOCK_DAY_print.php?
	            //    genpage=genpage/Report201505/201505_F3_1_8_2330.php&type=csv
				
		//console.log('fetching ' + monStock);
		url.request(monStock, {timeout:600000})
		.then(function(result) {
			var parsed_data = to_list(result.data.toString());
			//console.log('There are ' + parsed_data.length + ' records in ' + 
			//	parsed_data[0].t.getFullYear() + '/' + (parseInt(parsed_data[0].t.getMonth())+1));
			var entryArray = [];
			for(var i = 0 ; i < parsed_data.length ; i++)
			{
				// the parsed_data is sorted in chronological order, newest first
				// so if we find an entry already existed, we know parse has the rest
				if(parsed_data[i].t <= latest_date)
					break;
				var entry = new Stock();
				entry.set('stock_no', stock_no);
				entry.set('t', parsed_data[i].t);
				entry.set('a', parsed_data[i].a);
				entry.set('v', parsed_data[i].v);
				entry.set('o', parsed_data[i].o);
				entry.set('h', parsed_data[i].h);
				entry.set('l', parsed_data[i].l);
				entry.set('c', parsed_data[i].c);
				entry.set('p', parsed_data[i].p);
				entry.set('n', parsed_data[i].n);
				entryArray.push(entry);
			}
			//console.log('Adding ' + entryArray.length + ' new records.');
			// save all created objects
			return Parse.Object.saveAll(entryArray);
		}).catch(function(err) {
			console.error(err.toString());
			reject(err.toString());
		})
		.then(function(obj) {
			resolve(obj.length);
		}, function(err) {
			reject(err.toString());
		});
	});
}

// parse the data from fetch_raw and return sorted
// newest entry first
function to_list(data){
	var list = [];
	data = data.split('\n');
	for(var i = 2 ; i < data.length ; i++)
	{
		if(data[i].length <= 0)
			continue;
		var temp = data[i].split(/,(?=(?:(?:[^\"]*\"){2})*[^\"]*$)/, -1);
		var item = {};
		var year = parseInt(temp[0].substring(0,temp[0].indexOf('/'))) + 1911;
		var date = new Date(temp[0]);
		date.setYear(year);
		item.t = date;
		item.a = parseFloat(temp[1].replace(/"/g, '').replace(/,/g, '')); 	// 成交量
		item.v = parseFloat(temp[2].replace(/"/g, '').replace(/,/g, '')); 	// 成交值
		item.o = parseFloat(temp[3].replace(/,/g, ''));						// 開盤價
		item.h = parseFloat(temp[4].replace(/,/g, ''));						// 最高價
		item.l = parseFloat(temp[5].replace(/,/g, ''));						// 最低價
		item.c = parseFloat(temp[6].replace(/,/g, ''));						// 收盤價
		item.p = temp[7]; 													// 價差百分比
		item.n = parseFloat(temp[8].replace(/"/g, '').replace(/,/g, '')); 	// 成交筆數
		list.push(item);
	}
	return list.sort().reverse();
}

function Fetch(stock_no) {
	return new Promise( function(resolve, reject) {
		var query = new Parse.Query(Stock);
		query.equalTo('stock_no', stock_no);
		query.descending('t').first().then(function(latest) {
			if( latest === undefined)
			{
				// get data up to 10 years
				var latest_date = new Date('2004/12/31');;
			} else {
				var latest_date = latest.get('t');
			}
			var today = new Date();
			today.setHours(0,0,0,0);
			//console.log('today:\t' + today + '\nlatest:\t' + latest_date);
			if(	today.getTime() === latest_date.getTime())
			{
				console.log('Already has the up-to-date data...');
				return;
			}
			
			var arr = [];
			for(var i = 0 ; today > latest_date ; i++)
			{
				arr.push(dummy(stock_no, latest_date, new Date(today.getTime())));
				arr.push(sleep(1000));
				today.setMonth(today.getMonth()-1);
			}
			async.series(arr, function(err, results) {
				if(err) {
					reject("async error: " + err.toString());
					return;
				}
				var total = 0;
				for(var i = 0 ; i < results.length ; i++)
				{
					total += results[i];
				}
				resolve(total);
			});
		});
	});
}

function sleep(milliseconds) {
	return function(callback) {
		var start = new Date().getTime();
		for (var i = 0; i < 1e7; i++) {
			if ((new Date().getTime() - start) > milliseconds){
				break;
			}
		}
		callback(null, 0);
	}
}

// dummy function to avoid function-in-a-loop (ES5 restriction)
function dummy(stock_no, latest_date, today) {
	return function(callback) {
		updateMonthly(stock_no, latest_date, today)
			.then( function(ret) {
				console.log(ret + ' records were added for ' + stock_no + 
					" for " + today.getFullYear() + "/" + parseInt(today.getMonth()+1));
				callback(null, ret);
			}, function(e) {
				callback(e.toString());
			});
	}
}

module.exports.Fetch = Fetch;