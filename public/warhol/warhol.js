var Warhol = (function ($, _, createjs) {

    var mainCanvasWidth = 900,
        mainCanvasHeight = 500,
        stage = new createjs.Stage($('#display').get(0)),
        bg_color = '#be1c18', // red
        imageSrc;

    function setup() {
        // stage = new createjs.Stage($('#display').get(0));

        $('#pape').on('click', function(e) {
            imageSrc = 'img/pape.jpg';
            redraw();
        });
        $('#wtc').on('click', function(e) {
            imageSrc = 'img/wtc.gif';
            redraw();
        });
        $('#sarkozy').on('click', function(e) {
            imageSrc = 'img/france_forte.jpg';
            redraw();
        });
        $('#hollande').on('click', function(e) {
            imageSrc = 'img/hollande.jpg';
            redraw();
        });

        $('#red').on('click', function(e) {
            bg_color = '#be1c18';
            redraw();
        });
        $('#blue').on('click', function(e) {
            bg_color = '#00688B';
            redraw();
        });

        $('#gold').on('click', function(e) {
            bg_color = '#DAA520';
            redraw();
        });

        $('#fileupload').fileupload({
            dataType: 'json',
            done: function (e, data) {
                console.log(data.result.photo_path);
                imageSrc = data.result.photo_path;
                redraw();
            }
        });
        // hack to replace link by button
        $('#fileupload_button').click(function(e) {
            e.preventDefault();
            $('#fileupload').click();
        });

        document.getElementById('download_link').addEventListener('click', function() {
            downloadCanvas(this, 'display', 'red_disaster.png');
        }, false);

        // hack to replace link by button
        $('#download_button').click(function(e) {
            e.preventDefault();
            document.getElementById('download_link').click();
        });
    }



    function redraw() {
        processImage(imageSrc, function(displayImageData){
            emptyCanvas(stage, bg_color);
            drawAll(stage, displayImageData);
        });
    }

    function processImage(imageSrc, next) {
        var displayImage = new Image();
        displayImage.src = imageSrc;

        $(displayImage).load(function(){
            // create a temporary canvas to use getImageData
            var tempCanvas = document.createElement('canvas');
            tempCanvas.width = displayImage.width;
            tempCanvas.height = displayImage.height;

            var tempContext = tempCanvas.getContext('2d');
            tempContext.drawImage(displayImage, 0, 0);

            var displayImageData = tempContext.getImageData(0, 0, displayImage.width, displayImage.height);

            greyscale_luminance(displayImageData);
            dither_atkinson(displayImageData, tempCanvas.width);
            replace_colours(displayImageData);

            next(displayImageData);
        });
    }

    function emptyCanvas (stage, bg_color) {
        stage.clear();
        stage.removeAllChildren();
        setBackground(stage, bg_color);
    }

    function drawAll(stage, displayImageData) {
        var displayCanvas = document.createElement('canvas');
        displayCanvas.width = displayImageData.width;
        displayCanvas.height = displayImageData.height;

        var displayContext = displayCanvas.getContext('2d');
        displayContext.putImageData(displayImageData, 0, 0);

        var verticalOffset = randomIntBetween(14, 26);
        var height;
        var width = 200;
        var horizontalRepeat = (mainCanvasWidth - 350) / width;

        while (verticalOffset < mainCanvasHeight - (width * 0.5)) {
            var horizontalOffset = randomIntBetween(8, 28);
            for (var i = 0; i < horizontalRepeat; i++){
                height = drawOne(stage, displayCanvas, horizontalOffset, verticalOffset, width);
                horizontalOffset += width + randomIntBetween(-9, 1);
            }
            verticalOffset += height + randomIntBetween(-6, 1);
        }
    }

    function randomIntBetween(min, max) {
        return Math.round( Math.random() * (max - min)) + min;
    }

    function drawOne(stage, img, x, y, width) {
        var bitmap = new createjs.Bitmap(img);
        stage.addChild(bitmap);

        bitmap.x = x;
        bitmap.y = y;

        var targetWidth = width;
        var bounds = bitmap.getBounds();
        var bitmapWidth = bounds.width;
        var ratio =  targetWidth / bitmapWidth;
        bitmap.scaleX = ratio;
        bitmap.scaleY = ratio;
        var bitmapHeight = bounds.height * ratio;
        bitmap.cache();

        bitmap.filters = [
            new createjs.BlurFilter(1, 2, 1)
        ];

        bitmap.cache(0, 0, width / ratio, bitmapHeight / ratio);

        stage.update();
        return bitmapHeight;
    }

    // Convert image data to greyscale based on luminance.
    function greyscale_luminance (image) {
        for (var i = 0; i <= image.data.length; i += 4) {
            image.data[i] = image.data[i + 1] = image.data[i + 2] = parseInt(image.data[i] * 0.21 + image.data[i + 1] * 0.71 + image.data[i + 2] * 0.07, 10);
        }
        return image;
    }

    // Apply Atkinson Dither to Image Data
    function dither_atkinson (image, imageWidth) {
        var skipPixels = 4;
        var imageLength = image.data.length;

        for (var currentPixel = 0; currentPixel <= imageLength; currentPixel += skipPixels) {
            var newPixelColour;
            if (image.data[currentPixel] <= 128) {
                newPixelColour = 0;
            } else {
                newPixelColour = 255;
            }

            var err = parseInt((image.data[currentPixel] - newPixelColour) / 8, 10);
            image.data[currentPixel] = newPixelColour;

            image.data[currentPixel + 4] += err;
            image.data[currentPixel + 8] += err;
            image.data[currentPixel + (4 * imageWidth) - 4] += err;
            image.data[currentPixel + (4 * imageWidth)] += err;
            image.data[currentPixel + (4 * imageWidth) + 4] += err;
            image.data[currentPixel + (8 * imageWidth)] += err;

            image.data[currentPixel + 1] = image.data[currentPixel + 2] = image.data[currentPixel];
        }

        return image.data;
    }

    function replace_colours (image) {
        var black = {
            r: 0,
            g: 0,
            b: 0,
            a: 255
        };
        var white = {
            r: 255,
            g: 255,
            b: 255,
            a: 0
        };

        for (var i = 0; i <= image.data.length; i += 4) {
            image.data[i] = (image.data[i] < 127) ? black.r : white.r;
            image.data[i + 1] = (image.data[i + 1] < 127) ? black.g : white.g;
            image.data[i + 2] = (image.data[i + 2] < 127) ? black.b : white.b;
            image.data[i + 3] = (((image.data[i] + image.data[i + 1] + image.data[i + 2]) / 3) < 127) ? black.a : white.a;
        }
    }

    function setBackground(stage, color) {
        var bg = new createjs.Shape();
        bg.graphics.beginFill(color);
        bg.graphics.drawRect(0, 0, mainCanvasWidth, mainCanvasHeight);
        bg.x = 0;
        bg.y = 0;
        stage.addChild(bg);
    }

    function downloadCanvas(link, canvasId, filename) {
        link.href = document.getElementById(canvasId).toDataURL();
        link.download = filename;
    }

    return {
        setup: setup
    }
}
)($, _, createjs);

Warhol.setup();



