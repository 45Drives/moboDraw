//Background image selection
let backgroundImage;
let showBackground = true;
let browse;
let browseJSON;
let maskJSON;
let COMPONENTS = [];
let SAVE_BUTTONS = [];
let GEN_MASK_BTN;
let GEN_MASK_FLAG = false;
let BG_OUTPUT_IMG_FILE;
let BG_OUTPUT_IMG;
let BG_SAVED = false;
let coord_str;


class component{
  constructor(type,shape,x0,y0,x1,y1,diam,id,filename){
    this.type = type;
    this.shape = shape;
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
    this.diam = diam;
    this.id = id;
    this.filename = filename;
    this.mask = createImage(backgroundImage.width,backgroundImage.height);
    this.maskCreated = false;
  }
  
  generateMask(w,h){
    if(!this.maskCreated){
      let padding = 50;

      this.mask.loadPixels();
      for(let i = 0; i < w; i++){
        for(let j = 0; j < h; j++){
          if((i > this.x0) && (i < this.x0 + this.x1) &&
            (j > this.y0) && (j < this.y0 + this.y1)){
            // inside footprint of component.
            this.mask.set(i, j, color(0, 0, 0, 0));
          }
          else if((i > this.x0 - padding) && (i < this.x0 -padding + this.x1 + 2*padding) &&
            (j > this.y0-padding) && (j < this.y0 - padding + this.y1 + 2*padding)){
            //inside transition between box and background.
            let falloff_x;
            let falloff_y;
            let x_map;
            let y_map;
            let r_map;
            let corner=false;
            let y;
            let x;
            let r;

            if(i < this.x0 && j < this.y0){
              //top left
              x = this.x0 - i;
              y = this.y0 - j;
              r = sqrt(x*x + y*y);
              r_map = map(r,0,padding,0,128,true);
              this.mask.set(i,j,color(0,0,0,r_map));
              corner = true;
            }else if(i > this.x0 + this.x1 && j < this.y0 ){
              //top right
              x = this.x0 + this.x1 - i;
              y = this.y0 - j;
              r = int(sqrt(x*x + y*y));
              r_map = map(r,0,padding,0,128,true);
              this.mask.set(i,j,color(0,0,0,r_map));
              corner = true;
            }
            else if(i < this.x0 && j > this.y0 + this.y1){
              //bottom left
              x = this.x0 - i;
              y = this.y0 + this.y1 - j;
              r = int(sqrt(x*x + y*y));
              r_map = map(r,0,padding,0,128,true);
              this.mask.set(i,j,color(0,0,0,r_map));
              corner = true;
            }
            else if(i > this.x0 + this.x1 && j > this.y0 + this.y1) {
              //bottom right
              x = this.x0 + this.x1 - i;
              y = this.y0 + this.y1 - j;
              r = int(sqrt(x*x + y*y));
              r_map = map(r,0,padding,0,128,true);
              this.mask.set(i,j,color(0,0,0,r_map));
              corner = true;
            }

            if(!corner){
              if(i < this.x0){
                falloff_x = this.x0 - i;
              }
              else{
                falloff_x = i - (this.x0 + this.x1);
              }
              if(j < this.y0){
                falloff_y = this.y0 - j;
              }
              else{
                falloff_y = j - (this.y0 + this.y1);
              }
              x_map = map(falloff_x,0,padding,0,128);
              y_map = map(falloff_y,0,padding,0,128);
              if(x_map > y_map){
                this.mask.set(i,j,color(0,0,0,x_map));
              }
              else{
                this.mask.set(i,j,color(0,0,0,y_map));
              }
            }
          }
          else{
            //outside box
            this.mask.set(i, j, color(0, 0, 0, 128));
          }
        }
      }
      this.mask.updatePixels();
      this.maskCreated = true;
    }
  }
}
function setup() {
    createCanvas(900, 750);
    //create a browse button. Browse for the image that you want
  //to trace, and this will be the background. 
  browse = createFileInput(loadBG);
  browse.position(width + 10, 0);
  browse.id("YAMS");
  browseJSON = createFileInput(loadMASKJSON);
  browseJSON.position(width + 10, 30);
}

function draw() {
  background(200,200,200);
  if(backgroundImage && showBackground){
    image(backgroundImage,0,0);
  }
  if(coord_str){
    showMouseCoords();
  }
  if(maskJSON){
    push();
    fill('rgba(255,255,255, 0.25)');
    maskJSON.forEach((msk) => {
      rect(msk.x0, msk.y0, msk.width,msk.height);
    });
    pop();
  }

  if(GEN_MASK_FLAG && backgroundImage){
      for(let i = 0; i < COMPONENTS.length; i++){
           COMPONENTS[i].generateMask(backgroundImage.width,backgroundImage.height);
      }
    if(SAVE_BUTTONS.length != COMPONENTS.length){
      makeSaveButtons();
    }
  }
}

function makeSaveButtons(){
      maskJSON.forEach((comp) => {
      let SV_BTN = createButton('save ' + comp.filename);
            SV_BTN.position(width + 10, 30*SAVE_BUTTONS.length + 90);
            SV_BTN.mousePressed(() => {
              saveFiles(comp.filename);
            }
            );
    SAVE_BUTTONS.push(SV_BTN); 
    });
}
// loads the background file
function loadBG(file){
  if(file.type === 'image'){
    backgroundImage = createImg(file.data, '');
    backgroundImage.hide();
    const selectedFile = document.getElementById('YAMS');
    const myImageFile = selectedFile.files[0];
    let urlOfImageFile = URL.createObjectURL(myImageFile);
    BG_OUTPUT_IMG = loadImage(urlOfImageFile);
    console.log("backgroundImage Dimensions: ",backgroundImage.width,backgroundImage.height);
  }
  else{
    backgroundImage = null;
  }
}

function loadMASKJSON(file){
  if(file.subtype === 'json'){
    maskJSON = file.data;
    maskJSON.forEach((comp) => {
          COMPONENTS.push(new component(
      comp.type,
      comp.shape,
      comp.x0,
      comp.y0,
      comp.width,
      comp.height,
      comp.diam,
      comp.id,
      comp.filename));
    });
    
  GEN_MASK_BTN = createButton("generate masks");
  GEN_MASK_BTN.position(width + 10, 60);
  GEN_MASK_BTN.mousePressed(() => {
    GEN_MASK_FLAG = true;
  });

  }
  else{
    maskJSON = null;
  }
}

function saveMask(fname){
  for(let i = 0; i < COMPONENTS.length; i++){
    if(COMPONENTS[i].filename === fname && COMPONENTS[i].maskCreated){
      console.log(COMPONENTS[i].filename);
    }
  }
}

function saveFiles(fname){
  console.log("backgroundImage Dimensions: ",backgroundImage.width,backgroundImage.height)
  var x_min = width;
  var y_min = height;
  var x_max = 0.0;
  var y_max = 0.0;

  // calculate the smallest area required to contain all components
  for(let i = 0; i < COMPONENTS.length; i++){
    if(COMPONENTS[i].x0 <= x_min) x_min = COMPONENTS[i].x0;
    if(COMPONENTS[i].y0 <= y_min) y_min = COMPONENTS[i].y0;
    if((COMPONENTS[i].x0 + COMPONENTS[i].x1) > x_max){
      x_max = COMPONENTS[i].x0 + (COMPONENTS[i].x1);
      console.log("X_MAX",COMPONENTS[i]);
    }
    if((COMPONENTS[i].y0 + COMPONENTS[i].y1) > y_max){
     y_max = COMPONENTS[i].y0 + COMPONENTS[i].y1;
      console.log("Y_MAX",COMPONENTS[i]);
    }
  }

  x_min = 0;
  y_min = 0;
  x_max = backgroundImage.width;
  y_max = backgroundImage.height;
  console.log("backgroundImage Dimensions: ",backgroundImage.width,backgroundImage.height)
  console.log("x_min",x_min);
  console.log("y_min",y_min);
  console.log("x_max",x_max);
  console.log("y_max",y_max);


  
  // save the calculated portion of the canvas 
  var to_save = BG_OUTPUT_IMG.get(x_min,y_min,x_max-x_min,y_max-y_min);

  //inspect the browse object to get the name of the
  //file that was selected by the user. Parse this
  //to obtain the file name.
  if(!BG_SAVED){
    var bstr = browse.value();
    var dot_remove = split(bstr,'.');
    var path_remove = split(dot_remove[0],'\\');
    var BOARD_fname = path_remove[2];
    png_name = BOARD_fname + ".png"
    to_save.save(png_name); //saves the image
    BG_SAVED = true;
  }
  
  for(let i = 0; i < COMPONENTS.length; i++){
    if (COMPONENTS[i].filename === fname){
      let MASK = COMPONENTS[i].mask.get(x_min,y_min,x_max-x_min,y_max-y_min);
      MASK.save(COMPONENTS[i].filename,"png");
    }
  }
}

function showMouseCoords(){
    push();
    textSize(14);
    text(coord_str, mouseX, mouseY);
    fill(0, 102, 153);
    pop();
}

function mouseMoved() {
  if(mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height){
    coord_str = `${mouseX},${mouseY}`; 
  }
}
