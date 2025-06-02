///
const totalAttempts = 2;
const scratchCoeff = 0.9;
const delayBeforeNextAttempt = 2000;

const initStateBG = "images/v1.png";
const playStateBG = "images/v2.png";
const winStateBG = "images/v3.png";
const gameFieldLoseImg = "images/gameFieldLose.png";
const gameFieldWinImg = "images/gameFieldWin.png";
const coverImage = "images/eng/cover.png";

const INIT_STATE = "INIT_STATE";
const PLAYING_STATE = "PLAYING_STATE";
const REPLAY_STATE = "REPLAY_STATE";
const WIN_STATE = "WIN_STATE";

const fireworkSize = {
    width: 1024,
    height: 768
};
const scratchRect = {
    width: 240,
    height: 137
};

const autoScratchDelay = 10;
const scratchRectPosition = [
    [127, 32],
    [270, 32],
    [415, 32]
];

const autoScratchPos = [
    [73, 145],
    [73, 145],
    [72, 147],
    [67, 150],
    [60, 157],
    [49, 164],
    [42, 169],
    [38, 172],
    [41, 172],
    [50, 171],
    [69, 164],
    [89, 157],
    [112, 156],
    [116, 156],
    [115, 158],
    [109, 164],
    [92, 177],
    [72, 190],
    [55, 208],
    [49, 216],
    [49, 219],
    [49, 221],
    [55, 221],
    [72, 221],
    [96, 220],
    [128, 217],
    [135, 217],
    [135, 217],
    [130, 221],
    [125, 225],
    [120, 233],
    [116, 239],
    [116, 243],
    [116, 245],
    [119, 246],
    [124, 246],
    [133, 245],
    [137, 244],
    [136, 244],
    [130, 249],
    [123, 254],
    [115, 261],
    [106, 269],
    [98, 274],
    [93, 280],
    [92, 281],
    [95, 280],
    [100, 277],
    [102, 273],
    [103, 268],
    [100, 261],
    [95, 260],
    [89, 259],
    [77, 259],
    [59, 267],
    [42, 273],
    [27, 281],
    [27, 281],
    [29, 281],
    [41, 280],
    [57, 273],
    [73, 267],
    [81, 266],
    [82, 266],
    [81, 267],
    [73, 273],
    [62, 281],
    [54, 291],
    [49, 299],
    [48, 305],
    [49, 307],
    [57, 309],
    [74, 308],
    [100, 305],
    [125, 303],
    [142, 303],
    [146, 304],
    [144, 308],
    [137, 313],
    [126, 321],
    [117, 329],
    [114, 335],
    [112, 339],
    [112, 341],
    [112, 343],
    [115, 344],
    [121, 344],
    [128, 344],
    [144, 341],
    [161, 341],
    [173, 340],
    [175, 340],
    [166, 344],
    [142, 350],
    [111, 353],
    [74, 355],
    [45, 355],
    [30, 356],
    [28, 356],
    [41, 352],
    [61, 345],
    [82, 338],
    [94, 331],
    [96, 325],
    [92, 321],
    [85, 320],
    [75, 320],
    [69, 324],
    [62, 329],
    [58, 337],
    [57, 346],
    [57, 361],
    [57, 369],
    [59, 373],
    [60, 377],
    [61, 378],
    [62, 378],
    [65, 378],
    [69, 375],
    [79, 370],
    [85, 368],
    [85, 368],
    [85, 368],
    [76, 370],
    [60, 377],
    [41, 387],
    [37, 391],
    [37, 396],
    [42, 399],
    [60, 401],
    [91, 401],
    [151, 397],
    [183, 394],
    [197, 393],
    [200, 393],
    [199, 393],
    [191, 395],
    [170, 401],
    [145, 404],
    [105, 413],
    [84, 417],
    [73, 420],
    [72, 421],
    [73, 422],
    [81, 424],
    [94, 426],
    [128, 426],
    [155, 425],
    [175, 425],
    [179, 425],
    [172, 425],
    [129, 429],
    [85, 431],
    [58, 433],
    [49, 433],
    [53, 433],
    [65, 433],
    [98, 429],
    [121, 428],
    [135, 428],
    [137, 428],
    [129, 429],
    [105, 437],
    [72, 440],
    [43, 448],
    [40, 449],
    [40, 449],
    [49, 451],
    [73, 453],
    [118, 453],
    [181, 453],
    [188, 455],
    [185, 457],
    [167, 463],
    [121, 466],
    [65, 476],
    [24, 480],
    [21, 482],
    [25, 484],
    [48, 484],
    [87, 483],
    [133, 477],
    [171, 468],
    [185, 465],
    [182, 465],
    [161, 469],
    [122, 478],
    [68, 485],
    [31, 487],
    [21, 489],
    [22, 489],
    [42, 492],
    [108, 490],
    [144, 490],
    [161, 490],
    [164, 490],
    [161, 491],
    [146, 493],
    [111, 495],
    [87, 499],
    [68, 504],
    [58, 509],
    [57, 514],
    [61, 518],
    [78, 521],
    [102, 521],
    [136, 520],
    [149, 520],
    [137, 523],
    [89, 528],
    [38, 533],
    [5, 537],
    [5, 537],
    [15, 537],
    [61, 529],
    [137, 528],
    [191, 523],
    [217, 522],
    [221, 521],
    [217, 521],
    [197, 525],
    [173, 529],
    [154, 533],
    [147, 535],
    [146, 537],
    [153, 537],
    [169, 534],
    [188, 530],
    [209, 527],
    [218, 525],
    [219, 525],
    [218, 525],
    [215, 525],
    [215, 527],
    [214, 528],
    [214, 529],
    [217, 529],
    [222, 529],
    [233, 526],
    [248, 524],
    [250, 523],
    [250, 522],
    [251, 519],
    [252, 513],
    [254, 505],
    [254, 500],
    [254, 498],
    [251, 497],
    [241, 497],
    [225, 498],
    [209, 499],
    [203, 499],
    [202, 498],
    [209, 494],
    [224, 488],
    [244, 480],
    [265, 466],
    [274, 457],
    [276, 451],
    [273, 448],
    [265, 445],
    [255, 444],
    [239, 442],
    [225, 439],
    [222, 437],
    [221, 435],
    [222, 431],
    [227, 425],
    [233, 414],
    [243, 402],
    [249, 390],
    [252, 377],
    [255, 357],
    [253, 349],
    [243, 341],
    [228, 339],
    [221, 337],
    [221, 337],
    [223, 335],
    [232, 328],
    [238, 321],
    [241, 317],
    [241, 316],
    [240, 315],
    [237, 313],
    [230, 313],
    [217, 310],
    [215, 310],
    [215, 309],
    [216, 308],
    [218, 304],
    [222, 295],
    [222, 291],
    [220, 287],
    [214, 284],
    [204, 279],
    [189, 276],
    [181, 274],
    [180, 273],
    [180, 272],
    [185, 269],
    [195, 261],
    [206, 253],
    [212, 247],
    [211, 242],
    [205, 239],
    [189, 236],
    [178, 235],
    [168, 235],
    [162, 235],
    [159, 235],
    [159, 233],
    [162, 229],
    [167, 224],
    [172, 217],
    [175, 213],
    [175, 212],
    [173, 210],
    [167, 209],
    [156, 206],
    [147, 204],
    [145, 203],
    [145, 201],
    [145, 198],
    [152, 191],
    [169, 174],
    [177, 166],
    [181, 164],
    [181, 162],
    [175, 161],
    [158, 159],
    [141, 157],
    [121, 155],
    [121, 154],
    [125, 154],
    [139, 154],
    [165, 154],
    [198, 155],
    [230, 157],
    [237, 157],
    [236, 157],
    [231, 161],
    [223, 166],
    [211, 172],
    [200, 183],
    [199, 189],
    [201, 190],
    [206, 192],
    [216, 192],
    [225, 190],
    [227, 189],
    [227, 190],
    [227, 193],
    [227, 198],
    [236, 202],
    [255, 208],
    [280, 217],
    [293, 225],
    [293, 227],
    [290, 230],
    [283, 234],
    [277, 239],
    [272, 245],
    [265, 255],
    [264, 259],
    [264, 260],
    [265, 261],
    [266, 264],
    [269, 265],
    [273, 267],
    [273, 268],
    [273, 271],
    [272, 277],
    [268, 282],
    [265, 288],
    [264, 293],
    [263, 297],
    [263, 301],
    [264, 305],
    [265, 308],
    [266, 309],
    [266, 312],
    [265, 317],
    [264, 321],
    [262, 329],
    [262, 334],
    [262, 336],
    [263, 337],
    [264, 337],
    [265, 339],
    [266, 339],
    [268, 341],
    [269, 342]
];

const popupBorderTop = 45;

let delayBeforePopup = 2000;
let redirectURL = "https://brand-games.com/affnet/click/10/9";
let autoPlayScratch = false;
let autoRedirect = false;
let autoRedirectDelay = 4000;
let playFireworkAnimation = false;
let autoPlayScratchDelay = 4000;
let lang = "ua";
let infoText = ["В ТЕБЕ 2 СПРОБИ!", "В ТЕБЕ 1 СПРОБА!", "ПЕРЕМОГА!"];
let cloudText = ["<b>ВІДКРИВАЙ <br>БОНУС!<b>", "<b>СПРОБУЙ<br> ЩЕ!</b>"];
let finishUrsRedirect;

function getParameterByName(name, url = window.location.href) {
	name = name.replace(/[\[\]]/g, '\\$&');
	var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


document.addEventListener('DOMContentLoaded', () => {

	const clickid = getParameterByName('clickid'),
          pid = getParameterByName('pid'),
          subid = getParameterByName('subid'),
          subid2 = getParameterByName('subid2'),
          subid3 = getParameterByName('subid3');

		const get_href = redirectURL
	
		const url = new URL( get_href );
		const params = new URLSearchParams(url.search);
		const url_params_window = window.location.search;
	
		params.set('refcode', `aff_${clickid}_${pid}`);
		params.set('subid', subid);
		params.set('subid2', subid2);
		params.set('subid3', subid3);
		params.set('utm_campaign', pid);
		params.set('utm_content', clickid);
	
		const finish_url = get_href.split('?')[0]

        //let close_url = `${finish_url}?${params.toString()}`;
        let close_url = `${finish_url}` + window.location.search;
        finishUrsRedirect = close_url;
})
let currentAttempt = 1;
let currentState = INIT_STATE;
let gameBackground;
let clip;
let configuration;
let autoPlayTimer;

function getParameterByName(name, url = window.location.href) {
	name = name.replace(/[\[\]]/g, '\\$&');
	var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
}



document.addEventListener("DOMContentLoaded", (event)=> {
    gameBackground = document.querySelector(".sl-game-wrap");
    gameImage = document.querySelector(".sl-game-girlImage");
    headTag = document.querySelector("html");
    getConfiguration("config/config.json", (text) => {
        let data = JSON.parse(text);
        delayBeforePopup = parseInt(data.delayBeforePopup);
        redirectURL = data.redirectURL;
        autoPlayScratch = data.autoPlayScratch == "true";
        autoRedirect = data.autoRedirect == "true";
        autoRedirectDelay = parseInt(autoRedirectDelay);
        playFireworkAnimation = data.firework == "true";
        autoPlayScratchDelay = parseInt(data.autoPlayScratchDelay);
        lang = data.lang;
        infoText = data[lang][0];
        cloudText = data[lang][1];
        updateGameText(data[lang]);
        setState(INIT_STATE);
    });

});

function playButtonClick(event) {
    clearInterval(autoPlayTimer);
    setState(PLAYING_STATE);
}

function setState(state) {
    switch (state) {

        case INIT_STATE:
            gameImage.src = initStateBG;
            headTag.classList.add("init-game");
            disableButton("#openButton");
            updateCloudText(cloudText[currentAttempt-1], false, false);
            if (autoPlayScratch) {
                autoPlayTimer = setTimeout(playButtonClick, autoPlayScratchDelay);
            }
        break;


        case PLAYING_STATE:
/*        case INIT_STATE:*/
            updateAttempsText(infoText[currentAttempt-1]);
            updateCloudText(cloudText[currentAttempt], true, false );
            headTag.classList.remove("init-game");

            // gameBackground.style.backgroundImage = `url(${playStateBG})`;
            gameImage.src = playStateBG;
            gameBackground.classList.add("wrap-active");
            document.querySelector("#playButton").classList.toggle("hidden");
            document.querySelector(".gameField").classList.toggle("hidden");
            document.querySelectorAll(".animated").forEach(element => {
                element.classList.toggle("star");
            });
            clip = new imageClip(scratchCoeff, gameFieldLoseImg, coverImage);
            clip.finish(function(){
                //alert("clip success...");
                if (currentAttempt >= totalAttempts) {
                    setState(WIN_STATE);
                } else {
                    clip.finish = null;
                    setTimeout(() => setState(REPLAY_STATE), delayBeforeNextAttempt);
                }
            });
        break;

        case REPLAY_STATE:
            decreaseAttemptsAnimation(currentAttempt );
            currentAttempt ++;
            updateAttempsText(infoText[currentAttempt-1]);
            updateCloudText(cloudText[currentAttempt], true, false);
            clip = new imageClip(scratchCoeff, gameFieldWinImg, coverImage, true);
            clip.finish(function(){
                if (currentAttempt >= totalAttempts) {
                    setState(WIN_STATE);
                } else {
                    clip.finish = null;
                    setTimeout(() => setState(REPLAY_STATE), delayBeforeNextAttempt);
                }
            });
            enableButton("#openButton");
        break;
        case WIN_STATE:
            decreaseAttemptsAnimation(currentAttempt);
            currentAttempt ++;
            updateAttempsText(infoText[currentAttempt - 1]);
            
            setTimeout(() => {
                updateCloudText(cloudText[currentAttempt-1], false, true);
                 gameBackground.classList.add("game-win");
                headTag.classList.add("game-win-body");
                gameImage.src = winStateBG;
                document.querySelector(".gameField").classList.toggle("hidden");
                showPopup();
                hideSplash(".animated");
            }, delayBeforePopup);

        break;
    }
    currentState = state;
}

function autoScratch() {
    clip.autoScratch();
    disableButton("#openButton");
}

// Expose autoScratch function to window for wallet integration
window.autoScratch = autoScratch;

function redirectTo() {
    clearInterval(redirectTimer);
    window.location = finishUrsRedirect;
}

function enableButton(buttonClass) {
    let btn = document.querySelector(buttonClass);
    if (btn.disabled == true || btn.disabled == undefined) {
        btn.disabled = false;
        btn.classList.toggle("disabled");
    }
}

function disableButton(buttonClass) {
    let btn = document.querySelector(buttonClass);
    if (!btn.disabled || btn.disabled == undefined) {
        btn.disabled = true;
        btn.classList.toggle("disabled");
    }
}



function updateAttempsText(text) {
    document.querySelector(".infoText").innerHTML = text;
}

function updateCloudText(text, secondSteep, hide) {



    

    const textCloudInner =  document.querySelector(".textCloudInner");
    const textCloud =  document.querySelector(".textCloud");

    textCloudInner.innerHTML = text;

    if( secondSteep ) {
        textCloud.classList.add("active-cloud");
    }
    

    if(hide) {
        textCloud.style.display = 'none';
    }
}

function getConfiguration(file, callback)  {
    let rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    };
    rawFile.send(null)
}

function updateGameText(data) {
    let buttonLabels = data[2];
    let buttonLabel =  document.querySelector(".sl-game__playButton").querySelector(".sl-game-button__label");
    buttonLabel.innerHTML = buttonLabels[0];
    buttonLabel =  document.querySelector(".sl-game__openButton").querySelector(".sl-game-button__label");
    buttonLabel.innerHTML = buttonLabels[1];
    buttonLabel =  document.querySelector(".sl-game__takeButton").querySelector(".sl-game-button__label");
    buttonLabel.innerHTML = buttonLabels[2];
    document.querySelector(".popupTitle").innerHTML = data[3].popupTitle;
    document.querySelector(".popupInfo").innerHTML = data[3].popupInfo;
    document.querySelector(".popupWinText").innerHTML = data[3].popupWinText;
}
let scratchFilter;
let canvas;
let context;
let imgw;
let imgh;
let finish;
let mousedown;
let timerId;
let ready = false;
let coords = [];

let completed = false;


CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x+r, y);
    this.arcTo(x+w, y,   x+w, y+h, r);
    this.arcTo(x+w, y+h, x,   y+h, r);
    this.arcTo(x,   y+h, x,   y,   r);
    this.arcTo(x,   y,   x+w, y,   r);
    this.closePath();
    return this;
};


function imageClip(filter, back, mask, isReady = false){
    completed = false;
    ready = isReady;
    scratchFilter = filter;
    mousedown = false;
    let coverPattern;
    let counter = 0;
    canvas = document.getElementById("myCanvas");

    context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    let  img = new Image(),
        cover = new Image();

    cover.onload = (e) => {
        coverPattern = context.createPattern(cover,'repeat');
        counter ++;
        if (counter > 1) {
            createGameField(e);
        }
    };

    img.onload = (e) => {
        counter ++;
        if (counter > 1) {
            createGameField(e);
        }
    };
    cover.src = mask; //coverImage;
    img.src = back; //gameFieldLoseImg;

    function createGameField(e)
    {
        canvas.removeEventListener('touchstart', eventDown);
        canvas.removeEventListener('touchend', eventUp);
        canvas.removeEventListener('touchmove', eventMove);

        canvas.removeEventListener('mousedown', eventDown);
        canvas.removeEventListener('mouseup', eventUp);
        canvas.removeEventListener('mousemove', eventMove);

        imgw = img.width;
        imgh = img.height;
        let
            offsetX = canvas.offsetLeft,
            offsetY = canvas.offsetTop;/*,
            isMousedown = false;*/

        canvas.width  = imgw;
        canvas.height = imgh;
        canvas.style.backgroundImage = 'url('+img.src+')';

        let w =  scratchRect.width;
        let h =  scratchRect.height;

        for (let i = 0; i < scratchRectPosition.length; i++) {
            let posX = scratchRectPosition[i][1];
            let posY = scratchRectPosition[i][0];

            context.fillStyle = coverPattern;

            context.globalAlpha = 1;

            //context.roundRect(posX,posY, w, h, 15);
            context.roundRect(posX,posY, w, h, 7).fill();
            //context.fillRect(posX,posY, w, h);
        }


        context.globalCompositeOperation = 'destination-out';

        function eventDown(e){
            e.preventDefault();
            if (!ready || completed) {
                return;
            }
            clearInterval(timerId);
            ready = true;
            mousedown = true;
            disableButton("#openButton");
        }

        function eventMove(e){
            e.preventDefault();
            if (!ready  || completed) {
                return;
            }
            if(mousedown) {
                if(e.changedTouches){
                    e = e.changedTouches[e.changedTouches.length-1];
                }

                let bounds = e.target.getBoundingClientRect();
                let x = e.clientX - bounds.left;
                let y = e.clientY - bounds.top;

                let rect = canvas.getBoundingClientRect(), // abs. size of element
                    scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for X
                    scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y

                coords.push([x,y]);
               context.beginPath();
               context.arc(x*scaleX,y*scaleY , 15  + Math.random()*15, 0, Math.PI * 2);
               context.fill();
            }
        }

        canvas.addEventListener('touchstart', eventDown);
        canvas.addEventListener('touchend', eventUp);
        canvas.addEventListener('touchmove', eventMove);

        canvas.addEventListener('mousedown', eventDown);
        canvas.addEventListener('mouseup', eventUp);
        window.addEventListener('mouseup', eventUp);
        canvas.addEventListener('mousemove', eventMove);

        //this.clearMask =clearMask;
    };

    this.finish = function(callback){
        finish = callback;
    };

    this.autoScratch = () => {
        let bounds = canvas.getBoundingClientRect();
        let i = 0;
        timerId = setInterval(() => {
            if (i < autoScratchPos.length) {
                let x = autoScratchPos[i][0];
                let y = autoScratchPos[i][1];
                i++;
                context.beginPath();
                context.arc(x, y, 15 + Math.random() * 15, 0, Math.PI * 2);
                /*            x += offX;
                            y += offY;*/
                context.fill();
                //clearMask();
            } else {
                clearMask();
            }
        }, autoScratchDelay);
    }
}

function clearMask(){
    console.log("mousedown = " + mousedown);
    let num = 0,
        datas = context.getImageData(0,0,imgw,imgh),
        datasLength = datas.data.length;
    for (let i = 0; i < datasLength; i++) {
        if (datas.data[i] == 0) num++;
    }
    if (num >= datasLength * scratchFilter) {
        completed = true;
        if(finish) {
            mousedown = false;
            clearInterval(timerId);
            ready = true;
            window.removeEventListener('mouseup', eventUp);
            canvas.removeEventListener('touchend', eventUp);
            canvas.removeEventListener('mouseup', eventUp);
            finish();
           let res = '[';
            for (let i = 0; i < coords.length; i++) {
                res += "[" + Math.round(coords[i][0]) + ", " + Math.round(coords[i][1]) + "],"
            }
            res += "]";
            console.log(res);

        }
    };
}

function eventUp(e){
    mousedown = false;
    if (!ready) {
        return;
    }
    e.preventDefault();
    mousedown = false;
    if (e.target.nodeName ==  "CANVAS") {
        clearMask();
    }
    if (!completed) {
        enableButton("#openButton");
    }
}

let modal = document.getElementById("my_modal");
let redirectTimer;

function showPopup() {
    modal.style.display = "block";
    createStars(document.querySelector(".modal_content"));
    animateWinText();
    if (playFireworkAnimation) {
        playFireworkAnimation();
    }
    if (autoRedirect) {
        redirectTimer(redirectTo, autoRedirectDelay);
    }
}

let starAnimation = 0;
let hStarsCount = 13;
let vStarsCount = 6;

document.querySelectorAll(".animated").forEach(star => {
    star.addEventListener('animationend', (event)=>{
        starAnimation++;
        if (starAnimation >= totalAttempts) {
                enableButton("#openButton");
                ready = true;
        }
    });

});

function decreaseAttemptsAnimation(attempt) {
   document.querySelector("#star" + attempt).classList.toggle("starDisappear");
}

function hideSplash(className) {
    document.querySelectorAll(className).forEach(element => {
        element.classList.toggle("hidden");
        element.style.animation = null;
    });
}

function createStars(element) {
    let starContainer = document.createElement("div");
/*    let elementStyle = window.getComputedStyle(element);
    let elementBgX = `${(parseFloat(elementStyle.backgroundPositionX) / 100 * element.clientWidth)}px`;
    let elementBgY = `${(parseFloat(elementStyle.backgroundPositionY) / 100 * element.clientHeight)}px`;*/

    element.append(starContainer);
/*    starContainer.style.top = elementBgY;
    starContainer.style.left = elementBgX;*/

    starContainer.classList.add("popupBorder");
    createVStars(starContainer);
}
function createVStars(element) {
    let rect = element.getBoundingClientRect();
    let elementStyle = window.getComputedStyle(element);
/*    let elementBgX = (parseFloat(elementStyle.backgroundPositionX) / 100 * element.offsetWidth);
    let elementBgY = (parseFloat(elementStyle.backgroundPositionY) / 100 * element.offsetHeight);*/
    for (let i = 0; i < vStarsCount; i++) {
        let starT = document.createElement("i");
        let starB = document.createElement("i");
        element.append(starT);
        element.append(starB);

        starB.style.top = `${popupBorderTop + i*35}px`;
        starT.style.top = `${popupBorderTop + i*35}px`;
        starB.style.left = 0 ;
        starT.style.left = `${rect.width}px` ;
        starT.classList.add("roundSplash");
        starB.classList.add("roundSplash");

    }
}

function animateWinText(split = true) {

    let textWrapper = document.querySelector('.ml6 .letters');
    if (split) {
        textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
    }

    const tl = anime.timeline({loop: true});
    tl.restart();
    /*const tl = anime.timeline({loop: true})*/
        tl.add({
            targets: '.ml6 .letter',
            translateY: ["1.1em", 0],
            translateZ: 0,
            duration: 750,
            delay: (el, i) => 50 * i
        }).add({
        targets: '.ml6',
        opacity: 0,
        duration: 1000,
        easing: "easeOutExpo",
        delay: 1000
    });
}

/*
 2017 Julian Garnier
 Released under the MIT license
*/
var $jscomp$this=this;
(function(v,p){"function"===typeof define&&define.amd?define([],p):"object"===typeof module&&module.exports?module.exports=p():v.anime=p()})(this,function(){function v(a){if(!g.col(a))try{return document.querySelectorAll(a)}catch(b){}}function p(a){return a.reduce(function(a,d){return a.concat(g.arr(d)?p(d):d)},[])}function w(a){if(g.arr(a))return a;g.str(a)&&(a=v(a)||a);return a instanceof NodeList||a instanceof HTMLCollection?[].slice.call(a):[a]}function F(a,b){return a.some(function(a){return a===b})}
function A(a){var b={},d;for(d in a)b[d]=a[d];return b}function G(a,b){var d=A(a),c;for(c in a)d[c]=b.hasOwnProperty(c)?b[c]:a[c];return d}function B(a,b){var d=A(a),c;for(c in b)d[c]=g.und(a[c])?b[c]:a[c];return d}function S(a){a=a.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i,function(a,b,d,h){return b+b+d+d+h+h});var b=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(a);a=parseInt(b[1],16);var d=parseInt(b[2],16),b=parseInt(b[3],16);return"rgb("+a+","+d+","+b+")"}function T(a){function b(a,b,c){0>
c&&(c+=1);1<c&&--c;return c<1/6?a+6*(b-a)*c:.5>c?b:c<2/3?a+(b-a)*(2/3-c)*6:a}var d=/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(a);a=parseInt(d[1])/360;var c=parseInt(d[2])/100,d=parseInt(d[3])/100;if(0==c)c=d=a=d;else{var e=.5>d?d*(1+c):d+c-d*c,l=2*d-e,c=b(l,e,a+1/3),d=b(l,e,a);a=b(l,e,a-1/3)}return"rgb("+255*c+","+255*d+","+255*a+")"}function x(a){if(a=/([\+\-]?[0-9#\.]+)(%|px|pt|em|rem|in|cm|mm|ex|pc|vw|vh|deg|rad|turn)?/.exec(a))return a[2]}function U(a){if(-1<a.indexOf("translate"))return"px";
if(-1<a.indexOf("rotate")||-1<a.indexOf("skew"))return"deg"}function H(a,b){return g.fnc(a)?a(b.target,b.id,b.total):a}function C(a,b){if(b in a.style)return getComputedStyle(a).getPropertyValue(b.replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase())||"0"}function I(a,b){if(g.dom(a)&&F(V,b))return"transform";if(g.dom(a)&&(a.getAttribute(b)||g.svg(a)&&a[b]))return"attribute";if(g.dom(a)&&"transform"!==b&&C(a,b))return"css";if(null!=a[b])return"object"}function W(a,b){var d=U(b),d=-1<b.indexOf("scale")?
1:0+d;a=a.style.transform;if(!a)return d;for(var c=[],e=[],l=[],h=/(\w+)\((.+?)\)/g;c=h.exec(a);)e.push(c[1]),l.push(c[2]);a=l.filter(function(a,c){return e[c]===b});return a.length?a[0]:d}function J(a,b){switch(I(a,b)){case "transform":return W(a,b);case "css":return C(a,b);case "attribute":return a.getAttribute(b)}return a[b]||0}function K(a,b){var d=/^(\*=|\+=|-=)/.exec(a);if(!d)return a;b=parseFloat(b);a=parseFloat(a.replace(d[0],""));switch(d[0][0]){case "+":return b+a;case "-":return b-a;case "*":return b*
a}}function D(a){return g.obj(a)&&a.hasOwnProperty("totalLength")}function X(a,b){function d(c){c=void 0===c?0:c;return a.el.getPointAtLength(1<=b+c?b+c:0)}var c=d(),e=d(-1),l=d(1);switch(a.property){case "x":return c.x;case "y":return c.y;case "angle":return 180*Math.atan2(l.y-e.y,l.x-e.x)/Math.PI}}function L(a,b){var d=/-?\d*\.?\d+/g;a=D(a)?a.totalLength:a;if(g.col(a))b=g.rgb(a)?a:g.hex(a)?S(a):g.hsl(a)?T(a):void 0;else{var c=x(a);a=c?a.substr(0,a.length-c.length):a;b=b?a+b:a}b+="";return{original:b,
numbers:b.match(d)?b.match(d).map(Number):[0],strings:b.split(d)}}function Y(a,b){return b.reduce(function(b,c,e){return b+a[e-1]+c})}function M(a){return(a?p(g.arr(a)?a.map(w):w(a)):[]).filter(function(a,d,c){return c.indexOf(a)===d})}function Z(a){var b=M(a);return b.map(function(a,c){return{target:a,id:c,total:b.length}})}function aa(a,b){var d=A(b);if(g.arr(a)){var c=a.length;2!==c||g.obj(a[0])?g.fnc(b.duration)||(d.duration=b.duration/c):a={value:a}}return w(a).map(function(a,c){c=c?0:b.delay;
a=g.obj(a)&&!D(a)?a:{value:a};g.und(a.delay)&&(a.delay=c);return a}).map(function(a){return B(a,d)})}function ba(a,b){var d={},c;for(c in a){var e=H(a[c],b);g.arr(e)&&(e=e.map(function(a){return H(a,b)}),1===e.length&&(e=e[0]));d[c]=e}d.duration=parseFloat(d.duration);d.delay=parseFloat(d.delay);return d}function ca(a){return g.arr(a)?y.apply(this,a):N[a]}function da(a,b){var d;return a.tweens.map(function(c){c=ba(c,b);var e=c.value,l=J(b.target,a.name),h=d?d.to.original:l,h=g.arr(e)?e[0]:h,m=K(g.arr(e)?
e[1]:e,h),l=x(m)||x(h)||x(l);c.isPath=D(e);c.from=L(h,l);c.to=L(m,l);c.start=d?d.end:a.offset;c.end=c.start+c.delay+c.duration;c.easing=ca(c.easing);c.elasticity=(1E3-Math.min(Math.max(c.elasticity,1),999))/1E3;g.col(c.from.original)&&(c.round=1);return d=c})}function ea(a,b){return p(a.map(function(a){return b.map(function(b){var c=I(a.target,b.name);if(c){var d=da(b,a);b={type:c,property:b.name,animatable:a,tweens:d,duration:d[d.length-1].end,delay:d[0].delay}}else b=void 0;return b})})).filter(function(a){return!g.und(a)})}
function O(a,b,d){var c="delay"===a?Math.min:Math.max;return b.length?c.apply(Math,b.map(function(b){return b[a]})):d[a]}function fa(a){var b=G(ga,a),d=G(ha,a),c=Z(a.targets),e=[],g=B(b,d),h;for(h in a)g.hasOwnProperty(h)||"targets"===h||e.push({name:h,offset:g.offset,tweens:aa(a[h],d)});a=ea(c,e);return B(b,{children:[],animatables:c,animations:a,duration:O("duration",a,d),delay:O("delay",a,d)})}function n(a){function b(){return window.Promise&&new Promise(function(a){return Q=a})}function d(a){return f.reversed?
f.duration-a:a}function c(a){for(var b=0,c={},d=f.animations,e={};b<d.length;){var g=d[b],h=g.animatable,m=g.tweens;e.tween=m.filter(function(b){return a<b.end})[0]||m[m.length-1];e.isPath$1=e.tween.isPath;e.round=e.tween.round;e.eased=e.tween.easing(Math.min(Math.max(a-e.tween.start-e.tween.delay,0),e.tween.duration)/e.tween.duration,e.tween.elasticity);m=Y(e.tween.to.numbers.map(function(a){return function(b,c){c=a.isPath$1?0:a.tween.from.numbers[c];b=c+a.eased*(b-c);a.isPath$1&&(b=X(a.tween.value,
b));a.round&&(b=Math.round(b*a.round)/a.round);return b}}(e)),e.tween.to.strings);ia[g.type](h.target,g.property,m,c,h.id);g.currentValue=m;b++;e={isPath$1:e.isPath$1,tween:e.tween,eased:e.eased,round:e.round}}if(c)for(var k in c)E||(E=C(document.body,"transform")?"transform":"-webkit-transform"),f.animatables[k].target.style[E]=c[k].join(" ");f.currentTime=a;f.progress=a/f.duration*100}function e(a){if(f[a])f[a](f)}function g(){f.remaining&&!0!==f.remaining&&f.remaining--}function h(a){var h=f.duration,
l=f.offset,n=f.delay,P=f.currentTime,q=f.reversed,r=d(a),r=Math.min(Math.max(r,0),h);if(f.children){var p=f.children;if(r>=f.currentTime)for(var u=0;u<p.length;u++)p[u].seek(r);else for(u=p.length;u--;)p[u].seek(r)}r>l&&r<h?(c(r),!f.began&&r>=n&&(f.began=!0,e("begin")),e("run")):(r<=l&&0!==P&&(c(0),q&&g()),r>=h&&P!==h&&(c(h),q||g()));a>=h&&(f.remaining?(t=m,"alternate"===f.direction&&(f.reversed=!f.reversed)):(f.pause(),"Promise"in window&&(Q(),R=b()),f.completed||(f.completed=!0,e("complete"))),
k=0);e("update")}a=void 0===a?{}:a;var m,t,k=0,Q=null,R=b(),f=fa(a);f.reset=function(){var a=f.direction,b=f.loop;f.currentTime=0;f.progress=0;f.paused=!0;f.began=!1;f.completed=!1;f.reversed="reverse"===a;f.remaining="alternate"===a&&1===b?2:b;for(a=f.children.length;a--;)b=f.children[a],b.seek(b.offset),b.reset()};f.tick=function(a){m=a;t||(t=m);h((k+m-t)*n.speed)};f.seek=function(a){h(d(a))};f.pause=function(){var a=q.indexOf(f);-1<a&&q.splice(a,1);f.paused=!0};f.play=function(){f.paused&&(f.paused=
!1,t=0,k=d(f.currentTime),q.push(f),z||ja())};f.reverse=function(){f.reversed=!f.reversed;t=0;k=d(f.currentTime)};f.restart=function(){f.pause();f.reset();f.play()};f.finished=R;f.reset();f.autoplay&&f.play();return f}var ga={update:void 0,begin:void 0,run:void 0,complete:void 0,loop:1,direction:"normal",autoplay:!0,offset:0},ha={duration:1E3,delay:0,easing:"easeOutElastic",elasticity:500,round:0},V="translateX translateY translateZ rotate rotateX rotateY rotateZ scale scaleX scaleY scaleZ skewX skewY".split(" "),
E,g={arr:function(a){return Array.isArray(a)},obj:function(a){return-1<Object.prototype.toString.call(a).indexOf("Object")},svg:function(a){return a instanceof SVGElement},dom:function(a){return a.nodeType||g.svg(a)},str:function(a){return"string"===typeof a},fnc:function(a){return"function"===typeof a},und:function(a){return"undefined"===typeof a},hex:function(a){return/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a)},rgb:function(a){return/^rgb/.test(a)},hsl:function(a){return/^hsl/.test(a)},col:function(a){return g.hex(a)||
g.rgb(a)||g.hsl(a)}},y=function(){function a(a,d,c){return(((1-3*c+3*d)*a+(3*c-6*d))*a+3*d)*a}return function(b,d,c,e){if(0<=b&&1>=b&&0<=c&&1>=c){var g=new Float32Array(11);if(b!==d||c!==e)for(var h=0;11>h;++h)g[h]=a(.1*h,b,c);return function(h){if(b===d&&c===e)return h;if(0===h)return 0;if(1===h)return 1;for(var m=0,k=1;10!==k&&g[k]<=h;++k)m+=.1;--k;var k=m+(h-g[k])/(g[k+1]-g[k])*.1,l=3*(1-3*c+3*b)*k*k+2*(3*c-6*b)*k+3*b;if(.001<=l){for(m=0;4>m;++m){l=3*(1-3*c+3*b)*k*k+2*(3*c-6*b)*k+3*b;if(0===l)break;
var n=a(k,b,c)-h,k=k-n/l}h=k}else if(0===l)h=k;else{var k=m,m=m+.1,f=0;do n=k+(m-k)/2,l=a(n,b,c)-h,0<l?m=n:k=n;while(1e-7<Math.abs(l)&&10>++f);h=n}return a(h,d,e)}}}}(),N=function(){function a(a,b){return 0===a||1===a?a:-Math.pow(2,10*(a-1))*Math.sin(2*(a-1-b/(2*Math.PI)*Math.asin(1))*Math.PI/b)}var b="Quad Cubic Quart Quint Sine Expo Circ Back Elastic".split(" "),d={In:[[.55,.085,.68,.53],[.55,.055,.675,.19],[.895,.03,.685,.22],[.755,.05,.855,.06],[.47,0,.745,.715],[.95,.05,.795,.035],[.6,.04,.98,
.335],[.6,-.28,.735,.045],a],Out:[[.25,.46,.45,.94],[.215,.61,.355,1],[.165,.84,.44,1],[.23,1,.32,1],[.39,.575,.565,1],[.19,1,.22,1],[.075,.82,.165,1],[.175,.885,.32,1.275],function(b,c){return 1-a(1-b,c)}],InOut:[[.455,.03,.515,.955],[.645,.045,.355,1],[.77,0,.175,1],[.86,0,.07,1],[.445,.05,.55,.95],[1,0,0,1],[.785,.135,.15,.86],[.68,-.55,.265,1.55],function(b,c){return.5>b?a(2*b,c)/2:1-a(-2*b+2,c)/2}]},c={linear:y(.25,.25,.75,.75)},e={},l;for(l in d)e.type=l,d[e.type].forEach(function(a){return function(d,
e){c["ease"+a.type+b[e]]=g.fnc(d)?d:y.apply($jscomp$this,d)}}(e)),e={type:e.type};return c}(),ia={css:function(a,b,d){return a.style[b]=d},attribute:function(a,b,d){return a.setAttribute(b,d)},object:function(a,b,d){return a[b]=d},transform:function(a,b,d,c,e){c[e]||(c[e]=[]);c[e].push(b+"("+d+")")}},q=[],z=0,ja=function(){function a(){z=requestAnimationFrame(b)}function b(b){var c=q.length;if(c){for(var d=0;d<c;)q[d]&&q[d].tick(b),d++;a()}else cancelAnimationFrame(z),z=0}return a}();n.version="2.0.2";
n.speed=1;n.running=q;n.remove=function(a){a=M(a);for(var b=q.length;b--;)for(var d=q[b],c=d.animations,e=c.length;e--;)F(a,c[e].animatable.target)&&(c.splice(e,1),c.length||d.pause())};n.getValue=J;n.path=function(a,b){var d=g.str(a)?v(a)[0]:a,c=b||100;return function(a){return{el:d,property:a,totalLength:d.getTotalLength()*(c/100)}}};n.setDashoffset=function(a){var b=a.getTotalLength();a.setAttribute("stroke-dasharray",b);return b};n.bezier=y;n.easings=N;n.timeline=function(a){var b=n(a);b.pause();
b.duration=0;b.add=function(a){b.children.forEach(function(a){a.began=!0;a.completed=!0});w(a).forEach(function(a){var c=b.duration,d=a.offset;a.autoplay=!1;a.offset=g.und(d)?c:K(d,c);b.seek(a.offset);a=n(a);a.duration>c&&(b.duration=a.duration);a.began=!0;b.children.push(a)});b.reset();b.seek(0);b.autoplay&&b.restart();return b};return b};n.random=function(a,b){return Math.floor(Math.random()*(b-a+1))+a};return n});
window.requestAnimFrame = ( function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function( callback ) {
            window.setTimeout( callback, 1000 / 60 );
        };
})();

let firework = document.getElementById( 'firework' ),
    ctx = firework.getContext( '2d' ),

    cw = fireworkSize.width,
    ch = fireworkSize.height,

    fireworks = [],

    particles = [],
    hue = 120,
    limiterTotal = 5,
    limiterTick = 0,
    timerTotal = 80,
    timerTick = 0,
    isMousedown = false,
    mx,
    my;

firework.width = cw;
firework.height = ch;

function random( min, max ) {
    return Math.random() * ( max - min ) + min;
}


function calculateDistance( p1x, p1y, p2x, p2y ) {
    let xDistance = p1x - p2x,
        yDistance = p1y - p2y;
    return Math.sqrt( Math.pow( xDistance, 2 ) + Math.pow( yDistance, 2 ) );
}

function Firework( sx, sy, tx, ty ) {

    this.x = sx;
    this.y = sy;

    this.sx = sx;
    this.sy = sy;

    this.tx = tx;
    this.ty = ty;

    this.distanceToTarget = calculateDistance( sx, sy, tx, ty );
    this.distanceTraveled = 0;

    this.coordinates = [];
    this.coordinateCount = 3;

    while( this.coordinateCount-- ) {
        this.coordinates.push( [ this.x, this.y ] );
    }
    this.angle = Math.atan2( ty - sy, tx - sx );
    this.speed = 2;
    this.acceleration = 1.05;
    this.brightness = random( 50, 70 );
    this.targetRadius = 1;
}

Firework.prototype.update = function( index ) {
    this.coordinates.pop();
    this.coordinates.unshift( [ this.x, this.y ] );

    if( this.targetRadius < 8 ) {
        this.targetRadius += 0.3;
    } else {
        this.targetRadius = 1;
    }

    this.speed *= this.acceleration;

    let vx = Math.cos( this.angle ) * this.speed,
        vy = Math.sin( this.angle ) * this.speed;
    this.distanceTraveled = calculateDistance( this.sx, this.sy, this.x + vx, this.y + vy );

    if( this.distanceTraveled >= this.distanceToTarget ) {
        createParticles( this.tx, this.ty );
        fireworks.splice( index, 1 );
    } else {
        this.x += vx;
        this.y += vy;
    }
};

Firework.prototype.draw = function() {
    ctx.beginPath();
    ctx.moveTo( this.coordinates[ this.coordinates.length - 1][ 0 ], this.coordinates[ this.coordinates.length - 1][ 1 ] );
    ctx.lineTo( this.x, this.y );
    ctx.strokeStyle = 'hsl(' + hue + ', 100%, ' + this.brightness + '%)';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc( this.tx, this.ty, this.targetRadius, 0, Math.PI * 2 );
    ctx.stroke();
};

function Particle( x, y ) {
    this.x = x;
    this.y = y;
    this.coordinates = [];
    this.coordinateCount = 5;
    while( this.coordinateCount-- ) {
        this.coordinates.push( [ this.x, this.y ] );
    }
    this.angle = random( 0, Math.PI * 2 );
    this.speed = random( 1, 10 );
    this.friction = 0.95;
    this.gravity = 1;
    this.hue = random( hue - 50, hue + 50 );
    this.brightness = random( 50, 80 );
    this.alpha = 1;
    this.decay = random( 0.015, 0.03 );
}

Particle.prototype.update = function( index ) {

    this.coordinates.pop();
    this.coordinates.unshift( [ this.x, this.y ] );
    this.speed *= this.friction;
    this.x += Math.cos( this.angle ) * this.speed;
    this.y += Math.sin( this.angle ) * this.speed + this.gravity;
    this.alpha -= this.decay;

    if( this.alpha <= this.decay ) {
        particles.splice( index, 1 );
    }
};


Particle.prototype.draw = function() {
    ctx. beginPath();
    ctx.moveTo( this.coordinates[ this.coordinates.length - 1 ][ 0 ], this.coordinates[ this.coordinates.length - 1 ][ 1 ] );
    ctx.lineTo( this.x, this.y );
    ctx.strokeStyle = 'hsla(' + this.hue + ', 100%, ' + this.brightness + '%, ' + this.alpha + ')';
    ctx.stroke();
};

function createParticles( x, y ) {
    let particleCount = 30;
    while( particleCount-- ) {
        particles.push( new Particle( x, y ) );
    }
}

function playFirework() {
    requestAnimFrame( playFirework );

    hue = random(0, 360 );

    ctx.globalCompositeOperation = 'destination-out';
     ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect( 0, 0, cw, ch );
    ctx.globalCompositeOperation = 'lighter';

    // playFirework over each firework, draw it, update it
    let i = fireworks.length;
    while( i-- ) {
        fireworks[ i ].draw();
        fireworks[ i ].update( i );
    }

    i = particles.length;
    while( i-- ) {
        particles[ i ].draw();
        particles[ i ].update( i );
    }

    if( timerTick >= timerTotal ) {
        if( !isMousedown ) {
             fireworks.push( new Firework( cw / 2, ch, random( 0, cw ), random( 0, ch / 2 ) ) );
            timerTick = 0;
        }
    } else {
        timerTick++;
    }

    if( limiterTick >= limiterTotal ) {
        if( isMousedown ) {
            fireworks.push( new Firework( cw / 2, ch, mx, my ) );
            limiterTick = 0;
        }
    } else {
        limiterTick++;
    }
}

firework.addEventListener( 'mousemove', function(e ) {
    mx = e.pageX - firework.offsetLeft;
    my = e.pageY - firework.offsetTop;
});


firework.addEventListener( 'isMousedown', function(e ) {
    e.preventDefault();
    isMousedown = true;
});

firework.addEventListener( 'mouseup', function(e ) {
    e.preventDefault();
    isMousedown = false;
});


//window.onload = playFirework;



