var Fetch = require('./fetch.js').Fetch;
var Parse = require('parse').Parse;
var async = require('async');

Parse.initialize("YOUR_APP_ID", "YOUR_JAVASCRIPT_KEY");

var Stock_list = Parse.Object.extend('TWSE_list_20150610');
var query = new Parse.Query(Stock_list);
var func_list = [];
query.limit(1000);
query.ascending('Stock_no').find({
	success: function(results) {
		for(var i = 0 ; i < results.length ; i++)
		{
			func_list.push(results[i].get('Stock_no'));
		}
		async.mapSeries(func_list, function(stock_no, callback) {
			Fetch(stock_no)
			.then(function(total) { callback(null, total)},
				function(err) {callback(err)})
		}, function(err, results) {
			if (err) console.error(err.toString());
			console.log('Fetch all finished!');
		});
	},
	error: function(error) {
		console.error(error.toString());
	}
});