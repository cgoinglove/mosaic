const box = document.getElementById('image-upload-box')!;
const input = document.getElementById(
  'image-upload-input',
)! as HTMLInputElement;

const canvas = document.getElementById('canvas')! as HTMLCanvasElement;

const size = 400;

const blockPixcelSize = 20;

box.addEventListener('dragenter', e => {
  e.preventDefault();
  if (box.classList.contains('dragover')) return;
  box.classList.add('dragover');
});
box.addEventListener('dragleave', () => {
  box.classList.remove('dragover');
});
box.addEventListener('dragover', e => {
  e.preventDefault();
});
box.addEventListener('drop', e => {
  e.preventDefault();
  box.classList.remove('dragover');
  if (!e.dataTransfer?.files) return;
  input.files = e.dataTransfer?.files;
  input.dispatchEvent(new Event('change'));
});
box.addEventListener('click', () => {
  input.click();
});
input.addEventListener('change', () => {
  if (!input.files) return;
  const file = input.files[0];
  if (!file.type.startsWith('image/')) return;
  const reader = new FileReader();

  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d')!;
      const scaleFactor = size / img.height;

      canvas.width = img.width * scaleFactor;
      canvas.height = img.height * scaleFactor;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      mosaic(ctx);
    };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(file);
});

function mosaic(ctx: CanvasRenderingContext2D) {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);

  const imageHelper = new ImageHelper(imageData);

  const blockArray = genSquareArray(10);

  console.time();

  blockArray.forEach(blockPosition => {
    const weightX = blockPosition.x * blockPixcelSize;
    const weigthY = blockPosition.y * blockPixcelSize;
    const { position, sum } = genSquareArray(blockPixcelSize).reduce(
      (prev, pixcelPosition) => {
        const x = weightX + pixcelPosition.x;
        const y = weigthY + pixcelPosition.y;
        const pixel = imageHelper.getPixel(x, y);
        prev.position.push([x, y]);
        prev.sum[0] += pixel.r;
        prev.sum[1] += pixel.g;
        prev.sum[2] += pixel.b;
        prev.sum[3] += pixel.a;
        return prev;
      },
      {
        sum: [0, 0, 0, 0] as [r: number, g: number, b: number, a: number],
        position: [] as [number, number][],
      },
    );
    const color = sum.map(v => v / position.length);
    position.forEach(([x, y]) => {
      imageHelper.setPixel(x, y, {
        r: color[0],
        g: color[1],
        b: color[2],
        a: color[3],
      });
    });
  });

  ctx.putImageData(imageData, 0, 0);
  console.timeEnd();
}

class ImageHelper {
  height: number;
  width: number;
  constructor(private image: ImageData) {
    this.width = image.width;
    this.height = image.height;
  }

  getPixelIndex(x: number, y: number) {
    return y * 4 * this.width + x * 4;
  }
  getPixel(x: number, y: number) {
    const index = this.getPixelIndex(x, y);
    return {
      r: this.image.data[index],
      g: this.image.data[index + 1],
      b: this.image.data[index + 2],
      a: this.image.data[index + 3],
    };
  }
  setPixel(
    x: number,
    y: number,
    rgba: {
      r: number;
      g: number;
      b: number;
      a?: number;
    },
  ) {
    const index = this.getPixelIndex(x, y);
    this.image.data[index] = rgba.r;
    this.image.data[index + 1] = rgba.g;
    this.image.data[index + 2] = rgba.b;
    if (rgba.a) this.image.data[index + 3] = rgba.a;
  }
}

function genArray(length: number) {
  return Array.from({ length }, (_, i) => i);
}

function genSquareArray(length: number) {
  return genArray(length ** 2).map(i => ({
    x: i % length,
    y: Math.floor(i / length),
  }));
}
