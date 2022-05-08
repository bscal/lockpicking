local ERROR     = -1
local NONE      = 0
local SUCCESS   = 1
local FAILURE   = 2

local IsLockpicking = false
local CurrentStatus = 0

local function StartLockpicking(rodCount --[[int]])
    if (not rodCount or rodCount < 0 or rodCount > 9) then
        print("[LockPicking] rodCount in client::StartLockpicking() is null or < 0 or > 9. Value: " .. rodCount)
        return
    end

    print("Starting to lockpick!")

    IsLockpicking = true

    Citizen.CreateThread(function()
        while IsLockpicking do

            while (not HasAnimDictLoaded("anim@amb@clubhouse@tutorial@bkr_tut_ig3@")) do
                RequestAnimDict("anim@amb@clubhouse@tutorial@bkr_tut_ig3@")
                Citizen.Wait(5)
            end

            TaskPlayAnim(
            GetPlayerPed(-1) --[[ Ped ]], 
            "anim@amb@clubhouse@tutorial@bkr_tut_ig3@" --[[ string ]], 
            "machinic_loop_mechandplayer" --[[ string ]], 
            8.0 --[[ number ]], 
            -8.0 --[[ number ]], 
            -1 --[[ integer ]], 
            49 --[[ integer ]], 
            0 --[[ number ]], 
            false --[[ boolean ]], 
            false --[[ boolean ]], 
            false --[[ boolean ]])

            Citizen.Wait(1000)
        end
    end)

    SendNUIMessage({
        type = "SetLockpicking",
        enabled = IsLockpicking,
        rodCount = rodCount,
        drillHealth = 100
    })
    SetNuiFocus(true, false)
end

local function StopLockpicking(currentState --[[int]], newDrillHealth --[[float]])
    CurrentState = currentState
    IsLockpicking = false
    SetNuiFocus(false, false)

    local ped = GetPlayerPed(-1)
    ClearPedTasksImmediately(ped)

    if (currentState == SUCCESS) then
        print("Lockpick success")
    elseif (currentState == FAILURE) then
        print("Lockpick failed")
    elseif (currentState == ERROR) then
        print("[LockPicking] currentState in client::StopLockpicking() is -1 (ERROR)")
    end
end

RegisterNUICallback('LockpickResult', function(data, cb)
    local resultState = data.result
    if (not resultState) then
        resultState = -1
    end
    
    StopLockpicking(resultState, data.drillHealth)
    cb('ok')
end)

RegisterCommand("DebugLockpick", function(source, args)
    StartLockpicking(2)
end, false)

exports('StartLockpicking', function(rodCount)
    StartLockpicking(rodCount)
end)
exports('StopLockpicking', function(currentState, drillHealth)
    StopLockpicking(currentState, drillHealth)
end)
