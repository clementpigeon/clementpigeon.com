var Mondrian = (function ($, _, createjs) {

    var stageWidth = 600,
        stageHeight = 800,
        $canvas = $('#display'),
        isFirst = false,
        colors = ['#f00', '#ff0', '#00f', '#000'],
        rectangles = [];


    function setup() {
        var stage = new createjs.Stage('display');
        setBackground(stage);
        isFirst = true;

        var first_rect = new Rect(0,0, stageWidth, stageHeight);
        rectangles.push(first_rect);

        document.getElementById('download_link').addEventListener('click', function() {
            downloadCanvas(this, 'display', 'mondrian.png');
        }, false);

        // hack to prevent dblclick from selection adjacent text
        var canvas = document.getElementById('display');
        canvas.onselectstart = function () {
            return false;
        };

        // distinguish click from dblckick
        $canvas
          .on('click', function(e) {
            var that = this;
            setTimeout(function() {
                var dblclick = parseInt($(that).data('double'), 10);
                if (dblclick > 0) {
                    $(that).data('double', dblclick-1);
                } else {
                    onSingleClick.call(that, e, stage);
                }
            }, 300);
          })
          .on('dblclick', function(e) {
            $(this).data('double', 2);
            onDoubleClick.call(this, e, stage);
        });

        createjs.Ticker.setFPS(40);
        createjs.Ticker.addEventListener('tick', function(){
            stage.update();
        });

    }


    function Rect(left, top, right, bottom){
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;

        this.width = function (){
            return this.right - this.left;
        };

        this.height = function (){
            return this.bottom - this.top;
        };

        this.intersects = function(otherRect) {
            return (this.left < otherRect.right &&
              otherRect.left < this.right &&
              this.top < otherRect.bottom &&
              otherRect.top < this.bottom);
        };
    }

    function calculateLinesEnds(click_point, rectangles) {
        // vertical line, click_point.x constant
        var y_min = 0;
        var y_max = stageHeight;
        var x_min = 0;
        var x_max = stageWidth;

        var coloredRectangles = _(rectangles).select(function(rect){return rect.color;});

        coloredRectangles.forEach(function(rect){
            if (click_point.x > rect.left && click_point.x < rect.right ){  // the vertical line crosses the rectangle
                if (click_point.y < rect.top){ // click_point.y is above the rect
                    if (y_max > rect.top){
                        y_max = rect.top;
                    }
                }
                else if (y_min < rect.bottom){  // click_point.y is below the rect
                    y_min = rect.bottom;
                }
            }
        });

        coloredRectangles.forEach(function(rect) {
            if (click_point.y > rect.top && click_point.y < rect.bottom ){  // the horizontal line crosses the rectangle
                if (click_point.x < rect.left){ // click_point.y is above the rect
                    if (x_max > rect.left){
                        x_max = rect.left;
                    }
                }
                else if (x_min < rect.right){  // click_point.y is below the rect
                    x_min = rect.right;
                }
            }
        });

        var result = {
            x_min: x_min,
            y_min: y_min,
            x_max: x_max,
            y_max: y_max
        };

        return result;
    }

    function updateRectArray(click_point, linesEnds, rectangles){
        // vertical line
        var newRectArray1 = [];

        var verticalLine = new Rect(click_point.x, linesEnds.y_min, click_point.x, linesEnds.y_max);

        rectangles.forEach(function(rect){
            if (rect.intersects(verticalLine)){
                var leftRect = new Rect(rect.left, rect.top, click_point.x - 5, rect.bottom);
                var rightRect = new Rect(click_point.x + 5, rect.top, rect.right, rect.bottom);
                newRectArray1.push(leftRect);
                newRectArray1.push(rightRect);
            }
            else {
                newRectArray1.push(rect);
            }
        });

        // horizontal line
        var horizontalLine = new Rect(linesEnds.x_min, click_point.y, linesEnds.x_max, click_point.y);
        var newRectArray2 = [];

        newRectArray1.forEach(function(rect){
            if (rect.intersects(horizontalLine)){
                var topRect = new Rect(rect.left, rect.top, rect.right, click_point.y - 5);
                var bottomRect = new Rect(rect.left, click_point.y + 5, rect.right, rect.bottom);
                newRectArray2.push(topRect);
                newRectArray2.push(bottomRect);
            }
            else {
                newRectArray2.push(rect);
            }
        });
        return newRectArray2;
    }

    function onSingleClick(event, stage) {
        var click_point = new createjs.Point(event.offsetX, event.offsetY);

        var linesEnds = calculateLinesEnds(click_point, rectangles);

        rectangles = updateRectArray(click_point, linesEnds, rectangles);

        drawLinesFromPoint(stage, click_point, linesEnds, function(){
            if (isFirst){
                isFirst = false;
            } else {
                colorizeRandomRect(rectangles, stage);
            }
        });
    }

    function colorizeRandomRect(rectangles, stage){
        var new_colorized = selectRectToColorize(rectangles);
        var new_color = selectColor();
        colorizeRect(stage, new_colorized, new_color);
    }

    function onDoubleClick(event, stage) {
        var click_point = new createjs.Point(event.offsetX, event.offsetY);
        // console.log('dblclick on ' + click_point.y + ', ' + click_point.y);

        var rect = whichRect(click_point, rectangles);
        var new_color = selectColor(rect.color);
        colorizeRect(stage, rect, new_color);
    }


    function selectRectToColorize(rectangles){
        return (_.sample(_(rectangles).reject(function(rect)
            {return rect.color;}
            )
        ));
    }

    function selectColor(current_color){
        if (current_color){
            var current_index = colors.indexOf(current_color);
            return (current_index + 1) >= colors.length ? colors[0] : colors[current_index + 1];
        }
        else {
            return _.sample(colors);
        }
    }

    function colorizeRect(stage, rect, color){
        var filling = new createjs.Shape();
        filling.graphics.beginFill(color);
        filling.graphics.drawRect(0, 0, rect.right - rect.left, rect.bottom - rect.top);
        filling.x = rect.left;
        filling.y = rect.top;
        rect.color = color;
        stage.addChild(filling);
    }

    function setBackground(stage, color){
        var whiteBG = new createjs.Shape();
        color = color || '#ffffff';
        whiteBG.graphics.beginFill(color);
        whiteBG.graphics.drawRect(0, 0, 600, 800);
        whiteBG.x = 0;
        whiteBG.y = 0;
        stage.addChild(whiteBG);
    }

    // function drawPoint(click_point){
    //  var origin = new createjs.Shape();
    //  origin.graphics.beginFill("#f00").drawRect(-3, -3, 6, 6);
    //  origin.x = click_point.x;
    //  origin.y = click_point.y;
    //  stage.addChild(origin);
    // };

    function drawLinesFromPoint(stage, click_point, linesEnds, completeCallback){
        // vertical line
        var duration = 2000;

        var h_line = new createjs.Shape();
        h_line.graphics.beginFill('#000');

        var h_line_min = linesEnds.x_min;
        var h_line_max = linesEnds.x_max;

        h_line.graphics.drawRect(0, -5, h_line_max -  h_line_min, 10);
        h_line.x = click_point.x;
        h_line.y = click_point.y;
        h_line.scaleX = 0;
        createjs.Tween.get(h_line).to({scaleX: 1, x: h_line_min}, duration);

        // vertical line, with callback
        var v_line = new createjs.Shape();
        v_line.graphics.beginFill('#000');

        var v_line_min = linesEnds.y_min;
        var v_line_max = linesEnds.y_max;

        v_line.graphics.drawRect(- 5, 0, 10, v_line_max - v_line_min);
        v_line.x = click_point.x;
        v_line.y = click_point.y;

        v_line.scaleY = 0;
        createjs.Tween.get(v_line).to({scaleY: 1, y: v_line_min}, duration).call(completeCallback);

        stage.addChild(h_line);
        stage.addChild(v_line);
    }

    function whichRect(point, rectangles){
        var result;
        rectangles.forEach(function(rect){
            if (point.x > rect.left && point.x < rect.right && point.y > rect.top && point.y < rect.bottom ) {
                result = rect;
            }
        });
        return result;
    }

    function downloadCanvas(link, canvasId, filename) {
        link.href = document.getElementById(canvasId).toDataURL();
        link.download = filename;
    }

    return {
        setup: setup
    };

})($, _, createjs);

Mondrian.setup();


