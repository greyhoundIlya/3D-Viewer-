/**
 * Компонент NodeSelector - выбор узла (части) 3D-модели
 * 
 * Позволяет пользователю выбрать узел (часть) 3D-модели для редактирования.
 * В вашем случае это могут быть "стопчики", "крыша", "фасад", "верхняя часть" и т.д.
 * 
 * После выбора узла становятся доступны соответствующие материалы и сетки
 * для этой конкретной части модели.
 * 
 * Компонент отображается в левом верхнем углу интерфейса в панели управления.
 */
import React, { useState, useEffect } from "react"
import { connect } from "react-redux"
import { PropTypes } from "prop-types"
import { setCurrentNodeData } from "../../redux/actions/NodeActions"
import styles from "./NodeSelector.module.css"

const NodeSelector = props => {
  const { nodeStore, productStore, setCurrentNodeData, onNodeReselect, getMaterialThumbnailByNode, onNodeVisibilityChange } = props

  const options = productStore.productData?.nodes || []
  // Фильтруем узлы, убирая "Декоративная вставка"
  const filteredOptions = options.filter(node =>
    node.label !== "Декоративная вставка"
  )

  // Состояние для галочек кружков - все включены по умолчанию
  const [checkedNone, setCheckedNone] = useState(true)
  const [checkedCircles, setCheckedCircles] = useState([])
  // Состояние для подменю деревянных вставок
  const [showWoodSubmenu, setShowWoodSubmenu] = useState(false)
  const [checkedWoodItems, setCheckedWoodItems] = useState([true, true]) // Для двух деревянных вставок

  // Инициализируем галочки когда загружаются данные о продукте
  useEffect(() => {
    if (filteredOptions.length > 0) {
      setCheckedCircles(Array(filteredOptions.length).fill(true));
    }
  }, [filteredOptions.length]);

  const handleNodeSelect = (nodeId) => {
    if (productStore.productData) {
      if (nodeId !== "none") {
        const selectedNode = productStore.productData.nodes.find(n => n.id === nodeId)
        if (nodeStore.currentNodeData?.id === nodeId) {
          if (onNodeReselect) onNodeReselect(nodeId)
        } else {
          setCurrentNodeData(selectedNode)
        }

        // Изменяем позицию камеры в зависимости от выбранного узла
        if (window.moveCameraToView) {
          const nodeLabel = selectedNode?.label?.toLowerCase();
          let viewType = 'isometric'; // По умолчанию изометрический вид

          // Определяем тип вида на основе названия узла
          if (nodeLabel?.includes('фасад') || nodeLabel?.includes('front')) {
            viewType = 'facade';
          } else if (nodeLabel?.includes('крыша') || nodeLabel?.includes('roof') || nodeLabel?.includes('криша')) {
            viewType = 'roof';
          } else if (nodeLabel?.includes('бок') || nodeLabel?.includes('side')) {
            viewType = 'side';
          } else if (nodeLabel?.includes('стопчик') || nodeLabel?.includes('column')) {
            viewType = 'front';
          } else if (nodeLabel?.includes('Деревянные вставки') || nodeLabel?.includes('Panel') || nodeLabel?.includes('Декоративная вставка')) {
            viewType = 'wood_insert'; // Специальный вид для деревянных вставок
          } else if (nodeLabel?.includes('металлическая конструкция') || nodeLabel?.includes('metal')) {
            viewType = 'Metal-constuctor'; // Специальный вид для металлической конструкции
          }

          // Находим соответствующий объект в 3D сцене
          let targetObject = null;
          if (window.g_model_root) {
            const nodeObject = window.g_model_root.children.find(child => child.name === nodeId);
            if (nodeObject) {
              targetObject = nodeObject;
            }
          }

          window.moveCameraToView(viewType, targetObject);
        }
      } else {
        if (!nodeStore.currentNodeData) {
          if (onNodeReselect) onNodeReselect(null)
        } else {
          setCurrentNodeData(null)
        }
      }
    } else {
      setCurrentNodeData(null)
    }
  }

  const handleNoneCircleClick = (e) => {
    e.stopPropagation();
    setCheckedNone(prev => !prev)
    // Управляем видимостью всех узлов
    if (onNodeVisibilityChange) {
      const newState = !checkedNone;
      filteredOptions.forEach((node, index) => {
        onNodeVisibilityChange(node.id, newState);
      });
    }
  }

  const handleCircleClick = (idx, e) => {
    e.stopPropagation();
    const node = filteredOptions[idx];
    const newState = !checkedCircles[idx];

    setCheckedCircles(prev => {
      const arr = [...prev]
      arr[idx] = newState
      return arr
    })

    // Управляем видимостью конкретного узла
    if (onNodeVisibilityChange) {
      onNodeVisibilityChange(node.id, newState);
    }
  }

  const handleWoodSubmenuToggle = (e) => {
    e.stopPropagation();
    setShowWoodSubmenu(prev => !prev);
  }

  const handleWoodItemClick = (index, e) => {
    e.stopPropagation();
    setCheckedWoodItems(prev => {
      const arr = [...prev];
      arr[index] = !arr[index];
      return arr;
    });

    // Управляем видимостью деревянных вставок
    if (onNodeVisibilityChange) {
      const woodNodes = options.filter(node => node.label === "Декоративная вставка");
      if (woodNodes[index]) {
        onNodeVisibilityChange(woodNodes[index].id, !checkedWoodItems[index]);
      }
    }
  }

  return (
    <div className={styles.nodeSelector}>
      <div className={styles.header}>
      </div>

      <div className={styles.optionsContainer}>
        <div className={`${styles.option}`}>
          <div
            className={styles.circleDot + (checkedNone ? ' ' + styles.checked : '')}
            onClick={handleNoneCircleClick}
          >
            {checkedNone && (
              <svg className={styles.checkMark} viewBox="0 0 24 24">
                <path
                  d="M 11.94,20.25 8.7,13.64 C 7.5836008,11.362408 8.7449524,11.954942 9.234963,12.670011 12.802978,17.461386 11.781076,19.309624 14.75,13.24 L 20.707,1.0616 C 21.19746,0.0424868 21.563475,1.05578 21.049,2.27 l -6.488,17.07 c -0.381549,1.003861 -1.786,2.05 -2.621,0.9 l -10e-4,0.005 10e-4,0.005 z"
                  fill="currentColor"
                />
              </svg>
            )}
          </div>
          <div
            className={styles.optionText}
            onClick={e => {
              e.stopPropagation();
              handleNodeSelect("none");
              // Возвращаем камеру в изометрический вид при выборе "всех пунктов"
              if (window.moveCameraToView) {
                window.moveCameraToView('isometric');
              }
            }}
          >Выбрать все пункты</div>
        </div>
        {filteredOptions.map((node, index) => (
          <div key={node.id} className={`${styles.option}`}>
            <div
              className={styles.circleDot + (checkedCircles[index] ? ' ' + styles.checked : '')}
              onClick={e => handleCircleClick(index, e)}
            >
              {checkedCircles[index] && (
                <svg className={styles.checkMark} viewBox="0 0 24 24">
                  <path
                    d="M 11.94,20.25 8.7,13.64 C 7.5836008,11.362408 8.7449524,11.954942 9.234963,12.670011 12.802978,17.461386 11.781076,19.309624 14.75,13.24 L 20.707,1.0616 C 21.19746,0.0424868 21.563475,1.05578 21.049,2.27 l -6.488,17.07 c -0.381549,1.003861 -1.786,2.05 -2.621,0.9 l -10e-4,0.005 10e-4,0.005 z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </div>
            {/* Показываем миниатюру выбранного материала */}
            <div
              className={styles.statusDot}
              style={{ background: 'none', padding: 0 }}
              onClick={(e) => {
                e.stopPropagation()
                handleNodeSelect(node.id)
              }}
            >
              <img src={getMaterialThumbnailByNode ? getMaterialThumbnailByNode(node) : node.candidateMaterials[0]?.thumbnail} alt="material" style={{ width: 35, height: 20, borderRadius: 6, objectFit: 'cover', border: '1px solid #888' }} />
            </div>
            <div
              className={styles.optionText}
              onClick={e => { e.stopPropagation(); handleNodeSelect(node.id) }}
            >
              {node.label}
              {/* Добавляем SVG стрелку для "Крыша" */}
              {node.label === "Криша" && (
                <svg
                  className={`${styles.arrowIcon} ${showWoodSubmenu ? styles.open : ''}`}
                  viewBox="0 0 16 8"
                  width="24"
                  height="12"
                  style={{ marginLeft: '30px', display: 'inline-block' }}
                >
                  <path
                    d="M9.547 7.268L16 0 8 4 0 0l6.453 7.268A1.996 1.996 0 0 0 8 8c.623 0 1.18-.285 1.547-.732z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </div>

            {/* Добавляем кнопку-переключатель для "Крыша" */}
            {node.label === "Криша" && (
              <div
                className={styles.toggleButton}
                onClick={handleWoodSubmenuToggle}
              >
                <svg viewBox="0 0 16 16" width="8" height="8">
                  <path
                    d="M4 6l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}

        {/* Подменю для деревянных вставок */}
        {showWoodSubmenu && (
          <div className={styles.woodSubmenu}>
            {options.filter(node => node.label === "Декоративная вставка").map((woodNode, index) => (
              <div key={woodNode.id} className={styles.woodOption}>
                <div
                  className={styles.circleDot + (checkedWoodItems[index] ? ' ' + styles.checked : '')}
                  onClick={e => handleWoodItemClick(index, e)}
                >
                  {checkedWoodItems[index] && (
                    <svg className={styles.checkMark} viewBox="0 0 24 24">
                      <path
                        d="M 11.94,20.25 8.7,13.64 C 7.5836008,11.362408 8.7449524,11.954942 9.234963,12.670011 12.802978,17.461386 11.781076,19.309624 14.75,13.24 L 20.707,1.0616 C 21.19746,0.0424868 21.563475,1.05578 21.049,2.27 l -6.488,17.07 c -0.381549,1.003861 -1.786,2.05 -2.621,0.9 l -10e-4,0.005 10e-4,0.005 z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                </div>
                <div
                  className={styles.optionText}
                  onClick={e => {
                    e.stopPropagation();
                    handleNodeSelect(woodNode.id);
                    // Для деревянных вставок используем специальный вид
                    if (window.moveCameraToView) {
                      window.moveCameraToView('wood_insert');
                    }
                  }}
                >
                  Деревянные вставки {index + 1}
                </div>
                <div
                  className={styles.statusDot}
                  style={{ background: 'none', padding: 0 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNodeSelect(woodNode.id)
                  }}
                >
                  <img
                    src={getMaterialThumbnailByNode ? getMaterialThumbnailByNode(woodNode) : woodNode.candidateMaterials[0]?.thumbnail}
                    alt="material"
                    style={{ width: 35, height: 20, borderRadius: 6, objectFit: 'cover', border: '1px solid #888' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  nodeStore: state.nodeStore,
  productStore: state.productStore,
})

export default connect(mapStateToProps, { setCurrentNodeData })(NodeSelector)
