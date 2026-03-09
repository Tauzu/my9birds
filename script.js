const accessKey = "msIwwhLd2l1xdwmnXKufnrGKCcGctIqTcB1UamYHzHk";

let currentCell = null;
let images = new Array(9).fill(null);

const grid = document.getElementById("grid");

for(let i=0;i<9;i++){
  const div=document.createElement("div");
  div.className="cell";
  div.dataset.index=i;
  div.onclick=()=>{
    currentCell=i;
    openModal();
  }
  grid.appendChild(div);
}

function openModal(){
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal(){
  document.getElementById("modal").classList.add("hidden");
}

// URLをBase64に変換するヘルパー関数
async function toBase64(url){
  // CORSプロキシ経由で画像を取得
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

document.getElementById("searchBox").addEventListener("change", async(e)=>{
  const word=e.target.value;
  const res=await fetch(
    `https://api.unsplash.com/search/photos?query=${word}+animal&per_page=10&client_id=${accessKey}`
  );
  const data=await res.json();
  const results=document.getElementById("results");
  results.innerHTML="";

  data.results.forEach(photo=>{
    const img=document.createElement("img");
    img.src=photo.urls.small;

    img.onclick=async()=>{
      // ローディング表示
      const cell = document.querySelectorAll(".cell")[currentCell];
      cell.style.backgroundImage="";
      cell.textContent="読込中...";

      try {
        // Base64に変換して保存
        const base64 = await toBase64(photo.urls.small);
        images[currentCell] = base64;
        cell.textContent="";
        cell.style.backgroundImage=`url(${base64})`;
      } catch(err) {
        // フォールバック: URLをそのまま使用
        images[currentCell] = photo.urls.small;
        cell.textContent="";
        cell.style.backgroundImage=`url(${photo.urls.small})`;
      }

      closeModal();
    }

    results.appendChild(img);
  });
});

document.getElementById("completeBtn").onclick=()=>{
  if(images.includes(null)){
    alert("9つすべて選んでください");
    return;
  }

  const name=document.getElementById("username").value;
  if(!name){
    alert("名前を入力してください");
    return;
  }

  localStorage.setItem("images",JSON.stringify(images));
  localStorage.setItem("name",name);
  location.href="complete.html";
}