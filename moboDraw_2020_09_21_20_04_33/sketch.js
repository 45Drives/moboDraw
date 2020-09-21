
let controls = "f = advance, r = redraw, d = go back";

let instructions = [
  "STEP 1: Draw the board outline",
  "STEP 2: Draw all CPU outlines",
  "STEP 3: Draw the pci slots",
  "STEP 4:  Draw the dimm slots",
  "STEP 5: Draw the vga slots",
  "STEP 6: Draw the usb slots",
  "STEP 7: Draw the rj45 slots", 
  "STEP 8: Draw the sata slots",
  "STEP 9: Draw the posts",
  "STEP 10: Draw the atx power ports",
  "STEP 11: Draw the heatsinks",
  "STEP 12: Draw the battery"
];

class mobo {
  constructor() {
    this.step = 0;
    this.rects = [    
      this.board = [],
      this.cpu = [],
      this.pci = [],
      this.dimm = [],
      this.vga = [],
      this.usb = [],
      this.rj45 = [],
      this.sata = [],
      this.posts = [],
      this.atx_power = [],
      this.heatsink = [],
      this.cmos_battery = [],
    ];
    this.colors = [
      "#00600040",      //board
      "#605f6d40",  //cpu
      "#45454540",      //
      "#3266cd40",      //dimm
      "#3266cd40",  //vga
      "#b3b3b340",  //USB
      "#b3b3b340",  //rj45
      "#fcf8d440",  //sata
      "#000000ff",//posts
      "#fcf8d440",  //power
      "#8c969b40",  //heatsink
      "#e3e3e340",  //cmos battery
    ];
  }
  
  drawMobo(){
    for(let i = 0; i < this.rects.length;i++){
      for(let j = 0; j < this.rects[i].length; j++){
        fill(color(this.colors[i]));
        rect(
          this.rects[i][j][0],
          this.rects[i][j][1],
          this.rects[i][j][2],
          this.rects[i][j][3]
        );
      }
    }
  }
}



let mb;
let IMG_W = 800;
let IMG_H = 600;
let IMG;
let IMG_PATH = "https://raw.githubusercontent.com/markdhooper/moboDraw/master/img/X11DPL-i.jpg";
let locked = false;
let xOffset = 0.0;
let yOffset = 0.0;
let m_start_x,m_start_y,m_end_x,m_end_y = 0.0;


function preload() {
  IMG = loadImage(IMG_PATH);
}

function setup() {
  createCanvas(IMG_W, IMG_H);
  loadImage(IMG_PATH, img => {image(IMG, 0, 0);});
  mb = new mobo();
}

function draw() {
  background(200,200,200)
  tint(255, 255, 255, 126); 
  image(IMG, 0,0)
  
  if(m_start_x != m_end_x){
    fill(mb.colors[mb.step]);
    rect(m_start_x,m_start_y,m_end_x,m_end_y);
  }
  
  mb.drawMobo();
  
  
  //draw controls
  fill(0,0,0);
  textSize(15);
  text(controls, 10 ,height-20);
  
  //draw instructions
  text(instructions[mb.step],10,height -50);
  

 
}

function mousePressed() {
  locked = true;
  m_start_x = mouseX;
  m_start_y = mouseY;
  m_end_x = mouseX;
  m_end_y = mouseY;
}

function mouseDragged() {
  if (locked) {
    m_end_x = mouseX - m_start_x;
    m_end_y = mouseY - m_start_y;
  }
}

function mouseReleased() {
  locked = false;
  mb.rects[mb.step].push([m_start_x,m_start_y,m_end_x,m_end_y]);
  m_start_x = 0;
  m_start_y = 0;
  m_end_x = 0;
  m_end_y = 0;
}

function keyTyped() {
  if (key === 'f' && mb.step < (mb.rects.length-1) && mb.step < (instructions.length-1)){
    mb.step += 1;
  } else if (key === 'd' && mb.step > 0){
    mb.step -= 1;
  }
}