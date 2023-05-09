const PADDING_MIN = 1;
const PADDING_MAX = 6;

const controls = document.getElementById("controls");
const canvasContainer = document.getElementById("canvas-container");

/** @type {HTMLCanvasElement} */
const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");


const aspectRatioState = useState("2:3");
const conatinerBgColorState = useState("white");

const imageState = useState({
  activeIndex: -1,
  list: [],
});

const paddingState = useState({
  padding: 1,
  fillStyle: "white",
});

const borderState = useState({
  width: 1,
  color: "black"
});


aspectRatioState.watch((current) => {
  if (current === "2:3") {
    canvas.style.width = "600px";
    canvas.style.height = "400px";
  }
  if (current === "Square") {
    canvas.style.width = "400px";
    canvas.style.height = "400px";
  }
}, { immediate: true });

conatinerBgColorState.watch((current) => {
  canvasContainer.style.backgroundColor = current;
}, { immediate: true });

imageState.watch(renderActiveImage, { immediate: true });
paddingState.watch(renderActiveImage, { immediate: true });


setupAspectRatioControl();
setupFileInputControl();
setupPaddingControl();
setupContainerBgColorControl();


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
  fileInput.setAttribute("multiple", "");

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


function setupPaddingControl() {
  const color = createInput({
    label: "Frame color",
    onInput(ev) {
      paddingState.update({
        ...paddingState.value,
        fillStyle: ev.target.value
      });
    }
  });

  color.input.setAttribute("type", "color");

  const padding = createInput({
    label: "Frame padding",
    initialValue: paddingState.value.padding,
    onInput(ev) {
      paddingState.update({
        ...paddingState.value,
        padding: Number.parseInt(ev.target.value),
      });
    }
  });

  padding.input.setAttribute("type", "range");
  padding.input.setAttribute("step", 1);
  padding.input.setAttribute("min", PADDING_MIN);
  padding.input.setAttribute("max", PADDING_MAX);

  controls.append(color.container, padding.container);
}

function setupContainerBgColorControl() {
  const bgColor = createInput({
    label: "Container background",
    initialValue: conatinerBgColorState.value,
    onInput(ev) {
      conatinerBgColorState.update(ev.target.value);
    },
  });

  bgColor.input.setAttribute("type", "color");

  controls.append(bgColor.container);
}


function renderActiveImage() {
  const image = imageState.value.list[imageState.value.activeIndex];
    
  if (image) {
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const padding = paddingState.value.padding;

    const xMod = aspectRatioState.value === "2:3" ? 6 : 4;
    const yMod = 4;
  
    const paddingX = image.naturalWidth / (xMod * (PADDING_MAX - padding + 1));
    const paddingY = image.naturalHeight / (yMod * (PADDING_MAX - padding + 1));
  
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

/**
 * 
 * @param {{
 *   initialValue: any;
 *   label?: string;
 *   onInput: (ev: InputEvent) => void;
 * }} param0 
 * @returns 
 */
function createInput({
  initialValue,
  label,
  onInput,
} = {}) {
  const container = document.createElement("div");
  container.classList.add("input");

  const label_ = document.createElement("label");
  label_.classList.add("input__label");


  const input = document.createElement("input");
  input.classList.add("input__input");
  input.value = initialValue;
  input.addEventListener("input", onInput);

  container.append(label, input);

  return { container, input, label: label_ };
}