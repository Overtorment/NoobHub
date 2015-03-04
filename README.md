NoobHub
=======

OpenSource multiplayer and network messaging for CoronaSDK, Moai, Gideros & LÖVE

* Connections are routed through socket server with minimum latency, ideal for action games.
* Simple interface. Publish/subscribe paradigm in action.
* Server written on blazing fast Nodejs.
* Socket connections, works great through any NAT (local area network), messages delivery is reliable and fast.

Repo includes server code (so you can use your own server) and CoronaSDK/Moai/Gideros client. More clients to come.
You can test on my server, credentials are hardcoded in demo project!

Lua code may serve as an example of how LuaSocket library works.


How to use it
------------

START SERVER

        $ node node.js

INITIALIZE

        hub = noobhub.new({ server = "127.0.0.1"; port = 1337; }); 

SUBSCRIBE TO A CHANNEL AND RECEIVE CALLBACKS WHEN NEW JSON MESSAGES ARRIVE

        hub:subscribe({
          channel = "hello-world";	
        	callback = function(message)
        
        		if(message.action == "ping")   then 
        			print("Pong!")
        		end;
        
        	end;
        });

SAY SOMETHING TO EVERYBODY ON THE CHANNEL

        hub:publish({
            message = {
                action  =  "ping",
                timestamp = system.getTimer()
            }
        });


Authors
-------

* Igor Korsakov
* Sergii Tsegelnyk


Official discussion thread
---------------------------

* [old] http://developer.coronalabs.com/code/noobhub
* [new] http://forums.coronalabs.com/topic/32775-noobhub-free-opensource-multiplayer-and-network-messaging-for-coronasdk
