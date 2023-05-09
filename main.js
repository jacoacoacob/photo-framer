const controls = document.getElementById("controls");

/** @type {HTMLCanvasElement} */
const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");


const aspectRatioState = useState("2:3");

const imageState = useState({
  activeIndex: -1,
  list: [],
});

const paddingState = useState({
  x: 1,
  y: 1,
  fillStyle: "white",
});

const borderState = useState({
  width: 1,
  color: "black"
});


imageState.watch(renderActiveImage);


// setupAspectRatioControl();
setupFileInputControl();


function setupAspectRatioControl() {
  const select = document.createElement("select");

  const placeholder = document.createElement("option");
  placeholder.disabled = true;
  placeholder.textContent = "Aspect Ratio";
  select.append(placeholder);
  
  ["2:3", "Square"].forEach((x) => {
    const option = document.createElement("option");
    option.textContent = x;
    option.value = x;
    option.selected = x === aspectRatioState.value;
    select.append(option);
  });

  select.addEventListener("change", (ev) => {
    aspectRatioState.update(ev.target.value);
  });

  controls.append(select);
}


function setupFileInputControl() {
  const fileInput = document.createElement("input");
  fileInput.setAttribute("type", "file");
  fileInput.setAttribute("accept", "image/*");
  // fileInput.setAttribute("multiple", "");

  fileInput.addEventListener("change", async (ev) => {
    if (!ev.target.files || ev.target.files.length === 0) {
      return;
    }

    try {
      const imagePromises = [];

      for (let i = 0; i < ev.target.files.length; i++) {
        imagePromises.push(loadImage(ev.target.files[i]));
      }

      imageState.update({
        activeIndex: 0, 
        list: await Promise.all(imagePromises)
      });
    } catch (error) {
      console.error(error);
    }
  });

  controls.append(fileInput)
}



function renderActiveImage() {
  const image = imageState.value.list[imageState.value.activeIndex];
    
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const paddingX = image.naturalWidth / (9 * (5 - paddingState.value.x));
  const paddingY = image.naturalHeight / (6 * (5 - paddingState.value.y));

  ctx.restore();
  ctx.fillStyle = paddingState.value.fillStyle;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(
    image,
    paddingX / 2,
    paddingY / 2,
    canvas.width - paddingX,
    canvas.height - paddingY
  );
}


function useState(intialValue) {
  let current = intialValue;

  const watchers = [];

  return {
    get value() {
      return current;
    },
    update(newValue) {
      const prev = current;
      current = newValue;
      watchers.forEach((watcher) => {
        watcher(current, prev);
      });
    },
    watch(watcher, opts = {}) {
      watchers.push(watcher);
      if (opts.immediate) {
        watcher(current, null);
      }
    }
  }
}

/**
 * 
 * @param {File} file 
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", (ev) => {
      const image = new Image();
      image.src = ev.target.result;
      image.dataset.fileName = file.name;
      image.dataset.fileSize = file.size
      image.addEventListener("load", () => {
        resolve(image);
      });
      image.addEventListener("error", () => {
        reject(new Error("Couldn't load image"));
      });
    });
    reader.addEventListener("error", () => {
      reject(new Error("Couldn't reading image data"));
    });
    reader.readAsDataURL(file);
  });
}
