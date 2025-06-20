import { setupAudio, updateAudio, silenceAudio } from './audio.js';
import { setupCamera } from './camera.js';
import { loadModel, detectFaces, drawFaceElements } from './face.js';

let video, canvas, logDisplay;
let logs = [];
const videoWidth = 640;
const videoHeight = 480;

async function main() {
    video = document.getElementById('webcam');
    canvas = document.getElementById('canvas');
    logDisplay = document.getElementById('log-display');
    const startButton = document.getElementById('start-button');

    startButton.addEventListener('click', async () => {
        startButton.style.display = 'none';
        document.querySelector('.container').style.display = 'block';
        logDisplay.style.display = 'block';
        addLog("Initializing Systems...");

        await setupAudio();
        await loadModel();
        await setupCamera(video);
        
        addLog("All systems nominal. Starting main loop.");
        gameLoop();
    });
}

function addLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    logs.unshift(`[${timestamp}] ${message}`);
    if (logs.length > 25) logs.pop();
    logDisplay.textContent = logs.join('\n');
}

function gameLoop() {
    detectFaces(video).then(faces => {
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        drawFaceElements(faces, canvas);

        const audioParams = {
            p1: faces && faces.length > 0 ? faces[0] : null,
            p2: faces && faces.length > 1 ? faces[1] : null,
        };

        updateAudio(audioParams, videoWidth, videoHeight);
        
        if (audioParams.p1) {
            addLog(`P1: (${Math.round(audioParams.p1.box.xMin)}, ${Math.round(audioParams.p1.box.yMin)})`);
        }
        if (audioParams.p2) {
            addLog(`P2: (${Math.round(audioParams.p2.box.xMin)}, ${Math.round(audioParams.p2.box.yMin)})`);
        }
    }).catch(err => {
        addLog("ERROR: Face detection loop failed.");
        console.error(err);
    });

    requestAnimationFrame(gameLoop);
}

window.addEventListener('DOMContentLoaded', main);
