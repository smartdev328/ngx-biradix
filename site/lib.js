function getImage(img, height, degrees, isSquare) {

    var canvasWidth = height;
    var canvasHeight = height;

    if (!isSquare) {
        if (canvasHeight > img.height) {
            canvasHeight = img.height;
        }
        canvasWidth = img.width / img.height * canvasHeight;

        if (degrees == 90 || degrees == 270) {
            var temp = canvasWidth;
            canvasWidth = canvasHeight;
            canvasHeight = temp;
        }
    }

    var offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = canvasWidth;
    offscreenCanvas.height = canvasHeight;
    var context = offscreenCanvas.getContext('2d');

    var newWidth;
    var newHeight;


    if (img.width > img.height) {
        newHeight = height;
        newWidth = newHeight * img.width / img.height;
    }
    else {
        newWidth = height
        newHeight = newWidth * img.height / img.width;

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

    context.translate(height/2,height/2);

    // rotate the canvas to the specified degrees
    context.rotate(degrees*Math.PI/180);

    context.drawImage(img,offsetX - height/2,offsetY - height/2,newWidth,newHeight)

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