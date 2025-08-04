// Импорт компонентов и библиотек
import {Paper} from "@material-ui/core" // Материальная панель для UI-компонентов
import React from "react"
import {connect} from "react-redux"
import styled from "styled-components" // Для стилизации компонентов
// Импорты основных компонентов приложения
import MaterialSelector from "../components/MaterialSelector" // Выбор материалов
import MeshSelector from "../components/MeshSelector" // Выбор сеток (частей модели)
import NodeSelector from "../components/NodeSelector" // Выбор узлов модели
import ProductSelector from "../components/ProductSelector" // Выбор продукта (модели)
import Viewer3D from "../components/Viewer3D" // Основной 3D-просмотрщик
import Globe360 from "../components/Globe360/Globe360"

/**
 * Главная страница приложения
 * Содержит все компоненты для взаимодействия с 3D-моделью:
 * - выбор продукта
 * - выбор узла (части) модели
 * - выбор конкретной сетки (mesh)
 * - выбор материала для выбранной части
 * - 3D-просмотрщик модели
 */
function Home({nodeStore, onModelRotate}) {
  const [isNight, setIsNight] = React.useState(false)
  const [showMaterialSelector, setShowMaterialSelector] = React.useState(true)
  // Новый стейт: выбранные материалы по узлам
  const [selectedMaterialsByNode, setSelectedMaterialsByNode] = React.useState(
    {}
  )

  const toggleMode = () => {
    setIsNight(!isNight)
  }

  // Показывать MaterialSelector снова при выборе нового узла
  React.useEffect(() => {
    setShowMaterialSelector(true)
  }, [nodeStore.currentNodeData])

  // Функция для скрытия MaterialSelector после выбора материала
  const handleMaterialSelect = material => {
    setShowMaterialSelector(false)
    // Если выбран узел и материал, обновляем миниатюру
    if (nodeStore.currentNodeData && material) {
      setSelectedMaterialsByNode(prev => ({
        ...prev,
        [nodeStore.currentNodeData.id]: material.thumbnail
      }))
    }
  }

  // Функция для передачи в NodeSelector для получения миниатюры
  const getMaterialThumbnailByNode = node => {
    return (
      selectedMaterialsByNode[node.id] || node.candidateMaterials[0]?.thumbnail
    )
  }

  // Функция для управления видимостью узлов 3D-модели
  const handleNodeVisibilityChange = (nodeId, isVisible) => {
    // Передаем информацию о видимости в Viewer3D через глобальную переменную
    if (window.setNodeVisibility) {
      window.setNodeVisibility(nodeId, isVisible)
    }
  }

  return (
    <>
      {/* Панель управления слева вверху */}
      <StyledPaper>
        <div style={{opacity: 0, pointerEvents: "none"}}>
          <ProductSelector />
          <MeshSelector />
        </div>
      </StyledPaper>

      {/* Панель выбора материалов внизу */}
      <MaterialSelectHolder>
        {showMaterialSelector && (
          <MaterialSelector onMaterialSelect={handleMaterialSelect} />
        )}
        <NodeSelector
          onNodeReselect={() => setShowMaterialSelector(true)}
          getMaterialThumbnailByNode={getMaterialThumbnailByNode}
          onNodeVisibilityChange={handleNodeVisibilityChange}
        />
      </MaterialSelectHolder>

      {/* 3D-просмотрщик - главный компонент, отображающий 3D-модель */}
      <Viewer3D
        isNight={isNight}
        selectedNode={nodeStore.currentNodeData}
        onModelRotate={onModelRotate}
      />
      <Globe360 />
    </>
  )
}

export default connect(state => ({nodeStore: state.nodeStore}))(Home)

/**
 * Стилизованная панель для элементов управления
 * Расположена в верхнем левом углу экрана
 */
const StyledPaper = styled(Paper)`
  padding: 0.5em;
  position: absolute;
  top: 1em;
  left: 1em;
  z-index: 1;
  width: min-content;
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
`

/**
 * Контейнер для селектора материалов
 * Расположен в нижнем левом углу экрана
 */
const MaterialSelectHolder = styled.div`
  padding: 0.5em;
  position: absolute;
  bottom: 1em;
  left: 1em;
  z-index: 1;
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
`
