--------------------
-- NoobHub
-- opensource multiplayer and network messaging for CoronaSDK, Moai & Gideros & LÖVE
--
-- Demo project
-- Pings itself and measures network latency
--------------------
local APP_NAME = "<c:2CF>noobhub<c>moai<c:F52>demo 1.0"
STAGE_WIDTH = 800
STAGE_HEIGHT = 240
MOAISim.openWindow ( APP_NAME, STAGE_WIDTH, STAGE_HEIGHT )
aViewport = MOAIViewport.new ()
aViewport:setScale ( STAGE_WIDTH, STAGE_HEIGHT )
aViewport:setSize ( STAGE_WIDTH, STAGE_HEIGHT )
aMainLayer = MOAILayer2D.new ()
aMainLayer:setViewport ( aViewport )


-- a basic MOAI console
-- application fonts
asciiTextCodes  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,:;!?()&/-'
appFonts        = {}
appFonts["anonymous"] = {
	ttf        = 'anonymous.ttf',
	textcodes  = asciiTextCodes,
	font       = MOAIFont.new(),
	size       = 10,
	dpi        = 163
}

for appIndex, appFont in pairs(appFonts) do
	if (appFont.font ~= nil) then
    	appFont.font:loadFromTTF(appFont.ttf, appFont.textcodes, appFont.size, appFont.dpi)
	else
    	print("Some error loading fonts..")
	end
end

-- a text console message
aConsoleMsg = ""
aConsole = MOAITextBox.new()
aConsole:setFont(appFonts["anonymous"].font)
aConsole:setTextSize(appFonts["anonymous"].size)
aConsole:setString(APP_NAME)
aConsole:setRect(-STAGE_WIDTH/2 + 40, -STAGE_HEIGHT/2, STAGE_WIDTH/2, STAGE_HEIGHT/2 - 40)
aConsole:setYFlip(true)

aMainLayer:insertProp(aConsole)


function clearTextConsoleMessage()
	aConsoleMsg = ""
	aConsole:setString(aConsoleMsg)
end
function appMessage(instr)

	aConsoleMsg = aConsoleMsg .. instr
	aConsole:setString(aConsoleMsg)
end


-- and now it is time for the camera:
aPartition = MOAIPartition.new ()
aPartition:insertProp ( aConsole )
aMainLayer:setPartition ( aPartition )

MOAISim.pushRenderPass ( aMainLayer )

appMessage(APP_NAME)

-- implementing our own milliseconds counter, since we don't have a native one
local ms = 0
local ms_counter = MOAITimer.new ()
ms_counter:setSpan ( 0.010 )
ms_counter:setMode(MOAITimer.LOOP)
ms_counter:setListener ( MOAITimer.EVENT_TIMER_END_SPAN, function()
					ms = ms + 10
			end, true )
ms_counter:start()
--

require("noobhub")
latencies = {}

hub = noobhub.new({ server = "46.4.76.236"; port = 1337; });

aReportMsg = ""
hub:subscribe({
	channel = "ping-channel";
	callback = function(message)
		--aReportMsg = "message received  = "..json.encode(message)
		if(message.action == "ping")   then ----------------------------------

			aReportMsg = "ping received, sending pong"
			hub:publish({
				message = {
					action  =  "pong",
					id = message.id,
					original_timestamp = message.timestamp,
					timestamp = ms
				}
			});
		end;----------------------------------------------------------------



		if (message.action == "pong"  )   then ----------------------------------
			aReportMsg = aReportMsg .. "pong received, id "..message.id.." received on "..(ms).."; original_timestamp "..message.original_timestamp.." summary:   latency=" .. (ms - message.original_timestamp)
			table.insert( latencies,  ( (ms - message.original_timestamp)   )     );
			local sum = 0;
			local count = 0;
			for i,lat in ipairs(latencies) do
				sum = sum + lat;
				count =  count+1;
			end

			aReportMsg = aReportMsg .. "---------- "..count..') average =  '..(sum/count)
		end;----------------------------------------------------------------

		clearTextConsoleMessage()
		appMessage(aReportMsg)

	end;
});

local timer = MOAITimer.new ()
timer:setSpan ( 2 )
timer:setMode(MOAITimer.LOOP)
timer:setListener ( MOAITimer.EVENT_TIMER_END_SPAN, function()
					--timer:stop()
					appMessage("ping sent");
					hub:publish({
						message = {
							action  =  "ping",
							id = md5( math.random() .. '' ),
							timestamp = ms
						}
					});
			end, true )
timer:start()

function md5 ( data )
	local writer = MOAIHashWriter.new ()
	writer:openMD5 ()
	writer:write ( data )
	writer:close ()
	return writer:getHashHex ()
end
