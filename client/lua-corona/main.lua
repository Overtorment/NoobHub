require("noobhub")


latencies = {}

hub = noobhub.new();

hub:subscribe({
	channel = "funky";	
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
		end;----------------------------------------------------------------



	end;
});




timer.performWithDelay( 150, function()
	print("ping sent");
	hub:publish({
		message = {
			action  =  "ping",
			id = crypto.digest( crypto.md5, system.getTimer()  ..  math.random()   ),
			timestamp = system.getTimer()
		}
	});
  end, 10 );