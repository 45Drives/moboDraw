var lock = false;
var mx0 = 0.0;
var my0 = 0.0;
var mx1 = 0.0;
var my1 = 0.0;
var drawType = "circle";
var diam = 0.0;
var COMPONENTS = [];
var mode = "normal"
var backgroundImage;
var showBackground = true;
var browse;
var saveButton;
let sel;
let compCurrent = "board_outline"
var compSel = {
  board_outline:["round_rect",false,"#00800080",0,0],
  cpu:["rect",true,"#40404080",0,0],
  pci_8x_black:["rect",true,"#00000080",3,0],
  pci_16x_black:["rect",true,"#00000080",2,0],
  dimm_white:["rect",true,"#A0909080",1,0],
  cmos_battery:["circle",false,"#80808080",0,0],
  atx_holes:["circle",false,"#00000080",0,0]
};

var round_amt = 10;

var componentCopy;

let IMAGES = [];
let IMAGE_PATHS = [
  "https://raw.githubusercontent.com/markdhooper/moboDraw/master/img/cpu.png",
  "https://raw.githubusercontent.com/markdhooper/moboDraw/master/img/dimmwhite.png",
  "https://raw.githubusercontent.com/markdhooper/moboDraw/master/img/pci16xblack.png",
  "https://raw.githubusercontent.com/markdhooper/moboDraw/master/img/pci8xblack.png"
];

class component{
  constructor(type,shape,fill_color,x0,y0,x1,y1,diam,im,id){
    this.type = type;
    this.shape = shape;
    this.fill_color = fill_color;
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
    this.diam = diam;
    this.im = im;
    this.id = id;
  }
  
  display(){
    push();
    stroke(0,0,0);
    if(this.shape == "circle" && this.im != null){
      imageMode(CENTER);
      drawImage(this.im,this.x0,this.y0,this.diam,this.diam);
      circle(this.x0, this.y0, this.diam);
    }
    else if(this.shape == "rect" && this.im != null){
      imageMode(CORNER)
      rect(this.x0,this.y0,this.x1,this.y1);
      drawImage(this.im,this.x0,this.y0,this.x1,this.y1);
    }
    else if(this.shape == "circle"){
      fill(this.fill_color);
      circle(this.x0, this.y0, this.diam);
    }
    else if(this.shape == "rect"){
      fill(this.fill_color);
      rect(this.x0,this.y0,this.x1,this.y1);
    }
    else if(this.shape == "round_rect"){
      fill(this.fill_color);
      rect(this.x0,this.y0,this.x1,this.y1,round_amt);
    }
    pop();
  }
}


function drawImage(im,x,y,w,h){
    image(im,x,y,w,h);
}

function preload() {
  for(let i = 0; i < IMAGE_PATHS.length; i++){
    IMAGES.push(loadImage(IMAGE_PATHS[i]))
  }
}

function setup() {
  createCanvas(800, 600);
  loadImage(IMAGE_PATHS[0], ptr0 => drawImage(IMAGES[0],10,10,10,10) );
  loadImage(IMAGE_PATHS[1], ptr1 => drawImage(IMAGES[1],10,10,10,10) );
  loadImage(IMAGE_PATHS[2], ptr2 => drawImage(IMAGES[2],10,10,10,10) );
  loadImage(IMAGE_PATHS[3], ptr3 => drawImage(IMAGES[3],10,10,10,10) );
  
  sel = createSelect();
  sel.position(width + 10, 80);
  sel.option('board_outline');
  sel.option('cpu');
  sel.option('pci_8x_black');
  sel.option('pci_16x_black');
  sel.option('dimm_white');
  sel.option('cmos_battery');
  sel.option('atx_holes');
  sel.selected('board_outline');
  sel.changed(mySelectEvent);
  
  browse = createFileInput(loadBG);
  browse.position(width + 10, 0);
  
  saveButton = createButton('save');
  saveButton.position(width + 10, 40);
  saveButton.mousePressed(saveFiles);
}

function draw() {
  background(255,255,255);
  if(backgroundImage && showBackground){
    image(backgroundImage,0,0);
  }
  
  for(let i = 0; i < COMPONENTS.length; i++){
    COMPONENTS[i].display();
  }
  
  //draw current shape
  if(mode == "normal"){
    if(lock){
        if(compSel[compCurrent][0] == "circle"){
          push();
          fill(compSel[compCurrent][2]);
          stroke(0,0,0);
          circle(mx0,my0,diam);
          line(mx0,my0,mouseX,mouseY);
          pop();
        }
        else if(compSel[compCurrent][0] == "rect" && mx0 != mx1 && my0 != my1){
          push();
          fill(compSel[compCurrent][2]);
          stroke(0,0,0);
          rect(mx0,my0,mx1,my1);
          pop();
        }
        else if(compSel[compCurrent][0] == "round_rect" && mx0 != mx1 && my0 != my1){
          push();
          fill(compSel[compCurrent][2]);
          stroke(0,0,0);
          rect(mx0,my0,mx1,my1,round_amt);
          pop();
        }
    }    
  }
  else if (mode == "copy"){
    if (componentCopy){
      componentCopy.x0 = mouseX;
      componentCopy.y0 = mouseY;
      componentCopy.display();
    }
  }
}

function mousePressed() {
  if((0 < mouseX && mouseX < width) && (0 < mouseY && mouseY < height) && mode == "normal"){
    lock = true;
    mx0 = mouseX;
    my0 = mouseY;
    mx1 = mx0;
    my1 = my0;
  }
}

function mouseReleased() {
  if(mode == "normal"){
  if(lock){
    if(compSel[compCurrent][1]){
      COMPONENTS.push(
        new component(
          compCurrent,
          compSel[compCurrent][0],
          compSel[compCurrent][2],
          mx0,
          my0,
          mx1,
          my1,
          diam,
          IMAGES[compSel[compCurrent][3]],
          compSel[compCurrent][4]
        )
      )
    }
    else{
      COMPONENTS.push(
        new component(
          compCurrent,
          compSel[compCurrent][0],
          compSel[compCurrent][2],
          mx0, my0, mx1, my1,
          diam,
          null,
          compSel[compCurrent][4]
        )
      )
    }
    compSel[compCurrent][4]++;
  }
  lock = false;
  }
  else if(mode == "copy"){
    if(componentCopy){
      componentCopy.x0 = mouseX;
      componentCopy.y0 = mouseY;
      COMPONENTS.push(componentCopy)
      componentCopy = null;
      compSel[compCurrent][4]++;
      mode = "normal";
    }
  }
}

function mouseDragged() {
  if(lock){
    mx1 = mouseX - mx0;
    my1 = mouseY - my0;
    diam = 2*sqrt((mx1*mx1) + (my1*my1))
  }
}

function keyTyped() {
  if (key === "u"){
    //undo
    COMPONENTS.pop();
  }
  else if (key === "c"){
    //enter copy mode
    let lastComponent = COMPONENTS.pop();
    if (lastComponent){
      mode = "copy";
      componentCopy = new component(
        lastComponent.type,
        lastComponent.shape,
        lastComponent.fill_color,
        lastComponent.x0,
        lastComponent.y0,
        lastComponent.x1,
        lastComponent.y1,
        lastComponent.diam,
        lastComponent.im,
        lastComponent.id+1
      );
      COMPONENTS.push(lastComponent);
    }
  }
  else if (key === "n"){
    //enter normal mode (default)
    mode = "normal";
  }
  else if (key === "b"){
    showBackground = !showBackground;
  }
}

function mySelectEvent() {
  compCurrent = sel.value();
}

function loadBG(file){
  if(file.type === 'image'){
    backgroundImage = createImg(file.data, '');
    backgroundImage.hide();
  }
  else{
    backgroundImage = null;
  }
}

function saveFiles(){
  var x_min = width;
  var y_min = height;
  var x_max = 0.0;
  var y_max = 0.0;
  for(let i = 0; i < COMPONENTS.length; i++){
    if(COMPONENTS[i].x0 <= x_min) x_min = COMPONENTS[i].x0;
    if(COMPONENTS[i].y0 <= y_min) y_min = COMPONENTS[i].y0;
    if((COMPONENTS[i].x0 + COMPONENTS[i].x1) > x_max){
      x_max = COMPONENTS[i].x0 + COMPONENTS[i].x1;
    }
    if((COMPONENTS[i].y0 + COMPONENTS[i].y1) > y_max){
     y_max = COMPONENTS[i].y0 + COMPONENTS[i].y1;
    }
  }
  
  var to_save = get(x_min,y_min,x_max-x_min,y_max-y_min);
  var bstr = browse.value();
  var dot_remove = split(bstr,'.');
  var path_remove = split(dot_remove[0],'\\');
  var fname = path_remove[2];
  png_name = fname + ".png"
  to_save.save(png_name);
  
  let positions = [];
  let comp;
  
  for(let i = 0; i < COMPONENTS.length; i++){
    comp = {};
    comp.type = COMPONENTS[i].type;
    comp.id = COMPONENTS[i].id;
    comp.shape = COMPONENTS[i].shape;
    comp.x0 = COMPONENTS[i].x0 - x_min;
    comp.y0 = COMPONENTS[i].y0 - y_min;
    comp.width = COMPONENTS[i].x1;
    comp.height = COMPONENTS[i].y1;
    comp.diam = COMPONENTS[i].diam;
    positions.push(comp);
  }
  
  saveJSON(positions,fname+".json");
}