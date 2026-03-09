const accessKey = "msIwwhLd2l1xdwmnXKufnrGKCcGctIqTcB1UamYHzHk";

let currentCell = null;
let images = new Array(9);

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

img.onclick=()=>{

images[currentCell]=photo.urls.small;

document.querySelectorAll(".cell")[currentCell]
.style.backgroundImage=`url(${photo.urls.small})`;

closeModal();

}

results.appendChild(img);

});

});

document.getElementById("completeBtn").onclick=()=>{

if(images.includes(undefined)){
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
