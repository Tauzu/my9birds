const images = JSON.parse(localStorage.getItem("images"));
const name = localStorage.getItem("name");

// imgur Client ID（匿名アップロード用）
const IMGUR_CLIENT_ID = "546c25a59c58ad7";

document.getElementById("title").innerText =
  `${name}を構成する9つのいきもの`;

const grid = document.getElementById("resultGrid");
images.forEach(url => {
  const img = document.createElement("img");
  img.src = url;
  img.width = 120;
  grid.appendChild(img);
});

// Canvas合成
function buildCanvas() {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const cols = 3, cellSize = 120, gap = 12, padding = 20, titleHeight = 60;
    canvas.width  = cols * cellSize + (cols - 1) * gap + padding * 2;
    canvas.height = titleHeight + cols * cellSize + (cols - 1) * gap + padding * 2;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#f7f7f7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#333";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${name}を構成する9つのいきもの`, canvas.width / 2, padding + 30);

    let loaded = 0;
    images.forEach((url, i) => {
      const img = new Image();
      img.onload = () => {
        const col = i % cols, row = Math.floor(i / cols);
        const x = padding + col * (cellSize + gap);
        const y = padding + titleHeight + row * (cellSize + gap);
        ctx.save();
        roundRect(ctx, x, y, cellSize, cellSize, 8);
        ctx.clip();
        ctx.drawImage(img, x, y, cellSize, cellSize);
        ctx.restore();
        if (++loaded === images.length) resolve(canvas);
      };
      img.onerror = () => { if (++loaded === images.length) resolve(canvas); };
      img.src = url;
    });
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r);
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

// 画像保存
async function saveImage() {
  const canvas = await buildCanvas();
  const link = document.createElement("a");
  link.download = "9creatures.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// imgurにアップロードしてURLを返す
async function uploadToImgur(blob) {
  const formData = new FormData();
  formData.append("image", blob);
  formData.append("type", "file");

  const res = await fetch("https://api.imgur.com/3/image", {
    method: "POST",
    headers: { Authorization: `Client-ID ${IMGUR_CLIENT_ID}` },
    body: formData,
  });

  const data = await res.json();
  if (!data.success) throw new Error("imgur upload failed");
  return data.data.link;
}

// X共有
async function shareX() {
  // ボタンをローディング状態に
  const btn = document.querySelector("button[onclick='shareX()']");
  const originalText = btn.textContent;
  btn.textContent = "アップロード中…";
  btn.disabled = true;

  try {
    const canvas = await buildCanvas();

    const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
    const imageUrl = await uploadToImgur(blob);

    const tweetText = `${name}を構成する9つのいきもの\n${imageUrl}`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, "_blank");

  } catch (e) {
    alert("画像のアップロードに失敗しました。\n画像を保存してからXに手動で添付してください。");
    console.error(e);
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}