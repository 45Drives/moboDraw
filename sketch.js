/******************************************************************************/
// moboDraw: Used to trace images of motherboards and produce consistently
//           styled images for use with 45Drives/cockpit-hardware. It will
//           also generate a .json file that can be inspected to obtain
//           positional information about the components in the image. 
//
// Copyright (C) 2020, Mark Hooper   <mhooper@45drives.com>
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// TODO: Add instructions  
/******************************************************************************/

/********************************************************/
/* GLOBAL VARIABLES                                     */
/********************************************************/
//mouse variables
var lock = false;
var mx0 = 0.0;
var my0 = 0.0;
var mx1 = 0.0;
var my1 = 0.0;
var diam = 0.0;

//Component variables
var COMPONENTS = [];
var sel;
var compCurrent = "board_outline"
var componentCopy;

let CPU;
let DIMM_BLUE;
let PCI_16x_BLACK;
let PCI_8x_BLACK;
let ATX_HOLES;
let VGA;

const CPU_IDX = 0;
const DIMM_BLUE_IDX = 1;
const PCI_16X_BLACK_IDX = 2;
const PCI_8X_BLACK_IDX = 3;
const ATX_HOLES_IDX = 4;
const VGA_IDX = 5;

// compSel format: [
//        shape, 
//        if we are using an image, 
//        fill color, 
//        index into images array for image,
//        current amount of components of that type present 
//      ]
var compSel = {
  board_outline:["round_rect",false,"#00800080",0,0],
  cpu:["rect",true,"#40404000",CPU_IDX,0],
  pci_8x_black:["rect",true,"#00000080",PCI_8X_BLACK_IDX,0],
  pci_16x_black:["rect",true,"#00000080",PCI_16X_BLACK_IDX,0],
  dimm_blue:["rect",true,"#A0909080",DIMM_BLUE_IDX,0],
  cmos_battery:["circle",false,"#80808080",0,0],
  atx_holes:["circle",false,"#00000080",ATX_HOLES_IDX,0]
};
var IMAGES = [];
var IMAGE_PATHS = [
  "https://raw.githubusercontent.com/markdhooper/moboDraw/master/img/cpu.png",
  "https://raw.githubusercontent.com/markdhooper/moboDraw/master/img/dimm_blue.png",
  "https://raw.githubusercontent.com/markdhooper/moboDraw/master/img/pci_16x_black.png",
  "https://raw.githubusercontent.com/markdhooper/moboDraw/master/img/pci_8x_black.png",
  "https://raw.githubusercontent.com/markdhooper/moboDraw/master/img/atx_holes.png",
  "https://raw.githubusercontent.com/markdhooper/moboDraw/master/img/vga.png"
];

//program state
var mode = "normal" //either "normal" or "copy"

//Background image selection
var backgroundImage;
var showBackground = true;
var browse;

//buttons
var saveButton;

//shape variables
var round_amt = 10;

/********************************************************/
/* CLASSES                                              */
/********************************************************/
// each object that can be drawn is a component. 
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
    stroke(0,0,0,0);
    if(this.shape == "circle" && this.im != null){
      imageMode(CENTER);
      noFill();
      drawImage(this.im,this.x0,this.y0,this.diam,this.diam);
      circle(this.x0, this.y0, this.diam);
    }
    else if(this.shape == "rect" && this.im != null){
      imageMode(CORNER)
      noFill();
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

/********************************************************/
/* p5 Functions                                         */
/********************************************************/
// the callback function required to draw an image. 
function drawImage(im,x,y,w,h){
    image(im,x,y,w,h);
}

//pre-load loads the images into memory before setup
function preload() {
  for(let i = 0; i < IMAGE_PATHS.length; i++){
    IMAGES.push(loadImage(IMAGE_PATHS[i]))
  }
}


function setup() {
  createCanvas(800, 600);

  //create a drop down menu to select which component
  //you would like to draw
  sel = createSelect();
  sel.position(width + 10, 80);
  sel.option('board_outline');
  sel.option('cpu');
  sel.option('pci_8x_black');
  sel.option('pci_16x_black');
  sel.option('dimm_blue');
  sel.option('cmos_battery');
  sel.option('atx_holes');
  sel.selected('board_outline');
  sel.changed(mySelectEvent);
  
  //create a browse button. Browse for the image that you want
  //to trace, and this will be the background. 
  browse = createFileInput(loadBG);
  browse.position(width + 10, 0);
  
  //creates a button used to save the image as a .png
  //and a .json file for further use in cockpit-hardware
  saveButton = createButton('save');
  saveButton.position(width + 10, 40);
  saveButton.mousePressed(saveFiles);
}

//This is called every frame
function draw() {
  background(0,0,0);

  // draw the loaded background image (toggle flag by typing 'b')
  if(backgroundImage && showBackground){
    image(backgroundImage,0,0);
  }
  
  //draw all components 
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
    //update the copy preview image to follow the mouse
    if (componentCopy){
      componentCopy.x0 = mouseX;
      componentCopy.y0 = mouseY;
      componentCopy.display();
    }
  }
}

/********************************************************/
/* EVENT HANDLERS                                       */
/********************************************************/
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
    if(compSel[compCurrent][4] > 0) compSel[compCurrent][4]--;    
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

// The string inside the drop down is the new value of compCurrent. 
// compCurrent is the key for the compSel dictionary 
function mySelectEvent() {
  compCurrent = sel.value();
}

// loads the background file
function loadBG(file){
  if(file.type === 'image'){
    backgroundImage = createImg(file.data, '');
    backgroundImage.hide();
  }
  else{
    backgroundImage = null;
  }
}

// calculates the bounding area around all components.
// saves that portion of the canvas to a .png file
// Then a .json struct is created by iterating through
// the array of components, and extracting the 
// relevant fields, and adjusting for the "new origin"
// that resulted from the cropped canvas. 
function saveFiles(){
  var x_min = width;
  var y_min = height;
  var x_max = 0.0;
  var y_max = 0.0;

  // calculate the smallest area required to contain all components
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
  
  // save the calculated portion of the canvas 
  var to_save = get(x_min,y_min,x_max-x_min,y_max-y_min);

  //inspect the browse object to get the name of the
  //file that was selected by the user. Parse this
  //to obtain the file name.
  var bstr = browse.value();
  var dot_remove = split(bstr,'.');
  var path_remove = split(dot_remove[0],'\\');
  var fname = path_remove[2];
  png_name = fname + ".png"
  to_save.save(png_name); //saves the image
  
  //go through the array of components, and 
  //extract the relevant fields that we want to export
  //to a .json file
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
  
  saveJSON(positions,fname+".json"); //saves the .json file
}