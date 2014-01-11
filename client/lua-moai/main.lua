--------------------
-- NoobHub
-- opensource multiplayer and network messaging for CoronaSDK, Moai, Gideros & LÖVE
--
-- Demo project
-- Pings itself and measures network latency
--------------------

MOAISim.openWindow ( "test", 320, 480 )
viewport = MOAIViewport.new ()
viewport:setSize ( 320, 480 )
viewport:setScale ( 320, -480 )
layer = MOAILayer2D.new ()
layer:setViewport ( viewport )
MOAISim.pushRenderPass ( layer )



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

hub = noobhub.new({ server = "198.57.44.231"; port = 1337; });

hub:subscribe({
	channel = "ping-channel";
	callback = function(message)
		--print("message received  = "..json.encode(message));

		if(message.action == "ping")   then ----------------------------------
			print ("ping received, sending pong");
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
			print ("pong received, id "..message.id.." received on "..(ms).."; original_timestamp "..message.original_timestamp.." summary:   latency=" .. (ms - message.original_timestamp)   );
			table.insert( latencies,  ( (ms - message.original_timestamp)   )     );
			local sum = 0;
			local count = 0;
			for i,lat in ipairs(latencies) do
				sum = sum + lat;
				count =  count+1;
			end

			print("---------- "..count..') average =  '..(sum/count)  );
		end;----------------------------------------------------------------



	end;
});






local timer = MOAITimer.new ()
timer:setSpan ( 2 )
timer:setMode(MOAITimer.LOOP)
timer:setListener ( MOAITimer.EVENT_TIMER_END_SPAN, function()
					--timer:stop()
					print("ping sent");
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