var url = require('urllib');
var promise = require('promise');

var TWSE_HOST = 'http://www.twse.com.tw';

function fetch_raw(stock_no, year, month) {
	return new promise( function(resolve, reject){
		if(year === undefined || month === undefined)
		{
			console.log('Which date?');
			reject('Which date?');
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
	            'Report' + year + month + '/' + year + month + '_F3_1_8_' + stock_no + '.php' +
	            '&type=csv';
	            //ex: http://www.twse.com.tw/ch/trading/exchange/STOCK_DAY/STOCK_DAY_print.php?
	            //    genpage=genpage/Report201505/201505_F3_1_8_2330.php&type=csv

		url.request(monStock, function(err, data, res) {
			//if(err) console.log(err);

			if(data === undefined || data.length === 0)
			{
				console.log("Get data error on: " + monStock);
				reject("Get data error on: " + monStock);
			}
			resolve( data.toString() );
		});
	});
}

function to_list(data){
	var list = [];
	data = data.split('\n');
	for(var i = 2 ; i < data.length ; i++)
	{
		if(data[i].length <= 0)
			continue;
		var temp = data[i].split(/,(?=(?:(?:[^\"]*\"){2})*[^\"]*$)/, -1);
		temp = temp.map(function(item) { 
			if(item.indexOf('/') > 0)
			{
				var year = parseInt(item.substring(0,item.indexOf('/'))) + 1911;
				var date = new Date(item);
				return date.setYear(year);
			}
			else
				return parseFloat(item.replace(/"/g, '').replace(/,/g,'')); 
		});
		temp[0] = new Date(temp[0]);
		list.push(temp);
	}
	return list;
}

var fetch_data = fetch_raw(2330, '2015', '05');

fetch_data.then(function(data) { 
	try {
		var parsed_data = to_list(data);
		console.log('There are ' + parsed_data.length + ' records in ' + 
			parsed_data[0][0].getFullYear() + '/' + (parseInt(parsed_data[0][0].getMonth())+1));
	} catch (e) {
		console.log(e);
	}
});

