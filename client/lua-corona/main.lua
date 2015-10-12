--------------------
-- NoobHub
-- opensource multiplayer and network messaging for CoronaSDK, Moai, Gideros & LÖVE
--
-- Demo project
-- Pings itself and measures network latency
--------------------


crypto = require("crypto")
require("noobhub")

latencies = {}

hub = noobhub.new({ server = "46.4.76.236"; port = 1337; });

hub:subscribe({
	channel = "ping-channel";
	callback = function(message)  
		print("message received  = "..json.encode(message)); 

		if(message.action == "ping")   then ----------------------------------
			print ("pong sent");
			hub:publish({
				message = {
					action  =  "pong",
					id = message.id,
					original_timestamp = message.timestamp,
					timestamp = system.getTimer()
				}
			});
		end;----------------------------------------------------------------



		if (message.action == "pong"  )   then ----------------------------------
			print ("pong id "..message.id.." received on "..system.getTimer().."; summary:   latency=" .. (system.getTimer() - message.original_timestamp)   );
			table.insert( latencies,  ( (system.getTimer() - message.original_timestamp)   )     );

			local sum = 0;
			local count = 0;
			for i,lat in ipairs(latencies) do
				sum = sum + lat;
				count =  count+1;
			end
			
			print("---------- "..count..') average =  '..(sum/count)  );
			native.showAlert( "Corona", "---------- "..count..') average =  '..(sum/count), { "OK", "Learn More" })

		end;----------------------------------------------------------------



	end;
});




timer.performWithDelay( 5000, function()
	print("ping sent");
	hub:publish({
		message = {
			action  =  "ping",
			id = crypto.digest( crypto.md5, system.getTimer()  ..  math.random()   ),
			timestamp = system.getTimer()
		}
	});
  end, 0 );