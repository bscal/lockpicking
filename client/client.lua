local IsLockpicking = false
local CurrentStatus = 0

RegisterCommand("DebugLockpick", function(source, args)
    StartLockpicking()
--[[
    Citizen.CreateThread(function()
        while IsLockpicking do
            DisableControlAction(0,24, true) -- disable attack
            DisableControlAction(0,25, true) -- disable aim
            DisableControlAction(0, 1, true) -- LookLeftRight
            DisableControlAction(0, 2, true) -- LookUpDown
            Citizen.Wait(0)
        end
    end)]]
end, false)

function StartLockpicking()
    IsLockpicking = true

    print("Starting to lockpick!")

    SendNUIMessage({
        type = "SetLockpicking",
        enabled = IsLockpicking
    })
    SetNuiFocus(true, false)
end

local function Cleanup()
    IsLockpicking = false
    SetNuiFocus(false, false)
end

RegisterNUICallback('LockpickResult', function(data, cb)
    Cleanup()
    CurrentStatus = data.result
    TriggerEvent("chat:addMessage", { color = { 255, 255, 255 }, args = {'', 'Current status: ' .. CurrentStatus}})
    cb('ok')
end)

Cleanup()
