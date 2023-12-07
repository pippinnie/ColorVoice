(() => {
  const focusSize = 50;
  let focusX = 0;
  let focusY = 0;

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

    // adjust the image
    // context.filter = "saturate(120%) contrast(150%)";

    // capture from video to canvas
    context.drawImage(
      video,
      focusX,
      focusY,
      focusSize,
      focusSize,
      0,
      0,
      focusSize,
      focusSize
    );

    // capture from canvas to image
    const data = canvas.toDataURL("image/png");
    photo.setAttribute("src", data);

    // To show the captured photo on screen
    document.getElementById("capture-area").classList.add("show");
  }

  // Get the color result
  function getColor() {
    const colorThief = new ColorThief();
    let dominantColor;

    // Get a dominant color
    dominantColor = colorThief.getColor(photo, 0); // quality number determines how many pixels are skipped before the next one is sampled.

    const dominantColorHex = rgbToHex(
      dominantColor[0],
      dominantColor[1],
      dominantColor[2]
    );

    console.log("Dorminant color hex: ", dominantColorHex);

    // Find color from the list compared with dominant color
    const colorResult = findColor(dominantColorHex);
    console.log("Matched color: ", colorResult);

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
    captureArea = document.getElementById("capture-area");
    focusArea = document.getElementById("focus-area");

    // Set canvas size
    canvas.width = focusSize;
    canvas.height = focusSize;
    canvas.setAttribute("width", focusSize);
    canvas.setAttribute("height", focusSize);

    // After the page is loaded, it will get the video streaming from the rear camera.
    startVideo();

    // To show the video streaming on the page
    video.addEventListener(
      "canplay",
      (ev) => {
        if (!streaming) {
          // height = (video.videoHeight / video.videoWidth) * width;
          // video.setAttribute("width", width);
          // video.setAttribute("height", height);

          focusX = video.videoWidth / 2 - focusSize / 2;
          focusY = video.videoHeight / 2 - focusSize / 2;

          // To add focus area on the video
          focusArea.classList.add("show");
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
      getColor();
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
        captureArea.classList.remove("show");
        // To remove the focus area from screen
        focusArea.classList.remove("show");
        // To change the toggle button name
        toggle.innerText = "Turn on Camera";
        return;
      }

      // Start the video screen if video streaming is currently off
      startVideo();
      // To change the toggle button name
      toggle.innerText = "Turn off Camera";
    });
  });
})();
