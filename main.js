var Fetch = require('./fetch.js').Fetch;
var Parse = require('parse').Parse;



var Stock_list = Parse.Object.extend('TWSE_list_20150610');
var query = new Parse.Query(Stock_list);
query.limit(1000);
query.ascending('Stock_no').find({
	success: function(results) {
		for(var i = 0 ; i < results.length ; i++)
		{
			arrangeTasks(i, results[i]);
		}
	},
	error: function(error) {
		console.error(error.toString());
	}
});

function arrangeTasks(i, obj)
{
	setTimeout(function() {
		Fetch(obj.get('Stock_no'));
	}, 1000*60*3*i);
}