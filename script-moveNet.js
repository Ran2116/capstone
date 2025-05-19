let cam;
let detector;
let poses = [];
let newPose = null;

let pose = {
  nose: { x: 0, y: 0 },
  leftEye: { x: 0, y: 0 },
  rightEye: { x: 0, y: 0 },
  leftEar: { x: 0, y: 0 },
  rightEar: { x: 0, y: 0 },
  leftShoulder: { x: 0, y: 0 },
  rightShoulder: { x: 0, y: 0 },
  leftElbow: { x: 0, y: 0 },
  rightElbow: { x: 0, y: 0 },
  leftWrist: { x: 0, y: 0 },
  rightWrist: { x: 0, y: 0 },
  leftHip: { x: 0, y: 0 },
  rightHip: { x: 0, y: 0 },
  leftKnee: { x: 0, y: 0 },
  rightKnee: { x: 0, y: 0 },
  leftAnkle: { x: 0, y: 0 },
  rightAnkle: { x: 0, y: 0 },
};

const LIGHTNING_CONFIG = {
  modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
  scoreThreshold: 0.3,
};

function setup() {
  createCanvas(640, 480);
  initCameraAndPoseModel();
}

async function initCameraAndPoseModel() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter(d => d.kind === 'videoinput');

  let selectedDevice = videoDevices.find(d => d.label.includes("Logitech"));
  if (!selectedDevice) {
    console.warn("No Logitech camera found. Falling back to default camera.");
    selectedDevice = videoDevices[0];
  }

  if (!selectedDevice) {
    console.error("No video devices available.");
    return;
  }

  let constraints = {
    video: { deviceId: { exact: selectedDevice.deviceId } }
  };

  cam = createCapture(constraints, async () => {
    cam.size(640, 480);
    cam.hide();
    console.log("Camera ready:", selectedDevice.label);
    await loadPoseDetectionModel();
  });
}

async function loadPoseDetectionModel() {
  await tf.ready();
  const model = poseDetection.SupportedModels.MoveNet;
  detector = await poseDetection.createDetector(model, LIGHTNING_CONFIG);
  console.log("Model Loaded: MoveNet");
}

function draw() {
  background(0);

  if (cam) {
    drawMirroredCam(0, 0);
  }

  updateMoveNet();

  if (poses.length > 0) {
    drawKeypoints(poses);
    drawSkeleton(poses);
    drawKeypointNames(poses);
  }
}

function drawMirroredCam(x, y) {
  push();
  translate(x, y);
  translate(cam.width, 0);
  scale(-1, 1);
  image(cam, 0, 0);
  pop();
}

function updateMoveNet() {
  getPoses();
  if (newPose === null) return;

  let amount = 0.25;
  let index = 0;
  for (let point in pose) {
    pose[point].x = lerp(pose[point].x, newPose[index].x, amount);
    pose[point].y = lerp(pose[point].y, newPose[index].y, amount);
    index++;
  }
}

async function getPoses() {
  if (!detector || !cam) return;

  const results = await detector.estimatePoses(cam.elt);
  if (results.length === 0) return;

  // Flip horizontally
  for (const pose of results) {
    for (const p of pose.keypoints) {
      p.x = cam.width - p.x;
    }
  }

  poses = results.map(p => ({ pose: p }));
  newPose = results[0].keypoints;
}

function drawKeypoints(poses) {
  push();
  fill(255, 0, 255);
  noStroke();
  for (let eachPose of poses) {
    for (let keypoint of eachPose.pose.keypoints) {
      if (keypoint.score > 0.2) {
        ellipse(keypoint.x, keypoint.y, 10, 10);
      }
    }
  }
  pop();
}

function drawKeypointNames(poses) {
  push();
  fill(0, 255, 0);
  noStroke();
  for (let eachPose of poses) {
    for (let keypoint of eachPose.pose.keypoints) {
      if (keypoint.score > 0.2) {
        text(keypoint.name || keypoint.part, keypoint.x + 15, keypoint.y + 5);
      }
    }
  }
  pop();
}

function drawSkeleton(poses) {
  push();
  stroke(0, 255, 255);
  for (let eachPose of poses) {
    if (eachPose.pose && eachPose.pose.keypoints && eachPose.pose.keypoints.length) {
      const kp = eachPose.pose.keypoints;
      const skeleton = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
      for (let [i, j] of skeleton) {
        const p1 = kp[i];
        const p2 = kp[j];
        if (p1.score > 0.2 && p2.score > 0.2) {
          line(p1.x, p1.y, p2.x, p2.y);
        }
      }
    }
  }
  pop();
}
