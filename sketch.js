let img;
let img_path = "https://www.supermicro.com/CDS_Image/uploads/imagecache/600px_wide/intel_motherboard_active/x11dpl-i_front_0728_3.jpg";
function preload() {
  img = loadImage(img_path);
}

function setup() {
  createCanvas(400, 400);
  loadImage(img_path, img => {image(img, 0, 0);});
}

function draw() {

}