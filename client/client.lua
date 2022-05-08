local IsLockpicking = false
local CurrentStatus = 0

RegisterCommand("DebugLockpick", function(source, args)
    StartLockpicking(2)
end, false)

function StartLockpicking(rodCount)
    IsLockpicking = true

    print("Starting to lockpick!")

    SendNUIMessage({
        type = "SetLockpicking",
        enabled = IsLockpicking,
        rodCount = rodCount,
    })
    SetNuiFocus(true, false)
end

function Cleanup()
    IsLockpicking = false
    SetNuiFocus(false, false)
end

RegisterNUICallback('LockpickResult', function(data, cb)
    Cleanup()
    CurrentStatus = data.result
    TriggerEvent("chat:addMessage", { color = { 255, 255, 255 }, args = {'', 'Current status: ' .. CurrentStatus}})
    cb('ok')
end)

exports('StartLockpicking', StartLockpicking(rodCount))
