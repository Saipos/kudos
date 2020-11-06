const canvas = document.getElementById("canvas-base");
const canvasMove = document.getElementById("canvas-move");
const context = canvas.getContext("2d");
const contextMove = canvasMove.getContext("2d");
const imageObj = new Image();
const button = document.getElementById("btn-download");
const buttonCpy = document.getElementById("btn-copy");
const buttonTemplate = document.getElementById("btn-download-template");
const theText = document.getElementById("theText");
const bt = document.getElementById("submit");
const reloadImageBtn = document.querySelector("#reloadImage");
const btnColor = document.querySelector("#submitColor");
const theColor = document.querySelector("#text-color");
const bgLoader = document.querySelector("#loader-fundo");
const fontLoader = document.querySelector("#loader-fontes");
const fontField = document.querySelector("#font-selector");
const fontSizeField = document.querySelector("#text-size");
const templateField = document.querySelector("#template-field");
const backgroundField = document.querySelector("#background-field");
const templateLoader = document.querySelector("#loader-templates");
const templatesField = document.querySelector("#template-selector");

let availableFonts = [];
let canMove = false;
let canRotate = false;

const config = {
  fontSize: 50,
  color: "#ffffff",
  fontWeight: "bold",
  fontFamily: "Dancing Script",
};

let offsetX = canvasMove.getBoundingClientRect().left;
let offsetY = canvasMove.getBoundingClientRect().top;
let scrollX = canvas.scrollLeft;
let scrollY = canvas.scrollTop;

let startX;
let startY;

let texts = [];

let selectedText = -1;

imageObj.crossOrigin = "Anonymous";

function drawStatic() {
  context.restore();
  //context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(imageObj, 0, 0);
  setTimeout(function () {
    for (let i = 0; i < texts.length; i++) {
      if (i != selectedText) {
        const text = texts[i];
        context.save();
        context.translate(text.x, text.y);
        context.rotate(text.angle);
        context.translate(-text.x, -text.y);
        context.font = `${config.fontWeight} ${
          text.fontSize ? text.fontSize : config.fontSize
        }px '${text.fontFamily ? text.fontFamily : config.fontFamily}'`;
        context.fillStyle = text.color ? text.color : config.color;
        context.fillText(text.text, text.x, text.y);
        context.restore();
      }
    }
  }, 10);
}

function drawBorder(text) {
  const x = text.x - 5;
  const y = text.y - text.height - 5;
  const w = text.width + x + 10;
  const h = text.height + y + 10;
  contextMove.strokeStyle = text.color ? text.color : config.color;
  contextMove.setLineDash([7, 3, 3]);
  contextMove.beginPath();
  contextMove.moveTo(x, y);
  contextMove.lineTo(w, y);
  contextMove.lineTo(w, h);
  contextMove.lineTo(x, h);
  contextMove.lineTo(x, y);
  contextMove.stroke();
  drawMoveCursor(text);
}

function drawMoveCursor(text) {
  const w = text.width + text.x + 30;
  const h = text.y;
  contextMove.lineWidth = 3;
  contextMove.strokeStyle = text.color ? text.color : config.color;
  contextMove.setLineDash([]);
  contextMove.beginPath();
  contextMove.arc(w, h, 10, Math.PI * 1, Math.PI * 1.5, true);
  const dots = polarToCartesian(w, h, Math.PI * 1.5, 10);
  contextMove.moveTo(dots.x + 5, dots.y + 10);
  contextMove.lineTo(dots.x, dots.y);
  contextMove.lineTo(dots.x + 10, dots.y - 3);
  contextMove.stroke();
  contextMove.lineWidth = 1;
}

function clearMove() {
  contextMove.clearRect(0, 0, canvasMove.width, canvasMove.height);
}

function draw() {
  clearMove();
  const text = texts[selectedText];
  contextMove.save();
  contextMove.translate(text.x, text.y);
  contextMove.rotate(text.angle);
  contextMove.translate(-text.x, -text.y);
  contextMove.font = `${config.fontWeight} ${
    text.fontSize ? text.fontSize : config.fontSize
  }px '${text.fontFamily ? text.fontFamily : config.fontFamily}'`;
  contextMove.fillStyle = text.color ? text.color : config.color;
  contextMove.fillText(text.text, text.x, text.y);
  theColor.value = text.color;
  btnColor.style.background = theColor.value;
  drawBorder(text);
  contextMove.restore();
}

function polarToCartesian(x, y, rad, r) {
  return {
    x: Math.floor(x + r * Math.cos(rad)),
    y: Math.floor(y + r * Math.sin(rad)),
  };
}

function textHittestCircle(x, y, textIndex) {
  const text = texts[textIndex];
  var dts = polarToCartesian(text.x, text.y, text.angle, text.width + 30);
  const w = dts.x;
  const h = dts.y;
  return x >= w - 10 && x <= w + 10 && y >= h - 10 && y <= h + 10;
}

function textHittest(x, y, textIndex) {
  const text = texts[textIndex];
  return (
    x >= text.x &&
    x <= text.x + text.width &&
    y >= text.y - text.height &&
    y <= text.y
  );
}

function handleMouseDown(e) {
  e.preventDefault();
  oldSelectedText = selectedText;
  selectedText = -1;
  theText.value = "";
  startX = parseInt(e.clientX - offsetX);
  startY = parseInt(e.clientY - offsetY);
  for (let i = 0; i < texts.length; i++) {
    if (
      textHittest(startX, startY, i) ||
      textHittestCircle(startX, startY, i)
    ) {
      selectedText = i;
      drawStatic();
      draw();
      theText.value = texts[selectedText].text;
      fontField.value = texts[selectedText].fontFamily;
      fontSizeField.value = texts[selectedText].fontSize;
      canMove = true;
      if (textHittestCircle(startX, startY, i)) {
        canMove = false;
        canRotate = true;
      }
    }
  }
  if (selectedText < 0) {
    theColor.value = config.color;
    btnColor.style.background = theColor.value;
    if (oldSelectedText !== selectedText) drawStatic();
    clearMove();
  }
}

function handleMouseUp(e) {
  e.preventDefault();
  canMove = false;
  canRotate = false;
  if (selectedText >= 0) drawStatic();
  //selectedText = -1;
}

function handleMouseOut(e) {
  e.preventDefault();
  canMove = false;
  canRotate = false;
  //drawStatic();
}

function handleMouseMove(e) {
  if (canMove) doMove(e);
  if (canRotate) doRotate(e);
}

function doMove(e) {
  e.preventDefault();
  mouseX = parseInt(e.clientX - offsetX);
  mouseY = parseInt(e.clientY - offsetY);
  let dx = mouseX - startX;
  let dy = mouseY - startY;
  startX = mouseX;
  startY = mouseY;
  const text = texts[selectedText];
  text.x += dx;
  text.y += dy;
  draw();
}

function doRotate(e) {
  e.preventDefault();
  const text = texts[selectedText];
  mouseX = parseInt(e.clientX - offsetX);
  mouseY = parseInt(e.clientY - offsetY);
  let dx = mouseX - text.x;
  let dy = mouseY - text.y;

  let angle = Math.atan2(dy, dx);
  texts[selectedText].angle = angle;
  draw();
}

canvasMove.onmousedown = handleMouseDown;
canvasMove.onmousemove = handleMouseMove;
canvasMove.onmouseup = handleMouseUp;
window.onmouseout = handleMouseOut;

doText = () => {
  let text = {
    text: theText.value,
    x: 20,
    y: 50,
    color: config.color,
    fontFamily: config.fontFamily,
    fontSize: config.fontSize,
    angle: 0,
  };

  if (selectedText >= 0) {
    text = texts[selectedText];
    text.text = theText.value;
  }

  context.font = `${config.fontWeight} ${text.fontSize}px '${text.fontFamily}'`;
  text.width = context.measureText(text.text).width;
  text.height = text.fontSize;

  if (selectedText < 0) {
    texts.push(text);
    drawStatic();
  } else {
    texts[selectedText] = text;
    draw();
  }
  contextMove.setTransform(1, 0, 0, 1, 0, 0);
};
imageObj.onload = function (e) {
  drawStatic();
  bgLoader.classList.remove("show");
};

bt.onclick = () => {
  doText();
  setTimeout(function () {
    theText.value = "";
  }, 0);
};

theText.onkeyup = () => {
  if (selectedText >= 0) {
    doText();
  }
};

let currImage = "";

const setImage = (url) => {
  currImage = url;
  imageObj.src = currImage;
};

const getImage = (cb) => {
  bgLoader.classList.add("show");
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (cb) cb();
      bgLoader.classList.remove("show");
      if (this.status == 200) {
        setImage(xhttp.responseURL);
      }
    }
  };
  xhttp.open(
    "GET",
    "https://source.unsplash.com/650x400/?nature,water,animals",
    true
  );
  xhttp.setRequestHeader(
    "cache-control",
    "no-cache, must-revalidate, post-check=0, pre-check=0"
  );
  xhttp.setRequestHeader("cache-control", "max-age=0");
  xhttp.setRequestHeader("expires", "0");
  xhttp.setRequestHeader("expires", "Tue, 01 Jan 1980 1:00:00 GMT");
  xhttp.setRequestHeader("pragma", "no-cache");
  xhttp.send();
};

function reloadImage() {
  getImage();
}

const downloadTemplate = () => {
  const storageObj = {
    image: currImage,
    texts,
  };
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(storageObj));
  buttonTemplate.setAttribute("href", dataStr);
  buttonTemplate.setAttribute("download", "template.json");
};

function copyImage() {
  canvas.toBlob(function (blob) {
    navigator.clipboard
      .write([
        new ClipboardItem(
          Object.defineProperty({}, blob.type, {
            value: blob,
            enumerable: true,
          })
        ),
      ])
      .then(function () {
        console.log("copiado");
        // do something
      });
  });
}

button.addEventListener("click", function (e) {
  button.href = canvas.toDataURL("image/png");
});
buttonTemplate.addEventListener("click", downloadTemplate);
reloadImageBtn.addEventListener("click", reloadImage);
buttonCpy.addEventListener("click", copyImage);

theColor.addEventListener("change", function (e) {
  btnColor.style.background = theColor.value;
  config.color = theColor.value;
  if (selectedText < 0) {
    drawStatic();
  } else {
    texts[selectedText].color = theColor.value;
    draw();
  }
});

const createFontTag = (font, text) => {
  let url = `https://fonts.googleapis.com/css?family=${font}`;
  const currFont = document.querySelector(`link[href="${url}"]`);
  if (currFont) {
    console.log("fonte já disponivel");
  } else {
    url += `${text ? `&text=${text}` : ""}`;
    const link = document.createElement("link");
    link.href = url;
    link.rel = "stylesheet";
    link.type = "text/css";
    link.onload = () => document.fonts.load(`12px '${font}'`);

    document.head.appendChild(link);
  }
};

const createOption = (value, label, isFont) => {
  const opt = document.createElement("option");
  opt.value = value;
  opt.innerHTML = label;
  if (isFont) opt.style.fontFamily = value;
  return opt.outerHTML;
};

const populateFonts = () => {
  let fontFieldList = createOption("", "Selecione", false);
  for (font of availableFonts) {
    fontFieldList += createOption(font.family, font.family, true);
    createFontTag(font.family, font.family);
  }
  fontField.innerHTML = fontFieldList;
};

const getFonts = () => {
  fontLoader.classList.add("show");
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      fontLoader.classList.remove("show");
      if (this.status == 200) {
        availableFonts = JSON.parse(xhttp.responseText);
        populateFonts();
      }
    }
  };
  xhttp.open("GET", "fonts.json", true);
  xhttp.send();
};

fontField.onchange = (e) => {
  fontLoader.classList.add("show");
  addFont(fontField.value);
};

function addFont(name) {
  createFontTag(name, null);
  checkfontcounter[name] = 0;
  checkfonttimeout[name] = setTimeout(() => checkfont(name), 300);
}

fontSizeField.onchange = (e) => {
  config.fontSize = fontSizeField.value;
  if (selectedText >= 0) {
    texts[selectedText].fontSize = Number(fontSizeField.value);
    doText();
  }
};

const checkfont = (font) => {
  clearTimeout(checkfonttimeout[font]);
  if (document.fonts.check(`12px '${font}'`)) {
    fontLoader.classList.remove("show");
    config.fontFamily = fontField.value;
    fontField.style.fontFamily = fontField.value;
    if (selectedText >= 0) {
      texts[selectedText].fontFamily = fontField.value;
      doText();
    }
  } else {
    checkfontcounter[font]++;
    if (checkfontcounter[font] < 50) {
      checkfonttimeout[font] = setTimeout(() => checkfont(font), 300);
    }
  }
};
let checkfonttimeout = {};
let checkfontcounter = {};

function setTexts(textsToSet) {
  for (t of textsToSet) {
    fontLoader.classList.add("show");
    addFont(t.fontFamily);
  }
  texts = textsToSet;
}

function activateTemplate(json) {
  setTexts(json.texts);
  if (json.image) {
    bgLoader.classList.remove("show");
    setImage(json.image);
  }
}

templateField.addEventListener("change", function (event) {
  var file = event.target.files[0];
  var reader = new FileReader();
  reader.onload = function (event) {
    if (event.target.result) {
      try {
        const tempData = JSON.parse(event.target.result);
        activateTemplate(tempData);
      } catch (error) {
        console.error(error);
      }
    }
  };
  reader.readAsText(file);
});

backgroundField.addEventListener("change", function (event) {
  var file = event.target.files[0];
  if (/\.(jpe?g|png|gif)$/i.test(file.name)) {
    var reader = new FileReader();

    reader.addEventListener(
      "load",
      function () {
        var img = new Image();
        img.title = file.name;

        img.addEventListener("load", function () {
          var canvasResize = document.createElement("canvas");
          canvasResize.width = "650";
          canvasResize.height = "400";
          var ctx = canvasResize.getContext("2d");
          ctx.drawImage(img, 0, 0);

          var MAX_WIDTH = 650;
          var MAX_HEIGHT = 400;
          var width = img.width;
          var height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvasResize.width = width;
          canvasResize.height = height;
          var ctx = canvasResize.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          var dataurl = canvasResize.toDataURL("image/png");
          setImage(dataurl);
        });

        img.src = this.result;
      },
      false
    );

    reader.readAsDataURL(file);
  }
});

const populateTemplates = () => {
  let templateFieldList = createOption("", "Selecione");
  for (template of availableTemplates) {
    (templateFieldList += createOption(template.file, template.name)), false;
  }
  templatesField.innerHTML = templateFieldList;
};

const getTemplates = () => {
  templateLoader.classList.add("show");
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      templateLoader.classList.remove("show");
      if (this.status == 200) {
        availableTemplates = JSON.parse(xhttp.responseText);
        populateTemplates();
      }
    }
  };
  xhttp.open("GET", "templates/lista.json", true);
  xhttp.send();
};

templatesField.onchange = (e) => {
  templateLoader.classList.add("show");
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      templateLoader.classList.remove("show");
      if (this.status == 200) {
        const templateJson = JSON.parse(xhttp.responseText);
        activateTemplate(templateJson);
      }
    }
  };
  xhttp.open("GET", "templates/" + templatesField.value, true);
  xhttp.send();
};

function init() {
  getImage(getFonts);
  getTemplates();
}

init();
