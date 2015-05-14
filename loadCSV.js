var fs = require('fs');

//var csv is the CSV file with headers
function csvJSON(csv){
  var lines=csv.split("\n");
  var result = [];
  var headers=lines[0].split(",");
 
  for(var i=1;i<lines.length;i++){
    var obj = {};
    var currentline=lines[i].split(",");
 
    for(var j=0;j<headers.length;j++){
      obj[headers[j]] = currentline[j];
    }
 
    result.push(obj);
  }
  //return result; //JavaScript object
  return JSON.stringify(result); //JSON
}

function csvArray(csv) {
  var lines = csv.split("\n");
  var result = [];
  for(var i = 0 ; i < lines.length ; i++) {
    var currentline = lines[i].split(",");
    result.push(currentline);
  }
  return result;
}

var data = [];
data = fs.readFileSync('./temp.csv');
var json = csvJSON(data.toString());
console.log("JSON output:");
console.log(json);
var array = csvArray(data.toString());
console.log("Array output:");
console.log(array[2][0]);