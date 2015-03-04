//# sourceURL=matkot.view3d.js


// webgl design from
// https://github.com/nklsrh/BuildNewGames_ThreeJSGame
// thanks!

var View3d = function (game, controls) {

	// scene object variables
	var renderer, scene, camera, pointLight, spotLight, ball;

	// field variables
	var fieldWidth = 400,
		fieldHeight = 300;

	var view = {

		createScene: function () {
			// set the scene size
			var WIDTH = 400,
				HEIGHT = 300;

			// set some camera attributes
			var VIEW_ANGLE = 50,
				ASPECT = WIDTH / HEIGHT,
				NEAR = 0.1,
				FAR = 10000;

			var c = document.getElementById("canvas3d");

			// create a WebGL renderer, camera
			// and a scene
			renderer = new THREE.WebGLRenderer({
				alpha: true
			});
			camera =
				new THREE.PerspectiveCamera(
					VIEW_ANGLE,
					ASPECT,
					NEAR,
					FAR);

			scene = new THREE.Scene();
			// add the camera to the scene
			scene.add(camera);

			// start the renderer
			renderer.setSize(WIDTH, HEIGHT);

			// attach the render-supplied DOM element
			c.appendChild(renderer.domElement);

			// set up the playing surface plane 
			var planeWidth = fieldWidth,
				planeHeight = fieldHeight,
				planeQuality = 10;

			// create the paddle1's material
			var paddle1Material =
				new THREE.MeshLambertMaterial({
					map: THREE.ImageUtils.loadTexture(magicwheel.blobUrlByUrl('images/bricks.jpg'))
				});

			// create the paddle2's material
			var paddle2Material =
				new THREE.MeshLambertMaterial({
					map: THREE.ImageUtils.loadTexture(magicwheel.blobUrlByUrl('images/bricks2.jpg'))
				});
			// create the plane's material
			var planeMaterial =
				new THREE.MeshLambertMaterial({
					map: THREE.ImageUtils.loadTexture(magicwheel.blobUrlByUrl('images/logo3d.jpg'))
				});
			// create the table's material
			var tableMaterial =
				new THREE.MeshLambertMaterial({
					map: THREE.ImageUtils.loadTexture(magicwheel.blobUrlByUrl('images/table.jpg'))
				});

			// create the playing surface plane
			var plane = new THREE.Mesh(

				new THREE.PlaneGeometry(
					planeWidth * 0.95, // 95% of table width, since we want to show where the ball goes out-of-bounds
					planeHeight,
					planeQuality,
					planeQuality),

				planeMaterial);

			scene.add(plane);
			plane.receiveShadow = true;

			var table = new THREE.Mesh(

				new THREE.CubeGeometry(
					planeWidth * 1.05, // this creates the feel of a billiards table, with a lining
					planeHeight * 1.03,
					10, // depth
					planeQuality,
					planeQuality,
					1),

				tableMaterial);
			table.position.z = -6; // we sink the table into the ground by 50 units. The extra 1 is so the plane can be seen
			scene.add(table);
			table.receiveShadow = true;

			// set up the sphere vars
			// lower 'segment' and 'ring' values will increase performance
			var radius = 7,
				segments = 8,
				rings = 8;

			// create the sphere's material
			var sphereMaterial =
				new THREE.MeshLambertMaterial({
					map: THREE.ImageUtils.loadTexture(magicwheel.blobUrlByUrl('images/glass.jpg'))
				});

			// Create a ball with sphere geometry
			ball = new THREE.Mesh(

				new THREE.SphereGeometry(
					radius,
					segments,
					rings),

				sphereMaterial);

			// // add the sphere to the scene
			scene.add(ball);

			// set ball above the table surface
			ball.position.z = radius;
			ball.receiveShadow = true;
			ball.castShadow = true;

			// set up the paddle vars
			paddleWidth = 10;
			paddleHeight = 60;
			paddleDepth = 8;
			paddleQuality = 5;

			paddle1 = new THREE.Mesh(

				new THREE.CubeGeometry(
					paddleWidth,
					paddleHeight,
					paddleDepth,
					paddleQuality,
					paddleQuality,
					paddleQuality),

				paddle1Material);

			// add the sphere to the scene
			scene.add(paddle1);
			paddle1.receiveShadow = true;
			paddle1.castShadow = true;

			paddle2 = new THREE.Mesh(

				new THREE.CubeGeometry(
					paddleWidth,
					paddleHeight,
					paddleDepth,
					paddleQuality,
					paddleQuality,
					paddleQuality),

				paddle2Material);

			// add the sphere to the scene
			scene.add(paddle2);
			paddle2.receiveShadow = true;
			paddle2.castShadow = true;

			// set paddles on each side of the table
			paddle1.position.x = fieldWidth / 2; // - paddleWidth;
			paddle2.position.x = -fieldWidth / 2; // + paddleWidth;

			// lift paddles over playing surface
			paddle1.position.z = paddleDepth;
			paddle2.position.z = paddleDepth;



			// // create a point light
			pointLight =
				new THREE.PointLight(0xF8D898);

			// set its position
			pointLight.position.x = -100;
			pointLight.position.y = -700;
			pointLight.position.z = 1000;
			pointLight.intensity = 1.2;
			pointLight.distance = 10000;
			// add to the scene
			scene.add(pointLight);

			// add a spot light
			// this is important for casting shadows
			spotLight = new THREE.SpotLight(0xF8D898);
			spotLight.position.set(0, 0, 460);
			spotLight.intensity = .6;
			spotLight.castShadow = true;
			scene.add(spotLight);

			// MAGIC SHADOW CREATOR DELUXE EDITION with Lights PackTM DLC
			renderer.shadowMapEnabled = true;
		},

		draw: function () {
			// draw THREE.JS scene
			if (magicwheel.currentPath == 'index.html') {
				renderer.render(scene, camera);
				// loop draw function call
				requestAnimationFrame(view.draw);
			}

			if (window.viewType == '2d') {
				return;
			}

			controls.onDraw();

			ball.position.x = 0 - game.model.ballX + 195;
			ball.position.y = game.model.ballY - 145;

			paddle1.position.y = game.model.left - 120;
			paddle2.position.y = game.model.right - 120;

			var flip = game.model.myRole == 'left' ? 1 : -1;

			camera.position.z = 230;
			camera.position.x = 420 * flip;
			camera.position.y = 0;

			camera.rotation.y = flip * 50 * Math.PI / 180;
			camera.rotation.z = flip * 90 * Math.PI / 180;
		}
	};

	view.createScene();

	view.draw();

	return view;
}