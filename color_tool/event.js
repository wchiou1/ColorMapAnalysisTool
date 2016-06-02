
var image2DArray=[];
var imageWidth;
var imageHeight;
$(document).on('load',dropInit());
function dropInit(){
if(window.FileReader) { 
  addEventHandler(window, 'load', function() {
    var status = document.getElementById('status');
    var drop   = document.getElementById('drop');
    var list   = document.getElementById('list');
  	
    function cancel(e) {
       e.preventDefault(); 
	  console.log('something');
    }
	
    addEventHandler(drop, 'dragover', cancel);
    addEventHandler(drop, 'dragenter', cancel);
	addEventHandler(drop,'drop', function(e) {
		e = e || window.event;
		cancel(e);
        e.stopPropagation();
        
        var files = e.dataTransfer.files; // Array of all files
        for (var i=0, file; file=files[i]; i++) {
                var reader = new FileReader();
                reader.onload = function(e2) { // finished reading file data.
					//parse the data into the array
                    var lines=e2.target.result.split('\n');
					if(lines[lines.length-1]=="")lines.pop();
					imageHeight=lines.length;
					for(var i=0;i<lines.length;i++) {
						var values=lines[i].split(' ');
						if(values[values.length-1]=="\r")values.pop();
						if(!imageWidth){
							imageWidth = values.length;
						}else if(imageWidth!=values.length){
							alert('error reading the file. line:'+i+ ", num:"+values.length+", value=("+values[0]+")");
						}
						for(var j=0; j<values.length; j++){
							if(values[j]) image2DArray.push(Number(values[j]));
						}
					}
					console.log(image2DArray);
					console.log("height="+imageHeight);
					console.log("width="+imageWidth);
                }
                reader.readAsText(file); // start reading the file data.
			}
		}) 
  });
} else { 
  document.getElementById('status').innerHTML = 'Your browser does not support the HTML5 FileReader.';
}
}


function addEventHandler(obj, evt, handler) {
    if(obj.addEventListener) {
        // W3C method
        obj.addEventListener(evt, handler, false);
    } else if(obj.attachEvent) {
        // IE method.
        obj.attachEvent('on'+evt, handler);
    } else {
        // Old school method.
        obj['on'+evt] = handler;
    }
}
