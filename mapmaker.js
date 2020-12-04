module.exports = class TwoDMap {

    constructor(startX, startY, size, minDistance) {
        this.startX = startX;
        this.startY = startY;
        this.size = size+1;
        this.minDistance = typeof(minDistance) == 'number' ? minDistance : 0;
        this.maparray = [];
    }

    generateNow () {
        for(var k = 1; k < this.size; k++) {
            this.store(this.startX, this.startY + k, k);
            this.store(this.startX, this.startY - k, k);
            this.store(this.startX + k, this.startY, k);
            this.store(this.startX - k, this.startY, k);
        }
        for (var i = 1; i < this.size; i++) {
            this.genYaxis(this.startX+i, this.startY, this.size);
            this.genYaxis(this.startX-i, this.startY, this.size);
        }
    }

    genYaxis(posX, posY, factor) {
        for (var j = 1; j < factor; j++) {
            this.store2(posX, posY+j);
            this.store2(posX, posY-j);
        }
    }
    
    store2(xVal, yVal) {
        let distance = this.pythagorean(this.startX - xVal, this.startY - yVal);
        if (distance > this.minDistance)
        this.maparray.push({x: xVal, y: yVal, d: (Math.round( distance * 1e2 ) / 1e2)*1e2, k: `${xVal}/${yVal}`});
    }

    store(xVal, yVal, distance) {
        if (distance > this.minDistance)
        this.maparray.push({x: xVal, y: yVal, d: distance * 1e2, k: `${xVal}/${yVal}`});
    }

    pythagorean(sideA, sideB){
        return Math.sqrt(Math.pow(Math.abs(sideA), 2) + Math.pow(Math.abs(sideB), 2));
    }
}