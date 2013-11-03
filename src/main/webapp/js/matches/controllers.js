function TournamentCtrl($scope, TournamentRESTService, MatchWebSocketService) {
	
	$scope.matches = [];
	$scope.lives = new Object();
	$scope.msg = new Object();
	$scope.betMessages = new Object();
	
	TournamentRESTService.async().then(function(d) {
	    $scope.matches = d;
	  });
	
	//Messages sent by peer server are handled here
	MatchWebSocketService.subscribe(function(idMatch, message) {
		try {
			var obj = JSON.parse(message);
			//Match Live message from server
			if (obj.hasOwnProperty("match")){
				$scope.lives[idMatch] = obj.match;
			}
			//Bet message from server
			else if (obj.hasOwnProperty("winner")){
				$scope.betMessages[idMatch] = obj;
			}
		} catch (exception) {
			//Status message
			$scope.msg[idMatch] = message;
		}
		$scope.$apply();
	});

	$scope.connect = function(idMatch) {
		MatchWebSocketService.connect(idMatch);
	};

	$scope.disconnect = function(idMatch) {
		delete $scope.lives[idMatch] ;
		delete $scope.msg[idMatch] ;
		delete $scope.betMessages[idMatch] ;
		MatchWebSocketService.disconnect(idMatch);
	};
	
	$scope.isOpen = function(idMatch) {
		return angular.equals(WebSocket.OPEN, MatchWebSocketService.status(idMatch));
	};
	
	$scope.isClosed = function(idMatch) {
		return angular.equals(WebSocket.CLOSED, MatchWebSocketService.status(idMatch));
	};
	
	$scope.getStatus = function(idMatch) {
		if (angular.isUndefined($scope.msg[idMatch])){
			return "CLOSED";
		}
		return MatchWebSocketService.statusAsText(idMatch);
	};
	
	//return true if there is no players received 
	$scope.noMessage = function(idMatch) {
		return (angular.isUndefined($scope.lives[idMatch]) || angular.isUndefined($scope.lives[idMatch].players));
	};
	
	
	$scope.betOnWinner = function(idMatch, player) {
		MatchWebSocketService.sendBetMatchWinner(idMatch, player);
	};
	
	$scope.isBet = function(idMatch) {
		return (angular.isUndefined($scope.betMessages[idMatch]) == false  
				&& angular.equals($scope.betMessages[idMatch].winner,"") == false);
	};
	
	$scope.isBetOnPlayer = function(idMatch, player) {
		return $scope.isBet(idMatch) && angular.equals($scope.betMessages[idMatch].winner, player); 
	};
	
	$scope.isFinished = function(idMatch) {
		return (angular.isUndefined($scope.lives[idMatch]) == false  
				&& $scope.lives[idMatch].finished);
	};
	
	$scope.whoIsTheWinner = function(idMatch) {
		if ($scope.isFinished(idMatch) == false){
			return null;
		}
		if (parseInt($scope.lives[idMatch].players[0].sets) > 
				parseInt($scope.lives[idMatch].players[1].sets)){
			return $scope.lives[idMatch].players[0].name;
		} else {
			return $scope.lives[idMatch].players[1].name;		
		}
	};
	
	// Last message
	$scope.handleEndMessage = function(idMatch) {
		var winner = $scope.whoIsTheWinner(idMatch);
		if (winner == null){
			return;
		}
		var msg = winner.concat(" WINS the match. ");
		if ($scope.isBet(idMatch)){
			if (angular.equals($scope.betMessages[idMatch].result, "OK")){
				msg = msg.concat("CONGRATS !! You won your bet !");
			} else {
				msg = msg.concat("SORRY, you've lost your bet, try again :) ");
			}
		}
		return msg;
	};
	
	//winners set have green background, grey for others
	$scope.cssSetColor = function(idMatch, player, idSet) {
		var cssClass = "label label-default";
			angular.forEach($scope.lives[idMatch].players, function(p, key){
				  if (angular.equals(p.name, player.name) == false)
					  if(idSet == 1 && player.set1 > p.set1){
						  cssClass = 'label label-success';
					  } else if(idSet == 2 && player.set2 > p.set2){
						  cssClass = 'label label-success';
					  } else if(idSet == 3 && player.set3 > p.set3){
						  cssClass = 'label label-success';
					  }
				}, cssClass);
		return cssClass;
	};
	
	//last message color : blue if no bet, green if winning bet, red if loosing bet
	$scope.cssEndMessage = function(idMatch) {
		var cssClass = "alert alert-info";
		if ($scope.isBet(idMatch)){
			if (angular.equals($scope.betMessages[idMatch].result, "OK")){
			  cssClass = 'alert alert-success';
			} else if(angular.equals($scope.betMessages[idMatch].result, "KO")){
			  cssClass = 'alert alert-danger';
			} 
		}
		return cssClass;
	};
	
	//Utils for img source
	$scope.splitForImage = function(string, nb) {
		$scope.array = string.toLowerCase().split(' ');
		return $scope.result = $scope.array[nb];
	};
	
}
