const images = JSON.parse(localStorage.getItem("images"));
const userName = localStorage.getItem("name");

// imgur Client ID（匿名アップロード用）
const IMGUR_CLIENT_ID = "546c25a59c58ad7";

document.getElementById("title").innerText =
  `${userName}を構成する9羽の鳥`;

const grid = document.getElementById("resultGrid");
images.forEach(url => {
  const img = document.createElement("img");
  img.src = url;
  img.width = 150;
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
    ctx.fillText(`${userName}を構成する9羽の鳥`, canvas.width / 2, padding + 30);

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

        // object-fit: cover 相当の中央クロップ
        const iw = img.naturalWidth, ih = img.naturalHeight;
        const scale = Math.max(cellSize / iw, cellSize / ih);
        const sw = cellSize / scale, sh = cellSize / scale;
        const sx = (iw - sw) / 2, sy = (ih - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, x, y, cellSize, cellSize);

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
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y);
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
  link.download = "my9birds.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

window.shareURL = async function shareURL() {
  const btn = document.getElementById("shareBtn");
  btn.textContent = "アップロード中…";
  btn.disabled = true;

  try {
    const canvas = await buildCanvas();
    const blob = await new Promise(r => canvas.toBlob(r, "image/png"));

    const formData = new FormData();
    formData.append("image", blob);
    formData.append("type", "file");

    const res = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: { Authorization: `Client-ID ${IMGUR_CLIENT_ID}` },
      body: formData,
    });
    const data = await res.json();
    if (!data.success) throw new Error("upload failed");

    const imageUrl = data.data.link;
    showURLPanel(imageUrl);

  } catch (e) {
    alert("アップロードに失敗しました。時間をおいて再試行してください。");
    console.error(e);
  } finally {
    btn.textContent = "URLで共有";
    btn.disabled = false;
  }
}

function showURLPanel(url) {
  let panel = document.getElementById("urlPanel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "urlPanel";
    panel.style.cssText = `
      margin: 20px auto;
      max-width: 500px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(panel);
  }

  panel.innerHTML = `
    <p style="margin:0 0 10px;font-size:14px;color:#555;">画像URLが発行されました</p>
    <div style="display:flex;gap:8px;align-items:center;">
      <input id="urlInput" readonly value="${url}"
        style="flex:1;padding:8px;border:1px solid #ccc;border-radius:6px;font-size:13px;" />
      <button onclick="copyURL()" id="copyBtn"
        style="padding:8px 14px;background:#333;color:white;border:none;border-radius:6px;cursor:pointer;white-space:nowrap;">
        コピー
      </button>
    </div>
  `;

  panel.scrollIntoView({ behavior: "smooth" });
}

window.copyURL = function copyURL() {
  const input = document.getElementById("urlInput");
  navigator.clipboard.writeText(input.value).then(() => {
    const btn = document.getElementById("copyBtn");
    btn.textContent = "コピーしました✓";
    setTimeout(() => btn.textContent = "コピー", 2000);
  });
}