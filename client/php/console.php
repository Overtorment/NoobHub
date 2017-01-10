<?php
$url = !empty($argv[1]) ? $argv[1] :  '46.4.76.236';
$port = !empty($argv[2]) ? $argv[2] :  1337;
$channel = !empty($argv[3]) ? $argv[3] :  'testing';
$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
$ip = gethostbyname($url);
@socket_connect($socket, $ip, $port) or die("Cant connect to $url:$port\n");
socket_write($socket,  $msg = "__SUBSCRIBE__".$channel."__ENDSUBSCRIBE__", strlen($msg) );
print  socket_read($socket,1024,PHP_NORMAL_READ)."\n";
$command = '';
$in = fopen('php://stdin', 'r');



$write  = NULL;
$except = NULL;
$read_buffer = '';
while(1) {
    $read = array($socket);
    $num_changed_sockets = socket_select($read, $write, $except, 0,0);
    if ( $num_changed_sockets > 0 ) {
        foreach($read as $sock)
        if( $r = socket_read($sock,1,PHP_NORMAL_READ) ) {
            $r = str_ireplace("\n",'',$r);
            $r = str_ireplace("\r",'',$r);
            $read_buffer .= $r;
            $start = stripos($read_buffer,'__JSON__START__');
            $end = stripos($read_buffer,'__JSON__END__');
            if ($start !== false && $end !== false) {
                print "\rnoobhub> ".substr($read_buffer,$start+15, $end - ($start+15) )."                            \n";
                $read_buffer =  substr($read_buffer,0,$start ).substr($read_buffer,$end+13  );
            }
        }
    }


    if(non_block_read(STDIN, $x)) {
        $command .=  $x;
        if ( stripos($command,"\n") !== false ||  stripos($command,"\r") !== false  ) {
            $command = str_ireplace("\n",'',$command);
            socket_write($socket, $msg = "__JSON__START__".json_encode($command)."__JSON__END__", strlen($msg) );
            $command = '';
        }
    }
}






function non_block_read($fd, &$data) {
    $read = array($fd);
    $write = array();
    $except = array();
    $result = stream_select($read, $write, $except, 0);
    if($result === false) throw new Exception('stream_select failed');
    if($result === 0) return false;
    $data = stream_get_line($fd, 1);
    return true;
}
