(() => {
  const width = 320;
  let height = 0; // This will be computed based on the input stream

  let streaming = false; // Video from the camera. Start at false.

  let video = null;
  let canvas = null;
  let photo = null;
  let toggle = null;
  let result = null;
  let result2 = null;
  let timeoutID = null;

  // Take a still image from the streaming video into the 'photo' element
  function takepicture() {
    const context = canvas.getContext("2d");

    if (width && height) {
      canvas.width = width;
      canvas.height = height;

      // adjust the image to have more saturation
      context.filter = "saturate(120%) contrast(150%)";

      context.drawImage(video, 0, 0, width, height);

      const data = canvas.toDataURL("image/png");
      photo.setAttribute("src", data);

      // To show the captured photo on screen
      document.getElementById("capture").classList.add("show");
    }
  }

  function getColorNew() {
    // options with defaults (not required)
    const opts = {
      colors: 5, // desired palette size
      // method: 2, // histogram method, 2: min-population threshold within subregions; 1: global top-population
      // boxSize: [64, 64], // subregion dims (if method = 2)
      // boxPxls: 2, // min-population threshold (if method = 2)
      // initColors: 4096, // # of top-occurring colors  to start with (if method = 1)
      minHueCols: 0, // # of colors per hue group to evaluate regardless of counts, to retain low-count hues
      // dithKern: null, // dithering kernel name, see available kernels in docs below
      // dithDelta: 0, // dithering threshhold (0-1) e.g: 0.05 will not dither colors with <= 5% difference
      // dithSerp: false, // enable serpentine pattern dithering
      // palette: [], // a predefined palette to start with in r,g,b tuple format: [[r,g,b],[r,g,b]...]
      // reIndex: false, // affects predefined palettes only. if true, allows compacting of sparsed palette once target palette size is reached. also enables palette sorting.
      // useCache: true, // enables caching for perf usually, but can reduce perf in some cases, like pre-def palettes
      // cacheFreq: 10, // min color occurance count needed to qualify for caching
      // colorDist: "euclidean", // method used to determine color distance, can also be "manhattan"
    };

    const q = new RgbQuant(opts);

    // analyze histograms
    q.sample(photo);

    // build palette
    const colorPalette = q.palette(true, true);
    const dominantColor = colorPalette[0];
    const dominantColorHex = rgbToHex(
      dominantColor[0],
      dominantColor[1],
      dominantColor[2]
    );

    var palHist = [];
    q.idxi32.forEach(function (i32) {
      palHist.push({ color: q.i32rgb[i32], count: q.histogram[i32] });
    });

    console.log(999, palHist);

    console.log(222, colorPalette, dominantColor, dominantColorHex);
    const output = q.reduce(photo);
    var idxi32 = new Uint32Array(output.buffer);

    const reducedPhoto = document.getElementById("reduced-photo");
    reducedPhoto.width = width;
    reducedPhoto.height = height;
    const ctx = reducedPhoto.getContext("2d");
    ctx.imageSmoothingEnabled =
      ctx.mozImageSmoothingEnabled =
      ctx.webkitImageSmoothingEnabled =
      ctx.msImageSmoothingEnabled =
        false;

    var imgd = ctx.createImageData(reducedPhoto.width, reducedPhoto.height);
    if (typeof imgd.data == "CanvasPixelArray") {
      var data = imgd.data;
      for (var i = 0, len = data.length; i < len; ++i) data[i] = idxi8[i];
    } else {
      var buf32 = new Uint32Array(imgd.data.buffer);
      buf32.set(idxi32);
    }

    ctx.putImageData(imgd, 0, 0);
    ctx.drawImage(reducedPhoto, 0, 0, reducedPhoto.width, reducedPhoto.height);

    document.getElementById("reduced-photo").src = URL.createObjectURL(
      new Blob([idxi32], { type: "image/jpeg" })
    );
  }

  // Get the color result
  function getColor() {
    const colorThief = new ColorThief();
    let dominantColor;

    // Get a dominant color
    dominantColor = colorThief.getColor(photo, 5); // quality number determines how many pixels are skipped before the next one is sampled.

    const dominantColorHex = rgbToHex(
      dominantColor[0],
      dominantColor[1],
      dominantColor[2]
    );

    console.log(111, dominantColor, dominantColorHex);

    // Find color from the list compared with dominant color
    const colorResult = findColor(dominantColorHex);
    console.log(colorResult);

    // Text to speech to say the color name out loud
    var msg = new SpeechSynthesisUtterance();
    msg.text = colorResult.name;
    window.speechSynthesis.speak(msg);

    // Show the color result name in the middle of the screen
    if (timeoutID) {
      clearTimeout(timeoutID);
    }
    result.innerText = colorResult.name;
    result.style.color = colorResult.value;

    // Remove the color result name from the screen
    timeoutID = setTimeout(() => {
      result.innerText = "";
    }, 5000);

    // Log the color result name at the capture section
    result2.innerText = colorResult.name;
    result2.style.color = colorResult.value;
  }

  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  // To return the main camera of the mobile
  async function getVideoConstraints() {
    // get available devices
    const devices = await navigator.mediaDevices.enumerateDevices();

    var deviceLabel = ""; //Used to check if permissions have been accepted, enumerateDevices() runs without needing to accept permissions

    for (var i = 0; i < devices.length; i++) {
      deviceLabel = devices[i].label;
      if (devices[i].kind === "videoinput") {
        // For andriod phones
        if (devices[i].label.includes("0")) {
          return {
            deviceId: devices[i].deviceId,
          };
        }
      }
    }
    for (var i = 0; i < devices.length; i++) {
      if (devices[i].kind === "videoinput") {
        // For iphones
        if (devices[i].label.includes("Back")) {
          return {
            deviceId: devices[i].deviceId,
          };
        }
      }
    }

    return {
      facingMode: "environment",
    };
  }

  // To start the camera
  async function startVideo() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: await getVideoConstraints(),
      });
      video.srcObject = stream;
    } catch (error) {
      console.error("Error accessing the camera: " + error);
    }
  }

  // To pause the camera
  function stopVideo() {
    const stream = video.srcObject;
    const tracks = stream.getTracks();

    tracks.forEach((track) => {
      track.stop();
    });

    video.srcObject = null;
    streaming = false;
  }

  document.addEventListener("DOMContentLoaded", async function () {
    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    photo = document.getElementById("photo");
    toggle = document.getElementById("toggle-camera");
    result = document.getElementById("color-result");
    result2 = document.getElementById("color-result2");

    // After the page is loaded, it will get the video streaming from the rear camera.
    startVideo();

    // To show the video streaming on the page
    video.addEventListener(
      "canplay",
      (ev) => {
        if (!streaming) {
          height = (video.videoHeight / video.videoWidth) * width;

          // video.setAttribute("width", width);
          // video.setAttribute("height", height);
          canvas.setAttribute("width", width);
          canvas.setAttribute("height", height);
          streaming = true;
        }
      },
      false
    );

    // If the video is clicked/tapped on, the still image will be taken.
    video.addEventListener("click", () => {
      if (streaming) {
        takepicture();
      }
    });

    // Call the fuction to get the color after photo is loaded
    photo.addEventListener("load", function () {
      console.log("get color");
      getColor();
      getColorNew();
    });

    // When the toggle button is clicked
    toggle.addEventListener("click", () => {
      // Close the video screen, reset the color result and reset the captured photo if video streaming is currently on
      if (streaming) {
        stopVideo();

        // Clear the results
        result.innerText = "";
        result2.innerText = "";
        photo.setAttribute("src", null);
        // To remove the captured photo from screen
        document.getElementById("capture").classList.remove("show");
        // To change the toggle button name
        toggle.innerText = "Open Camera";
        return;
      }

      // Start the video screen if video streaming is currently off
      startVideo();
      // To change the toggle button name
      toggle.innerText = "Stop Camera";
    });
  });
})();
