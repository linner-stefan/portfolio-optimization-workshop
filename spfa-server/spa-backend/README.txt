openshift commands
tailing backend logs
rhc tail boot -f app-root/data/logs/app.log --opts '-n 500'
connecting to backend via ssh
ssh 58e6a25d0c1e6686fb0000b7@boot-jsimo.rhcloud.com

installing oracle driver

	1. download file from 
		http://www.oracle.com/technetwork/database/features/jdbc/default-2280470.html
	2. install to your maven repository
		mvn install:install-file -Dfile=ojdbc7.jar  -DgroupId=com.oracle -DartifactId=ojdbc7 -Dversion=12.1.0.1 -Dpackaging=jar