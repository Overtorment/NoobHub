function noop() {}

const noobhub = {
  new: function (cfg) {
    const ws = new WebSocket(`ws://${cfg.server}:${cfg.port}`);

    let channel;
    let callback;
    let errorCallback;
    let subscribedCallback;
    let isReady = false;

    function publish(data) {
      isReady && ws.send(`__JSON__START__${JSON.stringify(data)}__JSON__END__`);
    }

    function subscribe(o) {
      channel = o.channel;
      callback = o.callback;
      errorCallback = o.errorCallback || noop;
      subscribedCallback = o.subscribedCallback || noop;
      isReady &&
        ws.send(JSON.stringify(`__SUBSCRIBE__${channel}__ENDSUBSCRIBE__`));
    }

    ws.addEventListener('open', () => {
      isReady = true;
      ws.send(JSON.stringify(`__SUBSCRIBE__${channel}__ENDSUBSCRIBE__`));
      subscribedCallback(ws);
    });

    ws.addEventListener('message', (rawData) => {
      let data = rawData.data;
      try {
        let start, end;
        if (
          (start = data.indexOf('__JSON__START__')) !== -1 &&
          (end = data.indexOf('__JSON__END__')) !== -1
        ) {
          const json = data.substr(start + 15, end - (start + 15));
          data = JSON.parse(json);
        }
      } catch (_) {}
      callback(data);
    });

    ws.addEventListener('error', (err) => {
      errorCallback(err);
    });

    ws.addEventListener('close', () => {
      isReady = false;
      errorCallback('closed');
    });

    return { publish, subscribe };
  }
};
