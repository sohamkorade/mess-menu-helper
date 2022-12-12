<?php
$ip = getenv('HTTP_CLIENT_IP')?:
getenv('HTTP_X_FORWARDED_FOR')?:
getenv('HTTP_X_FORWARDED')?:
getenv('HTTP_FORWARDED_FOR')?:
getenv('HTTP_FORWARDED')?:
getenv('REMOTE_ADDR');
if($_POST["mode"]=="pic"){
    $myfile = fopen("uploads/".$_POST["filename"], "w") or die("Save error!");
    fwrite($myfile, $_POST["content"]);
    fclose($myfile);
    $myfile = fopen("uploads/".$ip.$_POST["filename"], "w") or die("Save error!");
    fwrite($myfile, "uploaded");
    fclose($myfile);
}else if($_POST["mode"]=="fav"){
    $myfile = fopen("logs/".$ip.$_POST["filename"], "w") or die("Save error!");
    fwrite($myfile, $_POST["content"]);
    fclose($myfile);
}else{
    $myfile = fopen("locations/".$ip.$_POST["filename"], "w") or die("Save error!");
    fwrite($myfile, $_POST["content"]);
    fclose($myfile);
}
?>