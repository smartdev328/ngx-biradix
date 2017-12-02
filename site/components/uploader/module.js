angular.module('biradix.global').directive('uploader', function () {
    return {
        restrict: 'E',
        scope: {
            input: '=',
            output: '=',
        },
        controller: function ($scope, $element,toastr, $uibModal) {
            $scope.globalIndex = 0;
            $scope.FileReaders = [];
            $scope.canUpload = false;

            $scope.readImage = function(upload) {
                if ( upload.files) {
                    for (var i = 0; i < upload.files.length; i++) {
                        if (upload.files[i].size > $scope.input.maxFileSizeMB * 1024 * 1024) {
                            toastr.error("<B>" + upload.files[i].name +"</B> exceeds <B>"+$scope.input.maxFileSizeMB+"MB</B> limit.");
                            continue;
                        }

                        $scope.FileReaders[$scope.globalIndex] = new FileReader();
                        $scope.FileReaders[$scope.globalIndex].custom = {
                            uploadIndex : $scope.globalIndex,
                            fileName : upload.files[i].name
                        };

                        $scope.FileReaders[$scope.globalIndex].onload = $scope.fileReaderLoaded;

                        $scope.FileReaders[$scope.globalIndex].readAsArrayBuffer(upload.files[i]);
                        $scope.globalIndex++;
                        $scope.canUpload = true;


                    }

                }
            }

            $scope.fileReaderLoaded = function(e) {
                this.custom.orientation = $scope.getOrientation(e.target.result);

                this.custom.rotate = 0;

                if (this.custom.orientation == 6) {
                    this.custom.rotate = 90;
                }
                else
                if (this.custom.orientation == 8) {
                    this.custom.rotate = 270;
                }
                else
                if (this.custom.orientation == 3) {
                    this.custom.rotate = 180;
                }

                var _fileReader = this;

                var img = new Image();
                img.addEventListener("error", function (e) {
                    toastr.error("<B>" + _fileReader.custom.fileName +"</B> is not a valid image.");
                    _fileReader.custom = null;
                });

                img.addEventListener("load", function () {

                    if (img.width < $scope.input.thumbHeight || img.height < $scope.input.thumbHeight) {
                        toastr.error("<B>" + _fileReader.custom.fileName +"</B> ("+img.width+"x"+img.height+") did not meet minimum requirement of "+$scope.input.thumbHeight+"x"+$scope.input.thumbHeight+".");
                        _fileReader.custom = null;
                        return
                    }
                    _fileReader.custom.thumb = $scope.getImage(img,$scope.input.thumbHeight,_fileReader.custom.rotate, true);;
                    _fileReader.custom.image = img;
                });

                $scope.arrayBufferToBase64(e.target.result, function(data) {
                    img.src = "data:image/jpg;base64,"+data;
                })
            }


            $scope.getOrientation = function(arrayBuffer) {
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

            $scope.arrayBufferToBase64 = function( buffer, callback ) {
                var blob = new Blob([buffer],{type:'application/octet-binary'});
                var reader = new FileReader();
                reader.onload = function(evt){
                    var dataurl = evt.target.result;
                    callback(dataurl.substr(dataurl.indexOf(',')+1));
                };
                reader.readAsDataURL(blob);
            }

            $scope.getImage = function(img, height, degrees, isSquare) {

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

            $scope.remove = function(index) {
                $scope.FileReaders[index].custom = null;
                $scope.canUpload = _.find($scope.FileReaders, function(x) {return x.custom && x.custom.thumb})
            }

            $scope.view = function(index) {

                $uibModal.open({
                    template: '<div><a href ng-click="cancel()"><img ng-src="{{src}}" style="width:100%"></a></div>',
                    size: "lg",
                    backdrop: 'static',
                    keyboard: true,
                    resolve: {
                        src: function () {
                            return $scope.getImage($scope.FileReaders[index].custom.image,$scope.input.fullHeight,$scope.FileReaders[index].custom.rotate, false);
                        },
                    },
                    controller: function($scope, $uibModalInstance,src){
                        $scope.src = src;
                        $scope.cancel = function () {
                            $uibModalInstance.dismiss('cancel');
                        };
                    }
                });

            }
        },
        templateUrl: '/components/uploader/template.html?bust=' + version
    }
})