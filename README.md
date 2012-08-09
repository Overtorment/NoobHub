NoobHub
=======

OpenSource multiplayer and network messaging.

* Connections are routed through socket server with minimum latency, ideal for action games.
* Simple interface.
* Server written on blazing fast nodejs. 
* Socket connections, works great through any NAT (local area network), messages delivery is reliable and fast.

Repo includes server code (so you can youse your own server) and Corona lua client. You can test on my server, credentials are in the repo!

Lua code may serve as an example of how LuaSocket library works.


How to use it
------------

INITIALIZE

        hub = noobhub.new(); 

SUBSCRIBE TO A CHANNEL AND RECEIVE CALLBACKS WHEN NEW JSON OBJECTS ARRIVE

        hub:subscribe({
          channel = "hello-world";	
        	callback = function(message)
        
        		if(message.action == "ping")   then 
        			print("Pong!")
        		end;
        
        	end;
        });

SAY SOMETHING TO EVERYBODY WHO IS SUBSCRIBED TO THE CNAHHEL

        hub:publish({ 
            message = {
                action  =  "ping",
                timestamp = system.getTimer()
            }
        });