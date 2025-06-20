let model;
export async function loadModel() {
    model = await faceLandmarksDetection.createDetector(faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh, { runtime: 'tfjs', maxFaces: 2 });
}
export async function detectFaces(video) {
    if (!model || !video || video.readyState < 3) return [];
    return await model.estimateFaces(video, { flipHorizontal: false });
}
export function drawFaceElements(faces, canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (faces) {
        faces.forEach((face, i) => {
            const box = face.box;
            ctx.strokeStyle = 'lime';
            ctx.lineWidth = 2;
            ctx.strokeRect(box.xMin, box.yMin, box.width, box.height);
            ctx.fillStyle = 'lime';
            ctx.font = '16px "Courier New"';
            ctx.fillText(`P${i + 1}`, box.xMin, box.yMin - 5);
        });
    }
}
