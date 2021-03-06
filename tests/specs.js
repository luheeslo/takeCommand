//factory function for command
var commands = takeCommand.CommandGroup.init('commands');
var buildCommand = function(key, options) {
	key = key || 'mockCommand';
	options = options || {url: '/mock/add'};
	return commands.register(key, options)
};

describe('using takeCommand', function() {

	describe('when registering a new command', function() {
		it('should throw when not command is provided', function() {
			expect(function() { commands.register(undefined, {url: '/foo'})}).toThrow();
			expect(function() { commands.register('', {url: '/foo'})}).toThrow();
		});

		it('should throw when no options are provided', function() {
			expect(function() {commands.register('mockCommand')}).toThrow();
		});

		it('should convert the options string into an option and set the url property', function() {
			var command = buildCommand(null, '/mock/update');
			expect(command.options.url).toEqual( '/mock/update' );
		});

		it('should set default jQuery Ajax options for type to GET', function() {
			var command = buildCommand();
			expect(command.options.type).toBe('GET');
		});

		it('should set default jQuery Ajax options for dataType to JSON', function() {
			var command = buildCommand();
			expect(command.options.dataType).toBe('JSON');
		});

		it('should add urlSelector property to options when passed :href', function() {
			var command = buildCommand('href', ':href');
			expect(command.options.urlSelector).not.toBeUndefined();
		});

		it('should add window property to options when passed :window', function() {
			var command = buildCommand('href', {url: ':window'});
			expect(command.options.urlSelector).toEqual('window');
		});

		it('should set urlSelector property to action when passed :action', function() {
			var command = buildCommand('action', ':action');
			expect(command.options.urlSelector).toEqual('action');
		});
	});

	describe('when binding success, error and always function to a command', function() {
		var command = buildCommand();
		
		it('should set s as the success function', function() {
			var functionName;
			runs(function () {
				command.success( function() { functionName = 's'; } );
				command.publish( 'success' );
			});
			waits(100);
			runs(function () {
				expect( functionName ).toEqual( 's' );
			});
		});

		it('should set e as the error function', function() {
			var functionName;
			runs(function () {
				command.error( function() { functionName = 'e'; } );
				command.publish( 'error' );
			});
			waits(100);
			runs(function () {
				expect( functionName ).toEqual( 'e' );
			});
		});

		it('should set a as the always function', function() {
			var functionName;
			runs(function () {
				command.always( function() { functionName = 'a'; } );
				command.publish( 'always' );
			});
			waits(100);
			runs(function () {
				expect( functionName ).toEqual( 'a' );
			});
		});
	});

	describe('when using clear', function() {
		var command = buildCommand(),
			s = function() { };
		command.success(s);
		command.clear('success');

		it('should unbind success function', function() {
			expect(command.success).not.toEqual(s);
		});

		it('should reset to the prototype success function', function() {
			expect(command.success).toEqual(takeCommand.Command.prototype.success);
		});
	});

	describe('when using command.on', function() {
		var command = buildCommand(),
			_temp,
			a = function(response) { _temp = response || 'called by always'; },
			d = function() { return 'from the callback' },
			ds = function() { return this.id; };
		command.always(a);
		
		it('should bind Ajax call to provided el and event', function() {
			_temp = '';
			runs(function() {
				command.on('click', '#theLink');
				$('#theLink').trigger('click');
			});
			waits(500);
			runs(function() {
				expect(_temp).toEqual('called by always');	
			});
			
		});

		it('should use the hash from callback as options.data', function() {
			runs(function() {
				command.on('click', '#theOtherLink', d);
				$('#theOtherLink').trigger('click');
			});
			waits(500);
			runs(function() {
				expect(command.options.data).toEqual('from the callback');
			});
		});

		it('should set the scope of the callback to the elemet', function() {
			runs(function() {
				command = buildCommand();
				command.on('click', '#theOtherOtherLink', ds);
				$('#theOtherOtherLink').trigger('click');
			});
			waits(500);
			runs(function() {
				expect(command.options.data).toEqual('theOtherOtherLink');
			});
		});

		
		describe('when the el is a form and jQuery validation is included', function() {
			it('should serialize the form and set it as options.data', function() {
				var command = buildCommand('noValForm');
				runs(function() {
					command.on('submit', '#mockFormNoVal');
					$('#mockFormNoVal').trigger('submit');
				});
				waits(500);
				runs(function() {
					expect(command.options.data).toEqual('mockInput=MockText');
				});
			});

			it('should not send the Ajax request if the form is not valid', function() {
				var command = buildCommand('valForm');
				runs(function() {
					command.on('submit', '#mockFormVal');
					command.always(function() {});
					spyOn(command, 'always');
					$('#mockFormVal').trigger('submit');
				});
				waits(500);
				runs(function() {
					expect(command.always).not.toHaveBeenCalled();
				});
			});
		});

		describe('when using different overloads', function() {
			it('should set the default scope to the body el if not provided', function() {
				var command = buildCommand('body-scope');
				command.on('click', '#elBodyDefault');
				expect($('body').data('events').live[5].namespace).toEqual('#elBodyDefault.click');
			});

			it('should set scope to #wrapper when provided as the 3rd arg', function() {
				var command = buildCommand('someWrapper');
				command.on('click', '#el', '#wrapper');
				expect($('#wrapper').data('events').live[0].namespace).toEqual('#el.click');
			});
		});

		describe('when url is element attribute', function() {
			it('should get the value from attribute :href and use it in Ajax request', function() {
				command = buildCommand('href1', ':href');
				command.on('click', '.hrefTest');
				console.log($('.hrefTest'));
				$($('.hrefTest')[0]).trigger('click');
				expect(command.options.url).toEqual('/href/test/url1');
			});

			it('should get the value from attribute :href and use it in Ajax request', function() {
				command = buildCommand('href2', ':href');
				command.on('click', '.hrefTest');
				$($('.hrefTest')[1]).trigger('click');
				expect(command.options.url).toEqual('/href/test/url2');
			});

			it('should get the value from attribute :data-url and use it in Ajax request', function() {
				command = buildCommand('data', ':data-url');
				command.on('click', '#dataTest');
				$('#dataTest').trigger('click');
				expect(command.options.url).toEqual('/data/test/url');
			});

			it('should get the value from attribute :action and use it in Ajax request', function() {
				command = buildCommand('action', ':action');
				command.on('click', '#actionTest');
				$('#actionTest').trigger('click');
				expect(command.options.url).toEqual('/action/test/url');
			});
		});
	});

	describe('when calling send/execute', function() {
		var command = buildCommand('sendExecute')
			commands.testMode = true;
			takeCommand.testMode = true;
		describe('when the call is successfull', function() {
			it('should publish all success funtions', function() {
				var callback = jasmine.createSpy();
				runs(function() {
					command.success(callback);
					command.send();
				});
				waits(500);
				runs(function() {
					expect(callback).toHaveBeenCalled();
				});
			});
		
			it('should publish all always funtions', function() {
				var callback = jasmine.createSpy();
				runs(function() {
					command.always(callback);
					command.send();
				});
				waits(500);
				runs(function() {
					expect(callback).toHaveBeenCalled();
				});
			});
		});
		describe('when the call is not successfull', function() {
			it('should call the error funtion', function() {
				command.options.mock.wasSuccess = false;
				var callback = jasmine.createSpy();
				runs(function() {
					command.error(callback);
					command.send();
				});
				waits(500);
				runs(function() {
					expect(callback).toHaveBeenCalled();
				});
			});
		
			it('should publish all always funtions', function() {
				command.options.mock.wasSuccess = false;
				var callback = jasmine.createSpy();
				runs(function() {
					command.always(callback);
					command.send();
				});
				waits(500);
				runs(function() {
					expect(callback).toHaveBeenCalled();
				});
			});
		});
	});

	describe('when comands.testMode is true', function() {
		commands.testMode = true;
		takeCommand.testMode = true;
		
		it('should not send an Ajax request', function() {
			var s = jasmine.createSpy(),
				command = buildCommand( 'testModeTrueNoData' );
			runs(function() {
				command.options.mock.wasSuccess = true;
				command.success( s );
				command.send();
			});
			waits(500);
			runs(function() {
				expect( s ).toHaveBeenCalled();
			});
		});
		
		it('should pass mock.data to callbacks', function() {
			var mockData = { message: 'this is a always message' },
				a = function(response) { _temp = response.message ;},
				command = buildCommand( 'testModeTrueWithData' ),
				_temp;
			runs(function() {
				command.options.mock.wasSuccess = true;
				command.options.mock.responseData = mockData;
				command.always( a );
				command.send();
			});
			waits(500);
			runs(function() {
				expect( _temp ).toEqual( 'this is a always message' );
			});
		});
	});
});