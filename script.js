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
  document.getElementById("overlay").classList.remove("hidden");
  document.getElementById("searchBox").focus();
}

function closeModal(){
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("overlay").classList.add("hidden");
}

// 日本語を含むかどうか判定
function containsJapanese(str) {
  return /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uffef\u4e00-\u9faf]/.test(str);
}

// Wikipedia APIで日本語記事に対応する英語タイトルを取得
async function getEnglishViaWikipedia(jaWord) {
  try {
    const searchRes = await fetch(
      `https://ja.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(jaWord)}&prop=langlinks&lllang=en&format=json&origin=*`
    );
    const searchData = await searchRes.json();
    const pages = searchData.query.pages;
    const page = Object.values(pages)[0];

    if (page.langlinks && page.langlinks.length > 0) {
      return page.langlinks[0]["*"];
    }

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

// URLをBase64に変換するヘルパー関数（プロキシ→直接の順で試みる）
async function toBase64(url){
  const tryFetch = async (fetchUrl) => {
    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error(res.status);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}`;
  try {
    return await tryFetch(wsrvUrl);
  } catch {
    return await tryFetch(url);
  }
}

document.getElementById("searchBox").addEventListener("change", async(e)=>{
  const word = e.target.value.trim();
  if (!word) return;

  const results = document.getElementById("results");
  results.innerHTML = "";

  const status = document.createElement("p");
  status.className = "result-status";
  status.textContent = "検索中…";
  results.appendChild(status);

  let searchWord = word;
  let translatedLabel = "";

  if (containsJapanese(word)) {
    const enWord = await getEnglishViaWikipedia(word);
    if (enWord) {
      searchWord = enWord;
      translatedLabel = enWord;
    }
  }

  // iNaturalist API で鳥類（taxon_id=3 = Aves）に限定して検索
  const res = await fetch(
    `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(searchWord)}&taxon_id=3&per_page=12`
  );
  const data = await res.json();

  results.innerHTML = "";

  if (translatedLabel) {
    const label = document.createElement("p");
    label.className = "result-translate";
    label.textContent = `「${word}」→ "${translatedLabel}" で検索`;
    results.appendChild(label);
  }

  const birds = data.results.filter(b => b.default_photo);

  if (birds.length === 0) {
    const msg = document.createElement("p");
    msg.className = "result-status";
    msg.textContent = "見つかりませんでした";
    results.appendChild(msg);
    return;
  }

  const resultGrid = document.createElement("div");
  resultGrid.className = "results-grid";
  results.appendChild(resultGrid);

  birds.forEach(bird => {
    const photoUrl = bird.default_photo.medium_url || bird.default_photo.square_url;
    if (!photoUrl) return;
    const name = bird.preferred_common_name || bird.name;

    const wrapper = document.createElement("div");
    wrapper.className = "result-item";

    const img = document.createElement("img");
    img.src = photoUrl;
    img.alt = name;

    const nameLabel = document.createElement("p");
    nameLabel.className = "result-name";
    nameLabel.textContent = name;

    wrapper.appendChild(img);
    wrapper.appendChild(nameLabel);

    wrapper.onclick = async () => {
      const cellIndex = currentCell;
      const cell = document.querySelectorAll(".cell")[cellIndex];
      cell.classList.remove("filled");
      cell.style.backgroundImage = "";
      cell.textContent = "読込中…";

      try {
        const base64 = await toBase64(photoUrl);
        images[cellIndex] = base64;
        cell.textContent = "";
        cell.style.backgroundImage = `url(${base64})`;
      } catch(err) {
        images[cellIndex] = photoUrl;
        cell.textContent = "";
        cell.style.backgroundImage = `url(${photoUrl})`;
      }

      cell.classList.add("filled");
      closeModal();
    };

    resultGrid.appendChild(wrapper);
  });
});

document.getElementById("completeBtn").onclick=()=>{
  if(images.includes(null)){
    alert("9羽すべて選んでください");
    return;
  }

  const name=document.getElementById("username").value.trim();
  if(!name){
    alert("名前を入力してください");
    return;
  }

  localStorage.setItem("images",JSON.stringify(images));
  localStorage.setItem("name",name);
  location.href="complete.html";
}
