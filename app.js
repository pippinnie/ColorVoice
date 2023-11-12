(() => {
  const width = 320;
  let height = 0; // This will be computed based on the input stream

  let streaming = false; // Video from the camera. Start at false.

  let video = null;
  let canvas = null;
  let photo = null;
  let button = null;

  // Take a still image from the streaming video into the 'photo' element
  function takepicture() {
    const context = canvas.getContext("2d");
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);

      const data = canvas.toDataURL("image/png");
      photo.setAttribute("src", data);
    }
  }

  function getColor() {
    const colorThief = new ColorThief();
    let dominantColor;

    // Get a dominant color
    dominantColor = colorThief.getColor(photo, 1); // quality number determines how many pixels are skipped before the next one is sampled.

    const dominantColorHex = rgbToHex(
      dominantColor[0],
      dominantColor[1],
      dominantColor[2]
    );

    console.log(dominantColor, dominantColorHex);

    var getNearestColor = nearestColor.from(colors);

    const colorResult = getNearestColor(dominantColorHex);

    console.log(colorResult);

    var msg = new SpeechSynthesisUtterance();
    msg.text = colorResult.name;
    window.speechSynthesis.speak(msg);
  }

  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  async function getVideoConstraints() {
    // get available devices
    const devices = await navigator.mediaDevices.enumerateDevices();

    var deviceLabel = ""; //Used to check if permissions have been accepted, enumerateDevices() runs without needing to accept permissions

    for (var i = 0; i < devices.length; i++) {
      deviceLabel = devices[i].label;
      if (devices[i].kind === "videoinput") {
        alert(devices[i].label);
        if (devices[i].label.includes("0")) {
          return {
            deviceId: devices[i].deviceId,
          };
        }
      }
    }
    for (var i = 0; i < devices.length; i++) {
      if (devices[i].kind === "videoinput") {
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

  document.addEventListener("DOMContentLoaded", async function () {
    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    photo = document.getElementById("photo");
    button = document.getElementById("take-photo");

    // After the page is loaded, it will get the video streaming from the rear camera.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: await getVideoConstraints(),
      });
      video.srcObject = stream;
    } catch (error) {
      console.error("Error accessing the camera: " + error);
    }

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

    // If the button is clicked, the still image will be taken.
    // button.addEventListener("click", () => {
    //   takepicture();
    // });

    // If the video is clicked/tapped on, the still image will be taken.
    video.addEventListener("click", () => {
      takepicture();
    });

    // Call the fuction to get the color after photo is loaded
    photo.addEventListener("load", function () {
      console.log("get color");
      getColor();
    });
  });
})();
