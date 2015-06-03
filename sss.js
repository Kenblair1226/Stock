var url = require('urllib');
var fs = require('fs');
var iconvlite = require('iconv-lite');
var holidays = require('./holidays.js').holidays;

function getAfterMarket(date) {
	return function(callback) { setTimeout(function() {
	var results = [];

	var year = date.getFullYear().toString();
	var month = (date.getMonth()+1).toString().length === 2 ? 
				(date.getMonth()+1).toString() : 
				"0"+(date.getMonth()+1).toString();
	var day = date.getDate().toString().length === 2 ? 
			   date.getDate().toString() :
			  "0"+date.getDate().toString();

	var dailyStock = "http://www.twse.com.tw/ch/trading/exchange/MI_INDEX/MI_INDEX3_print.php?genpage=genpage/Report" +
					  year + month + "/A112" + year + month + day + "ALL_1.php&type=csv";

	url.request(dailyStock, function(err, data, res) {
		//if(err) console.log(err);

		if(data === undefined || data.length === 0)
		{
			console.log("Get data error on: " + date);
			return;
		}

		content = iconvlite.decode(data, 'Big-5');

		var temp = content.indexOf('\u4e0a\u6f32(\u6f32\u505c)');  // 上漲(漲停)
		var str = content.substring(temp, content.indexOf('\n', temp));  // 上漲(漲停),"2,289(9)",173(4)
		var reg = str.match(/\"\,(\d+)\((\d+)\)/);
		if(reg === null || reg.length !== 3)
		{
			console.log("Parse data error on: " + date);
			return;
		}
		results.push(parseInt(reg[1]));
		results.push(parseInt(reg[2]));

		temp = content.indexOf('\u4e0b\u8dcc(\u8dcc\u505c)');  // 下跌(跌停)
		str = content.substring(temp, content.indexOf('\n', temp));  // 下跌(跌停),"4,225(39)",620(7)
		reg = str.match(/\"\,(\d+)\((\d+)\)/);
		if(reg === null || reg.length !== 3)
		{
			console.log("Parse data error on: " + date);
			return;
		}
		results.push(parseInt(reg[1]));
		results.push(parseInt(reg[2]));

		var result_buf = date + ', ' + results + '\n';
		fs.writeFileSync('./results.csv', result_buf, {flag: 'a'});
		return results;
	});
	if(typeof callback == 'function') callback();
	}, 500)};
}

Date.prototype.addDays = function(days) {
    var dat = new Date(this.valueOf())
    dat.setDate(dat.getDate() + days);
    return dat;
}

function getDates(startDate, stopDate) {
    var dateArray = new Array();
    var currentDate = startDate;
    while (currentDate <= stopDate) {
        dateArray.push( new Date (currentDate) )
        currentDate = currentDate.addDays(1);
    }
    return dateArray;
}

function executeTasks() {
    var tasks = Array.prototype.concat.apply([], arguments);
    var task = tasks.shift();
    task(function() {
        if(tasks.length > 0)
            executeTasks.apply(this, tasks);
    });
}

var start = new Date('2015/05/01');
var today = new Date();
var dateArray = getDates(start, today);
var tsks = [];

// var old_results = fs.readFileSync('./result.csv');
// old_results = old_results.split('\n');
// var num = old_results.length;


for(var i = 0 ; i < dateArray.length ; i++)
{
	if(dateArray[i] >= today ||
	   dateArray[i].getDay() === 6 || dateArray[i].getDay() === 0)
		continue;
	if(holidays.indexOf(dateArray[i].toString()) < 0)
		tsks.push(getAfterMarket(dateArray[i]));
}

executeTasks(tsks);
