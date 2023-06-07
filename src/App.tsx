import { useEffect, useRef } from 'react';
import getVideoStream from './utils/getVideoStream';
import loadModels from './utils/loadModels';
import * as faceapi from 'face-api.js';

function App() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const isLoaded = useRef(false);

	useEffect(() => {
		const displaySize: { width: number; height: number } = {
			width: 0,
			height: 0,
		};

		const start = async () => {
			if (!videoRef.current || !canvasRef.current) return;

			const stream = await getVideoStream();
			videoRef.current.srcObject = stream;

			await loadModels();

			videoRef.current.pause();
			videoRef.current.play();

			videoRef.current.addEventListener('playing', () => {
				if (!videoRef.current || !canvasRef.current) return;

				displaySize.width = videoRef.current.videoWidth;
				displaySize.height = videoRef.current.videoHeight;

				canvasRef.current.width = displaySize.width;
				canvasRef.current.height = displaySize.height;
			});

			isLoaded.current = true;
		};

		const loop = async () => {
			if (!videoRef.current || !canvasRef.current || !isLoaded.current) {
				return;
			}

			if (displaySize.width === 0 || displaySize.height === 0) return;

			// Detect all faces
			const detections = await faceapi
				.detectAllFaces(videoRef.current)
				.withFaceLandmarks();

			// Clear canvas before drawing
			const context = canvasRef.current.getContext('2d');
			context?.clearRect(0, 0, displaySize.width, displaySize.height);

			// Draw detections to canvas
			const resizedDetections = faceapi.resizeResults(
				detections,
				displaySize,
			);
			faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
			faceapi.draw.drawFaceLandmarks(
				canvasRef.current,
				resizedDetections,
			);
		};

		start();

		const interval = setInterval(loop, 100);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className='container'>
			<div className='main'>
				<video ref={videoRef} autoPlay muted></video>
				<canvas ref={canvasRef}></canvas>
			</div>
		</div>
	);
}

export default App;
