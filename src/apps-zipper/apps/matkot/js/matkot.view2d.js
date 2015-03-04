//# sourceURL=matkot.view2d.js

var View2d = function (game, controls) {
	var view = {
		draw: function (init) {
			requestAnimationFrame(view.draw);

			if (!init && window.viewType == '3d') {
				return;
			}

			controls.onDraw();
			
			$('#left').css('top', game.model.left + 'px');

			$('#right').css('top', game.model.right + 'px');

			$('#ball').css('top', game.model.ballY + 'px');

			$('#ball').css('left', game.model.ballX + 'px');
		}
	};
	
	view.draw(true);

	return view;
}