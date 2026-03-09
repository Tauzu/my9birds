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

// 日本語を含むかどうか判定
function containsJapanese(str) {
  return /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uffef\u4e00-\u9faf]/.test(str);
}

// MyMemory APIで日本語→英語翻訳
async function translateToEnglish(text) {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ja|en`
    );
    const data = await res.json();
    return data.responseData.translatedText || text;
  } catch {
    return text; // 翻訳失敗時はそのまま使用
  }
}

// URLをBase64に変換するヘルパー関数
async function toBase64(url){
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
  const word = e.target.value.trim();
  if (!word) return;

  const results = document.getElementById("results");
  results.innerHTML = "<p style='color:#888;font-size:13px;'>検索中…</p>";

  // 日本語なら英語に翻訳してから検索
  let searchWord = word;
  if (containsJapanese(word)) {
    searchWord = await translateToEnglish(word);
  }

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchWord)}+animal&per_page=10&client_id=${accessKey}`
  );
  const data = await res.json();
  results.innerHTML = "";

  if (data.results.length === 0) {
    results.innerHTML = "<p style='color:#888;font-size:13px;'>見つかりませんでした</p>";
    return;
  }

  data.results.forEach(photo=>{
    const img=document.createElement("img");
    img.src=photo.urls.small;

    img.onclick=async()=>{
      const cell = document.querySelectorAll(".cell")[currentCell];
      cell.style.backgroundImage="";
      cell.textContent="読込中...";

      try {
        const base64 = await toBase64(photo.urls.small);
        images[currentCell] = base64;
        cell.textContent="";
        cell.style.backgroundImage=`url(${base64})`;
      } catch(err) {
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