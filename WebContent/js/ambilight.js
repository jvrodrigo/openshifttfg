/**
 * requestAnimationFrame polyfill by Erik Möller fixes from Paul Irish and Tino
 * Zijdel http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 */
(function() {
	var lastTime = 0;
	var vendors = [ 'ms', 'moz', 'webkit', 'o' ];
	for ( var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]
				+ 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]
				+ 'CancelAnimationFrame']
				|| window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = (new Date()).getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() {
				callback(currTime + timeToCall);
			}, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
}());

/**
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */
var ambilight = (function() {
	var defaults = {
		brightness : 2.7, // ambilight brightness coeff
		saturation : 1.4, // ambilight saturation coeff
		lamps : 5, // number of glowing lamps.
		blockSize : 20, // width of image sampling block. Larger value means
						// more accurate but result but slower performance
		fade : true,
		delay : 100,
		leftMask : new Image,
		rightMask : new Image,
	};

	defaults.leftMask.src = './images/mask4-left.png';
	defaults.rightMask.src = './images/mask4-right.png';

	var buffer = document.createElement('canvas');
	var bufferCtx = buffer.getContext('2d');
	var lightCache = {};
	var animItems = [];
	var playList = [];
	// use object pools to reduce garbage collection
	var arrayPool = {};
	var isPlaying = false;
	var _id = 0;

	var transEndEventNames = {
		'WebkitTransition' : 'webkitTransitionEnd',
		'MozTransition' : 'transitionend',
		'OTransition' : 'oTransitionEnd',
		'msTransition' : 'MSTransitionEnd',
		'transition' : 'transitionend'
	};

	var trEndEventName = transitionEndEvent(document.documentElement);

	function getArrayFromPool(key) {
		if (!(key in arrayPool)) {
			arrayPool[key] = [];
		}

		return arrayPool[key];
	}
	
	/**
	 * Generate unique ID for video element
	 * 
	 * @return {String}
	 */
	function getId() {
		return 'ambi__id' + (_id++);
	}

	/**
	 * Returns internal ID for video element, if it has it
	 * 
	 * @param {Element}
	 *            elem Video element
	 * @return {String}
	 */
	function getIdByVideo(elem) {
		for ( var p in lightCache)
			if (lightCache.hasOwnProperty(p))
				if (lightCache[p].video == elem)
					return p;

		return null;
	}

	/**
	 * Returns current time in milliseconds
	 * 
	 * @return {Number}
	 */
	function getTime() {
		return +new Date;
	}

	function transitionEndEvent(elem) {
		var keys = Object.keys(transEndEventNames);
		var test = elem.style;
		for ( var i = keys.length - 1; i >= 0; i--) {
			if (keys[i] in test) {
				return transEndEventNames[keys[i]];
			}
		}
		;
	}

	/**
	 * Prepares video element for ambilight: creates canvases for lights and
	 * caches it
	 * 
	 * @param {Element}
	 *            elem Video element
	 */
	function prepareVideo(elem) {
		var id = getIdByVideo(elem);

		if (id === null) {
			id = getId();
			lightCache[id] = {
				video : elem
			};

			elem.addEventListener('play', startAmbilight, false);
			elem.addEventListener('autoplay', startAmbilight, false);
			elem.addEventListener('pause', stopAmbilight, false);
			elem.addEventListener('ended', stopAmbilight, false);
		}

		return id;
	}

	/**
	 * Returns ambilight assets object for video ID
	 * 
	 * @return {Object}
	 */
	function getAssets(id) {
		return lightCache[id];
	}

	/**
	 * Makes current frame snapshot in buffer canvas
	 * 
	 * @param {String}
	 *            id Internal video's ID
	 */
	function createSnapshot(id) {
		var assets = getAssets(id);
		var video = assets.video;

		buffer.width = video.width;
		buffer.height = video.height;

		var vw = video.videoWidth || video.width;
		var vh = video.videoHeight || video.height;

		bufferCtx.drawImage(video, 0, 0, vw, vh, 0, 0, buffer.width,
				buffer.height);
	}

	/**
	 * Calculates middle color for pixel block
	 * 
	 * @param {CanvasPixelArray}
	 *            data Canvas pixel data
	 * @param {Number}
	 *            from Start index of pixel data
	 * @param {Number}
	 *            to End index of pixel data
	 * @return {Array} RGB-color
	 */
	function calcMidColor(data, from, to, ix) {
		// var result = [0, 0, 0];
		var result = getArrayFromPool('color' + ix);
		var totalPixels = (to - from) / 4;

		for ( var i = from; i <= to; i += 4) {
			result[0] += data[i];
			result[1] += data[i + 1];
			result[2] += data[i + 2];
		}

		result[0] = (result[0] / totalPixels) | 0;
		result[1] = (result[1] / totalPixels) | 0;
		result[2] = (result[2] / totalPixels) | 0;

		return result;
	}

	/**
	 * Gets option by its name
	 */
	function getOption(name) {
		return defaults[name];
	}

	/**
	 * Returns array of midcolors for one of the side of buffer canvas
	 * 
	 * @param {String}
	 *            side Canvas side where to take pixels from. 'left' or 'right'
	 * @return {Array} Array of RGB colors
	 */
	function getMidColors(side) {
		var w = buffer.width;
		var h = buffer.height;
		var lamps = getOption('lamps');
		var blockWidth = getOption('blockSize');
		var blockHeight = Math.ceil(h / lamps);
		var pxl = blockWidth * blockHeight * 4;
		var result = getArrayFromPool('midcolor');

		var imgData = bufferCtx.getImageData(side == 'right' ? w - blockWidth
				: 0, 0, blockWidth, h);
		var totalPixels = imgData.data.length;

		for ( var i = 0; i < lamps; i++) {
			var from = i * w * blockWidth;
			result[i] = calcMidColor(imgData.data, i * pxl, Math.min((i + 1)
					* pxl, totalPixels - 1), i);
		}

		return result;
	}

	/**
	 * Convers RGB color to HSV model
	 * 
	 * @param {Array}
	 *            RGB color
	 * @return {Array} HSV color
	 */
	function rgb2hsv(color) {
		var r = color[0] / 255;
		var g = color[1] / 255;
		var b = color[2] / 255;

		var x, val, d1, d2, hue, sat, val;

		x = Math.min(Math.min(r, g), b);
		val = Math.max(Math.max(r, g), b);
		if (x == val) {
			return false;
		}

		d1 = (r == x) ? g - b : ((g == x) ? b - r : r - g);
		d2 = (r == x) ? 3 : ((g == x) ? 5 : 1);

		color[0] = (((d2 - d1 / (val - x)) * 60) | 0) % 360;
		color[1] = (((val - x) / val) * 100) | 0;
		color[2] = (val * 100) | 0;
		return true;
	}

	/**
	 * Convers HSV color to RGB model
	 * 
	 * @param {Array}
	 *            RGB color
	 * @return {Array} HSV color
	 */
	function hsv2rgb(color) {
		var h = color[0], s = color[1], v = color[2];

		var r, g, a, b, c, s = s / 100, v = v / 100, h = h / 360;

		if (s > 0) {
			if (h >= 1)
				h = 0;

			h = 6 * h;
			var f = h - (h | 0);
			// don't need accurate results here, use |0 instead of Math.round()
			a = (255 * v * (1 - s)) | 0;
			b = (255 * v * (1 - (s * f))) | 0;
			c = (255 * v * (1 - (s * (1 - f)))) | 0;
			v = (255 * v) | 0;

			switch (h | 0) {
			case 0:
				r = v;
				g = c;
				b = a;
				break;
			case 1:
				r = b;
				g = v;
				b = a;
				break;
			case 2:
				r = a;
				g = v;
				b = c;
				break;
			case 3:
				r = a;
				g = b;
				b = v;
				break;
			case 4:
				r = c;
				g = a;
				b = v;
				break;
			case 5:
				r = v;
				g = a;
				b = b;
				break;
			}

			color[0] = r || 0;
			color[1] = g || 0;
			color[2] = b || 0;
		} else {
			color[0] = color[1] = color[2] = (v * 255) | 0;
		}
	}

	/**
	 * Adjusts color lightness and saturation
	 * 
	 * @param {Array}
	 *            RGB color
	 * @return {Array}
	 */
	function adjustColor(color) {
		var ok = rgb2hsv(color);
		if (ok) {
			color[1] = Math.min(100, color[1] * getOption('saturation'))
			// color[2] = Math.min(100, color[2] * getOption('brightness'));
			color[2] = 90;
			hsv2rgb(color);
		}

		return color;
	}

	/**
	 * Creates canvas for light element
	 * 
	 * @param {Element}
	 *            video
	 * @param {String}
	 *            class_name
	 * @return {Element}
	 */
	function createCanvas(video, className) {
		var canvas = document.createElement('canvas');
		// canvas.style.opacity = '0';
		canvas.className = className;
		video.parentNode.appendChild(canvas);
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;
		return canvas;
	}

	function removeElem(elem) {
		if (elem.parentNode) {
			elem.parentNode.removeChild(elem);
		}
	}

	function onTransitionEnd(evt) {
		removeElem(this);
	}

	/**
	 * Draw ambilight on one of the video's side
	 * 
	 * @param {String}
	 *            id Internal video ID
	 * @param {String}
	 *            side On what side draw highlight, 'left' or 'right'
	 */
	function createLight(id, side) {
		side = (side == 'left') ? 'left' : 'right';
		var assets = getAssets(id);

		var oldLight = assets[side];
		var newLight = drawLight(id, side, oldLight);
		return assets[side] = newLight;

		if (getOption('fade') && oldLight) {
			if (oldLight) {
				if (trEndEventName) {
					// newLight.style.opacity = 0;
					oldLight.addEventListener(trEndEventName, onTransitionEnd,
							false);
				} else {
					removeElem(oldLight);
				}
			}

			setTimeout(function() {
				if (oldLight) {
					oldLight.style.opacity = 0;
				}

				newLight.style.opacity = 1;
			}, 1);
		} else if (oldLight) {
			newLight.style.opacity = 1;
			removeElem(oldLight);
		}

		return assets[side] = newLight;
	}

	/**
	 * Draws light on one side of video element defined by ID
	 * 
	 * @param {String}
	 *            id Internal video ID
	 * @param {String}
	 *            side 'left' or 'right'
	 */
	function drawLight(id, side, canvas) {
		var assets = getAssets(id);
		var video = assets.video;

		if (!canvas) {
			canvas = createCanvas(video, 'ambilight-' + side);
		}

		/** @type {CanvasRenderingContext2D} */
		var ctx = canvas.getContext('2d');

		var midcolors = getMidColors(side);
		var grd = ctx.createLinearGradient(0, 0, 0, canvas.height);

		for ( var i = 0, il = midcolors.length; i < il; i++) {
			adjustColor(midcolors[i]);
			grd.addColorStop(i / il, 'rgb(' + midcolors[i].join(',') + ')');
		}

		ctx.fillStyle = grd;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		var gco = ctx.globalCompositeOperation;
		var img = getOption(side + 'Mask');
		// console.log(img);
		ctx.globalCompositeOperation = 'destination-in';
		ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width,
				canvas.height);
		ctx.globalCompositeOperation = gco;

		return canvas;
	}

	function startAmbilight(evt) {
		var id = getIdByVideo(evt.target);
		if (id) {
			playList.push({
				id : id,
				time : 0
			});
		}

		if (playList.length == 1) {
			ambilightLoop();
		}
	}

	function stopAmbilight(evt) {
		var id = getIdByVideo(evt.target);
		if (id) {
			for ( var i = playList.length - 1; i >= 0; i--) {
				if (playList[i].id == id) {
					return playList.splice(i, 1);
				}
			}
		}
	}

	function ambilightLoop() {
		var id;
		for ( var i = 0, il = playList.length, obj; i < il; i++) {
			obj = playList[i];

			var time = +new Date;
			if (time - obj.time < getOption('delay')) {
				continue;
			}

			createSnapshot(obj.id);
			createLight(obj.id, 'left');
			createLight(obj.id, 'right');
			obj.time = time;
		}

		if (playList.length) {
			requestAnimationFrame(ambilightLoop);
		}
	}

	/**
	 * Creates ambilight on video element
	 * 
	 * @param {Element}
	 *            video
	 */
	return function(video, options) {
		return prepareVideo(video, options);
	};
})();