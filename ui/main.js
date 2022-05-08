//////////////////////////////////////////////////////////////////////////////
//                                                                          //
// Lockpick Minigame                                                        //
//                                                                          //
//////////////////////////////////////////////////////////////////////////////

const ERROR = -1;
const NONE = 0;
const SUCCESS = 1;
const FAILURE = 2;

const DRILL_HEAT_DECAY = 2;
const DRILL_HEAT_INCREASE = 1;
const MAX_DRILL_HEAT = 100;
const DRILL_ACCELERATION = 0.1;
const MAX_SPIN = 1;
const MIN_SPIN = 0;
const MAX_ANGLE = 2.0;
const ANGLE_DELTA = 0.5;

let UpdateInterval; // interval handler
let Enabled = false;
let InputDrillPressed = false;

let DrillHot;
let DrillNormal;
let DrillImg;
let RodImg;
let DamagedRodImg;
let RodHolderImg;
let Canvas;
let Content = $("#content");

let RodHealthArray; // array
let DrillHeat = 0;
let DrillHealth = 0;
let DrillYOffset = 0;
let DrillSpinRate = 0;
let RodCount = 0;
let CurrentRodIndex = 0;
let DrillX = 0;
let DrillY = 0;
let LockX = 0;
let LockY = 0;
let CurrentWobbleAngle = 0.0;
let IsWobblingLeft = true;

//////////////////////////////////////////////////////////////////////////////
//                                                                          //
// Functions                                                                //
//                                                                          //
//////////////////////////////////////////////////////////////////////////////

function OnEnabled()
{
    console.log("enabled");
    UpdateInterval = setInterval(Update, 50); // 20tps

    for (i = 0; i < RodCount; ++i)
    {
        RodHealthArray.push(400 + Math.random() * 200);
    }

    DrillHot.loadPixels();
    DrillImg.loadPixels();
    DrillNormal.loadPixels();

    loop();
    Content.show();
    Enabled = true;
}

function OnDisable()
{
    console.log("disabled");
    Content.hide();
    InputDrillPressed = false;
    RodHealthArray = [];
    clearInterval(UpdateInterval)

    if (Enabled)
    {
        clear();
        // I feel its wasteful to store these pixel arrays when not in use
        DrillImg.pixels = null;
        DrillNormal.pixels = null;
        DrillHot.pixels = null;
        // wont call draw()
        noLoop();
    }

    Enabled = false;
}

function UpdateWobble()
{
    let delta = (IsWobblingLeft) ? -ANGLE_DELTA : ANGLE_DELTA;
    CurrentWobbleAngle += lerp(0, delta, DrillSpinRate);
    if (CurrentWobbleAngle <= -MAX_ANGLE)
    {
        IsWobblingLeft = false;
    }
    else if (CurrentWobbleAngle >= MAX_ANGLE)
    {
        IsWobblingLeft = true;
    }
}

function Update()
{
    // Drill damage
    if (DrillHeat > 99)
    {
        DrillHotCounter = 0;
        DrillHealth -= .2;
    }

    if (DrillHealth <= 0)
    {
        HandleDrillBreak();
    }

    if (InputDrillPressed) // Spin up, heat, and rod damage
    {
        console.log("drilling", DrillSpinRate, RodHealthArray[CurrentRodIndex], DrillHealth, DrillHeat);

        DrillSpinRate = Clamp(DrillSpinRate + DRILL_ACCELERATION, MIN_SPIN, MAX_SPIN);
        if (DrillSpinRate >= MAX_SPIN)
        {
            DrillHeat = Math.min(MAX_DRILL_HEAT, DrillHeat + DRILL_HEAT_INCREASE);
            RodHealthArray[CurrentRodIndex] -= 1;
            if (RodHealthArray[CurrentRodIndex] <= 0)
            {
                HandleRodBreak();
            }
        }
    }
    else // Spin down and cool
    {
        DrillSpinRate = Clamp(DrillSpinRate - DRILL_HEAT_DECAY, MIN_SPIN, MAX_SPIN);
        if (DrillSpinRate == MIN_SPIN)
        {
            DrillHeat = Math.max(0, DrillHeat - DRILL_HEAT_DECAY);
        }
    }
}

function HandleRodBreak()
{
    DrillYOffset -= 18;
    DrillHealth -= 1;
    if (++CurrentRodIndex == RodCount) // All rods broken
    {
        SendToLua(SUCCESS);
    }
}

function HandleDrillBreak()
{
    SendToLua(FAILURE);
}


function Clamp(num, min, max)
{
    return Math.min(max, Math.max(min, num))
}

//////////////////////////////////////////////////////////////////////////////
//                                                                          //
// p5                                                                       //
//                                                                          //
//////////////////////////////////////////////////////////////////////////////

// runs once on script ensure
function setup()
{
    let cX = windowWidth / 2;
    let cY = windowHeight / 2;
    Canvas = createCanvas(600, 600);
    Canvas.position(cX - 300, cY - 300);
    DrillX = 300;
    DrillY = 300;
    LockX = 300;
    LockY = 300;
    angleMode(DEGREES);
    imageMode(CENTER);

    RodImg = loadImage("./assets/pristine_rod.png");
    DamagedRodImg = loadImage("./assets/damaged_rod.png");
    RodHolderImg = loadImage("./assets/rod_casing.png");
    DrillHot = loadImage("./assets/drill_bit_hot.png");
    let drill = "./assets/drill_bit.png";
    DrillImg = loadImage(drill);
    DrillNormal = loadImage(drill);

    // just to make sure any remaining variables are cleaned up on restart
    OnDisable();
}

function draw()
{
    if (!Enabled) return;
    clear();

    UpdateWobble();

    let yOffset = 0;
    for (i = 0; i < RodCount; ++i)
    {
        image(RodHolderImg, LockX, LockY + yOffset)
        if (RodHealthArray[i] > 100)
            image(RodImg, LockX, LockY + yOffset)
        else if (RodHealthArray[i] > 0)
            image(DamagedRodImg, LockX, LockY + yOffset)
        yOffset += 13;
    }

    // Sets the pixels of a drill img between normal drill and hot drill
    let t = Math.max(0, (DrillHeat - 50) / 50);

    for (i = 0; i < DrillImg.pixels.length; i += 4)
    {
        let r = DrillNormal.pixels[i]
        let g = DrillNormal.pixels[i + 1];
        let b = DrillNormal.pixels[i + 2];
        let r2 = DrillHot.pixels[i]
        let g2 = DrillHot.pixels[i + 1];
        let b2 = DrillHot.pixels[i + 2];
        DrillImg.pixels[i] = lerp(r, r2, t);
        DrillImg.pixels[i + 1] = lerp(g, g2, t);
        DrillImg.pixels[i + 2] = lerp(b, b2, t);
    }
    DrillImg.updatePixels();
    push();
    translate(DrillX, DrillY + DrillYOffset + 40);
    rotate(CurrentWobbleAngle)
    image(DrillImg, 0, 0);
    pop();
}

//////////////////////////////////////////////////////////////////////////////
//                                                                          //
// NUI                                                                      //
//                                                                          //
//////////////////////////////////////////////////////////////////////////////

// listens from lua messages
window.addEventListener('message', event => {
    if (event.data.type === "SetLockpicking")
    {
        if (event.data.enabled === true)
        {
            RodCount = event.data.rodCount || 1;
            DrillHealth = event.data.drillHealth || 0;
            OnEnabled();
        }
        else
        {
            OnDisable();
        }
    }
});

// Ecs will cancel the lockpicking
document.onkeydown = function(event)
{
    if (!Enabled) return;
    if (event.code === "Escape" || event.code === "Ecs")
    {
        SendToLua(SUCCESS);
    }
    else if (event.code === "ArrowUp")
    {
        InputDrillPressed = true;
    }
}

document.onkeyup = function(event)
{
    if (!Enabled) return;
    if (event.code === "ArrowUp")
    {
        InputDrillPressed = false;
    }
}

// Sends result to lua
function SendToLua(state)
{
    OnDisable();

    // browser-side JS
    fetch(`https://${GetParentResourceName()}/LockpickResult`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
            result: state,
            drillHealth: DrillHealth
        })
    }).then(resp => resp.json()).then(resp => console.log(resp));
}
