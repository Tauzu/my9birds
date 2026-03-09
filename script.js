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

// Wikipedia APIで日本語記事に対応する英語タイトルを取得
async function getEnglishViaWikipedia(jaWord) {
  try {
    // 日本語Wikipediaで記事を検索し、英語版の対応タイトルを取得
    const searchRes = await fetch(
      `https://ja.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(jaWord)}&prop=langlinks&lllang=en&format=json&origin=*`
    );
    const searchData = await searchRes.json();
    const pages = searchData.query.pages;
    const page = Object.values(pages)[0];

    // 英語版リンクがあればそのタイトルを返す
    if (page.langlinks && page.langlinks.length > 0) {
      return page.langlinks[0]["*"];
    }

    // 直接ヒットしない場合はsearchで候補を探す
    const suggestRes = await fetch(
      `https://ja.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(jaWord)}&srlimit=1&format=json&origin=*`
    );
    const suggestData = await suggestRes.json();
    const hit = suggestData.query.search[0];
    if (!hit) return null;

    const hitRes = await fetch(
      `https://ja.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(hit.title)}&prop=langlinks&lllang=en&format=json&origin=*`
    );
    const hitData = await hitRes.json();
    const hitPage = Object.values(hitData.query.pages)[0];
    if (hitPage.langlinks && hitPage.langlinks.length > 0) {
      return hitPage.langlinks[0]["*"];
    }

    return null;
  } catch {
    return null;
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

  let searchWord = word;
  let translatedLabel = "";

  if (containsJapanese(word)) {
    const enWord = await getEnglishViaWikipedia(word);
    if (enWord) {
      searchWord = enWord;
      translatedLabel = enWord;
    }
    // Wikipedia失敗時はそのまま日本語で試みる
  }

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchWord)}&per_page=10&client_id=${accessKey}`
  );
  const data = await res.json();

  results.innerHTML = "";

  if (translatedLabel) {
    const label = document.createElement("p");
    label.style.cssText = "color:#888;font-size:12px;margin:0 0 8px;";
    label.textContent = `「${word}」→ "${translatedLabel}" で検索`;
    results.appendChild(label);
  }

  if (data.results.length === 0) {
    const msg = document.createElement("p");
    msg.style.cssText = "color:#888;font-size:13px;";
    msg.textContent = "見つかりませんでした";
    results.appendChild(msg);
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