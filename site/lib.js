function getImage(img, height, degrees, isSquare) {

    var canvasWidth = height;
    var canvasHeight = height;

    var h = img.height;
    var w = img.width;

    if (!isSquare) {
        if (degrees == 90 || degrees == 270) {
            w = img.height;
            h = img.width;
        }
        if (canvasHeight > h) {
            canvasHeight = h;
        }
        canvasWidth = w / h * canvasHeight;


    }

    var offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = canvasWidth;
    offscreenCanvas.height = canvasHeight;
    var context = offscreenCanvas.getContext('2d');

    var newWidth;
    var newHeight;


    if (w > h) {
        newHeight = canvasHeight;
        newWidth = newHeight * w / h;
    }
    else {
        newWidth = canvasWidth
        newHeight = newWidth * h / w;
    }



    var offsetX = 0, offsetY = 0;;

    if (isSquare) {
        if (newWidth > newHeight) {
            offsetX = (newHeight - newWidth) / 2;
        }
        else if (newHeight > newWidth) {
            offsetY = (newWidth - newHeight) / 2;
        }
    }

    context.translate(canvasWidth/2,canvasHeight/2);

    // rotate the canvas to the specified degrees
    context.rotate(degrees*Math.PI/180);

    if (!isSquare && (degrees == 270 || degrees == 90)) {
        context.drawImage(img,offsetX - canvasHeight/2,offsetY - canvasWidth/2,newHeight, newWidth)
    } else {
        context.drawImage(img,offsetX - canvasWidth/2,offsetY - canvasHeight/2,newWidth, newHeight)
    }

    return offscreenCanvas.toDataURL('image/jpeg');

}

function getOrientation(arrayBuffer) {
    var view = new DataView(arrayBuffer);
    if (view.getUint16(0, false) != 0xFFD8) return -2;
    var length = view.byteLength, offset = 2;
    while (offset < length) {
        var marker = view.getUint16(offset, false);
        offset += 2;
        if (marker == 0xFFE1) {
            if (view.getUint32(offset += 2, false) != 0x45786966) return -1;
            var little = view.getUint16(offset += 6, false) == 0x4949;
            offset += view.getUint32(offset + 4, little);
            var tags = view.getUint16(offset, little);
            offset += 2;
            for (var i = 0; i < tags; i++)
                if (view.getUint16(offset + (i * 12), little) == 0x0112)
                    return (view.getUint16(offset + (i * 12) + 8, little));
        }
        else if ((marker & 0xFF00) != 0xFF00) break;
        else offset += view.getUint16(offset, false);
    }
    return -1;

}

function arrayBufferToBase64( buffer, callback ) {
    var blob = new Blob([buffer],{type:'application/octet-binary'});
    var reader = new FileReader();
    reader.onload = function(evt){
        var dataurl = evt.target.result;
        callback(dataurl.substr(dataurl.indexOf(',')+1));
    };
    reader.readAsDataURL(blob);
}

function remove(i) {
    delete FR[i];
    delete images[i];
    $("#preview_" + i).remove();
}

function view(i) {

    var full = new Image();
    full.src = getImage(images[i],720,FR[i].rotate, false);

    $(".modal-body").empty();
    $(".modal-body").append(full);
    $("#myModal").modal('show')
    $("#myModal")

}