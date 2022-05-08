//////////////////////////////////////////////////////////////////////////////
//                                                                          //
// Lockpick Minigame                                                        //
//                                                                          //
//////////////////////////////////////////////////////////////////////////////

const ERROR = -1;
const NONE = 0;
const SUCCESS = 1;
const FAILURE = 2;

let UpdateInterval;
let Enabled = false;

const DRILL_HEAT_DECAY = 2;
const DRILL_HEAT_INCREASE = 1;
const DRILL_ACCELERATION = 1;
const MAX_SPIN = 1;
const MIN_SPIN = 0;

const PRISTIME = "./assets/pristine_rod.png";
const DAMAGED = "./assets/damaged_rod.png";
const ROD_HOLDER = "./assets/rod_casing.png";
const DRILL_HOT = "./assets/drill_bit_hot.png"
const DRILL = "./assets/drill_bit.png"

let InputDrillPressed = false;

let DrillHeat = 0;
let DrillHealth = 0;
let DrillYOffset = 0;
let DrillSpinRate = 0;

let RodCount = 0;
let CurrentRodIndex = 0;
let RodHealths = [];

let Canvas;
let DrillX;
let DrillY;
let LockX;
let LockY;
let DrillHot;
let DrillNormal;
let DrillImg;
let RodImg;
let DamagedRodImg;
let RodHolderImg;

let Content = $("#content");

//////////////////////////////////////////////////////////////////////////////
//                                                                          //
// Functions                                                                //
//                                                                          //
//////////////////////////////////////////////////////////////////////////////

function OnEnabled()
{
    console.log("enabled");
    Init();
    UpdateInterval = setInterval(Update, 50); // 20tps
    Content.show();
    Enabled = true;

}

function OnDisable()
{
    console.log("disabled");
    InputDrillPressed = false;
    Content.hide();
    clearInterval(UpdateInterval)
    Cleanup();
    Enabled = false;
}

function Init()
{
    DrillHot = loadImage(DRILL_HOT);
    DrillImg = loadImage(DRILL);
    DrillNormal = loadImage(DRILL);
    DrillHot.loadPixels();
    DrillImg.loadPixels();
    DrillNormal.loadPixels();

    DrillHealth = 100; //TODO

    for (i = 0; i < RodCount; ++i)
    {
        RodHealths.push(400 + Math.random() * 200);
    }
}

function Cleanup()
{
    RodHealths = [];
    if (Enabled)
    {
        clear();

        // I dont want the pixel arrays lingering when not opened
        DrillImg = null;
        DrillNormal = null;
        DrillHot = null;
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
        console.log("drilling", DrillSpinRate, RodHealths[CurrentRodIndex], DrillHealth, DrillHeat);

        DrillSpinRate = Clamp(DrillSpinRate + DRILL_ACCELERATION, MIN_SPIN, MAX_SPIN);
        if (DrillSpinRate == MAX_SPIN)
        {
            DrillHeat += DRILL_HEAT_INCREASE;
            RodHealths[CurrentRodIndex] -= 1;
            if (RodHealths[CurrentRodIndex] <= 0)
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
    ++CurrentRodIndex
    DrillHealth -= 2.5;

    if (CurrentRodIndex == RodCount)
    {
        HandleAllRodsBroken();
    }
}

function HandleDrillBreak()
{

}

function HandleAllRodsBroken()
{

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

// runs onces on startup
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

    RodImg = loadImage(PRISTIME);
    DamagedRodImg = loadImage(DAMAGED);
    RodHolderImg = loadImage(ROD_HOLDER);

    // just to make sure any remaining variables are cleaned up on restart
    OnDisable();
}

function draw()
{
    if (!Enabled) return;
    clear();

    let yOffset = 0;
    for (i = 0; i < RodCount; ++i)
    {
        image(RodHolderImg, LockX, LockY + yOffset)
        image(RodImg, LockX, LockY + yOffset)
        yOffset += 13;
    }

    let f = Math.max(0, (DrillHeat - 25) / 75);
    for (i = 0; i < DrillImg.pixels.length; i += 4)
    {
        let r = DrillNormal.pixels[i]
        let g = DrillNormal.pixels[i + 1];
        let b = DrillNormal.pixels[i + 2];
        let r2 = DrillHot.pixels[i]
        let g2 = DrillHot.pixels[i + 1];
        let b2 = DrillHot.pixels[i + 2];
        DrillImg.pixels[i] = lerp(r, r2, f);
        DrillImg.pixels[i + 1] = lerp(g, g2, f);
        DrillImg.pixels[i + 2] = lerp(b, b2, f);
    }
    DrillImg.updatePixels();
    image(DrillImg, DrillX, DrillY - 100);
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
