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
const MAX_SPIN = 1;
const MIN_SPIN = 0;

let InputDrillPressed = false;

let DrillHeat = 0;
let DrillHealth = 0;
let DrillYOffset = 0;
let DrillSpinRate = 0;
let DrillHotCounter = 0;

let RodCount = 1; // TODO
let CurrentRodIndex = 0;
let RodHealths;

let Content = $('#content');
let Drill = $('#drill');
let Locks = $('.fresh-lock-rod'); //array



function Start()
{
    let length = Locks.length;

    if (length < 1)
    {
        console.log("Locks length is less than 1!");
    }

    for (i = 0; i < length; ++i)
    {
        RodHealths[i] = 10 + Math.random() * 2;
    }
}

function Update()
{
    // Drill damage
    if (DrillHeat > 99 && DrillHotCounter++ >= 20)
    {
        DrillHotCounter = 0;
        DrillHealth -= 1;
    }

    if (InputDrillPressed) // Spin up, heat, and rod damage
    {
        DrillSpinRate = Clamp(DrillSpinRate + DRILL_WINDUP, MIN_SPIN, MAX_SPIN);
        if (DrillSpinRate == MAX_SPIN)
        {
            DrillHeat += DRILL_HEAT_INCREASE;
            RodHealths -= 1;
            if (RodHealths < 0)
            {
                BreakRod();
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
    //Lock.css('transform', `rotate(${Rotation})`);

    //TODO
    // colors
    // wobble?
    // inputed difficulty
}

function End()
{
}

function BreakRod()
{
    ++CurrentRodIndex
    DrillHealth -= 2.5;
}

function Clamp(num, min, max)
{
    return Math.min(max, Math.max(min, num))
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
    console.log(event.code);
    if (!Enabled) return;
    if (event.code === "Escape" || event.code === "Ecs")
    {
        SendToLua(SUCCESS);
    }
    else if (event.code === "UpArrow")
    {
        InputDrillPressed = true;
    }
}

document.addEventListener("onkeyup", event => {
    if (!Enabled) return;
    if (event.code === "UpArrow")
    {
        InputDrillPressed = false;
    }
})

function OnEnabled()
{
    console.log("enabled");
    Enabled = true;
    Start();
    UpdateInterval = setInterval(Update, 20);
    Content.show();
}

function OnDisable()
{
    console.log("disabled");
    Enabled = false;
    clearInterval(UpdateInterval)
    End();
    Content.hide();
    InputDrillPressed = false;
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

OnDisable();