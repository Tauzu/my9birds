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

html2canvas(document.getElementById("capture")).then(canvas=>{

const link=document.createElement("a");
link.download="9creatures.png";
link.href=canvas.toDataURL();
link.click();

});

}

function shareX(){

const text=`${name}を構成する9つのいきもの`;

const url=`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

window.open(url,"_blank");

}
