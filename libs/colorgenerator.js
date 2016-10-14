function genColor(h){
	return HSVtoRGB(h/360, 1, 1);
}

/* accepts parameters
 * h  Object = {h:x, s:y, v:z}
 * OR 
 * h, s, v
*/
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}




module.exports = function(args){

    var can = args.can;
    var fps = args.fps;
    var stop = function(){};

    can.on('params:changed', function(args) {
        if(args.fps !== fps){
            fps = args.fps;
        }
    });

    can.on('color:change_regim', function(regim){
        stop();

        if(regim === 'hue'){
            var hue = 0;
            var currentColor = genColor(hue);
            var delay = 1000/fps;
            
            var intF = setInterval(function(){
                
                hue = (hue+1)%360;
                
                currentColor = genColor(hue);
                can.emit('color:new', currentColor);
            }, delay);

            stop = function() {
                clearInterval(intF);
            }
        }
    });
}