socket = require("socket")
json = require("json")
crypto = require("crypto")




noobhub = {
	cr=[[
]];

	new = function () -- constructor method

		local self = {};
		self.buffer = '';
		

		function self:subscribe(params)
				params.channel = params.channel or 'test-channel';
				self.callback = params.callback or   function() end
				self.errorback = params.errorback or   function() end
				self.sock = socket.connect("cm4r.co",  1337);
				self.sock:setoption( 'tcp-nodelay', true ) -- disable Nagle's algorithm for the connection.
				self.sock:settimeout(0);
				local input,output = socket.select(nil,{ self.sock }, 3);
				for i,v in ipairs(output) do  v:send("__SUBSCRIBE__"..params.channel.."__ENDSUBSCRIBE__"); end
		end;
		
		function self:publish(message)
				local input,output = socket.select(nil,{ self.sock }, 1);
				for i,v in ipairs(output) do 
					local send_result,message,num_byes = v:send("__JSON__START__"..json.encode(message.message).."__JSON__END__"); 
					if (send_result == nil) then  print("SEND FAIL!  "..message..'  from byte '..num_byes);  end;
				end
				
				--local send_result,message,num_byes = self.sock:send("__JSON__START__"..json.encode(message.message).."__JSON__END__");
				--if (send_result == nil) then  print("SEND FAIL!  "..message..' '..num_byes);  end;
		end;
		
		function self:enterFrame()
				local clients = { self.sock };
				local input,output = socket.select(clients,nil, 0); -- this is a way not to block runtime while reading socket. zero timeout does the trick

				for i,v in ipairs(input) do  -------------

					while  true  do
						skt, e,p = v:receive();
						if (skt) then  self.buffer = self.buffer .. skt;   end;
						if (p) then  self.buffer = self.buffer .. p;   end;
						if (not skt) then break; end;
						if (e) then break; end;
					end;


						-- now, checking if a message is present in buffer...
					while true do  --  this is for a case of several messages stocker in the buffer
							local start = string.find(self.buffer,'__JSON__START__');
							local finish = string.find(self.buffer,'__JSON__END__');
							if (start and finish) then -- found a message!
								local message = string.sub(self.buffer, start+15, finish-1);
								self.buffer = string.sub(self.buffer, 1, start-1)  ..   string.sub(self.buffer, finish + 13 ); -- cutting our message from buffer
								local data = json.decode(message) ;
								self.callback(  data  );
							else
								break;
							end;
					end
					
					
				end -- /do
				

				
				
		end;
		
		Runtime:addEventListener('enterFrame', self);
		
		
		return self;
	end;
}