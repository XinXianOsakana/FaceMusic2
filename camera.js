export async function setupCamera(videoElement) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        videoElement.srcObject = stream;
        await new Promise(resolve => videoElement.onloadedmetadata = resolve);
        return videoElement;
    } catch (err) { console.error("カメラの起動に失敗…。", err); }
}
