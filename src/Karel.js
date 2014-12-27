var Karel = cc.Node.extend({
	
	delay: null,
	
	_sprite: null,
	
	_world: null,
	
	_board: null,
	
	_position: null,
	
	_direction: null,
	
	_commandQueue: null,
			
	_bugHasOccured: null,
		
	ctor: function (world, board) {
		this._super();
		
		this._world = world;
		this._board = board;
		this._position = world.startingPosition;
		this._direction = world.startingDirection;
		this._commandQueue = new CommandQueue();

		this.delay = 500;
		this._bugHasOccured = false;

		this._sprite = new cc.Sprite(res.ship_png);
		this._sprite.setScale(0.15);
		this._sprite.setPosition(this._board.pixelPositionForBoardPosition(this._position));
		this._sprite.setRotation(this._rotationForDirection(this._direction));

		board.addChild(this._sprite);
		
		this.run();
		this._commandQueue.run();
	},
	
	_rotationForDirection: function (direction) {
		switch(direction) {
			case Direction.NORTH:
				return 0;
			case Direction.EAST:
				return 90;
			case Direction.SOUTH:
				return 180;
			case Direction.WEST:
				return 270;
			default:
				return 0;
		}
	},
	
	_currentPositionWithOffset: function (xDiff, yDiff) {
		return cc.p(this._position.x+xDiff, this._position.y+yDiff)
	},
	
	_positionInDirection: function (direction) {
		switch(direction) {
			case Direction.NORTH:
				return this._currentPositionWithOffset(0,1);
			case Direction.EAST:
				return this._currentPositionWithOffset(1,0);
			case Direction.SOUTH:
				return this._currentPositionWithOffset(0,-1);
			case Direction.WEST:
				return this._currentPositionWithOffset(-1,0);
			default:
				return this._currentPositionWithOffset(0,1);
		}
	},

	_canMoveFromCurrentPositionTo: function (newPosition) {
		return this._world.canMove(this._position, newPosition) && this._commandQueue.isAvailable();
	},
	
	_rotateSpriteTo: function (direction) {
		var rotation = this._rotationForDirection(direction)
		var sprite = this._sprite;
		this._commandQueue.add(function () { 
			sprite.setRotation(rotation) 
		});
		console.log('rotate to ' + rotation)
	},

	_moveSpriteTo: function (boardPosition) {
		this._position = boardPosition;
		var pixelPosition = this._board.pixelPositionForBoardPosition(boardPosition);

		var sprite = this._sprite;
		this._commandQueue.add(function () { 
			sprite.setPosition(pixelPosition) 
		});
		console.log('move to ' + pixelPosition.x+ ' ' + pixelPosition.y)
	},
	
	move: function () {
		var newPosition = this._positionInDirection(this._direction);
		if (this._world.canMove(this._position, newPosition)) {
			this._moveSpriteTo(newPosition);
		} else {
			this._commandQueue.addBug('BUG: can\'t move!');
		}
	},

	turnLeft: function () {
		this._direction--;
		if (this._direction < 0) this._direction = 3;
		this._rotateSpriteTo(this._direction);
	},
	
	putBeeper: function () {
		var world = this._world;
		var board = this._board;
		var position = this._position

		world.putBeeperAt(position);
		this._commandQueue.add(function() { 
			board.putBeeperAt(position);
		});
	},

	pickBeeper: function () {
		if (this._world.canPickBeeperAt(this._position)) {
			var world = this._world;
			var board = this._board;
			var position = this._position;
			world.pickBeeperAt(position);

			this._commandQueue.add(function () { 
				board.pickBeeperAt(position);
			});
		} else {
			this._commandQueue.addBug('BUG: can\'t pick up a beeper that doesn\'t exist!');
		}
	},
	
	frontIsClear: function () {
		return this._canMoveFromCurrentPositionTo(this._positionInDirection(this._direction)) && this._commandQueue.isAvailable();
	},
	
	frontIsNotClear: function () {
		return !this._canMoveFromCurrentPositionTo(this._positionInDirection(this._direction)) && this._commandQueue.isAvailable();
	},
	
	leftIsClear: function () {
		var directionToLeft = this._direction - 1;
		if (directionToLeft < 0) directionToLeft = 3;
		
		return this._canMoveFromCurrentPositionTo(this._positionInDirection(directionToLeft)) && this._commandQueue.isAvailable();
	},
	
	leftIsNotClear: function () {
		var directionToLeft = this._direction - 1;
		if (directionToLeft < 0) directionToLeft = 3;

		return !this._canMoveFromCurrentPositionTo(this._positionInDirection(directionToLeft)) && this._commandQueue.isAvailable();
	},
	
	rightIsClear: function () {
		var directionToRight = this._direction + 1;
		if (directionToRight > 3) directionToRight = 0;

		return this._canMoveFromCurrentPositionTo(this._positionInDirection(directionToRight)) && this._commandQueue.isAvailable();
	},
	
	rightIsNotClear: function () {
		var directionToRight = this._direction + 1;
		if (directionToRight > 3) directionToRight = 0;

		return !this._canMoveFromCurrentPositionTo(this._positionInDirection(directionToRight)) && this._commandQueue.isAvailable();
	},
	
	beepersPresent: function () {
		return this._world.canPickBeeperAt(this._position) && this._commandQueue.isAvailable();
	},
	
	noBeepersPresent: function () {
		return !this._world.canPickBeeperAt(this._position) && this._commandQueue.isAvailable();
	},
	
	facingNorth: function () {
		return this._direction === Direction.NORTH && this._commandQueue.isAvailable();
	},
	
	notFacingNorth: function () {
		return this._direction !== Direction.NORTH && this._commandQueue.isAvailable();
	},
	
	facingEast: function () {
		return this._direction === Direction.EAST && this._commandQueue.isAvailable();
	},
	
	notFacingEast: function () {
		return this._direction !== Direction.EAST && this._commandQueue.isAvailable();
	},
	
	facingSouth: function () {
		return this._direction === Direction.SOUTH && this._commandQueue.isAvailable();
	},
	
	notFacingSouth: function () {
		return this._direction !== Direction.SOUTH && this._commandQueue.isAvailable();
	},
	
	facingWest: function () {
		return this._direction === Direction.WEST && this._commandQueue.isAvailable();
	},
	
	notFacingWest: function () {
		return this._direction !== Direction.WEST && this._commandQueue.isAvailable();
	},
	
	// replacement for while(true) -> while(this.isTrue())
	isTrue: function () { 
		return this._commandQueue.isAvailable();
	},
	
	run: function () {
		this.move();
		this.putBeeper();
		this.move();
		this.putBeeper();
		
		this.turnLeft();
		this.turnLeft();
		
		this.move();
		this.pickBeeper();
		this.move();
		
		while(this.frontIsClear()) {
			this.move();
		}
		
		console.log(this.facingNorth());
		console.log(this.notFacingNorth());
		console.log(this.facingEast());
		console.log(this.notFacingEast());
		console.log(this.facingSouth());
		console.log(this.notFacingSouth());
		console.log(this.facingWest());
		console.log(this.notFacingWest());
		console.log(this.beepersPresent());
		console.log(this.noBeepersPresent());
		console.log(this.frontIsClear());
		console.log(this.frontIsNotClear());
		console.log(this.leftIsClear());
		console.log(this.leftIsNotClear());
		console.log(this.rightIsClear());
		console.log(this.rightIsNotClear());
	}
});