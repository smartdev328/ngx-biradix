angular.module('biradix.global').directive('uploader', function () {
    return {
        restrict: 'E',
        scope: {
            input: '=',
            output: '=',
        },
        controller: function ($scope, $element,toastr, $uibModal) {
            $scope.FileReaders = [];
            $scope.canUpload = false;
            $scope.loading = false;
            $scope.uploads = [];

            $scope.readImage = function(upload) {
                $scope.canUpload = false;
                $scope.loading = false;

                var reader = new FileReader();
                var files = [];
                Array.prototype.push.apply( files, upload.files );
                var globalIndex = 0;

                files.forEach(function() {
                    $scope.uploads.push({
                        loaded : false
                    });
                })

                function process_one() {
                    var single_file = files.pop();

                    if (single_file === undefined) {
                        $("#fileUpload").val('');
                        $scope.checkCanUpload();
                        return;
                    }

                    (function dummy_function(file) {

                        if (file.size > $scope.input.maxFileSizeMB * 1024 * 1024) {
                            toastr.error("<B>" + file.name +"</B> exceeds <B>"+$scope.input.maxFileSizeMB+"MB</B> limit.");
                            $scope.uploads.splice(globalIndex, 1);
                            process_one();
                            return;
                        }

                        reader.onload = function (e) {

                            var newUpload = {
                                fileName : file.name,
                                loaded : false
                            }

                            $scope.uploads[globalIndex] = newUpload;

                            newUpload.orientation = $scope.getOrientation(e.target.result);

                            newUpload.rotate = 0;

                            if (newUpload.orientation == 6) {
                                newUpload.rotate = 90;
                            }
                            else
                            if (newUpload.orientation == 8) {
                                newUpload.rotate = 270;
                            }
                            else
                            if (newUpload.orientation == 3) {
                                newUpload.rotate = 180;
                            }

                            var img = new Image();
                            img.addEventListener("error", function (e) {
                                toastr.error("<B>" + newUpload.fileName +"</B> is not a valid image.");
                                $scope.uploads.splice(globalIndex, 1);

                                // process next at the end
                                process_one();
                            });

                            img.addEventListener("load", function () {

                                if (img.width < $scope.input.thumbHeight || img.height < $scope.input.thumbHeight) {
                                    toastr.error("<B>" + newUpload.fileName +"</B> ("+img.width+"x"+img.height+") did not meet minimum requirement of "+$scope.input.thumbHeight+"x"+$scope.input.thumbHeight+".");
                                    $scope.uploads.splice(globalIndex, 1);
                                    process_one();
                                    return
                                }

                                globalIndex++;
                                newUpload.loaded = true
                                newUpload.thumb = $scope.getImage(img,$scope.input.thumbHeight,newUpload.rotate, true).src;
                                newUpload.image = img;

                                // process next at the end
                                process_one();
                            });

                            $scope.arrayBufferToBase64(e.target.result, function(data) {
                                img.src = "data:image/jpg;base64,"+data;

                                e.target.result = null;
                                data = null;
                                delete data;
                                delete e.target;
                            })

                        };

                        reader.readAsArrayBuffer(file);
                    })(single_file);
                }

                process_one();
            }

            $scope.getOrientation = function(arrayBuffer) {
                var view = new DataView(arrayBuffer);
                if (view.getUint16(0, false) != 0xFFD8) return -2;
                var length = view.byteLength, offset = 2;
                var little, tags, i , ret, marker;
                while (offset < length) {
                    marker = view.getUint16(offset, false);
                    offset += 2;
                    if (marker == 0xFFE1) {
                        if (view.getUint32(offset += 2, false) != 0x45786966) {
                            view = null;
                            delete view;
                            return -1;
                        }
                        little = view.getUint16(offset += 6, false) == 0x4949;
                        offset += view.getUint32(offset + 4, little);
                        tags = view.getUint16(offset, little);
                        offset += 2;
                        for (i = 0; i < tags; i++)
                            if (view.getUint16(offset + (i * 12), little) == 0x0112) {
                                ret = (view.getUint16(offset + (i * 12) + 8, little));
                                view = null;
                                delete view;
                                return ret;

                            }
                    }
                    else if ((marker & 0xFF00) != 0xFF00) break;
                    else offset += view.getUint16(offset, false);
                }
                view = null;
                delete view;

                return -1;
            }

            $scope.arrayBufferToBase64 = function( buffer, callback ) {
                var blob = new Blob([buffer],{type:'application/octet-binary'});
                var reader = new FileReader();
                reader.onload = function(evt){
                    var dataurl = evt.target.result;
                    callback(dataurl.substr(dataurl.indexOf(',')+1));
                    reader = null;
                    blob = null;
                    buffer = null;
                    delete buffer;
                    delete reader;
                    delete blob;
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



                var ret = { src : offscreenCanvas.toDataURL('image/jpeg'), width: newWidth, height: newHeight}

                context = null;
                offscreenCanvas = null;
                delete context;
                delete offscreenCanvas;

                return ret;

            }

            $scope.remove = function(index) {
                $scope.uploads.splice(index, 1);
                $scope.checkCanUpload();
            }

            $scope.checkCanUpload = function () {
                $scope.canUpload = $scope.uploads.length > 0;
            }


            $scope.view = function(index) {

                var image = $scope.getImage($scope.uploads[index].image,$scope.input.fullHeight,$scope.uploads[index].rotate, false);
                var w = image.width;
                var h = image.height;

                if (image.width > 900) {
                    w = 900;
                    h = w * image.height / image.width;
                }

                if (w > window.outerWidth) {
                    h = h * window.outerWidth / w;
                    w = window.outerWidth;
                }

                if (h > window.outerHeight) {
                    w = w * window.outerHeight / h;
                    h = window.outerHeight;
                }
                $uibModal.open({
                    template: '<div style="position: relative">' +
                    '<div ng-click="cancel()" style="position: absolute;top:10px;right:10px;text-shadow: 3px 3px 16px #272634;cursor:pointer"><i class="fa fa-3x fa-times" style="color:white !important;"></i></div>' +
                    '<a href ng-click="cancel()"><img ng-src="{{image.src}}" style="width:'+w+'px;margin: 0px auto;display:block"></a></div>',
                    size: "lg",
                    backdrop: 'static',
                    keyboard: true,
                    resolve: {
                        image: function () {
                            return image;
                        },
                    },
                    controller: function($scope, $uibModalInstance,image){

                        $scope.image = image;

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