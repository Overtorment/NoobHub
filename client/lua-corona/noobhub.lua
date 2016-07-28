--------------------
-- NoobHub
-- opensource multiplayer and network messaging for CoronaSDK, Moai, Gideros & LÖVE
--
-- Authors:
-- Igor Korsakov
-- Sergii Tsegelnyk
--
-- License: WTFPL
-- https://github.com/Overtorment/NoobHub
--------------------

socket = require("socket")

-- platform dependent code
if (MOAIJsonParser ~= nil) then -- looks like MoaiSDK
	json = MOAIJsonParser
else
	json = require("json")
end -- /platform dependent code


noobhub = {

	new = function (params) -- constructor method
		params = params or {}
		if (not params.server  or not  params.port) then
			print("Noobhub requires server and port to be specified");
			return false;
		end;
		local self = {}
		self.buffer = ''

		self.server =  params.server
		self.port = params.port

		function self:subscribe(params)
				self.channel = params.channel or 'test-channel'
				self.callback = params.callback or   function() end
				self.sock, error_message = socket.connect(self.server,  self.port)
				if (self.sock == nil) then
					print("Noobhub connection error: "..error_message)
					print "Problems with server..?"
					return false;
				end
				self.sock:setoption( 'tcp-nodelay', true ) -- disable Nagle's algorithm for the connection
				self.sock:settimeout(0)
				local input,output = socket.select(nil,{ self.sock }, 3)
				for i,v in ipairs(output) do  v:send("__SUBSCRIBE__"..self.channel.."__ENDSUBSCRIBE__"); end
				return true
		end

		function self:unsubscribe()
			if self.sock then
				self.sock:close()
				self.sock = nil
			end
				self.buffer = ''
		end

		function self:reconnect()
				if (not self.channel or not self.callback) then return false; end;
				print("Noobhub: attempt to reconnect...");
				return self:subscribe({ channel = self.channel; callback = self.callback})
		end

		function self:publish(message)
				-- TODO: add retries
				if (self.sock == nil) then
					print "NoobHub: Attempt to publish without valid subscription (bad socket)"
					self:reconnect()
					return false;
				end
				local send_result, message, num_bytes = self.sock:send("__JSON__START__"..json.encode(message.message).."__JSON__END__")
				if (send_result == nil) then
					print("Noobhub publish error: "..message..'  sent '..num_bytes..' bytes');
					if (message == 'closed') then  self:reconnect() end
					return false;
				end
				return true
		end

		function self:enterFrame()
				local input,output = socket.select({ self.sock },nil, 0) -- this is a way not to block runtime while reading socket. zero timeout does the trick

				for i,v in ipairs(input) do  -------------

					local got_something_new = false
					while  true  do
						local skt, e, p = v:receive()
						if (skt) then  self.buffer = self.buffer .. skt;  got_something_new=true;  end
						if (p) then  self.buffer = self.buffer .. p;  got_something_new=true;  end
						if (not skt) then break; end
						if (e) then break; end
					end -- /while-do


					-- now, checking if a message is present in buffer...
					while got_something_new do  --  this is for a case of several messages stocker in the buffer
							local start = string.find(self.buffer,'__JSON__START__')
							local finish = string.find(self.buffer,'__JSON__END__')
							if (start and finish) then -- found a message!
								local message = string.sub(self.buffer, start+15, finish-1)
								self.buffer = string.sub(self.buffer, 1, start-1)  ..   string.sub(self.buffer, finish + 13 ) -- cutting our message from buffer
								local data = json.decode(message)
								self.callback(  data  )
							else
								break
							end
					end -- /while-do

				end -- / for-do
				
		end; -- /enterFrame

		-- platform dependent code
		if (system == nil) then
				if (application ~= nil) then -- most likely Gideros
					local timer = Timer.new(33, 0)
					timer:addEventListener(Event.TIMER,  function() self:enterFrame(); end );
					timer:start()
				end
				if (MOAIJsonParser ~= nil) then -- most likely MoaiSDK
					local timer = MOAITimer.new ()
					timer:setSpan( 0.033 )
					timer:setMode(MOAITimer.LOOP)
					timer:setListener( MOAITimer.EVENT_TIMER_END_SPAN, function() self:enterFrame(); end, true )
					timer:start()
				end
				if (love ~= nil) then -- most likely LÖVE
					-- do nothing, as Noobhub's enterFrame() method should be manually
					-- called on every love.update() callback to give it some CPU time
				end
			else  -- most likely CoronaSDK
				Runtime:addEventListener('enterFrame', self)
		end -- /platform dependent code

		return self
	end -- /new
}
