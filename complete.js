const images = JSON.parse(localStorage.getItem("images"));
const name = localStorage.getItem("name");

document.getElementById("title").innerText =
  `${name}を構成する9つのいきもの`;

const grid = document.getElementById("resultGrid");

images.forEach(url=>{
  const img=document.createElement("img");
  img.src=url;
  img.width=120;
  grid.appendChild(img);
});

function saveImage(){
  const canvas = document.createElement("canvas");
  const cols = 3;
  const cellSize = 120;
  const gap = 12;
  const padding = 20;
  const titleHeight = 60;

  canvas.width = cols * cellSize + (cols - 1) * gap + padding * 2;
  canvas.height = titleHeight + cols * cellSize + (cols - 1) * gap + padding * 2;

  const ctx = canvas.getContext("2d");

  // 背景
  ctx.fillStyle = "#f7f7f7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // タイトル
  ctx.fillStyle = "#333";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${name}を構成する9つのいきもの`, canvas.width / 2, padding + 30);

  // 画像を読み込んで描画
  let loaded = 0;
  images.forEach((url, i) => {
    const img = new Image();
    img.onload = () => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = padding + col * (cellSize + gap);
      const y = padding + titleHeight + row * (cellSize + gap);

      // 角丸クリッピング
      ctx.save();
      roundRect(ctx, x, y, cellSize, cellSize, 8);
      ctx.clip();
      ctx.drawImage(img, x, y, cellSize, cellSize);
      ctx.restore();

      loaded++;
      if(loaded === images.length){
        const link = document.createElement("a");
        link.download = "9creatures.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    };
    img.src = url;
  });
}

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function shareX(){
  const text=`${name}を構成する9つのいきもの`;
  const url=`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url,"_blank");
}