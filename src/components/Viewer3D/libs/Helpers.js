import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { SPACE_SIZE } from "../Viewer3DConstants"

function ShadowPlane() {
  const geometry = new THREE.PlaneGeometry(SPACE_SIZE, SPACE_SIZE)
  geometry.rotateX(-Math.PI / 2)
  const material = new THREE.ShadowMaterial()
  material.opacity = 0.3
  const groundMesh = new THREE.Mesh(geometry, material)
  groundMesh.name = "GroundMesh"
  groundMesh.position.y = 0
  groundMesh.receiveShadow = true
  return groundMesh
}

function FitCameraToSelection(camera, object, offset, controls) {
  offset = offset || 1.25

  const boundingBox = new THREE.Box3()

  // get bounding box of object - this will be used to setup controls and camera
  boundingBox.setFromObject(object)

  const center = new THREE.Vector3()

  boundingBox.getCenter(center)

  const size = new THREE.Vector3()
  boundingBox.getSize(size)

  // get the max side of the bounding box (fits to width OR height as needed )
  const maxDim = Math.max(size.x, size.y, size.z)
  console.log("Max dimension:", maxDim);

  var cameraZ = Math.abs(maxDim / 2)
  console.log("Camera Z position:", cameraZ);

  cameraZ *= offset // zoom out a little so that objects don't fill the screen

  camera.position.z = cameraZ

  const minZ = boundingBox.min.z
  const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ

  camera.far = cameraToFarEdge * 3
  camera.updateProjectionMatrix()

  if (controls) {
    // set camera to rotate around center of loaded object
    controls.target = center
    // Сохраняем пользовательские настройки для maxDistance
    // controls.maxDistance = cameraToFarEdge * 2  // Закомментировали, чтобы не переопределять настройки

    // Устанавливаем разумные ограничения для дистанции, если они не были установлены
    if (!controls.maxDistance || controls.maxDistance > 100) {
      controls.maxDistance = Math.min(50, cameraToFarEdge * 2) // Ограничиваем максимум 50 единицами
    }

    // Применяем жёсткие ограничения по вертикали для OrbitControls
    controls.minPolarAngle = Math.PI * 0.25;   // Более высокий угол для лучшего обзора
    controls.maxPolarAngle = Math.PI * 0.6;    // Ограничиваем снизу

    // Принудительное соблюдение ограничений при каждом обновлении
    const originalUpdate = controls.update;
    controls.update = function () {
      const result = originalUpdate.apply(this, arguments);

      // Принудительно ограничиваем углы после каждого обновления
      if (this.getPolarAngle() < this.minPolarAngle) {
        camera.position.y = Math.max(camera.position.y, center.y);
      }
      if (this.getPolarAngle() > this.maxPolarAngle) {
        camera.position.y = Math.min(camera.position.y, center.y);
      }

      return result;
    };
  } else {
    camera.lookAt(center)
  }
}

/**
 * Перемещает камеру в определенную позицию для просмотра конкретной части модели
 * @param {THREE.Camera} camera - Камера Three.js
 * @param {OrbitControls} controls - Контроллер камеры
 * @param {string} viewType - Тип вида: 'front', 'back', 'left', 'right', 'top', 'bottom', 'isometric'
 * @param {THREE.Object3D} targetObject - Целевой объект для фокусировки (опционально)
 */
function MoveCameraToView(camera, controls, viewType, targetObject = null) {
  if (!camera || !controls) return;

  let center = new THREE.Vector3(0, 0, 0);

  // Для деревянных вставок всегда используем центр всей модели
  if (viewType === 'wood_insert') {
    if (window.g_model_root) {
      const modelBoundingBox = new THREE.Box3();
      modelBoundingBox.setFromObject(window.g_model_root);
      modelBoundingBox.getCenter(center);
    }
  } else if (targetObject) {
    // Для остальных видов используем центр конкретного объекта
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(targetObject);
    boundingBox.getCenter(center);
  }

  // Определяем позиции камеры для разных видов (десктоп)
  const viewPositions = {
    'isometric': { x: 0, y: 7, z: 10 },   // Изометрический вид
    'facade': { x: 0, y: 0, z: 15 },      // Фасад 
    'roof': { x: 0, y: 8, z: 20 },        // Крыша 
    'side': { x: 0, y: 0, z: 50 },        // Боковой вид
    'wood_insert': { x: 10, y: 5, z: 10 }, // Деревянные вставки
    'Metal-constuctor': { x: 0, y: -10, z: 10 }, // Металлическая конструкция верх
  };

  // Определяем позиции камеры для мобильных устройств
  const mobileViewPositions = {
    'isometric': { x: 0, y: 5, z: 40 },    // Изометрический вид (ближе)
    'facade': { x: 0, y: 0, z: 30 },       // Фасад (ближе)
    'roof': { x: 0, y: 12, z: 35 },        // Крыша (ближе)
    'side': { x: 30, y: 15, z: 8 },       // Боковой вид (ближе)
    'wood_insert': { x: 8, y: 5, z: 30 },  // Деревянные вставки (ближе)
    'Metal-constuctor': { x: 0, y: -10, z: 30 }, // Металлическая конструкция верх (мобильная)
  };

  // Определяем, какое устройство используется
  const isMobile = window.innerWidth <= 768;
  const positions = isMobile ? mobileViewPositions : viewPositions;

  const position = positions[viewType];
  if (!position) {
    console.warn(`Неизвестный тип вида: ${viewType}`);
    return;
  }

  // Плавно перемещаем камеру к новой позиции
  const duration = 2000;
  const startPosition = camera.position.clone();
  const endPosition = new THREE.Vector3(
    center.x + position.x,
    center.y + position.y,
    center.z + position.z
  );

  const startTime = Date.now();

  function animateCamera() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Используем easeInOutCubic для плавности
    const easeProgress = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    camera.position.lerpVectors(startPosition, endPosition, easeProgress);
    controls.target.copy(center);
    controls.update();

    if (progress < 1) {
      requestAnimationFrame(animateCamera);
    }
  }

  animateCamera();
}

/**
 * Создает и настраивает контроллер камеры с ограничениями:
 * - 360 градусов вращения по горизонтали (ось X)
 * - Сильно ограниченное вращение по вертикали (ось Y) с очень узким радиусом (72° - 108°)
 * 
 * @param {THREE.Camera} camera - Камера Three.js
 * @param {HTMLElement} domElement - DOM-элемент для привязки событий контроллера
 * @returns {OrbitControls} Настроенный контроллер камеры
 */
function CreateCameraController(camera, domElement) {
  const controller = new OrbitControls(camera, domElement);

  // Полный поворот 360° по горизонтали (азимут)
  controller.minAzimuthAngle = -Infinity;  // Неограниченный поворот влево
  controller.maxAzimuthAngle = Infinity;   // Неограниченный поворот вправо

  // Ограничение по вертикали (полярный угол) с сильно уменьшенным радиусом
  controller.minPolarAngle = Math.PI * 0.6;   // 72° от верхней точки (0.4π радиан)
  controller.maxPolarAngle = Math.PI * 0.8;   // 108° от верхней точки (0.6π радиан)

  // Принудительные ограничения через пользовательский обработчик изменений
  const center = new THREE.Vector3(0, 0, 0); // Предполагаемый центр сцены
  const originalHandleChange = controller.addEventListener('change', function () {
    // Проверяем, не нарушаются ли ограничения по полярному углу
    const currentPolarAngle = controller.getPolarAngle();
    if (currentPolarAngle < controller.minPolarAngle || currentPolarAngle > controller.maxPolarAngle) {
      // Если нарушаются, возвращаем камеру в допустимый диапазон
      if (currentPolarAngle < controller.minPolarAngle) {
        // Слишком высоко - поднимаем точку обзора
        camera.position.y = center.y + Math.abs(camera.position.distanceTo(center)) * Math.cos(controller.minPolarAngle);
      } else {
        // Слишком низко - опускаем точку обзора
        camera.position.y = center.y + Math.abs(camera.position.distanceTo(center)) * Math.cos(controller.maxPolarAngle);
      }
    }
  });

  // Дополнительные настройки для плавности управления
  controller.dampingFactor = 0.05;         // Фактор инерции при движении
  controller.screenSpacePanning = true;    // Панорамирование в пространстве экрана
  controller.enableDamping = true;         // Включение инерции
  controller.enableZoom = true;            // Разрешить масштабирование
  controller.enablePan = false;            // Отключить панорамирование (перетаскивание)

  return controller;
}

export { ShadowPlane, FitCameraToSelection, CreateCameraController, MoveCameraToView }
