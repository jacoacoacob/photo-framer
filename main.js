const PADDING_MIN = 1;
const PADDING_MAX = 5;

const CANVAS_WIDTH = 600;

const controls = document.getElementById("controls");
const canvasContainer = document.getElementById("canvas-container");

/** @type {HTMLCanvasElement} */
const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_WIDTH;

const aspectRatioState = useState("2:3");
const conatinerBgColorState = useState("black");

const imageState = useState({
  activeIndex: -1,
  list: [],
});

const paddingState = useState({
  padding: 2,
  fillStyle: "#ffffff",
});

imageState.watch(renderActiveImage, { immediate: true });
paddingState.watch(renderActiveImage, { immediate: true });

conatinerBgColorState.watch(
  (current) => {
    canvasContainer.style.backgroundColor = current;
  },
  { immediate: true }
);

setupFileInputControl();
setupContainerBgColorControl();
setupPaddingControl();
setupSaveButton();


function setupFileInputControl() {
  const fileUpload = createInput({
    label: "Upload photo",
    async onChange(ev) {
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
    },
  });

  fileUpload.input.setAttribute("type", "file");
  fileUpload.input.setAttribute("accept", "image/*");

  controls.append(fileUpload.container);
}


function setupPaddingControl() {
  const color = createInput({
    label: "Frame color",
    initialValue: paddingState.value.fillStyle,
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

function setupSaveButton() {
  const button = document.createElement("button");
  button.textContent = "Save image";
  button.style.cursor = "pointer";
  button.style.border = "1px solid #aaa";
  button.style.borderRadius = "4px";
  button.style.padding = "4px 8px";

  button.addEventListener("click", () => {
    if (imageState.value.activeIndex > -1) {
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/jpeg");
      a.download = "framed_" + canvas.dataset.fileName;
      a.click();
    }
  });

  controls.append(button);
}


function renderActiveImage() {
  /** @type {HTMLImageElement | undefined} */
  const image = imageState.value.list[imageState.value.activeIndex];

  if (image) {
    const { naturalWidth, naturalHeight, dataset } = image;
    canvas.dataset.fileName = dataset.fileName;

    const heightRatio = getHeightRatio(naturalWidth, naturalHeight);

    canvas.style.width = CANVAS_WIDTH + "px";
    canvas.style.height = Math.round(CANVAS_WIDTH * heightRatio) + "px";

    canvas.width = naturalWidth;
    canvas.height = naturalHeight;

    const paddingModifier = [-34, -21, -13, -8, -3][paddingState.value.padding - 1];

    const xAspect = 1;
    const yAspect = heightRatio;
  
    const xMod = xAspect * (PADDING_MAX - paddingModifier);
    const yMod = yAspect * (PADDING_MAX - paddingModifier);

    const paddingX = image.naturalWidth / xMod;
    const paddingY = image.naturalHeight / yMod;

    ctx.fillStyle = paddingState.value.fillStyle;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
 *   onInput?: (ev: InputEvent) => void;
 *   onChange?: (ev: InputEvent) => void;
 * }} param0 
 * @returns 
 */
function createInput({
  initialValue,
  label,
  onInput,
  onChange,
} = {}) {
  const container = document.createElement("div");
  container.classList.add("input");

  const label_ = document.createElement("label");
  label_.classList.add("input__label");
  label_.textContent = label;


  const input = document.createElement("input");
  input.classList.add("input__input");
  input.value = initialValue;
  
  if (onInput) {
    input.addEventListener("input", onInput);
  }
  
  if (onChange) {
    input.addEventListener("change", onChange);
  }

  container.append(label_, input);

  return { container, input, label: label_ };
}

function getHeightRatio(width, height) {
  return round(height / width);
}

function round(number) {
  return Math.round(number * 100) / 100;
}