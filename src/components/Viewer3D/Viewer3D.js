/**
 * Компонент Viewer3D - главный 3D-просмотрщик модели
 * 
 * Отвечает за создание и управление 3D-сценой, включая:
 * - Загрузку 3D-модели продукта
 * - Настройку освещения, камеры и контролей орбитального вращения
 * - Обработку изменений материалов и сеток
 * - Рендеринг модели с постобработкой (тени, блики и т.д.)
 * 
 * Компонент занимает весь экран как фон для интерфейса управления.
 */

// React хуки и утилиты
import { useEffect, useRef, useState } from "react" // Хуки React для эффектов, рефов и состояния
import { connect } from "react-redux" // Для подключения к Redux хранилищу
import { PropTypes } from "prop-types" // Проверка типов пропсов
import ToggleDisplay from "react-toggle-display" // Утилита для условного отображения компонентов

// Импорты библиотеки Three.js и её расширений
import * as THREE from "three" // Основная библиотека Three.js для 3D-графики
import * as POSTPROCESSING from "postprocessing" // Библиотека для постобработки изображения
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader" // Загрузчик HDR изображений для освещения
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader" // Загрузчик моделей формата GLTF/GLB
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader" // Загрузчик сжатых моделей Draco
import { PMREMGenerator } from "three/src/extras/PMREMGenerator" // Генератор пре-рендеренных карт окружения
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls" // Контроллер камеры для вращения вокруг объекта

// Локальные компоненты и утилиты
import Loader from "../Loader" // Компонент загрузки
import styles from "./Viewer3D.module.css" // CSS стили
import Composer from "./libs/Composer" // Компоновщик рендера и постобработки
import Lights from "./libs/Lights" // Настройка освещения сцены
import { FitCameraToSelection, ShadowPlane, MoveCameraToView } from "./libs/Helpers" // Вспомогательные функции
import { SPACE_SIZE } from "./Viewer3DConstants" // Константы для 3D-просмотрщика

// Redux действия для взаимодействия со хранилищем
import { setSelectedMeshData } from "../../redux/actions/MeshActions" // Установка выбранной сетки
import { setSelectedMeshMaterial } from "../../redux/actions/MaterialActions" // Установка материала для сетки
import { setCurrentNodeData } from "../../redux/actions/NodeActions" // Установка текущего узла

// Глобальные переменные для 3D-сцены и её элементов
let g_model_root        // Корневой объект загруженной 3D-модели
let g_scene             // Three.js сцена
let g_camera            // Камера для просмотра сцены
let g_camera_controller // Контроллер для управления камерой (вращение, зум)
let g_render            // Рендерер Three.js
let g_render_scene      // Компоновщик сцены для рендеринга
let g_selected_node     // Текущий выбранный узел модели
let g_gltf_loader       // Загрузчик GLTF/GLB моделей
let g_texture_loader    // Загрузчик текстур
let g_rgbe_loader       // Загрузчик HDR изображений
let g_is_load_model = false // Флаг, указывающий загружена ли модель

/**
 * Основной компонент 3D-просмотрщика
 * Отвечает за:
 * - Инициализацию 3D-сцены и рендерера
 * - Загрузку и отображение 3D-модели
 * - Применение материалов к частям модели
 * - Обработку выбора элементов модели
 */
function Viewer3D(props) {
  // Получение данных и функций из Redux через props
  const {
    materialStore,       // Хранилище материалов
    meshStore,          // Хранилище информации о сетках
    nodeStore,          // Хранилище информации об узлах модели
    productStore,       // Хранилище информации о продуктах
    setSelectedMeshData, // Функция для установки выбранной сетки
    setSelectedMeshMaterial, // Функция для установки материала
    setCurrentNodeData,
    isNight,
  } = props

  // Реф для контейнера canvas, где будет рендериться 3D-сцена
  const canvasContainer = useRef(null)

  // Состояние для отображения индикатора загрузки
  const [showLoader, setShowLoader] = useState(true)
  const [startcolor, setStartColor] = useState("#C4C4C4")



  /**
   * Функция для управления видимостью узлов 3D-модели
   * @param {string} nodeId - ID узла для управления видимостью
   * @param {boolean} isVisible - Флаг видимости
   */
  function setNodeVisibility(nodeId, isVisible) {
    if (g_model_root) {
      g_model_root.traverse(child => {
        if (child.type === "Object3D" && child.name === nodeId) {
          child.visible = isVisible;
          // Также скрываем/показываем все дочерние элементы
          child.children.forEach(mesh => {
            mesh.visible = isVisible;
          });
        }
      });
      g_render_scene();
    }
  }

  // Делаем функцию доступной глобально
  useEffect(() => {
    window.setNodeVisibility = setNodeVisibility;
    return () => {
      delete window.setNodeVisibility;
    };
  }, []);

  /**
   * Функция для применения материала к узлу модели
   * Настраивает все свойства материала: цвет, текстуры, нормали, bump map и т.д.
   * @param {Object} node - Узел (объект) модели, к которому применяется материал
   * @param {Object} materialData - Данные материала с настройками
   */
  function setNodeMaterial(node, materialData) {
    if (node && materialData) {
      node.material.name = materialData.name

      // Установка основного цвета материала
      if (materialData.color === "") {
        node.material.color.set(null)
      } else {
        node.material.color.set(materialData.color)
      }

      // Установка базовой текстуры (диффузная карта/альбедо)
      if (materialData.map === "") {
        node.material.map = null
      } else {
        const texture = g_texture_loader.load(materialData.map)
        if (materialData.uvScale) {
          // Настройка масштабирования и повторения текстуры
          texture.repeat.set(materialData.uvScale.u, materialData.uvScale.v)
          texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping
        }
        node.material.map = texture
      }

      //Normal
      if (materialData.normalMap === "") {
        node.material.normalMap = null
      } else {
        const texture = g_texture_loader.load(materialData.normalMap)
        if (materialData.uvScale) {
          texture.repeat.set(materialData.uvScale.u, materialData.uvScale.v)
          texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping
        }
        node.material.normalMap = texture

        node.material.normalScale = new THREE.Vector2(
          materialData.normalScale.x,
          materialData.normalScale.y
        )
      }

      //Bump
      if (materialData.bumpMap === "") {
        node.material.bumpMap = null
      } else {
        const texture = g_texture_loader.load(materialData.bumpMap)
        if (materialData.uvScale) {
          texture.repeat.set(materialData.uvScale.u, materialData.uvScale.v)
          texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping
        }
        node.material.bumpMap = texture

        node.material.bumpScale = materialData.bumpScale
      }

      //Displacement
      if (materialData.displacementMap === "") {
        node.material.displacementMap = null
      } else {
        const texture = g_texture_loader.load(materialData.displacementMap)
        if (materialData.uvScale) {
          texture.repeat.set(materialData.uvScale.u, materialData.uvScale.v)
          texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping
        }
        node.material.displacementMap = texture

        node.material.displacementScale = materialData.displacementScale
        node.material.displacementBias = materialData.displacementBias
      }

      //Roughness
      if (materialData.roughnessMap === "") {
        node.material.roughnessMap = null
      } else {
        const texture = g_texture_loader.load(materialData.roughnessMap)
        if (materialData.uvScale) {
          texture.repeat.set(materialData.uvScale.u, materialData.uvScale.v)
          texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping
        }
        node.material.roughnessMap = texture
      }

      node.material.roughness = materialData.roughness

      //Metalness
      if (materialData.metalnessMap !== "") {
        node.material.metalnessMap = null
      } else {
        const texture = g_texture_loader.load(materialData.metalnessMap)
        if (materialData.uvScale) {
          texture.repeat.set(materialData.uvScale.u, materialData.uvScale.v)
          texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping
        }
        node.material.metalnessMap = texture
      }

      node.material.metalness = materialData.metalness

      //Alpha
      if (materialData.alphaMap === "") {
        node.material.alphaMap = null
      } else {
        const texture = g_texture_loader.load(materialData.alphaMap)
        if (materialData.uvScale) {
          texture.repeat.set(materialData.uvScale.u, materialData.uvScale.v)
          texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping
        }
        node.material.alphaMap = texture
      }

      node.material.opacity = materialData.opacity

      //AO
      if (materialData.aoMap === "") {
        node.material.aoMap = null
      } else {
        const texture = g_texture_loader.load(materialData.aoMap)
        if (materialData.uvScale) {
          texture.repeat.set(materialData.uvScale.u, materialData.uvScale.v)
          texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping
        }
        node.material.aoMap = texture

        node.material.aoMapIntensity = materialData.aoMapIntensity
      }

      //Emissive
      if (materialData.emissiveMap === "") {
        node.material.emissiveMap = null
      } else {
        const texture = g_texture_loader.load(materialData.emissiveMap)
        if (materialData.uvScale) {
          texture.repeat.set(materialData.uvScale.u, materialData.uvScale.v)
          texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping
        }
        node.material.emissiveMap = texture

        node.material.emissiveIntensity = materialData.emissiveIntensity
      }
      node.material.emissive.set(materialData.emissive)

      //Env
      node.material.envMapIntensity = materialData.envMapIntensity

      node.material.wireframe = materialData.wireframe
      node.material.transparent = materialData.transparent
      node.material.needsUpdate = true

      //Set material to candidate meshes
      node.children.forEach(child => {
        child.material = node.material
      })
    }
  }

  async function fetchMaterialData(path) {
    const response = await fetch(path)
    const data = await response.json()
    return data
  }



  useEffect(() => {
    let width = canvasContainer.current.offsetWidth
    let height = canvasContainer.current.offsetHeight

    let renderRequested = false

    let smaaSearchImage = null
    let smaaAreaImage = null

    const clock = new THREE.Clock()

    let composer = null

    g_model_root = new THREE.Object3D()
    g_model_root.name = "ModelRoot"

    const rayCaster = new THREE.Raycaster()
    const intersects = []

    /**
     * Scene
     */
    const scene = new THREE.Scene()
    // scene.fog = new THREE.Fog(0xa0a0a0, SPACE_SIZE * 0.9, SPACE_SIZE)
    g_scene = scene
    scene.background = new THREE.Color("#755c48")
    scene.add(g_model_root)

    /**
     * Lighter
     */
    const lighter = Lights()
    scene.add(lighter)

    /**
     * Helper
     */
    // const axisHelper = new THREE.AxesHelper(5)
    // scene.add(axisHelper)

    const shadowPlane = ShadowPlane()
    scene.add(shadowPlane)
    /**
     * Camera
     */
    const camera = new THREE.PerspectiveCamera(
      30,
      width / height,
      0.01,
      SPACE_SIZE * 100
    )
    camera.position.set(-SPACE_SIZE * 0., SPACE_SIZE, SPACE_SIZE)
    camera.lookAt(0, 0, 0)
    g_camera = camera

    /**
     * Resize & Render
     */
    function resizeRendererToDisplaySize() {
      const canvasWidth = renderer.domElement.offsetWidth
      const canvasHeight = renderer.domElement.offsetHeight
      const needResize = canvasWidth !== width || canvasHeight !== height
      if (needResize) {
        width = canvasWidth
        height = canvasHeight
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
        composer.setSize(width, height)
        requestRenderIfNotRequested()
      }
    }

    function render() {
      renderRequested = false
      resizeRendererToDisplaySize()
      cameraController.update()
      renderer.render(scene, camera)
      if (composer) composer.render(clock.getDelta())
      // Если автоматическое вращение включено, продолжаем рендеринг
      if (cameraController.autoRotate) {
        requestRenderIfNotRequested()
      }
    }

    function requestRenderIfNotRequested() {
      if (!renderRequested) {
        renderRequested = true
        requestAnimationFrame(render)
      }
    }
    g_render_scene = requestRenderIfNotRequested

    /**
     * Renderer
     */
    const renderer = new THREE.WebGLRenderer({
      powerPreference: "high-performance",
      antialias: false,
      stencil: false,
      depth: false
    })
    renderer.setSize(width, height, false)
    renderer.setPixelRatio(window.devicePixelRatio || 1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    g_render = renderer

    canvasContainer.current.appendChild(renderer.domElement)

    //Mouse&Touch event
    function onMouseDown(event) { }
    function onMouseUp(event) {
      const pickedPoint = new THREE.Vector2(
        (event.offsetX / width) * 2 - 1,
        -(event.offsetY / height) * 2 + 1
      )
      rayCaster.setFromCamera(pickedPoint, camera)
      let pickedObjs = rayCaster.intersectObjects(intersects)
      if (pickedObjs.length > 0) {
      }
    }
    function onMouseMove(event) {
      const pickedPoint = new THREE.Vector2(
        (event.offsetX / width) * 2 - 1,
        -(event.offsetY / height) * 2 + 1
      )

      rayCaster.setFromCamera(pickedPoint, camera)
      let pickedObjs = rayCaster.intersectObjects(intersects)
      if (pickedObjs.length > 0) {
        document.body.style.cursor = "pointer"
      } else {
        document.body.style.cursor = "default"
      }
    }

    function onTouchStart(event) { }
    function onTouchEnd(event) {
      const pickedPoint = new THREE.Vector2(
        (event.changedTouches[0].pageX / width) * 2 - 1,
        -(event.changedTouches[0].pageY / height) * 2 + 1
      )
      rayCaster.setFromCamera(pickedPoint, camera)
      let pickedObjs = rayCaster.intersectObjects(intersects)
      if (pickedObjs.length > 0) {
      }
    }
    function onTouchMove() { }

    renderer.domElement.addEventListener("mousedown", onMouseDown)
    renderer.domElement.addEventListener("mouseup", onMouseUp)
    renderer.domElement.addEventListener("mousemove", onMouseMove)

    renderer.domElement.addEventListener("touchstart", onTouchStart)
    renderer.domElement.addEventListener("touchend", onTouchEnd)
    renderer.domElement.addEventListener("touchmove", onTouchMove)
    window.addEventListener("keydown", resetIdleTimer)
    window.addEventListener("keyup", resetIdleTimer)
    /**
     * Camera Controller
     */
    const cameraController = new OrbitControls(camera, renderer.domElement)
    // Убираем ограничения по азимуту для свободного вращения
    // cameraController.minAzimuthAngle = -180
    // cameraController.maxAzimuthAngle = 180
    cameraController.dampingFactor = 0.05
    cameraController.screenSpacePanning = true
    cameraController.minDistance = 3 // Увеличили минимальное расстояние для менее близкого приближения
    cameraController.maxDistance = 25 // Правильное максимальное расстояние отдаления
    // Отключаем ограничения зума, так как они конфликтуют с distance
    // cameraController.minZoom = 1
    // cameraController.maxZoom = 500
    cameraController.minPolarAngle = 0.1 // Минимальный угол для движения вверх
    cameraController.maxPolarAngle = Math.PI - 0.1 // Максимальный угол для движения вниз
    cameraController.enableDamping = true
    cameraController.enableZoom = true
    cameraController.enablePan = true // Включаем панорамирование для движения по Y
    g_camera_controller = cameraController

    // Экспортируем функцию MoveCameraToView в глобальную область для использования в других компонентах
    window.moveCameraToView = (viewType, targetObject = null) => {
      MoveCameraToView(camera, cameraController, viewType, targetObject);
    };

    // Экспортируем корневой объект модели для доступа из других компонентов
    window.g_model_root = g_model_root;

    // Автоматическое вращение при бездействии
    let idleTimer = null
    let isAutoRotating = false
    const IDLE_TIMEOUT = 4000 // 3 секунды бездействия
    const ROTATION_SPEED = 1 // Скорость вращения по оси X

    // Функция для запуска автоматического вращения
    function startAutoRotation() {
      if (!isAutoRotating) {
        isAutoRotating = true
        cameraController.autoRotate = true
        cameraController.autoRotateSpeed = ROTATION_SPEED
        requestRenderIfNotRequested() // Запускаем рендеринг для анимации
      }
    }

    // Функция для остановки автоматического вращения
    function stopAutoRotation() {
      if (isAutoRotating) {
        isAutoRotating = false
        cameraController.autoRotate = false
        cameraController.autoRotateSpeed = 0
      }
    }

    // Функция для сброса таймера бездействия
    function resetIdleTimer() {
      stopAutoRotation()
      if (idleTimer) {
        clearTimeout(idleTimer)
      }
      idleTimer = setTimeout(() => {
        startAutoRotation()
      }, IDLE_TIMEOUT)
    }

    // Добавляем обработчики событий для сброса таймера
    cameraController.addEventListener("start", resetIdleTimer)
    cameraController.addEventListener("change", requestRenderIfNotRequested)

    // Запускаем таймер при инициализации
    resetIdleTimer()

    /**
     * Load Assets
     */
    const gltfLoadingManager = new THREE.LoadingManager()
    gltfLoadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      setShowLoader(true)
    }
    gltfLoadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      if (!showLoader) {
        setShowLoader(true)
      }
    }
    gltfLoadingManager.onLoad = () => {
      if (g_is_load_model) {
        camera.position.set(-SPACE_SIZE * 0.2, SPACE_SIZE, SPACE_SIZE)
        camera.lookAt(0, 0, 0)
        FitCameraToSelection(camera, g_model_root, 6, cameraController)

        // Устанавливаем ограничения камеры ПОСЛЕ FitCameraToSelection

        cameraController.minDistance = 3
        if (window.innerWidth <= 768) {
          cameraController.maxDistance = 60;
        } else {
          cameraController.maxDistance = 25;
        }
        cameraController.update(); // Принудительно устанавливаем максимальное расстояние

        g_is_load_model = false
      }
      requestRenderIfNotRequested()
      setTimeout(() => {
        setShowLoader(false)
      }, 1200)
    }
    const gLTFLoader = new GLTFLoader(gltfLoadingManager)
    g_gltf_loader = gLTFLoader

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath("/draco/")
    gLTFLoader.setDRACOLoader(dracoLoader)

    const textureLoader = new THREE.TextureLoader(gltfLoadingManager)
    g_texture_loader = textureLoader

    //Load smaa images
    const smaaImageLoader = new POSTPROCESSING.SMAAImageLoader(
      gltfLoadingManager
    )
    smaaImageLoader.load(([search, area]) => {
      smaaSearchImage = search
      smaaAreaImage = area
      composer = Composer(
        renderer,
        scene,
        camera,
        smaaSearchImage,
        smaaAreaImage
      )
    })

    //Load env map
    g_rgbe_loader = new RGBELoader(gltfLoadingManager)

    /**
     * RenderEvent & Dispose
     */
    renderer.render(scene, camera)

    // Camera change handler for globe synchronization
    const handleCameraChange = () => {
      requestRenderIfNotRequested()

      // Update globe rotation if function exists
      if (window.updateGlobeRotation) {
        const azimuthalAngle = cameraController.getAzimuthalAngle()
        const polarAngle = cameraController.getPolarAngle()
        window.updateGlobeRotation(azimuthalAngle, polarAngle)
      }
    }

    cameraController.addEventListener("change", handleCameraChange)
    window.addEventListener("resize", requestRenderIfNotRequested)
    return () => {
      cameraController.removeEventListener("change", handleCameraChange)
      window.removeEventListener("resize", requestRenderIfNotRequested)
      if (canvasContainer.current) canvasContainer.current.innerHTML = ""
    }
  }, [])

  useEffect(() => {
    setCurrentNodeData(null)

    //Set env
    if (productStore.productData) {
      g_rgbe_loader
        .setDataType(THREE.UnsignedByteType)
        .load(productStore.productData.envMap, texture => {
          const pg = new PMREMGenerator(g_render)
          pg.compileEquirectangularShader()
          const envMap = pg.fromEquirectangular(texture).texture
          console.log(envMap);

          g_scene.environment = envMap
          // g_scene.background = envMap
          texture.dispose()
          pg.dispose()
        })
    }

    //Clear
    g_model_root.children.forEach(node => {
      node.children.forEach(child => {
        child.geometry.dispose()
        child.material.dispose()
        node.remove(child)
      })
      g_model_root.remove(node)
    })
    g_model_root.children = []

    //Load models
    if (productStore.productData) {
      g_is_load_model = true
      g_gltf_loader.load(
        productStore.productData[productStore.currentDracoVersion],
        gltf => {
          if (gltf.scene) {
            //Get gltf mesh
            const gltfMeshes = []
            gltf.scene.traverse(child => {
              if (child.type === "Mesh") {
                child.castShadow = true
                gltfMeshes.push(child)
              }
            })

            //Generate the model structure
            productStore.productData.nodes.forEach(node => {
              const pivot = new THREE.Object3D()
              pivot.name = node.id
              node.candidateMeshes.forEach(json => {
                const gltfMesh = gltfMeshes.find(mesh => mesh.name === json.id)
                if (gltfMesh) {
                  gltfMesh.visible = gltfMesh.name === node.defaultMesh
                  pivot.add(gltfMesh)
                }
              })
              g_model_root.add(pivot)
            })

            //Set data for selected mesh
            const meshData = []
            productStore.productData.nodes.forEach(node => {
              meshData.push({ nodeId: node.id, meshId: node.defaultMesh })
            })
            setSelectedMeshData(meshData)

            //Set default material
            g_model_root.children.forEach(child => {
              const material = new THREE.MeshStandardMaterial({
                color: "#363636"
              })
              material.envMap = g_scene.environment
              child.material = material

              const materialData = productStore.productData.nodes.find(
                node => node.id === child.name
              )?.defaultMaterial
              fetchMaterialData(materialData?.path).then(data => {
                setNodeMaterial(child, data)
              })
            })
          }
        }
      )
    }
    g_render_scene()
  }, [productStore.productData, productStore.currentDracoVersion])

  useEffect(() => {
    if (g_selected_node) {
      // g_selected_node.material.color.set(g_selected_node.originColor)
      g_selected_node = null
      setSelectedMeshMaterial(null)
    }
    g_model_root?.traverse(child => {
      if (
        child.type === "Object3D" &&
        child.name === nodeStore.currentNodeData?.id
      ) {
        g_selected_node = child
        setSelectedMeshMaterial(child.material.name)
        // g_selected_node.originColor = new THREE.Color(
        //   g_selected_node.material.color.r,
        //   g_selected_node.material.color.g,
        //   g_selected_node.material.color.b
        // )
        // g_selected_node.material.color.set(0xff0000)
      }
    })
    g_render_scene()
  }, [nodeStore.currentNodeData])

  useEffect(() => {
    if (g_selected_node && meshStore.selectedMeshData) {
      const d = meshStore.selectedMeshData.find(
        data => data.nodeId === g_selected_node.name
      )
      if (d) {
        g_selected_node.children.forEach(child => {
          child.visible = child.name === d.meshId
        })
      }
    }

    g_render_scene()
  }, [meshStore.selectedMeshData])

  useEffect(() => {
    setNodeMaterial(g_selected_node, materialStore.currentMaterialData)
  }, [materialStore.currentMaterialData])



  return (
    <>
      <ToggleDisplay if={showLoader}>
        <Loader />
      </ToggleDisplay>
      <div className={styles.canvasContainer} ref={canvasContainer}></div>
    </>
  )
}

const mapStateToProps = (state, ownProps) => ({
  isNight: ownProps.isNight,
  materialStore: state.materialStore,
  meshStore: state.meshStore,
  nodeStore: state.nodeStore,
  productStore: state.productStore,
});

// Если вам нужно определить propTypes, делайте это так:
Viewer3D.propTypes = {
  setSelectedMeshData: PropTypes.func.isRequired,
  setSelectedMeshMaterial: PropTypes.func.isRequired,
  setCurrentNodeData: PropTypes.func.isRequired,
  isNight: PropTypes.bool
};

export default connect(mapStateToProps, {
  setSelectedMeshData,
  setSelectedMeshMaterial,
  setCurrentNodeData
})(Viewer3D);
