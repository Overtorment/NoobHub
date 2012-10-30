socket = require("socket")
json = require("json")
crypto = require("crypto")


noobhub = {

	new = function (params) -- constructor method
		local self = {}
		self.buffer = ''
		self.server =  params.server or "cm4r.co"
		self.port = params.port or 1337

		function self:subscribe(params)
				params.channel = params.channel or 'test-channel'
				self.callback = params.callback or   function() end
				self.errorback = params.errorback or   function() end
				self.server = params.server or self.server
				self.port = params.port or self.port
				self.sock = socket.connect(self.server,  self.port)
				self.sock:setoption( 'tcp-nodelay', true ) -- disable Nagle's algorithm for the connection
				self.sock:settimeout(0)
				local input,output = socket.select(nil,{ self.sock }, 3)
				for i,v in ipairs(output) do  v:send("__SUBSCRIBE__"..params.channel.."__ENDSUBSCRIBE__"); end
		end

		function self:unsubscribe()
				self.sock:close()
				self.sock = nil
				self.buffer = ''
		end

		function self:publish(message)
				-- TODO: add retries
				local send_result,message,num_byes = self.sock:send("__JSON__START__"..json.encode(message.message).."__JSON__END__")
				if (send_result == nil) then  print("SEND FAIL!  "..message..' '..num_byes);  end
		end

		function self:enterFrame()
				local input,output = socket.select({ self.sock },nil, 0) -- this is a way not to block runtime while reading socket. zero timeout does the trick

				for i,v in ipairs(input) do  -------------

					local got_something_new = false
					while  true  do
						skt, e,p = v:receive()
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

		Runtime:addEventListener('enterFrame', self)

		return self
	end
}